import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'profiles'), orderBy('xp', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data()
    })) as UserProfile[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'profiles');
    return [];
  }
}

export async function deregisterUser(uid: string): Promise<void> {
  try {
    const profileRef = doc(db, 'profiles', uid);
    await deleteDoc(profileRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `profiles/${uid}`);
    throw error;
  }
}
