// DiscussionVoting.tsx
// Placeholder for DiscussionVoting component

import React, { useState, useMemo, useEffect } from 'react';
import { discussionService } from '../../services/discussionService';
import { Discussion, DiscussionReply, VoteType } from '../../types/discussion.types';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

interface DiscussionVotingProps {
  item: Discussion | DiscussionReply;
  userId: string;
  itemType: 'discussion' | 'reply';
}

export const DiscussionVoting: React.FC<DiscussionVotingProps> = ({ item, userId, itemType }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local state for optimistic updates
  const [localVoteScore, setLocalVoteScore] = useState(item.voteScore || 0);
  const [localUserVote, setLocalUserVote] = useState<'upvote' | 'downvote' | undefined>(undefined);

  useEffect(() => {
    setLocalVoteScore(item.voteScore || 0);
    const foundVote = item.votes?.find(v => v.userId === userId)?.type;
    setLocalUserVote(foundVote as 'upvote' | 'downvote' | undefined);
  }, [item.voteScore, item.votes, userId]);

  const handleVote = async (voteType: VoteType) => {
    if (!userId) {
      setError("You must be logged in to vote.");
      return;
    }
    if (isVoting) return;

    setIsVoting(true);
    setError(null);
    
    const originalVoteScore = localVoteScore;
    const originalUserVote = localUserVote;

    // Optimistic UI update
    let newVoteScore = originalVoteScore;
    if (originalUserVote === voteType) { // Retracting vote
      newVoteScore += (voteType === VoteType.UPVOTE ? -1 : 1);
      setLocalUserVote(undefined);
    } else { // New or changed vote
      if (originalUserVote) { // Changing vote
          newVoteScore += (voteType === VoteType.UPVOTE ? 2 : -2);
      } else { // New vote
          newVoteScore += (voteType === VoteType.UPVOTE ? 1 : -1);
      }
      setLocalUserVote(voteType);
    }
    setLocalVoteScore(newVoteScore);

    try {
      if (itemType === 'discussion') {
        await discussionService.voteOnDiscussion(item.id, userId, voteType);
      } else {
        await discussionService.voteOnReply(item.id, userId, voteType);
      }
    } catch (err) {
      console.error(`Error voting on ${itemType}:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      // Revert on error
      setLocalVoteScore(originalVoteScore);
      setLocalUserVote(originalUserVote);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center space-x-1 text-gray-500">
      <button
        onClick={() => handleVote(VoteType.UPVOTE)}
        disabled={isVoting}
        className={`flex items-center justify-center p-1 rounded-full transition-colors duration-200 ease-in-out ${
          localUserVote === 'upvote' 
            ? 'text-green-600 bg-green-100' 
            : 'hover:bg-green-100 hover:text-green-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Upvote"
      >
        {isVoting && localUserVote === 'upvote' ? <Loader2 size={18} className="animate-spin"/> : <ThumbsUp size={18} />}
      </button>

      <span className="font-semibold text-sm w-8 text-center" data-testid="vote-score">
        {localVoteScore}
      </span>

      <button
        onClick={() => handleVote(VoteType.DOWNVOTE)}
        disabled={isVoting}
        className={`flex items-center justify-center p-1 rounded-full transition-colors duration-200 ease-in-out ${
          localUserVote === 'downvote' 
            ? 'text-red-600 bg-red-100' 
            : 'hover:bg-red-100 hover:text-red-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Downvote"
      >
        {isVoting && localUserVote === 'downvote' ? <Loader2 size={18} className="animate-spin"/> : <ThumbsDown size={18} />}
      </button>

      {error && <p className="text-xs text-red-500 ml-2">{error}</p>}
    </div>
  );
}; 