
'use server';
/**
 * @fileOverview A bot that provides quality-of-life commands.
 *
 * - qolforuBotFlow - Handles incoming commands for the qolforu bot.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  query,
  getDocs,
  where,
  limit
} from 'firebase/firestore';
import { z } from 'zod';
import { QOLFORU_BOT_ID, QOLFORU_BOT_USERNAME, QOLFORU_BOT_PHOTO_URL } from '@/ai/bots/qolforu-config';
import type { Embed, Server } from '@/lib/types';
import { SlashCommandInput, SlashCommandOutput } from './slash-command-flow';

// This function runs once on server startup to ensure the bot user exists.
async function ensureBotUser() {
    const botUserRef = doc(db, 'users', QOLFORU_BOT_ID);
    const botUserDoc = await getDoc(botUserRef);
    if (!botUserDoc.exists()) {
        console.log(`Bot user not found. Creating '${QOLFORU_BOT_USERNAME}'...`);
        await setDoc(botUserRef, {
            uid: QOLFORU_BOT_ID,
            displayName: QOLFORU_BOT_USERNAME,
            displayName_lowercase: QOLFORU_BOT_USERNAME.toLowerCase(),
            email: 'qolforu@whisper.chat',
            isBot: true,
            isDiscoverable: true,
            isVerified: true,
            photoURL: QOLFORU_BOT_PHOTO_URL,
            bio: "I'm qolforu, a bot designed to bring quality-of-life features to your server. Use my commands like /poll and /embed to spice up your conversations!",
            createdAt: serverTimestamp(),
            badges: ['bot']
        });
        console.log("qolforu-bot user created in Firestore.");
    }
}

// Immediately invoke the function to ensure the bot user exists on startup.
ensureBotUser().catch(console.error);


async function findServer(serverId: string): Promise<Server> {
    const serverSnap = await getDoc(doc(db, 'servers', serverId));
    if (!serverSnap.exists()) throw new Error('Server not found.');
    return { id: serverSnap.id, ...serverSnap.data() } as Server;
}

export const qolforuBotFlow = async ({ serverId, channelId, command, args }: SlashCommandInput): Promise<SlashCommandOutput> => {
    const server = await findServer(serverId);
    switch (command) {
        case 'poll': {
            const [question, ...options] = args;
            if (!question || options.length < 2) {
                throw new Error('Usage: /poll "Question" "Option A" "Option B" ...');
            }
            const description = options.map((opt, i) => `${String.fromCodePoint(0x1f1e6 + i)} ${opt}`).join('\n\n');
            const embed: Embed = {
                title: `📊 ${question}`,
                description,
                color: '#3b82f6',
                footer: { text: `Poll created by @user` } // Will be replaced on client
            };
            return { type: 'embed', payload: { embed, reactions: options.map((_, i) => String.fromCodePoint(0x1f1e6 + i)) } };
        }
        case 'embed': {
            const [title, description, color] = args;
            if (!title) throw new Error('Usage: /embed "Title" "Description" #color');
            const embed: Embed = {
                title,
                description,
                color: color && /^#[0-9A-F]{6}$/i.test(color) ? color : '#2dd4bf',
            };
            return { type: 'embed', payload: { embed } };
        }
        case 'suggest': {
             const [idea] = args;
             if (!idea) throw new Error('Usage: /suggest "Your awesome idea"');
             const embed: Embed = {
                author: { name: 'New Suggestion' },
                description: idea,
                color: '#f97316',
                footer: { text: 'Suggested by @user' }
             };
             return { type: 'embed', payload: { embed, reactions: ['👍', '👎'] } };
        }
        case 'random-user': {
            const q = query(collection(db, 'servers', serverId, 'channels', channelId, 'messages'), limit(50));
            const messagesSnapshot = await getDocs(q);
            const recentSenders = new Set(messagesSnapshot.docs.map(d => d.data().sender));
            const activeMembers = server.members.filter(id => recentSenders.has(id) && id !== QOLFORU_BOT_ID);
            
            if (activeMembers.length === 0) {
                throw new Error("Not enough active users in this channel to pick from.");
            }

            const randomUserId = activeMembers[Math.floor(Math.random() * activeMembers.length)];
            const userDoc = await getDoc(doc(db, 'users', randomUserId));
            const winner = userDoc.data()?.displayName || 'Someone';

            const embed: Embed = {
                title: '🎉 And the winner is...',
                description: `## @${winner}`,
                color: '#facc15'
            };

            return { type: 'embed', payload: { embed } };
        }
        default:
            throw new Error(`Unknown command for qolforu bot: /${command}`);
    }
};
