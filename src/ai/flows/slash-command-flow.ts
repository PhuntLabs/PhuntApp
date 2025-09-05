
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
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { z } from 'zod';
import type { Permission, Server, UserProfile, Message } from '@/lib/types';
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
  botId: z.string().optional(),
  serverId: z.string(),
  channelId: z.string(),
  command: z.string(),
  args: z.array(z.string()),
});

export type SlashCommandInput = z.infer<typeof SlashCommandInputSchema>;

const SlashCommandOutputSchema = z.union([
  z.object({
    type: z.literal('message'),
    content: z.string(),
  }),
  z.object({
    type: z.literal('embed'),
    payload: z.any(),
  }),
  z.object({
    type: z.literal('silent'),
  }),
]);

export type SlashCommandOutput = z.infer<typeof SlashCommandOutputSchema>;

export async function executeSlashCommand(input: SlashCommandInput): Promise<SlashCommandOutput> {
  return slashCommandFlow(input);
}

// Bot specific flows
import { qolforuBotFlow } from './qolforu-bot-flow';
import { QOLFORU_BOT_ID } from '@/ai/bots/qolforu-config';

async function findServer(serverId: string): Promise<Server> {
    const serverSnap = await getDoc(doc(db, 'servers', serverId));
    if (!serverSnap.exists()) throw new Error('Server not found.');
    return { id: serverSnap.id, ...serverSnap.data() } as Server;
}

const slashCommandFlow = ai.defineFlow(
  {
    name: 'slashCommandFlow',
    inputSchema: SlashCommandInputSchema,
    outputSchema: SlashCommandOutputSchema,
  },
  async ({ executorId, botId, serverId, channelId, command, args }) => {
    
    // Route to bot-specific command handler if a bot is invoked
    if (botId === QOLFORU_BOT_ID) {
      return qolforuBotFlow({ executorId, serverId, channelId, command, args });
    }

    // --- Standard Moderation Commands ---
    const server = await findServer(serverId);
    if (!hasPermission(server, executorId, 'manageChannels')) {
      throw new Error("You don't have permission to use moderation commands.");
    }
    
    switch (command) {
      case 'clean': {
        const messagesRef = collection(db, 'servers', serverId, 'channels', channelId, 'messages');
        const q = query(messagesRef, limit(100));
        const messagesSnapshot = await getDocs(q);
        const batch = writeBatch(db);
        messagesSnapshot.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        return { type: 'message', content: `Deleted last ${messagesSnapshot.size} messages.` };
      }

      case 'lock': {
        const lockValue = args[0] !== 'false';
        const everyoneRole = server.roles?.find(r => r.name === '@everyone');
        if (!everyoneRole) throw new Error('@everyone role not found.');
        
        const channelRef = doc(db, 'servers', serverId, 'channels', channelId);
        const overwritePath = `permissionOverwrites.${everyoneRole.id}.sendMessages`;

        await updateDoc(channelRef, { [overwritePath]: !lockValue });
        return { type: 'message', content: `Channel has been ${lockValue ? 'locked' : 'unlocked'}.` };
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
        
        const memberPath = `memberDetails.${userToKick.id}`;
        const updatedMembers = server.members.filter(id => id !== userToKick.id);
        
        await updateDoc(doc(db, 'servers', serverId), {
            members: updatedMembers,
            [memberPath]: undefined
        });

        return { type: 'message', content: `@${username} has been kicked from the server.` };
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
        
        const memberPath = `memberDetails.${userToBan.id}`;
        const updatedMembers = server.members.filter(id => id !== userToBan.id);
        
        await updateDoc(doc(db, 'servers', serverId), {
            members: updatedMembers,
            [memberPath]: undefined
        });
        
        return { type: 'message', content: `@${username} has been banned from the server. (Note: True ban list not implemented, user was kicked).` };
      }

      default:
        throw new Error(`Unknown command: /${command}`);
    }
  }
);
