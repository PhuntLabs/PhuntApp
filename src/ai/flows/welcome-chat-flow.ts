'use server';
/**
 * @fileOverview A flow to create a welcome chat for new users.
 *
 * - createWelcomeChat - Creates a DM with the official bot and sends a welcome message.
 * - WelcomeChatInput - The input type for the createWelcomeChat function.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { z } from 'zod';
import { BOT_ID, BOT_PHOTO_URL, BOT_USERNAME } from '../bots/config';

const WelcomeChatInputSchema = z.object({
  userId: z.string().describe('The ID of the new user.'),
  username: z.string().describe('The username of the new user.'),
});

export type WelcomeChatInput = z.infer<typeof WelcomeChatInputSchema>;

export async function createWelcomeChat(input: WelcomeChatInput): Promise<void> {
  return createWelcomeChatFlow(input);
}

const createWelcomeChatFlow = ai.defineFlow(
  {
    name: 'createWelcomeChatFlow',
    inputSchema: WelcomeChatInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId, username }) => {
    // Ensure bot user exists
    await setDoc(doc(db, 'users', BOT_ID), {
        uid: BOT_ID,
        displayName: BOT_USERNAME,
        email: 'echo@whisper.chat',
        isBot: true,
        photoURL: BOT_PHOTO_URL
    }, { merge: true });

    // Create a new chat document
    const chatRef = await addDoc(collection(db, 'chats'), {
      members: [userId, BOT_ID],
      isOfficial: true,
      name: BOT_USERNAME,
      photoURL: BOT_PHOTO_URL,
      createdAt: serverTimestamp(),
    });

    // Add the welcome message
    await addDoc(collection(db, 'chats', chatRef.id, 'messages'), {
      sender: BOT_ID,
      text: `Hello ${username}, welcome to WhisperChat! This is the echo-bot. Send me a message and I'll repeat it back to you.`,
      timestamp: serverTimestamp(),
    });
    
    // Update the last message timestamp on the chat
    await updateDoc(chatRef, {
        lastMessageTimestamp: serverTimestamp(),
    });
  }
);
