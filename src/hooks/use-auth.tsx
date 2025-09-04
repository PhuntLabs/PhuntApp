'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';


interface AuthContextType {
  user: UserProfile | null;
  authUser: User | null;
  setUser: Dispatch<SetStateAction<UserProfile | null>>;
  loading: boolean;
  signup: (email: string, pass: string, username: string) => Promise<UserCredential>;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        getDoc(userDocRef).then(userDoc => {
            if(userDoc.exists()) {
                const userData = userDoc.data() as UserProfile;
                
                // Add developer badge for specific user
                if (userData.email === 'raidensch0@gmail.com') {
                    if (!userData.badges) {
                        userData.badges = [];
                    }
                    if (!userData.badges.includes('developer')) {
                        userData.badges.push('developer');
                    }
                }

                setUser({ id: userDoc.id, ...userData });
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
        });
      } else {
        setAuthUser(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, pass: string, username: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    
    const photoURL = `https://i.pravatar.cc/150?u=${firebaseUser.uid}`

    await updateProfile(firebaseUser, {
      displayName: username,
      photoURL,
    });
    
    const userPayload: Omit<UserProfile, 'id'> = {
      displayName: username,
      email: firebaseUser.email,
      createdAt: serverTimestamp(),
      photoURL: photoURL,
      uid: firebaseUser.uid,
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userPayload);


    // Manually reload the user object to get the updated profile
    await firebaseUser.reload();
    setAuthUser(auth.currentUser);

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    setUser({id: userDoc.id, ...(userDoc.data() as UserProfile)});

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
