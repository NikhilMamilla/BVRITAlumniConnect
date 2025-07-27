// BanMemberModal.tsx
// Placeholder for BanMemberModal component

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { moderationService } from '../../services/moderationService';
import { auth } from '@/firebase';
import { toast } from 'sonner';

interface BanMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  memberId: string;
}

const BanMemberModal: React.FC<BanMemberModalProps> = ({ isOpen, onClose, communityId, memberId }) => {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const currentUser = auth.currentUser;

  const handleBan = async () => {
    if (!reason || !currentUser) return;
    setLoading(true);
    try {
      await moderationService.createBan({
        communityId,
        userId: memberId,
        reason,
        moderatorId: currentUser.uid,
        durationHours: duration,
      });
      toast.success('Member has been banned successfully.');
      onClose();
    } catch (error) {
      console.error('Failed to ban member:', error);
      toast.error('Failed to ban member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban Member</DialogTitle>
          <DialogDescription>
            Banning a member will prevent them from participating in the community. Please provide a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for Ban</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for the ban..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duration in hours (optional)</Label>
            <Input
              id="duration"
              type="number"
              value={duration || ''}
              onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="e.g., 24 for a 1-day ban"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBan} disabled={!reason || loading}>
            {loading ? 'Banning...' : 'Ban Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BanMemberModal; 