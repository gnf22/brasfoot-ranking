import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { CoachTeam } from '../models';

const COLLECTION_NAME = 'coach_teams';

export const coachTeamRepository = {
  async getAll(): Promise<CoachTeam[]> {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachTeam));
  },

  async getByCoachId(coachId: string): Promise<CoachTeam[]> {
    const q = query(collection(db, COLLECTION_NAME), where('coachId', '==', coachId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachTeam));
  },

  async create(coachTeamData: Omit<CoachTeam, 'id'>): Promise<CoachTeam> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), coachTeamData);
    return { id: docRef.id, ...coachTeamData } as CoachTeam;
  },

  async update(id: string, coachTeamData: Partial<Omit<CoachTeam, 'id'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, coachTeamData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
