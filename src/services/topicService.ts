import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export interface LessonTopic {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  keywords: string[];
  createdAt?: any;
}

const COLLECTION_PATH = 'lessonTopics';

export async function getLessonTopics(): Promise<LessonTopic[]> {
  try {
    const q = query(collection(db, COLLECTION_PATH), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LessonTopic));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_PATH);
    return [];
  }
}

export async function addLessonTopic(topic: Omit<LessonTopic, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_PATH), {
      ...topic,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_PATH);
  }
}

export async function updateLessonTopic(id: string, updates: Partial<LessonTopic>) {
  try {
    await updateDoc(doc(db, COLLECTION_PATH, id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_PATH}/${id}`);
  }
}

export async function deleteLessonTopic(id: string) {
  try {
    await deleteDoc(doc(db, COLLECTION_PATH, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_PATH}/${id}`);
  }
}
