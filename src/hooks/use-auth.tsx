
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
import { auth, db } from '@/lib/firebase';
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
  onSnapshot,
  arrayUnion,
  addDoc,
  runTransaction,
} from 'firebase/firestore';
import type { UserProfile, Badge, ServerProfile, Server } from '@/lib/types';
import { createWelcomeChat } from '@/ai/flows/welcome-chat-flow';
import { findUserByUsername } from '@/lib/firebase-utils';


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
  updateUserRolesInServer: (serverId: string, userId: string, roles: string[]) => Promise<void>;
  addBadgeToUser: (username: string, badgeId: string) => Promise<void>;
  createBadge: (badgeData: Omit<Badge, 'id'>) => Promise<void>;
  sendPasswordReset: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const developerEmails = ['raidensch0@gmail.com'];
const developerUsernames = ['testacc', 'aura farmer', 'thatguy123', 'heina'];

function applySpecialBadges(profile: UserProfile): UserProfile {
    const badges = new Set<string>(profile.badges || []);

    if (
        (profile.email && developerEmails.includes(profile.email)) ||
        (profile.displayName_lowercase && developerUsernames.includes(profile.displayName_lowercase))
    ) {
        badges.add('developer');
    }

    return { ...profile, badges: Array.from(badges) };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        updateDoc(userRef, { status: 'offline', currentGame: null });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        await setDoc(userDocRef, { status: 'online' }, { merge: true });
        
        const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
           if (userDoc.exists()) {
             const userData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
             const userWithBadge = applySpecialBadges(userData);
             setUser(userWithBadge);
           } else {
             setUser({
               id: firebaseUser.uid,
               uid: firebaseUser.uid,
               displayName: firebaseUser.displayName || '',
               photoURL: firebaseUser.photoURL || null,
             });
           }
        });

        setLoading(false);
        return () => unsubscribeUser();

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

      const profileUpdates: { displayName?: string; photoURL?: string | null } = {};
      if (displayName !== undefined && displayName !== authUser.displayName) profileUpdates.displayName = displayName;
      if (photoURL !== undefined && photoURL !== authUser.photoURL) profileUpdates.photoURL = photoURL;
      
      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(authUser, profileUpdates);
      }

      const userRef = doc(db, 'users', authUser.uid);
      await setDoc(userRef, firestoreData, { merge: true });
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

  }, [authUser]);

  const updateUserRolesInServer = useCallback(async (serverId: string, userId: string, roles: string[]) => {
      if (!authUser) throw new Error('Not authenticated');
      const serverRef = doc(db, 'servers', serverId);
      const fieldPath = `memberDetails.${userId}.roles`;
      await updateDoc(serverRef, { [fieldPath]: roles });
  }, [authUser]);
  
  const addBadgeToUser = useCallback(async (username: string, badgeId: string) => {
    if (user?.displayName !== 'heina') {
        throw new Error('You are not authorized to perform this action.');
    }
    const targetUser = await findUserByUsername(username);
    if (!targetUser) {
        throw new Error(`User with username "${username}" not found.`);
    }
    const userRef = doc(db, 'users', targetUser.id);
    await updateDoc(userRef, {
        badges: arrayUnion(badgeId)
    });
  }, [user]);

  const createBadge = useCallback(async (badgeData: Omit<Badge, 'id'>) => {
      if(user?.displayName !== 'heina') {
          throw new Error('You are not authorized to perform this action.');
      }
      const badgeId = badgeData.name.toLowerCase().replace(/\s+/g, '_');
      const badgeRef = doc(db, 'badges', badgeId);
      const badgeDoc = await getDoc(badgeRef);
      if (badgeDoc.exists()) {
          throw new Error(`A badge with the ID '${badgeId}' already exists.`);
      }
      await setDoc(badgeRef, badgeData);
  }, [user]);

  const sendPasswordReset = useCallback(async () => {
    if (!authUser?.email) throw new Error('No email associated with this account.');
    await sendPasswordResetEmail(auth, authUser.email);
  }, [authUser]);


  const signup = async (email: string, pass: string, username: string) => {
    try {
        const usernameQuery = query(collection(db, 'users'), where('displayName_lowercase', '==', username.toLowerCase()));
        const usernameSnapshot = await getDocs(usernameQuery);
        if (!usernameSnapshot.empty) {
            throw new Error("Username is already taken.");
        }
    } catch (e: any) {
        throw new Error(`Failed to check if username is taken. This is likely a security rule issue. Original error: ${e.message}`);
    }

    let userCredential;
    try {
        userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
        throw new Error(`Failed to create authentication user: ${error.message}`);
    }
    
    const firebaseUser = userCredential.user;
    const photoURL = `https://i.pravatar.cc/150?u=${firebaseUser.uid}`;

    try {
        await updateProfile(firebaseUser, {
          displayName: username,
          photoURL,
        });
    } catch (error: any) {
        throw new Error(`Failed to update auth profile: ${error.message}`);
    }

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
    
    await firebaseUser.reload();
    
    await createWelcomeChat({ userId: firebaseUser.uid, username: username });

    return userCredential;
  };

  const login = async (email: string, pass: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    if (credential.user) {
        const userRef = doc(db, 'users', credential.user.uid);
        await updateDoc(userRef, { status: 'online' });
    }
    return credential;
  };

  const logout = async () => {
    if(authUser) {
      const userRef = doc(db, 'users', authUser.uid);
      await updateDoc(userRef, { status: 'offline', currentGame: null });
    }
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
    updateUserRolesInServer,
    addBadgeToUser,
    createBadge,
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
