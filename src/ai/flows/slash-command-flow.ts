
'use server';
/**
 * @fileOverview A flow to handle slash commands for server moderation.
 *
 * - executeSlashCommand - Parses and executes a slash command.
 * - SlashCommandInput - The input type for the executeSlashCommand function.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { z } from 'zod';
import type { Permission, Server } from '@/lib/types';
import { findUserByUsername } from '@/lib/firebase-utils';

// Helper function to check permissions
function hasPermission(
  server: Server,
  userId: string,
  permission: Permission
): boolean {
  if (server.ownerId === userId) return true;
  const memberDetails = server.memberDetails?.[userId];
  if (!memberDetails) return false;
  const memberRoleIds = new Set(memberDetails.roles);
  const memberRoles =
    server.roles?.filter((role) => memberRoleIds.has(role.id)) || [];

  if (memberRoles.some((role) => role.permissions.administrator)) {
    return true;
  }
  return memberRoles.some((role) => role.permissions[permission]);
}

const SlashCommandInputSchema = z.object({
  executorId: z.string(),
  serverId: z.string(),
  channelId: z.string(),
  command: z.string(),
  args: z.array(z.string()),
});

export type SlashCommandInput = z.infer<typeof SlashCommandInputSchema>;

export async function executeSlashCommand(input: SlashCommandInput): Promise<string> {
  return slashCommandFlow(input);
}

const slashCommandFlow = ai.defineFlow(
  {
    name: 'slashCommandFlow',
    inputSchema: SlashCommandInputSchema,
    outputSchema: z.string(),
  },
  async ({ executorId, serverId, channelId, command, args }) => {
    const serverRef = doc(db, 'servers', serverId);
    const serverSnap = await getDocs(query(collection(db, 'servers'), where('__name__', '==', serverId)));
    if (serverSnap.empty) throw new Error('Server not found.');
    
    const server = { id: serverSnap.docs[0].id, ...serverSnap.docs[0].data() } as Server;

    switch (command) {
      case 'clean': {
        if (!hasPermission(server, executorId, 'manageChannels')) {
          throw new Error("You don't have permission to clean this channel.");
        }
        const messagesRef = collection(db, 'servers', serverId, 'channels', channelId, 'messages');
        const q = query(messagesRef, limit(100));
        const messagesSnapshot = await getDocs(q);
        const batch = writeBatch(db);
        messagesSnapshot.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        return `Deleted last ${messagesSnapshot.size} messages.`;
      }

      case 'lock': {
        if (!hasPermission(server, executorId, 'manageChannels')) {
          throw new Error("You don't have permission to lock this channel.");
        }
        const lockValue = args[0] === 'true';
        const everyoneRole = server.roles?.find(r => r.name === '@everyone');
        if (!everyoneRole) throw new Error('@everyone role not found.');
        
        const channelRef = doc(db, 'servers', serverId, 'channels', channelId);
        const overwritePath = `permissionOverwrites.${everyoneRole.id}.sendMessages`;

        await updateDoc(channelRef, { [overwritePath]: !lockValue });
        return `Channel has been ${lockValue ? 'locked' : 'unlocked'}.`;
      }

      case 'kick': {
         if (!hasPermission(server, executorId, 'kickMembers')) {
          throw new Error("You don't have permission to kick members.");
        }
        const username = args[0]?.replace('@', '');
        if (!username) throw new Error('You must specify a user to kick.');

        const userToKick = await findUserByUsername(username);
        if (!userToKick) throw new Error(`User @${username} not found.`);
        if (userToKick.id === server.ownerId) throw new Error("You cannot kick the server owner.");
        
        // Remove user from members list and memberDetails
        const memberPath = `memberDetails.${userToKick.id}`;
        const updatedMembers = server.members.filter(id => id !== userToKick.id);
        
        await updateDoc(serverRef, {
            members: updatedMembers,
            [memberPath]: undefined // Firestore doesn't have a direct way to delete a map key, set to undefined
        });

        return `@${username} has been kicked from the server.`;
      }
      
      case 'ban': {
         if (!hasPermission(server, executorId, 'banMembers')) {
          throw new Error("You don't have permission to ban members.");
        }
        const username = args[0]?.replace('@', '');
        if (!username) throw new Error('You must specify a user to ban.');

        const userToBan = await findUserByUsername(username);
        if (!userToBan) throw new Error(`User @${username} not found.`);
        if (userToBan.id === server.ownerId) throw new Error("You cannot ban the server owner.");
        
        // In a real app, you'd add this user to a "bans" subcollection.
        // For now, we'll just kick them.
        const memberPath = `memberDetails.${userToBan.id}`;
        const updatedMembers = server.members.filter(id => id !== userToBan.id);
        
        await updateDoc(serverRef, {
            members: updatedMembers,
            [memberPath]: undefined
        });
        
        return `@${username} has been banned from the server. (Note: True ban list not implemented, user was kicked).`;
      }

      default:
        throw new Error(`Unknown command: /${command}`);
    }
  }
);

    