import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import type {  Coach  } from '../models';

const COLLECTION_NAME = 'coaches';

export const coachRepository = {
  async getAll(): Promise<Coach[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('nome', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));
  },

  async getById(id: string): Promise<Coach | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Coach;
    }
    return null;
  },

  async create(coachData: Omit<Coach, 'id' | 'dataCriacao' | 'dataAtualizacao'>): Promise<Coach> {
    const now = new Date().toISOString();
    const newCoach = {
      ...coachData,
      dataCriacao: now,
      dataAtualizacao: now,
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newCoach);
    return { id: docRef.id, ...newCoach } as Coach;
  },

  async update(id: string, coachData: Partial<Omit<Coach, 'id' | 'dataCriacao' | 'dataAtualizacao'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData = {
      ...coachData,
      dataAtualizacao: new Date().toISOString(),
    };
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
