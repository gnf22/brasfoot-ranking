import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import type {  Season  } from '../models';

const COLLECTION_NAME = 'seasons';

export const seasonRepository = {
  async getAll(): Promise<Season[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('anoInicio', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
  },

  async getById(id: string): Promise<Season | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Season;
    }
    return null;
  },

  async create(seasonData: Omit<Season, 'id'>): Promise<Season> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), seasonData);
    return { id: docRef.id, ...seasonData } as Season;
  },

  async update(id: string, seasonData: Partial<Omit<Season, 'id'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, seasonData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
