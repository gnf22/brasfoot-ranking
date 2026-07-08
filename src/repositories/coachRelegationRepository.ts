import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { CoachRelegation } from '../models';

const COLLECTION_NAME = 'coach_relegations';

export const coachRelegationRepository = {
  async getAll(): Promise<CoachRelegation[]> {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachRelegation));
  },

  async getByCoachId(coachId: string): Promise<CoachRelegation[]> {
    const q = query(collection(db, COLLECTION_NAME), where('coachId', '==', coachId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachRelegation));
  },

  async create(relegationData: Omit<CoachRelegation, 'id'>): Promise<CoachRelegation> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), relegationData);
    return { id: docRef.id, ...relegationData } as CoachRelegation;
  },

  async update(id: string, relegationData: Partial<Omit<CoachRelegation, 'id'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, relegationData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
