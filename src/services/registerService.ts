import { firestore as db, auth } from '@/lib/firebase-admin';
import { User } from '@/types/user';

export const registerUser = async (user: Omit<User, 'id'> & { password?: string }) => {
  const userRecord = await auth.createUser({
    email: user.email,
    password: user.password,
    displayName: user.name,
  });

  const userDoc = {
    uid: userRecord.uid,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  await db.collection('users').doc(userRecord.uid).set(userDoc);

  return userDoc;
};
