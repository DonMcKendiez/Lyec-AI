import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'info' | 'warning' | 'achievement';
}

export const getAnnouncements = async (): Promise<Announcement[]> => {
  const q = query(collection(db, 'announcements'), orderBy('date', 'desc'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
};

export const addAnnouncement = async (announcement: Omit<Announcement, 'id'>) => {
  return await addDoc(collection(db, 'announcements'), announcement);
};

export const deleteAnnouncement = async (id: string) => {
  return await deleteDoc(doc(db, 'announcements', id));
};
