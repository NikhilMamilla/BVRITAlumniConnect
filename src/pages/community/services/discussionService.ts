// discussionService.ts
// Placeholder for discussionService

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  FirestoreError,
  Unsubscribe,
  runTransaction,
  arrayUnion,
  arrayRemove,
  increment,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type {
  Discussion,
  DiscussionReply,
  DiscussionCreateData,
  ReplyCreateData,
  ReplyUpdateData,
  DiscussionSearchParams,
  DiscussionSearchResult,
  DiscussionFilter,
  DiscussionAnalytics,
  CommunityDiscussionMetrics,
  VoteType
} from '../types/discussion.types';

export class DiscussionService {
  private static instance: DiscussionService;
  private readonly DISCUSSIONS_COLLECTION = 'discussions';
  private readonly REPLIES_COLLECTION = 'discussionReplies';

  private constructor() {}
  public static getInstance(): DiscussionService {
    if (!DiscussionService.instance) {
      DiscussionService.instance = new DiscussionService();
    }
    return DiscussionService.instance;
  }

  // =========================
  // Discussions
  // =========================

  async getDiscussions(
    communityId: string,
    params: Partial<DiscussionSearchParams> = {},
    limitCount = 20,
    startAfterDoc?: DocumentData
  ): Promise<{ discussions: Discussion[], lastVisible: DocumentData | null }> {
    let q = query(collection(db, this.DISCUSSIONS_COLLECTION), where('communityId', '==', communityId));
    if (params.type) q = query(q, where('type', '==', params.type));
    if (params.category) q = query(q, where('category', '==', params.category));
    if (params.status) q = query(q, where('status', '==', params.status));
    if (params.authorId) q = query(q, where('authorId', '==', params.authorId));
    if (params.tags && params.tags.length > 0) q = query(q, where('tags', 'array-contains-any', params.tags));
    q = query(q, orderBy(params.sortBy || 'createdAt', params.sortOrder || 'desc'));
    if (startAfterDoc) q = query(q, startAfter(startAfterDoc));
    q = query(q, limit(limitCount));
    const snapshot = await getDocs(q);
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    const discussions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discussion));
    return { discussions, lastVisible };
  }

  subscribeToDiscussions(
    communityId: string,
    callback: (discussions: Discussion[]) => void,
    onError: (error: FirestoreError) => void,
    params: Partial<DiscussionSearchParams>
  ): Unsubscribe {
    let q = query(
      collection(db, this.DISCUSSIONS_COLLECTION),
      where('communityId', '==', communityId)
    );

    if (params.category) {
      q = query(q, where('category', '==', params.category));
    }
    
    q = query(q, orderBy(params.sortBy || 'createdAt', params.sortOrder || 'desc'));
    
    // This subscription will fetch the initial batch.
    // For "load more", we will use the getDiscussions method.
    // A more complex real-time "load more" would require significant client-side logic to merge new documents.
    q = query(q, limit(params.limit || 20));

    return onSnapshot(q, (snapshot) => {
      const discussions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discussion));
      callback(discussions);
    }, onError);
  }

  async getDiscussionById(discussionId: string): Promise<Discussion | null> {
    const ref = doc(db, this.DISCUSSIONS_COLLECTION, discussionId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Discussion;
  }

  subscribeToDiscussionById(
    discussionId: string,
    callback: (discussion: Discussion | null) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const ref = doc(db, this.DISCUSSIONS_COLLECTION, discussionId);
    return onSnapshot(ref, (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback({ id: snapshot.id, ...snapshot.data() } as Discussion);
    }, onError);
  }

  async createDiscussion(data: DiscussionCreateData): Promise<string> {
    const docRef = await addDoc(collection(db, this.DISCUSSIONS_COLLECTION), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      uniqueViewers: [],
      voteScore: 0,
      upvoteCount: 0,
      downvoteCount: 0,
      replyCount: 0,
      votes: [],
      voterIds: [],
      lastActivityAt: new Date(),
      hotScore: 0,
      trendingScore: 0,
      qualityScore: 0,
      followers: [],
      followerCount: 0,
      engagementRate: 0,
      responseTime: 0,
      searchableContent: '',
      keywords: []
    });
    return docRef.id;
  }

  async updateDiscussion(discussionId: string, updates: Partial<Discussion>): Promise<void> {
    const ref = doc(db, this.DISCUSSIONS_COLLECTION, discussionId);
    await updateDoc(ref, { ...updates, updatedAt: new Date() });
  }

  async deleteDiscussion(discussionId: string): Promise<void> {
    const ref = doc(db, this.DISCUSSIONS_COLLECTION, discussionId);
    await deleteDoc(ref);
  }

  subscribeToPinnedDiscussions(
    communityId: string,
    callback: (discussions: Discussion[]) => void,
    onError?: (error: FirestoreError) => void,
    limitCount = 5
  ): Unsubscribe {
    const q = query(
      collection(db, this.DISCUSSIONS_COLLECTION),
      where('communityId', '==', communityId),
      where('isPinned', '==', true),
      orderBy('pinnedAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const discussions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discussion));
      callback(discussions);
    }, onError);
  }

  // =========================
  // Replies
  // =========================

  async getReplies(
    discussionId: string,
    limitCount = 50,
    startAfterDoc?: unknown
  ): Promise<DiscussionReply[]> {
    let q = query(collection(db, this.REPLIES_COLLECTION), where('discussionId', '==', discussionId));
    q = query(q, orderBy('createdAt', 'asc'), limit(limitCount));
    if (startAfterDoc) q = query(q, startAfter(startAfterDoc));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiscussionReply));
  }

  subscribeToReplies(
    discussionId: string,
    callback: (replies: DiscussionReply[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(collection(db, this.REPLIES_COLLECTION), where('discussionId', '==', discussionId), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const replies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiscussionReply));
      callback(replies);
    }, onError);
  }

  async getReplyById(replyId: string): Promise<DiscussionReply | null> {
    const ref = doc(db, this.REPLIES_COLLECTION, replyId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as DiscussionReply;
  }

  async createReply(data: ReplyCreateData): Promise<string> {
    const docRef = await addDoc(collection(db, this.REPLIES_COLLECTION), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      voteScore: 0,
      upvoteCount: 0,
      downvoteCount: 0,
      votes: [],
      voterIds: [],
      qualityScore: 0,
      helpfulVotes: 0,
      childReplies: [],
      childCount: 0,
      editHistory: []
    });
    return docRef.id;
  }

  async updateReply(replyId: string, updates: ReplyUpdateData): Promise<void> {
    const ref = doc(db, this.REPLIES_COLLECTION, replyId);
    await updateDoc(ref, { ...updates, updatedAt: new Date() });
  }

  async deleteReply(replyId: string): Promise<void> {
    const ref = doc(db, this.REPLIES_COLLECTION, replyId);
    await deleteDoc(ref);
  }

  // =========================
  // Voting (Discussions & Replies)
  // =========================
  
  async voteOnDiscussion(discussionId: string, userId: string, voteType: VoteType): Promise<void> {
    const discussionRef = doc(db, this.DISCUSSIONS_COLLECTION, discussionId);

    await runTransaction(db, async (transaction) => {
      const discussionDoc = await transaction.get(discussionRef);
      if (!discussionDoc.exists()) {
        throw new Error("Discussion not found!");
      }

      const data = discussionDoc.data() as Discussion;
      const currentVote = data.voterIds.includes(userId) ? (data.votes.find(v => v.userId === userId)?.type) : undefined;

      let upvoteIncrement = 0;
      let downvoteIncrement = 0;

      if (currentVote === voteType) { // User is retracting their vote
        if (voteType === 'upvote') upvoteIncrement = -1;
        else downvoteIncrement = -1;
        transaction.update(discussionRef, { 
          voterIds: arrayRemove(userId),
          votes: arrayRemove(data.votes.find(v => v.userId === userId))
        });
      } else { // New vote or changing vote
        if (currentVote === 'upvote') upvoteIncrement = -1;
        else if (currentVote === 'downvote') downvoteIncrement = -1;

        if (voteType === 'upvote') upvoteIncrement += 1;
        else downvoteIncrement += 1;

        if(currentVote) { // Changing vote
          transaction.update(discussionRef, {
            votes: arrayRemove(data.votes.find(v => v.userId === userId))
          });
        }
        transaction.update(discussionRef, {
          voterIds: arrayUnion(userId),
          votes: arrayUnion({ userId, type: voteType, createdAt: new Date() })
        });
      }
      
      const newUpvoteCount = (data.upvoteCount || 0) + upvoteIncrement;
      const newDownvoteCount = (data.downvoteCount || 0) + downvoteIncrement;

      transaction.update(discussionRef, {
        upvoteCount: newUpvoteCount,
        downvoteCount: newDownvoteCount,
        voteScore: newUpvoteCount - newDownvoteCount,
        lastActivityAt: new Date(),
        lastActivityBy: userId,
        lastActivityType: 'voted'
      });
    });
  }

  async voteOnReply(replyId: string, userId: string, voteType: VoteType): Promise<void> {
    const replyRef = doc(db, this.REPLIES_COLLECTION, replyId);
    
    await runTransaction(db, async (transaction) => {
      const replyDoc = await transaction.get(replyRef);
      if (!replyDoc.exists()) {
        throw new Error("Reply not found!");
      }

      const data = replyDoc.data() as DiscussionReply;
      const currentVote = data.voterIds.includes(userId) ? (data.votes.find(v => v.userId === userId)?.type) : undefined;
      
      let upvoteIncrement = 0;
      let downvoteIncrement = 0;

      if (currentVote === voteType) { // Retracting vote
        if (voteType === 'upvote') upvoteIncrement = -1;
        else downvoteIncrement = -1;
        transaction.update(replyRef, { 
          voterIds: arrayRemove(userId),
          votes: arrayRemove(data.votes.find(v => v.userId === userId))
        });
      } else { // New or changing vote
        if (currentVote === 'upvote') upvoteIncrement = -1;
        else if (currentVote === 'downvote') downvoteIncrement = -1;

        if (voteType === 'upvote') upvoteIncrement += 1;
        else downvoteIncrement += 1;

        if(currentVote) {
            transaction.update(replyRef, {
                votes: arrayRemove(data.votes.find(v => v.userId === userId))
            });
        }
        transaction.update(replyRef, {
          voterIds: arrayUnion(userId),
          votes: arrayUnion({ userId, type: voteType, createdAt: new Date() })
        });
      }
      
      const newUpvoteCount = (data.upvoteCount || 0) + upvoteIncrement;
      const newDownvoteCount = (data.downvoteCount || 0) + downvoteIncrement;
      
      transaction.update(replyRef, {
        upvoteCount: newUpvoteCount,
        downvoteCount: newDownvoteCount,
        voteScore: newUpvoteCount - newDownvoteCount,
        updatedAt: new Date()
      });
    });
  }
}

export const discussionService = DiscussionService.getInstance(); 