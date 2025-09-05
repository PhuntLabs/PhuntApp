
'use server';
/**
 * @fileOverview A flow to handle toggling emoji reactions on messages.
 *
 * - toggleReaction - Toggles a user's reaction on a message in a DM or server channel.
 * - ToggleReactionInput - The input type for the toggleReaction function.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
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
        await runTransaction(db, async (transaction) => {
            const messageDoc = await transaction.get(messageRef);
            if (!messageDoc.exists()) {
                throw new Error("Message does not exist!");
            }

            const currentReactions = (messageDoc.data().reactions || []) as Reaction[];
            const reactionIndex = currentReactions.findIndex(r => r.emoji === emoji);
            const newReactions = [...currentReactions];

            if (reactionIndex > -1) {
                // Reaction object for this emoji exists
                const reaction = newReactions[reactionIndex];
                const userIndex = reaction.users.indexOf(userId);

                if (userIndex > -1) {
                    // User has already reacted, so remove their reaction
                    reaction.users.splice(userIndex, 1);
                    if (reaction.users.length === 0) {
                        // If no users are left, remove the entire reaction object
                        newReactions.splice(reactionIndex, 1);
                    }
                } else {
                    // User has not reacted, so add them
                    reaction.users.push(userId);
                }
            } else {
                // Reaction object for this emoji does not exist, create it
                newReactions.push({ emoji, users: [userId] });
            }
            
            transaction.update(messageRef, { reactions: newReactions });
        });
    } catch (error) {
      console.error("Failed to toggle reaction in flow:", error);
      throw error; // Rethrow to let the client know something went wrong.
    }
  }
);
