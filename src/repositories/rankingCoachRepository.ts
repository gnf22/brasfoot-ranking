import { collection, doc, getDocs, setDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { RankingCoach } from '../models';

const COLLECTION_NAME = 'ranking_coaches';

export const rankingCoachRepository = {
  async getAll(): Promise<RankingCoach[]> {
    // Sort locally or via firestore index. By default we might need an index for totalPontos desc
    const q = query(collection(db, COLLECTION_NAME), orderBy('totalPontos', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as RankingCoach);
  },

  async createOrUpdate(rankingData: RankingCoach, coachId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, coachId);
    await setDoc(docRef, rankingData);
  },

  async delete(coachId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, coachId);
    await deleteDoc(docRef);
  }
};
