// DiscussionReply.tsx
// Placeholder for DiscussionReply component

import React, { useState } from 'react';
import type { DiscussionReply } from '../../types/discussion.types';
import { discussionService } from '../../services/discussionService';
import { DiscussionVoting } from './DiscussionVoting';
import { formatRelativeTime } from '../../utils/dateHelpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MoreVertical, CornerUpLeft, MessageSquare, Edit, Trash2, Loader2 } from 'lucide-react';
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

interface DiscussionReplyProps {
  reply: DiscussionReply;
  userId: string; // Current logged-in user
  communityId: string;
  onReply: (parentReplyId: string) => void;
  canManage: boolean; // Does user have moderator-level permissions?
}

export const DiscussionReplyComponent: React.FC<DiscussionReplyProps> = ({ reply, userId, canManage, onReply }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(reply.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEditOrDelete = canManage || userId === reply.authorId;

  const handleUpdateReply = async () => {
    if (!editedContent.trim()) {
      setError("Reply cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await discussionService.updateReply(reply.id, { content: editedContent });
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating reply:", err);
      setError(err instanceof Error ? err.message : "Failed to update reply.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReply = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await discussionService.deleteReply(reply.id);
      // The parent component will handle removal from the UI via real-time subscription
    } catch (err) {
      console.error("Error deleting reply:", err);
      setError(err instanceof Error ? err.message : "Failed to delete reply.");
    } finally {
      setIsLoading(false);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex space-x-4 py-4">
      <Avatar>
        <AvatarImage src={reply.authorInfo.photoURL} alt={reply.authorInfo.displayName} />
        <AvatarFallback>{reply.authorInfo.displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm">{reply.authorInfo.displayName}</span>
            <span className="text-xs text-gray-500">
              · {formatRelativeTime(reply.createdAt)} {reply.isEdited && '(edited)'}
            </span>
          </div>
          {canEditOrDelete && !isEditing && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDeleting(true)} className="text-red-500">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          )}
        </div>
        
        {!isEditing ? (
          <div className="prose prose-sm max-w-none text-gray-800 mt-1" dangerouslySetInnerHTML={{ __html: reply.content }}></div>
        ) : (
          <div className="mt-2">
            <Textarea 
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full"
              rows={4}
            />
            <div className="flex justify-end items-center space-x-2 mt-2">
                {error && <p className="text-xs text-red-500">{error}</p>}
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleUpdateReply} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </div>
          </div>
        )}
        
        {!isEditing && (
            <div className="flex items-center space-x-4 mt-2">
                <DiscussionVoting item={reply} userId={userId} itemType="reply" />
                 <Button variant="ghost" size="sm" onClick={() => onReply(reply.id)} className="text-gray-600 hover:text-gray-900">
                    <CornerUpLeft size={16} className="mr-2" />
                    Reply
                </Button>
            </div>
        )}
      </div>

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this reply?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the reply from the discussion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReply} disabled={isLoading} className="bg-red-500 hover:bg-red-600">
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 