// CommunityJoinButton.tsx
// Placeholder for CommunityJoinButton component

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { useCommunityMember } from '../../hooks/useCommunityMember';
import { Community, JoinApprovalType, MemberStatus } from '../../types/community.types';
import { MemberService } from '../../services/memberService';
import { toast } from 'sonner';
import { LogIn, Check, Clock, UserPlus, DoorOpen, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CommunityJoinButtonProps {
  community: Pick<Community, 'id' | 'name' | 'joinApproval' | 'visibility'>;
}

const memberService = MemberService.getInstance();

export const CommunityJoinButton: React.FC<CommunityJoinButtonProps> = ({ community }) => {
  const { currentUser } = useAuth();
  const { member, loading: memberLoading } = useCommunityMember(community.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optimistic state for membership status
  const [optimisticStatus, setOptimisticStatus] = useState<MemberStatus | null>(null);

  // Hide button for owner or admin
  const isOwner = currentUser && community.owner && currentUser.uid === community.owner.id;
  const isAdmin = currentUser && Array.isArray(community.admins) && community.admins.includes(currentUser.uid);
  if (isOwner || isAdmin) return null;

  const membershipStatus = useMemo(() => {
    if (optimisticStatus) return optimisticStatus;
    return member?.status || null;
  }, [optimisticStatus, member]);
  
  const handleJoin = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setOptimisticStatus('active');
    try {
      await memberService.joinCommunity(currentUser, community.id);
      toast.success(`Welcome to ${community.name}!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join community.');
      setOptimisticStatus(null); // Revert on error
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRequestJoin = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setOptimisticStatus('pending');
    try {
      await memberService.requestToJoinCommunity(currentUser, community.id);
      toast.success('Your request to join has been sent.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send request.');
      setOptimisticStatus(null); // Revert on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setOptimisticStatus(null); // Optimistically show the 'Join' state
    try {
      await memberService.leaveCommunity(currentUser.uid, community.id);
      toast.success(`You have left ${community.name}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to leave community.');
      setOptimisticStatus('active'); // Revert on error
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = memberLoading || isSubmitting;

  if (isLoading) {
    return <Button disabled className="w-28"><LoadingSpinner size={16} /></Button>;
  }

  if (!currentUser) {
    return <Button disabled><LogIn className="mr-2 h-4 w-4" />Login to Join</Button>;
  }
  
  if (membershipStatus) {
    switch (membershipStatus) {
      case 'pending':
        return <Button variant="secondary" disabled><Clock className="mr-2 h-4 w-4" />Pending</Button>;
      case 'active':
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
                <DoorOpen className="mr-2 h-4 w-4" />Leave
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive"/>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will lose access to all content and discussions in this community. You may need to be approved again to rejoin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeave} className="bg-destructive hover:bg-destructive/90">Confirm Leave</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
    }
  }

  // Not a member
  switch (community.joinApproval) {
    case JoinApprovalType.OPEN:
      return <Button onClick={handleJoin}><UserPlus className="mr-2 h-4 w-4" />Join</Button>;
    case JoinApprovalType.APPROVAL:
      return <Button onClick={handleRequestJoin}><UserPlus className="mr-2 h-4 w-4" />Request to Join</Button>;
    case JoinApprovalType.INVITE_ONLY:
      return <Button variant="secondary" disabled>Invite Only</Button>;
    default:
      return null;
  }
}; 