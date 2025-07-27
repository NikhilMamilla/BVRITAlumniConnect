// DeleteCommunityModal.tsx
// Placeholder for DeleteCommunityModal component

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CommunityService } from '../../services/communityService';
import { auth } from '@/firebase';
import { toast } from 'sonner';

interface DeleteCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
}

const communityService = CommunityService.getInstance();

const DeleteCommunityModal: React.FC<DeleteCommunityModalProps> = ({ isOpen, onClose, communityId, communityName }) => {
  const [loading, setLoading] = useState(false);
  const currentUser = auth.currentUser;

  const handleDelete = async () => {
    if (!currentUser) {
        toast.error("You must be logged in to delete a community.");
        return;
    };
    setLoading(true);
    try {
      await communityService.deleteCommunity(communityId, currentUser.uid, 'Deleted by owner');
      toast.success(`Community "${communityName}" has been deleted.`);
      // onClose will be called, and potentially a redirect will happen in the parent.
      onClose();
    } catch (error) {
      console.error('Failed to delete community:', error);
      toast.error('Failed to delete community. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will archive the community, hiding it from public view. All data will be preserved and can be restored later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive hover:bg-destructive/90">
            {loading ? 'Deleting...' : 'Yes, delete community'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCommunityModal; 