
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import type { UserProfile, BadgeType, ServerProfile } from '@/lib/types';
import { createWelcomeChat } from '@/ai/flows/welcome-chat-flow';
import { v4 as uuidv4 } from 'uuid';


interface AuthContextType {
  user: UserProfile | null;
  authUser: User | null;
  setUser: Dispatch<SetStateAction<UserProfile | null>>;
  loading: boolean;
  signup: (
    email: string,
    pass: string,
    username: string
  ) => Promise<UserCredential>;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateServerProfile: (serverId: string, profile: ServerProfile) => Promise<void>;
  uploadFile: (file: File, path: 'avatars' | 'banners' | `server-emojis/${string}` | `chat-images/${string}`) => Promise<string>;
  sendPasswordReset: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const developerEmails = ['raidensch0@gmail.com'];
const developerUsernames = ['testacc', 'aura farmer', 'thatguy123'];

function applySpecialBadges(profile: UserProfile): UserProfile {
    const badges = new Set<BadgeType>(profile.badges || []);
    const username = profile.displayName_lowercase || '';

    // Developer badges
    if (
        (profile.email && developerEmails.includes(profile.email)) ||
        (username && developerUsernames.includes(username))
    ) {
        badges.add('developer');
    }

    // Heina's badges
    if (username === 'heina') {
        ['developer', 'beta tester', 'youtuber', 'tiktoker', 'goat', 'early supporter'].forEach(b => badges.add(b as BadgeType));
    }

    // RecBacon's badges
    if (username === 'recbacon') {
        ['early supporter', 'youtuber', 'beta tester', 'goat'].forEach(b => badges.add(b as BadgeType));
    }


    return { ...profile, badges: Array.from(badges) };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
          const userWithBadge = applySpecialBadges(userData);
          setUser(userWithBadge);
        } else {
          // This case might happen briefly if the Firestore doc isn't created yet
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || null,
          });
        }
        setLoading(false);
      } else {
        setAuthUser(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!authUser) throw new Error('Not authenticated');

      const { displayName, photoURL, ...firestoreData } = data;

      // Update Firebase Auth profile if display name or photo URL changed
      const profileUpdates: { displayName?: string; photoURL?: string } = {};
      if (displayName) profileUpdates.displayName = displayName;
      if (photoURL) profileUpdates.photoURL = photoURL;
      
      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(authUser, profileUpdates);
      }


      // Update Firestore document
      const userRef = doc(db, 'users', authUser.uid);
      await setDoc(userRef, firestoreData, { merge: true });

      // Update local state
      setUser((prevProfile) => {
        if (!prevProfile) return null;
        const updatedProfile = { ...prevProfile, ...data };
        return applySpecialBadges(updatedProfile);
      });
    },
    [authUser]
  );
  
  const updateServerProfile = useCallback(async (serverId: string, profile: ServerProfile) => {
    if (!authUser) throw new Error('Not authenticated');
    
    const serverRef = doc(db, 'servers', serverId);
    const fieldPath = `memberDetails.${authUser.uid}.profile`;

    await updateDoc(serverRef, {
        [fieldPath]: profile
    });
    // Note: This won't update the local state immediately. The useServer hook's listener will catch this change.

  }, [authUser]);

  const uploadFile = useCallback(async (file: File, path: 'avatars' | 'banners' | `server-emojis/${string}` | `chat-images/${string}`): Promise<string> => {
      if (!authUser) throw new Error('Not authenticated');
      
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      let storagePath = '';

      if (path.startsWith('server-emojis/')) {
          const serverId = path.split('/')[1];
          storagePath = `server-assets/${serverId}/emojis/${fileId}.${fileExtension}`;
      } else if (path.startsWith('chat-images/')) {
          const chatId = path.split('/')[1];
          storagePath = `chat-assets/${chatId}/${fileId}.${fileExtension}`;
      }
      else {
          storagePath = `user-assets/${authUser.uid}/${path}/${fileId}.${fileExtension}`;
      }
      
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
  }, [authUser]);

  const sendPasswordReset = useCallback(async () => {
    if (!authUser?.email) throw new Error('No email associated with this account.');
    await sendPasswordResetEmail(auth, authUser.email);
  }, [authUser]);


  const signup = async (email: string, pass: string, username: string) => {
    // 1. Check if username is already taken
    try {
        const usernameQuery = query(collection(db, 'users'), where('displayName_lowercase', '==', username.toLowerCase()));
        const usernameSnapshot = await getDocs(usernameQuery);
        if (!usernameSnapshot.empty) {
            throw new Error("Username is already taken.");
        }
    } catch (e: any) {
        throw new Error(`Failed to check if username is taken. This is likely a security rule issue. Original error: ${e.message}`);
    }

    // 2. Create the user in Firebase Auth
    let userCredential;
    try {
        userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
        throw new Error(`Failed to create authentication user: ${error.message}`);
    }
    
    const firebaseUser = userCredential.user;
    const photoURL = `https://i.pravatar.cc/150?u=${firebaseUser.uid}`;

    // 3. Update the Firebase Auth profile
    try {
        await updateProfile(firebaseUser, {
          displayName: username,
          photoURL,
        });
    } catch (error: any) {
        throw new Error(`Failed to update auth profile: ${error.message}`);
    }

    // 4. Create the user document in Firestore
    const userPayload: Omit<UserProfile, 'id'> = {
      displayName: username,
      displayName_lowercase: username.toLowerCase(),
      email: firebaseUser.email,
      createdAt: serverTimestamp(),
      photoURL: photoURL,
      uid: firebaseUser.uid,
      status: 'online',
    };

    try {
        await setDoc(doc(db, 'users', firebaseUser.uid), userPayload);
    } catch (error: any) {
        console.error("Firestore user creation failed:", error);
        throw new Error(`Failed to create user profile in database. This is likely a security rule issue. Original error: ${e.message}`);
    }

    // 5. Finalize session and welcome new user
    await firebaseUser.reload();
    setAuthUser(auth.currentUser);

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const finalUser = { id: userDoc.id, ...(userDoc.data() as UserProfile) };
    setUser(applySpecialBadges(finalUser));
    
    await createWelcomeChat({ userId: firebaseUser.uid, username: username });

    return userCredential;
  };

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    authUser,
    setUser,
    loading,
    signup,
    login,
    logout,
    updateUserProfile,
    updateServerProfile,
    uploadFile,
    sendPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

    