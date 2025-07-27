import { db } from '@/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Alumni } from '@/types/alumni';

export class UserService {
  static async getUserById(userId: string): Promise<Alumni | null> {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Alumni;
  }

  static async pinCommunity(userId: string, communityId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pinnedCommunityIds: arrayUnion(communityId)
    });
  }

  static async unpinCommunity(userId: string, communityId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pinnedCommunityIds: arrayRemove(communityId)
    });
  }
} 