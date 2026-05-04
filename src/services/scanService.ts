import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc, 
  limit, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { encryptData, decryptData, getUserKey } from '../lib/encryption';

export interface ScanHistoryItem {
  id: string;
  name: string;
  thumbnail: string;
  analysis: string;
  timestamp: string;
  uid: string;
  isEncrypted?: boolean;
}

const COLLECTION_PATH = 'scans';

export function subscribeScans(uid: string, callback: (scans: ScanHistoryItem[]) => void) {
  const q = query(
    collection(db, COLLECTION_PATH), 
    where('uid', '==', uid),
    orderBy('timestamp', 'desc'),
    limit(20)
  );
  
  const userKey = getUserKey(uid);

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => {
      const item = doc.data() as Omit<ScanHistoryItem, 'id'>;
      const isItemEncrypted = item.isEncrypted;
      
      return { 
        id: doc.id, 
        ...item,
        name: isItemEncrypted ? decryptData(item.name, userKey) : item.name,
        analysis: isItemEncrypted ? decryptData(item.analysis, userKey) : item.analysis,
      } as ScanHistoryItem;
    });
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_PATH);
  });
}

export const addScan = async (scan: Omit<ScanHistoryItem, 'id' | 'timestamp'>, shouldEncrypt: boolean = true) => {
  try {
    const userKey = getUserKey(scan.uid);
    // Always encrypt sensitive research if requested
    const finalName = shouldEncrypt ? encryptData(scan.name, userKey) : scan.name;
    const finalAnalysis = shouldEncrypt ? encryptData(scan.analysis, userKey) : scan.analysis;

    await addDoc(collection(db, COLLECTION_PATH), {
      ...scan,
      name: finalName,
      analysis: finalAnalysis,
      isEncrypted: shouldEncrypt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_PATH);
  }
};

export const getScans = async (uid: string): Promise<ScanHistoryItem[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_PATH), 
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    const userKey = getUserKey(uid);

    return snap.docs.map(doc => {
      const item = doc.data() as Omit<ScanHistoryItem, 'id'>;
      const isItemEncrypted = item.isEncrypted;
      return { 
        id: doc.id, 
        ...item,
        name: isItemEncrypted ? decryptData(item.name, userKey) : item.name,
        analysis: isItemEncrypted ? decryptData(item.analysis, userKey) : item.analysis,
      } as ScanHistoryItem;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_PATH);
    return [];
  }
};

export const deleteScan = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_PATH, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_PATH}/${id}`);
  }
};
