// MemberActions.tsx
// Placeholder for MemberActions component

import React, { useState } from 'react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreVertical, User, Shield, Crown, Trash2, Ban } from 'lucide-react';
import { DetailedCommunityMember } from '../../types/member.types';
import { CommunityRole } from '../../types/community.types';
import { MemberService } from '../../services/memberService';
import { auth } from '@/firebase';
import BanMemberModal from './BanMemberModal';
import { useCommunityPermissions } from '../../hooks/useCommunityPermissions';
import { toast } from 'sonner';

interface MemberActionsProps {
  communityId: string;
  member: DetailedCommunityMember;
}

const memberService = MemberService.getInstance();

const roleHierarchy: Record<CommunityRole, number> = {
  member: 0,
  contributor: 0,
  moderator: 1,
  admin: 2,
  owner: 3,
  alumni_mentor: 1,
};

const MemberActions: React.FC<MemberActionsProps> = ({ communityId, member }) => {
  const currentUser = auth.currentUser;
  const { member: currentUserMember } = useCommunityPermissions(communityId, currentUser?.uid);
  
  const [isBanModalOpen, setBanModalOpen] = useState(false);
  const [isKickAlertOpen, setKickAlertOpen] = useState(false);

  const canActOnMember = (() => {
    if (!currentUserMember || !member || currentUserMember.userId === member.userId) {
      return false;
    }
    const currentUserLevel = roleHierarchy[currentUserMember.role];
    const targetUserLevel = roleHierarchy[member.role];
    return currentUserLevel > targetUserLevel;
  })();

  if (!currentUserMember) {
      return (
          <Button variant="ghost" size="icon" disabled>
              <MoreVertical className="h-4 w-4 animate-pulse" />
          </Button>
      );
  }

  const handleChangeRole = async (newRole: CommunityRole) => {
    if (!currentUser || !canActOnMember) {
        toast.error("You don't have permission to change this member's role.");
        return;
    }
    if(currentUserMember && roleHierarchy[newRole] >= roleHierarchy[currentUserMember.role]){
        toast.error("You cannot promote a member to a role equal to or higher than your own.");
        return;
    }

    try {
      await memberService.changeMemberRole(communityId, member.id, newRole, currentUser.uid);
      toast.success(`${member.userDetails.name}'s role has been changed to ${newRole}.`);
    } catch (error) {
      console.error("Failed to change role:", error);
      if (error instanceof Error) {
        toast.error(`Failed to change role: ${error.message}`);
      } else {
        toast.error("An unknown error occurred while changing role.");
      }
    }
  };

  const handleKickMember = async () => {
      if (!currentUser || !canActOnMember) {
          toast.error("You don't have permission to kick this member.");
          return;
      }
      try {
          await memberService.removeMember(communityId, member.id);
          toast.success(`${member.userDetails.name} has been kicked from the community.`);
      } catch (error) {
          console.error("Failed to kick member:", error);
          if (error instanceof Error) {
            toast.error(`Failed to kick member: ${error.message}`);
          } else {
            toast.error("An unknown error occurred while kicking member.");
          }
      }
      setKickAlertOpen(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={!canActOnMember}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!canActOnMember}>Change Role</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleChangeRole('admin')}>
                <Crown className="mr-2 h-4 w-4" /> Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeRole('moderator')}>
                <Shield className="mr-2 h-4 w-4" /> Moderator
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeRole('member')}>
                <User className="mr-2 h-4 w-4" /> Member
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setKickAlertOpen(true)} disabled={!canActOnMember}>
            <Trash2 className="mr-2 h-4 w-4" /> Kick Member
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => setBanModalOpen(true)} disabled={!canActOnMember}>
            <Ban className="mr-2 h-4 w-4" /> Ban Member
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BanMemberModal
        isOpen={isBanModalOpen}
        onClose={() => setBanModalOpen(false)}
        communityId={communityId}
        memberId={member.id}
      />

    <AlertDialog open={isKickAlertOpen} onOpenChange={setKickAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to kick {member.userDetails.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action will permanently remove them from the community. They can rejoin later if they are not banned.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleKickMember}>
                    Kick
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default MemberActions; 