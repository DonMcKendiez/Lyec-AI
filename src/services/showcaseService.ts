import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  category: 'food' | 'wares' | 'activities' | 'history' | 'stories' | 'dances';
  image: string;
  createdAt?: any;
  updatedAt?: any;
}

const INITIAL_ITEMS: ShowcaseItem[] = [
  {
    id: 'dance-1',
    title: 'Bwola Dance',
    description: 'The royal dance of the Acholi, performed for high chiefs and kings.',
    category: 'dances',
    image: 'https://images.unsplash.com/photo-1545625032-475960010078?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'dance-2',
    title: 'Dingidingi Dance',
    description: 'A high-energy dance performed by young girls to demonstrate beauty and strength.',
    category: 'dances',
    image: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'story-1',
    title: 'The Spear and the Bead',
    description: 'The definitive migration story of the Luo brothers Gipir and Labongo.',
    category: 'history',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'ododo-1',
    title: 'The Hare and the Elephant',
    description: 'A classic Ododo teaching wit over brute strength.',
    category: 'stories',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'ododo-2',
    title: 'The Greedy Hyena',
    description: 'A cautionary tale about the dangers of greed and lack of community spirit.',
    category: 'stories',
    image: 'https://images.unsplash.com/photo-1564349683136-77e08bef1ef1?auto=format&fit=crop&q=80&w=800'
  }
];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const COLLECTION_PATH = 'showcase';

export async function getShowcaseItems(): Promise<ShowcaseItem[]> {
  try {
    const q = query(collection(db, COLLECTION_PATH), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const firestoreItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ShowcaseItem));
    return [...firestoreItems, ...INITIAL_ITEMS];
  } catch (error) {
    return INITIAL_ITEMS;
  }
}

export async function addShowcaseItem(item: Omit<ShowcaseItem, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_PATH), {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_PATH);
  }
}

export async function updateShowcaseItem(id: string, updates: Partial<ShowcaseItem>) {
  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_PATH}/${id}`);
  }
}

export async function deleteShowcaseItem(id: string) {
  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_PATH}/${id}`);
  }
}
