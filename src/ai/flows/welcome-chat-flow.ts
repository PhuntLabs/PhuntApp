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
    const botId = 'whisperchat_bot';
    
    // Ensure bot user exists
    await setDoc(doc(db, 'users', botId), {
        uid: botId,
        displayName: 'WhisperChat',
        email: 'bot@whisper.chat',
        isBot: true,
        photoURL: 'https://picsum.photos/seed/bot/100'
    }, { merge: true });

    // Create a new chat document
    const chatRef = await addDoc(collection(db, 'chats'), {
      members: [userId, botId],
      isOfficial: true,
      name: 'WhisperChat',
      photoURL: 'https://picsum.photos/seed/bot/100',
      createdAt: serverTimestamp(),
    });

    // Add the welcome message
    await addDoc(collection(db, 'chats', chatRef.id, 'messages'), {
      sender: botId,
      text: `Hello ${username}, welcome to WhisperChat! This is a place to connect and share. Feel free to look around and start a conversation.`,
      timestamp: serverTimestamp(),
    });
    
    // Update the last message timestamp on the chat
    await updateDoc(chatRef, {
        lastMessageTimestamp: serverTimestamp(),
    });
  }
);
