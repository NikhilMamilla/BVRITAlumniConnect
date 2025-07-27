// DiscussionThread.tsx
// Placeholder for DiscussionThread component

import React, { useState, useEffect, useMemo } from 'react';
import { discussionService } from '../../services/discussionService';
import type { Discussion, DiscussionReply, ReplyCreateData } from '../../types/discussion.types';
import { ReplyType } from '../../types/discussion.types';
import { DiscussionPost } from './DiscussionPost';
import { DiscussionReplyComponent } from './DiscussionReply';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare } from 'lucide-react';

interface DiscussionThreadProps {
  discussionId: string;
  communityId: string;
  userId: string; // Assume current user's ID is passed
  canManage: boolean; // Assume current user's permissions are passed
  userInfo: {
    displayName: string;
    role: 'student' | 'alumni' | 'admin';
    reputation: number;
    isExpert: boolean;
    photoURL?: string;
    badge?: string;
  };
}

// Helper to build a tree from a flat list of replies
const buildReplyTree = (replies: DiscussionReply[]): (DiscussionReply & { children: DiscussionReply[] })[] => {
  const replyMap: { [key: string]: DiscussionReply & { children: DiscussionReply[] } } = {};
  const tree: (DiscussionReply & { children: DiscussionReply[] })[] = [];

  for (const reply of replies) {
    replyMap[reply.id] = { ...reply, children: [] };
  }

  for (const replyId in replyMap) {
    const reply = replyMap[replyId];
    if (reply.parentReplyId && replyMap[reply.parentReplyId]) {
      replyMap[reply.parentReplyId].children.push(reply);
    } else {
      tree.push(reply);
    }
  }
  return tree;
};

// Recursive component to render replies
const ReplyNode: React.FC<{
    reply: DiscussionReply & { children: DiscussionReply[] };
    userId: string;
    canManage: boolean;
    communityId: string;
    onReply: (replyId: string) => void;
}> = ({ reply, userId, canManage, communityId, onReply }) => {
    return (
        <div className="ml-0 md:ml-8 pl-4 border-l-2">
            <DiscussionReplyComponent
                reply={reply}
                userId={userId}
                canManage={canManage}
                communityId={communityId}
                onReply={onReply}
            />
            {/* Recursively render child replies */}
            <div className="space-y-2">
                {reply.children.map(child => (
                    <ReplyNode key={child.id} reply={child as DiscussionReply & { children: DiscussionReply[] }} userId={userId} canManage={canManage} communityId={communityId} onReply={onReply} />
                ))}
            </div>
        </div>
    );
};

// Reply form component
const ReplyForm: React.FC<{
    discussionId: string;
    communityId: string;
    userId: string;
    parentReplyId?: string;
    onReplySuccess: () => void;
    userInfo: {
        displayName: string;
        role: 'student' | 'alumni' | 'admin';
        reputation: number;
        isExpert: boolean;
        photoURL?: string;
        badge?: string;
    };
}> = ({ discussionId, communityId, userId, parentReplyId, onReplySuccess, userInfo }) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);

    const handleSubmit = async () => {
        if (!content.trim()) {
            setError("Reply cannot be empty.");
            return;
        }
        
        setIsLoading(true);
        setError(null);

        try {
            const replyData: ReplyCreateData = {
                discussionId,
                communityId,
                authorId: userId,
                content,
                authorInfo: {
                  displayName: userInfo.displayName,
                  photoURL: userInfo.photoURL,
                  role: userInfo.role,
                  reputation: userInfo.reputation,
                  badge: userInfo.badge,
                  isExpert: userInfo.isExpert,
                },
                type: ReplyType.COMMENT,
                depth: parentReplyId ? 1 : 0,
                parentReplyId,
                isAcceptedAnswer: false,
                isBestAnswer: false,
                isHighQuality: false,
                isReported: false,
                reportCount: 0,
                isFlagged: false,
                isHidden: false,
                isPinned: false,
                isOfficial: false,
                attachments: [],
                codeSnippets: [],
                externalLinks: [],
                mentions: [],
                mentionedUsers: [],
                isEdited: false,
                editCount: 0
            };

            await discussionService.createReply(replyData);
            setContent('');
            onReplySuccess();
        } catch (err) {
            console.error("Failed to post reply:", err);
            setError(err instanceof Error ? err.message : "Failed to post reply.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <Textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={parentReplyId ? "Write your reply..." : "Add to the discussion..."}
                rows={4}
            />
            <div className="flex justify-end items-center mt-2 space-x-2">
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Reply
                </Button>
            </div>
        </div>
    )
}

export const DiscussionThread: React.FC<DiscussionThreadProps> = ({ 
  discussionId, 
  communityId, 
  userId, 
  canManage, 
  userInfo 
}) => {
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string|null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const unsubDiscussion = discussionService.subscribeToDiscussionById(
      discussionId,
      (data) => {
        if (!isMounted) return;
        
        if (data) {
          setDiscussion(data);
        } else {
          setError("Discussion not found.");
        }
        setIsLoading(false);
      },
      (err) => {
        if (!isMounted) return;
        
        console.error("Error fetching discussion:", {
          error: err,
          discussionId,
          communityId,
          attemptedPath: `/discussions/${discussionId}`
        });
        setError(`Failed to load discussion. Details: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    );

    const unsubReplies = discussionService.subscribeToReplies(
      discussionId,
      (data) => {
        if (!isMounted) return;
        setReplies(data);
      },
      (err) => {
        if (!isMounted) return;
        console.error("Error fetching replies:", {
          error: err,
          discussionId,
          communityId,
          attemptedPath: `/discussions/${discussionId}/replies`
        });
        if(!error) setError(`Failed to load replies. Details: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
      }
    );

    return () => {
      isMounted = false;
      unsubDiscussion();
      unsubReplies();
    };
  }, [discussionId]); // Removed 'error' from dependencies to prevent infinite loops

  const replyTree = useMemo(() => buildReplyTree(replies), [replies]);

  if (isLoading) {
    return <div className="text-center p-12"><Loader2 className="h-10 w-10 animate-spin mx-auto" /></div>;
  }

  if (error || !discussion) {
    return <div className="text-center p-12 text-red-500">{error || "Could not load discussion."}</div>;
  }

  return (
    <div className="space-y-6">
      <DiscussionPost discussion={discussion} userId={userId} canManage={canManage} />
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center">
            <MessageSquare className="mr-2"/> {replies.length} Replies
        </h2>

        {replyTree.map(reply => (
            <ReplyNode key={reply.id} reply={reply} userId={userId} canManage={canManage} communityId={communityId} onReply={setReplyingTo}/>
        ))}

        {replyingTo && (
             <ReplyForm 
                discussionId={discussionId}
                communityId={communityId}
                userId={userId}
                parentReplyId={replyingTo}
                onReplySuccess={() => setReplyingTo(null)}
                userInfo={userInfo}
            />
        )}

        <ReplyForm 
            discussionId={discussionId}
            communityId={communityId}
            userId={userId}
            onReplySuccess={() => {}}
            userInfo={userInfo}
        />
      </div>
    </div>
  );
}; 