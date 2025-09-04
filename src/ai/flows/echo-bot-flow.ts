'use server';
/**
 * @fileOverview A bot that echoes messages and auto-accepts friend requests.
 *
 * - processEcho - Handles incoming messages for the echo bot.
 * - EchoBotInput - The input type for the processEcho function.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { z } from 'zod';

const EchoBotInputSchema = z.object({
  chatId: z.string().describe('The ID of the chat.'),
  message: z.object({
    id: z.string(),
    text: z.string(),
    sender: z.string(),
  }),
});

export type EchoBotInput = z.infer<typeof EchoBotInputSchema>;

export async function processEcho(input: EchoBotInput): Promise<void> {
  return echoBotFlow(input);
}

const BOT_ID = 'echo_bot';
const BOT_USERNAME = 'echo-bot';
const BOT_PHOTO_URL = 'https://picsum.photos/seed/echobot/100';


const ensureBotUser = async () => {
    await setDoc(doc(db, 'users', BOT_ID), {
        uid: BOT_ID,
        displayName: BOT_USERNAME,
        email: 'echo@whisper.chat',
        isBot: true,
        photoURL: BOT_PHOTO_URL,
    }, { merge: true });
};


const autoAcceptFriendRequest = async (userId: string) => {
    const q = query(
        collection(db, 'friendRequests'),
        where('from.id', '==', userId),
        where('to', '==', BOT_ID),
        where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const requestDoc = querySnapshot.docs[0];
        const batch = writeBatch(db);

        // Update request status
        batch.update(requestDoc.ref, { status: 'accepted' });

        // Create a new chat if it doesn't exist
        const chatQuery = query(
            collection(db, 'chats'),
            where('members', 'array-contains', userId)
        );
        const chatSnapshot = await getDocs(chatQuery);
        const existingChat = chatSnapshot.docs.find(d => d.data().members.includes(BOT_ID));
        
        if (!existingChat) {
             const newChatRef = doc(collection(db, 'chats'));
             batch.set(newChatRef, {
                members: [userId, BOT_ID],
                createdAt: serverTimestamp(),
                lastMessageTimestamp: serverTimestamp()
             });
        }
        
        await batch.commit();
    }
};

const echoBotFlow = ai.defineFlow(
  {
    name: 'echoBotFlow',
    inputSchema: EchoBotInputSchema,
    outputSchema: z.void(),
  },
  async ({ chatId, message }) => {
    // The bot should not echo its own messages
    if (message.sender === BOT_ID) {
      return;
    }

    // Ensure the bot user exists
    await ensureBotUser();
    
    // Auto-accept any pending friend requests from the sender
    await autoAcceptFriendRequest(message.sender);
    
    const chatRef = doc(db, 'chats', chatId);
    const messagesCol = collection(chatRef, 'messages');

    // Add the echoed message
    await addDoc(messagesCol, {
      sender: BOT_ID,
      text: `Echo: ${message.text}`,
      timestamp: serverTimestamp(),
    });

    // Update the last message timestamp on the chat
    await updateDoc(chatRef, {
      lastMessageTimestamp: serverTimestamp(),
    });
  }
);
