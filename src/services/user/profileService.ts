
'use client';

import { doc, onSnapshot, setDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/types/user';
import { User as FirebaseUser } from 'firebase/auth';

// Função auxiliar para serializar o perfil do usuário
function serializeUserProfile(doc: any): AppUser {
  const data = doc.data();
  const user: AppUser = {
    id: doc.id,
    uid: doc.id,
    email: data.email,
    name: data.name,
    role: data.role,
    instagram: data.instagram,
    facebook: data.facebook,
  };

  if (data.createdAt && data.createdAt instanceof Timestamp) {
    user.createdAt = data.createdAt.toDate().toISOString();
  }

  return user;
}

/**
 * Escuta as atualizações do perfil de um usuário em tempo real.
 * @param uid - O ID do usuário.
 * @param callback - Função para ser chamada com os dados do perfil.
 * @returns Uma função para cancelar a inscrição do listener.
 */
export function onUserProfileUpdate(
  uid: string,
  callback: (user: AppUser | null) => void
): () => void {
  const userDocRef = doc(db, 'users', uid);

  const unsubscribe = onSnapshot(
    userDocRef,
    (doc) => {
      if (doc.exists()) {
        callback(serializeUserProfile(doc));
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Erro ao observar o perfil do usuário:", error);
      callback(null);
    }
  );

  return unsubscribe;
}

/**
 * Cria o perfil de um novo usuário no Firestore.
 * @param firebaseUser - O objeto de usuário do Firebase Auth.
 */
export async function createUserProfile(firebaseUser: FirebaseUser): Promise<void> {
  const userDocRef = doc(db, 'users', firebaseUser.uid);

  const newUser: Omit<AppUser, 'uid' | 'createdAt'> & { createdAt: any } = {
    name: firebaseUser.displayName || 'Usuário Anônimo',
    email: firebaseUser.email || '',
    role: 'citizen',
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(userDocRef, newUser);
  } catch (error) {
    console.error("Erro ao criar o perfil do usuário:", error);
    throw error;
  }
}

/**
 * Atualiza o perfil de um usuário no Firestore.
 * @param uid - O ID do usuário.
 * @param data - Os dados a serem atualizados.
 */
export async function updateUserProfile(uid: string, data: Partial<AppUser>): Promise<void> {
  const userDocRef = doc(db, 'users', uid);

  try {
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erro ao atualizar o perfil do usuário:', error);
    throw error;
  }
}
