// CommunitySettings.tsx
// Placeholder for CommunitySettings component

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CommunityService } from '../../services/communityService';
import { Community, UpdateCommunityData, CommunitySettings as CommunitySettingsType } from '../../types/community.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/firebase';
import DeleteCommunityModal from './DeleteCommunityModal';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface CommunitySettingsProps {
  communityId: string;
}

const communityService = CommunityService.getInstance();

const settingsSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  privacy: z.object({
    showMemberList: z.boolean(),
    showMemberActivity: z.boolean(),
    allowSearchIndexing: z.boolean(),
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

// Use a more specific type for the state
type CommunityWithSettings = Community & { settings?: CommunitySettingsType; updatedAt?: Timestamp };

const CommunitySettings: React.FC<CommunitySettingsProps> = ({ communityId }) => {
  const [community, setCommunity] = useState<CommunityWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const currentUser = auth.currentUser;

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  const fetchAndSetCommunity = useCallback(async () => {
    setLoading(true);
    try {
      const fullCommunityData = await communityService.getCommunityById(communityId);
      if (fullCommunityData) {
        setCommunity(fullCommunityData as CommunityWithSettings);
        reset({
          name: fullCommunityData.name,
          description: fullCommunityData.description,
          privacy: (fullCommunityData as CommunityWithSettings).settings?.privacy || {
            showMemberList: false,
            showMemberActivity: false,
            allowSearchIndexing: false,
          },
        });
      }
    } catch (error) {
      console.error('Failed to load community settings:', error);
      toast.error("Failed to load community settings.");
    } finally {
      setLoading(false);
    }
  }, [communityId, reset]);

  useEffect(() => {
    fetchAndSetCommunity();
  }, [fetchAndSetCommunity]);

  const onSubmit = async (data: SettingsFormData) => {
    if (!currentUser || !community) return;
    const updates: Partial<UpdateCommunityData> = {
      name: data.name,
      description: data.description,
      settings: {
        ...(community.settings || {}),
        privacy: data.privacy,
      },
    };
    try {
      await communityService.updateCommunity(communityId, updates, currentUser.uid);
      toast.success('Community settings updated successfully.');
      // Refetch data to show the latest "updatedAt"
      fetchAndSetCommunity();
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings. Please try again.');
    }
  };
  
  const updatedAt = community?.updatedAt;
  const lastUpdated = updatedAt ? (updatedAt instanceof Timestamp ? updatedAt.toDate() : updatedAt) : null;

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Community Settings</CardTitle>
          <CardDescription>Manage your community's name, description, and privacy.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <fieldset disabled={loading || isSubmitting} className="space-y-6">
              <div>
                <Label htmlFor="name">Community Name</Label>
                <Controller name="name" control={control} render={({ field }) => <Input {...field} id="name" />} />
                {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Controller name="description" control={control} render={({ field }) => <Textarea {...field} id="description" rows={4} />} />
                {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
              </div>
              <div className="space-y-4 rounded-md border p-4">
                <h4 className="font-semibold">Privacy Settings</h4>
                <Controller
                  name="privacy.showMemberList"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showMemberList" className="flex flex-col space-y-1">
                        <span>Show Member List</span>
                        <span className="font-normal leading-snug text-muted-foreground">Allow non-members to see the list of community members.</span>
                      </Label>
                      <Switch id="showMemberList" checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                  )}
                />
                <Controller
                  name="privacy.showMemberActivity"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showMemberActivity" className="flex flex-col space-y-1">
                        <span>Show Member Activity</span>
                        <span className="font-normal leading-snug text-muted-foreground">Display members' activity status.</span>
                      </Label>
                      <Switch id="showMemberActivity" checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                  )}
                />
                <Controller
                  name="privacy.allowSearchIndexing"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="allowSearchIndexing" className="flex flex-col space-y-1">
                        <span>Allow Search Indexing</span>
                        <span className="font-normal leading-snug text-muted-foreground">Let search engines like Google index this community.</span>
                      </Label>
                      <Switch id="allowSearchIndexing" checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                  )}
                />
              </div>
            </fieldset>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {lastUpdated && `Last updated ${formatDistanceToNow(lastUpdated)} ago`}
              </p>
              <Button type="submit" disabled={loading || isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 border-destructive">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteModalOpen(true)} disabled={!community}>Delete Community</Button>
        </CardContent>
      </Card>

      {community && <DeleteCommunityModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        communityId={community.id}
        communityName={community.name}
      />}
    </>
  );
};

export default CommunitySettings; 