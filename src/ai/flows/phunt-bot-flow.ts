
'use server';
/**
 * @fileOverview The main Phunt bot.
 *
 * - ensurePhuntBotUser - Creates the bot user if it doesn't exist.
 */
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { PHUNT_BOT_ID, PHUNT_BOT_USERNAME, PHUNT_BOT_PHOTO_URL } from '@/ai/bots/phunt-config';

// This function runs on startup to ensure the bot user exists.
export async function ensurePhuntBotUser(): Promise<UserProfile> {
    const botUserRef = doc(db, 'users', PHUNT_BOT_ID);
    const botUserDoc = await getDoc(botUserRef);
    if (!botUserDoc.exists()) {
        console.log(`Bot user not found. Creating '${PHUNT_BOT_USERNAME}'...`);
        const botData: Omit<UserProfile, 'id'> = {
            uid: PHUNT_BOT_ID,
            displayName: PHUNT_BOT_USERNAME,
            displayName_lowercase: PHUNT_BOT_USERNAME.toLowerCase(),
            email: 'phunt@whisper.chat',
            isBot: true,
            isDiscoverable: true,
            isVerified: true,
            photoURL: PHUNT_BOT_PHOTO_URL,
            bio: "Official Phunt bot for announcements and special events.",
            createdAt: serverTimestamp(),
            badges: ['bot']
        };
        await setDoc(botUserRef, botData);
        console.log("phunt-bot user created in Firestore.");
        return { id: PHUNT_BOT_ID, ...botData };
    }
    return { id: botUserDoc.id, ...botUserDoc.data() } as UserProfile;
}

// Immediately invoke the function to ensure the bot user exists on startup.
ensurePhuntBotUser().catch(console.error);
