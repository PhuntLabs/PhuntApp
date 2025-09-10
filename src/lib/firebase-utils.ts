
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from './types';

export async function findUserByUsername(username: string): Promise<UserProfile | null> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as UserProfile;
}

    
