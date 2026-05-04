import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export interface AdminUser {
  uid: string;
  email: string;
  role: 'owner' | 'admin';
  displayName?: string;
  addedAt: any;
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  apiKeyRequired: boolean;
  config?: any;
}

export interface Integration {
  id: string;
  providerName: string;
  endpoint: string;
  lastSynced: any;
  status: 'connected' | 'disconnected';
}

// Admins
export const getAdmins = async (): Promise<AdminUser[]> => {
  const path = 'admins';
  try {
    const q = query(collection(db, path), orderBy('addedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data() as AdminUser }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const addAdmin = async (admin: Omit<AdminUser, 'addedAt'>) => {
  const path = `admins/${admin.uid}`;
  try {
    await setDoc(doc(db, 'admins', admin.uid), {
      ...admin,
      addedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateAdminRole = async (uid: string, role: 'owner' | 'admin') => {
  const path = `admins/${uid}`;
  try {
    await updateDoc(doc(db, 'admins', uid), { role });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const removeAdmin = async (uid: string) => {
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Transfer Ownership
export const transferOwnership = async (currentOwnerUid: string, newOwnerUid: string) => {
  try {
    await updateDoc(doc(db, 'admins', currentOwnerUid), { role: 'admin' });
    await updateDoc(doc(db, 'admins', newOwnerUid), { role: 'owner' });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'admins/transfer');
  }
};

// Extensions
export const getExtensions = async (): Promise<Extension[]> => {
  const path = 'extensions';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Extension }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const toggleExtension = async (id: string, status: 'active' | 'inactive') => {
  const path = `extensions/${id}`;
  try {
    await updateDoc(doc(db, 'extensions', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// Integrations
export const getIntegrations = async (): Promise<Integration[]> => {
  const path = 'integrations';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Integration }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

