// DiscussionPost.tsx
// Placeholder for DiscussionPost component

import React, { useState, useMemo } from 'react';
import type { Discussion } from '../../types/discussion.types';
import { discussionService } from '../../services/discussionService';
import { DiscussionVoting } from './DiscussionVoting';
import DiscussionTags from './DiscussionTags';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, Eye, MessageSquare, Loader2, Bookmark, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';

interface DiscussionPostProps {
  discussion: Discussion;
  userId: string;
  canManage: boolean;
  onDelete?: () => void; // Callback when post is deleted
}

export const DiscussionPost: React.FC<DiscussionPostProps> = ({ discussion, userId, canManage, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(discussion.title);
  const [editedContent, setEditedContent] = useState(discussion.content);
  const [editedTags, setEditedTags] = useState(discussion.tags);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEditOrDelete = canManage || userId === discussion.authorId;

  const handleUpdate = async () => {
    if (!editedTitle.trim() || !editedContent.trim()) {
      setError("Title and content cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await discussionService.updateDiscussion(discussion.id, {
        title: editedTitle,
        content: editedContent,
        tags: editedTags,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating discussion:", err);
      setError(err instanceof Error ? err.message : "Failed to update post.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await discussionService.deleteDiscussion(discussion.id);
      if (onDelete) onDelete();
      window.location.href = `/community/${discussion.communityId}/discussions`;
    } catch (err) {
      console.error("Error deleting discussion:", err);
      setError(err instanceof Error ? err.message : "Failed to delete post.");
      setIsLoading(false);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
           <Avatar className="h-12 w-12">
            <AvatarImage src={discussion.authorInfo.photoURL} alt={discussion.authorInfo.displayName} />
            <AvatarFallback>{discussion.authorInfo.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-bold text-lg">{discussion.authorInfo.displayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(discussion.createdAt.seconds * 1000))} ago
            </span>
          </div>
        </div>
        {canEditOrDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical size={20} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleting(true)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-4">
        {!isEditing ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900">{discussion.title}</h1>
            <div className="prose prose-lg max-w-none mt-4" dangerouslySetInnerHTML={{ __html: discussion.htmlContent || discussion.content }}></div>
          </>
        ) : (
          <div className="space-y-4">
            <Input 
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-2xl font-bold"
              placeholder="Discussion Title"
            />
            <Textarea 
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={10}
              placeholder="What are your thoughts?"
            />
          </div>
        )}
      </div>

      <div className="mt-6">
          <DiscussionTags 
            communityId={discussion.communityId}
            initialTags={isEditing ? editedTags : discussion.tags}
            onTagsChange={isEditing ? setEditedTags : () => {}}
            isEditable={isEditing}
          />
      </div>

      {isEditing && (
        <div className="flex justify-end items-center space-x-2 mt-4">
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>
      )}

      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <DiscussionVoting item={discussion} userId={userId} itemType="discussion" />
        <div className="flex items-center space-x-4 text-gray-500">
          <div className="flex items-center space-x-1">
            <Eye size={20} />
            <span className="text-sm">{discussion.viewCount || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageSquare size={20} />
            <span className="text-sm">{discussion.replyCount || 0}</span>
          </div>
          <Button variant="ghost" size="icon"><Bookmark size={20} /></Button>
          <Button variant="ghost" size="icon"><Share2 size={20} /></Button>
        </div>
      </div>
      
       <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this discussion and all of its replies. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-red-500 hover:bg-red-600">
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 