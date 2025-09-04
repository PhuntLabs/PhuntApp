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
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { z } from 'zod';
import { BOT_ID, BOT_USERNAME, BOT_PHOTO_URL } from '@/ai/bots/config';

// This function runs once on server startup to ensure the bot user exists.
async function ensureBotUser() {
    const botUserRef = doc(db, 'users', BOT_ID);
    const botUserDoc = await getDoc(botUserRef);
    if (!botUserDoc.exists()) {
        console.log(`Bot user not found. Creating '${BOT_USERNAME}'...`);
        await setDoc(botUserRef, {
            uid: BOT_ID,
            displayName: BOT_USERNAME,
            displayName_lowercase: BOT_USERNAME.toLowerCase(),
            email: 'echo@whisper.chat',
            isBot: true,
            photoURL: BOT_PHOTO_URL,
            createdAt: serverTimestamp(),
            badges: ['bot']
        });
        console.log("Echo-bot user created in Firestore.");
    }
}

// Immediately invoke the function to ensure the bot user exists on startup.
ensureBotUser().catch(console.error);


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

const autoAcceptFriendRequest = async (userId: string) => {
    // Find the pending friend request from the user to the bot
    const q = query(
        collection(db, 'friendRequests'),
        where('from.id', '==', userId),
        where('to', '==', BOT_ID),
        where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log(`No pending friend request found from ${userId} to the bot.`);
        return;
    }

    const requestDoc = querySnapshot.docs[0];
    const batch = writeBatch(db);

    // 1. Update request status to accepted
    batch.update(requestDoc.ref, { status: 'accepted' });
    console.log(`Accepting friend request from ${userId}...`);

    // 2. Check if a chat already exists
    const sortedMembers = [userId, BOT_ID].sort();
    const chatQuery = query(
        collection(db, 'chats'),
        where('members', '==', sortedMembers)
    );
    const chatSnapshot = await getDocs(chatQuery);
    
    // 3. If no chat exists, create a new one
    if (chatSnapshot.empty) {
         const newChatRef = doc(collection(db, 'chats'));
         batch.set(newChatRef, {
            members: sortedMembers,
            createdAt: serverTimestamp(),
            lastMessageTimestamp: serverTimestamp()
         });
         console.log(`Creating chat for ${userId} with bot.`);
    } else {
        console.log(`Chat already exists for ${userId} with bot.`);
    }
    
    // 4. Commit all database changes
    await batch.commit();
    console.log(`Friend request from ${userId} processed successfully.`);
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


const FriendRequestInputSchema = z.object({
    requestId: z.string(),
    fromId: z.string(),
    toId: z.string(),
});

/**
 * A flow that is triggered when a friend request is sent to the bot.
 * It automatically accepts the request and creates a chat.
 */
export const processBotFriendRequest = ai.defineFlow(
    {
        name: 'processBotFriendRequest',
        inputSchema: FriendRequestInputSchema,
        outputSchema: z.void()
    },
    async ({ fromId }) => {
        // Use a slight delay to ensure the friend request document is fully committed
        // before we try to read and update it.
        await new Promise(resolve => setTimeout(resolve, 1000));
        await autoAcceptFriendRequest(fromId);
    }
);
