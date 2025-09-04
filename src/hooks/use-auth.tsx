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


interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  loading: boolean;
  signup: (email: string, pass: string, username: string) => Promise<UserCredential>;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Attach firestore data to user object
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then(userDoc => {
            if(userDoc.exists()) {
                const userData = userDoc.data();
                const combinedUser = {...user, ...userData};
                setUser(combinedUser);
            } else {
                setUser(user);
            }
             setLoading(false);
        });
      } else {
        setUser(user);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, pass: string, username: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const { user } = userCredential;
    
    const photoURL = `https://i.pravatar.cc/150?u=${user.uid}`

    await updateProfile(user, {
      displayName: username,
      photoURL,
    });
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: username,
      email: user.email,
      createdAt: serverTimestamp(),
      photoURL: photoURL
    });


    // Manually reload the user object to get the updated profile
    await user.reload();
    // We need to update the state to reflect the new displayName
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    const combinedUser = {...user, ...userData};
    setUser(combinedUser);


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
