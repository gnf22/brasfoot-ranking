import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import type {  Team  } from '../models';

const COLLECTION_NAME = 'teams';

export const teamRepository = {
  async getAll(): Promise<Team[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('nome', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
  },

  async getById(id: string): Promise<Team | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Team;
    }
    return null;
  },

  async create(teamData: Omit<Team, 'id'>): Promise<Team> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), teamData);
    return { id: docRef.id, ...teamData } as Team;
  },

  async update(id: string, teamData: Partial<Omit<Team, 'id'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, teamData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
