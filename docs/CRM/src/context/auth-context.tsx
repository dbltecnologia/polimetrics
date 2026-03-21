
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, Firestore, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface AppUser extends User {
  role?: 'admin' | 'cliente';
  isNewUser?: boolean;
}

const AuthContext = createContext<{ user: AppUser | null; isLoading: boolean; db: typeof db }>({
  user: null,
  isLoading: true,
  db: db // Use the imported db instance
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ ...firebaseUser, role: userData.role, isNewUser: userData.isNewUser });
        } else {
          // Default to 'cliente' if no document exists
          setUser({ ...firebaseUser, role: 'cliente', isNewUser: true });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, db }}>
      {children}
    </AuthContext.Provider>
  );
};
