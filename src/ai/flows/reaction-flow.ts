
'use server';
/**
 * @fileOverview A flow to handle toggling emoji reactions on messages.
 *
 * - toggleReaction - Toggles a user's reaction on a message in a DM or server channel.
 * - ToggleReactionInput - The input type for the toggleReaction function.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { z } from 'zod';
import type { Reaction } from '@/lib/types';

const ToggleReactionInputSchema = z.object({
  userId: z.string().describe('The ID of the user toggling the reaction.'),
  messageId: z.string().describe('The ID of the message being reacted to.'),
  emoji: z.string().describe('The emoji being used for the reaction.'),
  context: z.discriminatedUnion('type', [
    z.object({
        type: z.literal('dm'),
        chatId: z.string(),
    }),
    z.object({
        type: z.literal('channel'),
        serverId: z.string(),
        channelId: z.string(),
    }),
  ]),
});

export type ToggleReactionInput = z.infer<typeof ToggleReactionInputSchema>;

export async function toggleReaction(input: ToggleReactionInput): Promise<void> {
  return toggleReactionFlow(input);
}

const toggleReactionFlow = ai.defineFlow(
  {
    name: 'toggleReactionFlow',
    inputSchema: ToggleReactionInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId, messageId, emoji, context }) => {
    let messageRef;
    if (context.type === 'dm') {
        messageRef = doc(db, 'chats', context.chatId, 'messages', messageId);
    } else {
        messageRef = doc(db, 'servers', context.serverId, 'channels', context.channelId, 'messages', messageId);
    }

    try {
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists()) {
        throw new Error("Message does not exist!");
      }

      const reactions = (messageDoc.data().reactions || []) as Reaction[];
      const reactionIndex = reactions.findIndex(r => r.emoji === emoji);
      let userHasReacted = false;

      if (reactionIndex > -1) {
        userHasReacted = reactions[reactionIndex].users.includes(userId);
      }

      if (userHasReacted) {
        // User is removing their reaction
        const currentReaction = reactions[reactionIndex];
        if (currentReaction.users.length === 1) {
          // If user is the last one, remove the whole reaction object
          await updateDoc(messageRef, {
            reactions: arrayRemove(currentReaction)
          });
        } else {
          // Otherwise, just remove the user's ID
          await updateDoc(messageRef, {
            reactions: arrayRemove(currentReaction)
          });
          await updateDoc(messageRef, {
             reactions: arrayUnion({ ...currentReaction, users: arrayRemove(userId) })
          });
        }
      } else {
        // User is adding a reaction
        if (reactionIndex > -1) {
          // Reaction object exists, add user to it
          const currentReaction = reactions[reactionIndex];
           await updateDoc(messageRef, {
             reactions: arrayRemove(currentReaction)
           });
           await updateDoc(messageRef, {
            reactions: arrayUnion({ ...currentReaction, users: arrayUnion(userId) })
           });
        } else {
          // Reaction object doesn't exist, create it
          await updateDoc(messageRef, {
            reactions: arrayUnion({ emoji, users: [userId] })
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle reaction in flow:", error);
      throw error; // Rethrow to let the client know something went wrong.
    }
  }
);
