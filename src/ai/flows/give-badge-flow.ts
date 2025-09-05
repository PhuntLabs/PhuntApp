
'use server';
/**
 * @fileOverview A flow to grant badges to users.
 *
 * - giveBadge - A function that handles granting a badge to a user.
 * - GiveBadgeInput - The input type for the giveBadge function.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  arrayUnion,
} from 'firebase/firestore';
import { z } from 'zod';
import { BadgeType, ALL_BADGES } from '@/lib/types';

const GiveBadgeInputSchema = z.object({
  callerUsername: z.string().describe('The username of the user executing the command.'),
  targetUsername: z.string().describe('The username of the user receiving the badge.'),
  badge: BadgeType.describe('The badge to be granted.'),
});

export type GiveBadgeInput = z.infer<typeof GiveBadgeInputSchema>;

export async function giveBadge(input: GiveBadgeInput): Promise<{ message: string }> {
  return giveBadgeFlow(input);
}

const giveBadgeFlow = ai.defineFlow(
  {
    name: 'giveBadgeFlow',
    inputSchema: GiveBadgeInputSchema,
    outputSchema: z.object({ message: z.string() }),
  },
  async ({ callerUsername, targetUsername, badge }) => {
    // Security Check: Only 'heina' can run this command.
    if (callerUsername.toLowerCase() !== 'heina') {
      throw new Error('You do not have permission to use this command.');
    }
    
    if (!ALL_BADGES.includes(badge)) {
        throw new Error(`Invalid badge: ${badge}.`);
    }

    // Find the target user
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('displayName_lowercase', '==', targetUsername.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`User "${targetUsername}" not found.`);
    }

    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);

    // Add the badge to the user's profile
    await updateDoc(userRef, {
      badges: arrayUnion(badge),
    });

    return { message: `Successfully gave the "${badge}" badge to ${targetUsername}.` };
  }
);
