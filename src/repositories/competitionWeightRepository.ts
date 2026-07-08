import { collection, getDocs, doc, query, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import type {  CompetitionWeight  } from '../models';

const COLLECTION_NAME = 'competition_weights';

export const competitionWeightRepository = {
  async getAll(): Promise<CompetitionWeight[]> {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetitionWeight));
  },

  async saveAll(weights: Omit<CompetitionWeight, 'id'>[]): Promise<void> {
    const batch = writeBatch(db);
    
    // Instead of completely wiping, we can use the competitionId as the document ID 
    // to easily upsert weights per competition.
    weights.forEach(weight => {
      const docRef = doc(db, COLLECTION_NAME, weight.competitionId);
      batch.set(docRef, weight);
    });

    await batch.commit();
  }
};
