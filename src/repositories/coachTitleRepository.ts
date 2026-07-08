import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { CoachTitle } from '../models';

const COLLECTION_NAME = 'coach_titles';

export const coachTitleRepository = {
  async getAll(): Promise<CoachTitle[]> {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachTitle));
  },

  async getByCoachId(coachId: string): Promise<CoachTitle[]> {
    const q = query(collection(db, COLLECTION_NAME), where('coachId', '==', coachId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachTitle));
  },

  async create(titleData: Omit<CoachTitle, 'id'>): Promise<CoachTitle> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), titleData);
    return { id: docRef.id, ...titleData } as CoachTitle;
  },

  async update(id: string, titleData: Partial<Omit<CoachTitle, 'id'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, titleData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
