// CreateDiscussionModal.tsx
// Placeholder for CreateDiscussionModal component

import React, { useState, useEffect } from 'react';
import { discussionService } from '../../services/discussionService';
import { DiscussionCreateData, DiscussionCategory, DiscussionType, DiscussionPriority, DiscussionStatus } from '../../types/discussion.types';
import DiscussionTags from './DiscussionTags';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/AuthContext';

interface CreateDiscussionModalProps {
  communityId: string;
  userId: string;
  onSuccess: (discussionId: string) => void;
}

export const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({ communityId, userId, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DiscussionCategory | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !category) {
      setError("Please fill out all required fields: title, content, and category.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const discussionData: any = {
        communityId,
        authorId: userId,
        authorInfo: {
          displayName: currentUser?.displayName || 'Unknown User',
          photoURL: currentUser?.photoURL || '',
          role: currentUser?.role || 'student',
          reputation: 0,
        },
        title,
        content,
        excerpt: content.substring(0, 100),
        category,
        tags,
        type: DiscussionType.GENERAL_DISCUSSION,
        priority: DiscussionPriority.NORMAL,
        status: DiscussionStatus.ACTIVE,
        isLocked: false,
        hasBestAnswer: false,
        isReported: false,
        reportCount: 0,
        isFlagged: false,
        isPinned: false,
        isFeatured: false,
        slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        attachments: [],
        hasAttachments: false,
        codeSnippets: [],
        hasCodeSnippets: false,
        externalLinks: [],
        hasExternalLinks: false,
        isFollowedByAuthor: true,
        viewCount: 0,
        upvoteCount: 0,
        downvoteCount: 0,
        replyCount: 0,
        followerCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
        isAnonymous: false,
        isApproved: true,
        answerCount: 0,
        lastActivityBy: currentUser?.displayName || 'Unknown User',
        lastActivityType: 'created',
        relatedDiscussionIds: [],
        participantCount: 1,
        isClosed: false,
        closedAt: null,
        closedBy: null,
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        editedAt: null,
        editedBy: null,
        lastReply: null,
        polls: [],
        hasPolls: false,
        reactions: [],
        hasReactions: false,
        mentions: [],
        hasMentions: false,
        isPrivate: false,
        allowedUsers: [],
        isImported: false,
        source: null,
        sourceId: null,
        metadata: {},
        htmlContent: '',
        rawContent: '',
        difficulty: 'beginner',
        bestAnswerId: '',
        bestAnswerSelectedBy: '',
        bestAnswerSelectedAt: null,
        flaggedReason: '',
        flaggedBy: '',
        flaggedAt: null,
        pinnedBy: '',
        pinnedAt: null,
        pinnedReason: '',
        featuredBy: '',
        featuredAt: null,
        resolutionTime: 0,
        lastEditedAt: null,
        lastEditedBy: '',
        isBookmarked: false,
        isFollowing: false,
        readBy: [],
      };

      const newDiscussionId = await discussionService.createDiscussion(discussionData);
      
      setIsLoading(false);
      setIsOpen(false);
      onSuccess(newDiscussionId);
      // Reset form
      setTitle('');
      setContent('');
      setCategory('');
      setTags([]);

    } catch (err) {
      console.error("Failed to create discussion:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setIsLoading(false);
    }
  };

  const allCategories = Object.values(DiscussionCategory);
  const allPriorities = Object.values(DiscussionPriority);
  const allTypes = Object.values(DiscussionType);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Start a Discussion</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Create a New Discussion</DialogTitle>
          <DialogDescription>
            Share your thoughts, ask a question, or start a conversation with the community.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="What's on your mind?"/>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content" className="text-right pt-2">Content</Label>
            <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} className="col-span-3" rows={8} placeholder="Provide more details here..."/>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as DiscussionCategory)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {allCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
           </div>
           <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Tags</Label>
                <div className="col-span-3">
                    <DiscussionTags 
                        communityId={communityId}
                        initialTags={tags}
                        onTagsChange={setTags}
                        isEditable={true}
                        maxTags={5}
                    />
                </div>
           </div>
        </div>
        {error && <p className="text-sm text-center text-red-500">{error}</p>}
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Discussion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 