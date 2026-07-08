import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { TeamTitle } from '../models';

const COLLECTION_NAME = 'team_titles';

export const teamTitleRepository = {
  async getAll(): Promise<TeamTitle[]> {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamTitle));
  },

  async getByTeamId(teamId: string): Promise<TeamTitle[]> {
    const q = query(collection(db, COLLECTION_NAME), where('teamId', '==', teamId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamTitle));
  },

  async create(titleData: Omit<TeamTitle, 'id'>): Promise<TeamTitle> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), titleData);
    return { id: docRef.id, ...titleData } as TeamTitle;
  },

  async update(id: string, titleData: Partial<Omit<TeamTitle, 'id'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, titleData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
