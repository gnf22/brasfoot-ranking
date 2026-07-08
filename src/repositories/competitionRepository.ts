import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import type {  Competition  } from '../models';

const COLLECTION_NAME = 'competitions';

export const competitionRepository = {
  async getAll(): Promise<Competition[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('nome', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Competition));
  },

  async getById(id: string): Promise<Competition | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Competition;
    }
    return null;
  },

  async create(competitionData: Omit<Competition, 'id'>): Promise<Competition> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), competitionData);
    return { id: docRef.id, ...competitionData } as Competition;
  },

  async update(id: string, competitionData: Partial<Omit<Competition, 'id'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, competitionData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
