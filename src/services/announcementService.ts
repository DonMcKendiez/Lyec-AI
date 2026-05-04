import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'info' | 'warning' | 'achievement';
}

const COLLECTION_PATH = 'announcements';

export function subscribeAnnouncements(callback: (announcements: Announcement[]) => void) {
  const q = query(collection(db, COLLECTION_PATH), orderBy('date', 'desc'), limit(10));
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_PATH);
  });
}

export const getAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const q = query(collection(db, COLLECTION_PATH), orderBy('date', 'desc'), limit(10));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_PATH);
    return [];
  }
};

export const addAnnouncement = async (announcement: Omit<Announcement, 'id'>) => {
  try {
    return await addDoc(collection(db, COLLECTION_PATH), announcement);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_PATH);
  }
};

export const deleteAnnouncement = async (id: string) => {
  try {
    return await deleteDoc(doc(db, COLLECTION_PATH, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_PATH}/${id}`);
  }
};
