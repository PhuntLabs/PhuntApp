'use server';
/**
 * @fileOverview A flow to handle users joining the Phunt Preview program.
 *
 * - joinPreview - Adds the 'beta tester' badge to a user.
 * - JoinPreviewInput - The input type for the joinPreview function.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { z } from 'zod';

const JoinPreviewInputSchema = z.object({
  userId: z.string().describe('The ID of the user joining the preview program.'),
});
export type JoinPreviewInput = z.infer<typeof JoinPreviewInputSchema>;

export async function joinPreview(input: JoinPreviewInput): Promise<void> {
  return joinPreviewFlow(input);
}

const joinPreviewFlow = ai.defineFlow(
  {
    name: 'joinPreviewFlow',
    inputSchema: JoinPreviewInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId }) => {
    const userRef = doc(db, 'users', userId);
    
    // Add the 'beta tester' badge to the user's profile
    await updateDoc(userRef, {
        badges: arrayUnion('beta tester')
    });
  }
);
