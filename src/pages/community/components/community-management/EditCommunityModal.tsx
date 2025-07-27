// EditCommunityModal.tsx
// Placeholder for EditCommunityModal component

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CommunityService } from '../../services/communityService';
import { Community, UpdateCommunityData } from '../../types/community.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { auth } from '@/firebase';

interface EditCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community;
}

const communityService = CommunityService.getInstance();

const editSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type EditFormData = z.infer<typeof editSchema>;

const EditCommunityModal: React.FC<EditCommunityModalProps> = ({ isOpen, onClose, community }) => {
  const currentUser = auth.currentUser;

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: community.name,
      description: community.description,
    }
  });

  useEffect(() => {
      reset({
          name: community.name,
          description: community.description,
      })
  }, [community, reset])

  const onSubmit = async (data: EditFormData) => {
    if (!currentUser) return;
    const updates: UpdateCommunityData = {
      name: data.name,
      description: data.description,
    };
    try {
      await communityService.updateCommunity(community.id, updates, currentUser.uid);
      // add success toast
      onClose();
    } catch (error) {
      console.error('Failed to update community:', error);
      // add error toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Community</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <Label htmlFor="name">Community Name</Label>
                    <Controller name="name" control={control} render={({ field }) => <Input {...field} id="name" />} />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Controller name="description" control={control} render={({ field }) => <Textarea {...field} id="description" />} />
                    {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
  );
};

export default EditCommunityModal; 