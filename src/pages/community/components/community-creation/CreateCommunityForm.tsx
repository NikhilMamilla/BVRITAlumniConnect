// CreateCommunityForm.tsx
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CommunityService } from '../../services/communityService';
import { useAuth } from '@/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { CommunityImageUpload } from './CommunityImageUpload';
import { CommunityTagsSelector } from './CommunityTagsSelector';
import { CommunityPrivacySettings } from './CommunityPrivacySettings';
import { CommunityGuidelinesEditor } from './CommunityGuidelinesEditor';
import { CommunityCategory, JoinApprovalType, CreateCommunityData } from '../../types/community.types';
import { VisibilityLevel } from '../../types/common.types';
import { communityFormSchema, CommunityFormData } from './CommunityFormValidation';

const communityService = CommunityService.getInstance();

interface CreateCommunityFormProps {
  onSuccess: (communityId: string) => void;
  onCancel: () => void;
}

export const CreateCommunityForm: React.FC<CreateCommunityFormProps> = ({ onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<CommunityFormData>({
    resolver: zodResolver(communityFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: undefined,
      avatar: '',
      tags: [],
      visibility: VisibilityLevel.PUBLIC,
      joinApproval: JoinApprovalType.OPEN,
      guidelines: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: CommunityFormData) => {
    if (!currentUser) {
      toast.error('You must be logged in to create a community.');
      return;
    }
    setLoading(true);
    try {
      const ownerProfile = {
        id: currentUser.uid,
        name: currentUser.displayName || 'Anonymous',
        email: currentUser.email!,
        avatar: currentUser.photoURL || '',
        role: currentUser.role || 'alumni',
      };

      const communityData: CreateCommunityData = {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
        visibility: data.visibility,
        joinApproval: data.joinApproval,
        avatar: data.avatar || '',
        guidelines: data.guidelines || '',
        longDescription: '',
        skills: data.tags, 
        features: {},
        settings: {},
      };

      const communityId = await communityService.createCommunity(
        communityData,
        ownerProfile
      );

      toast.success(`Community "${data.name}" created successfully!`);
      form.reset();
      onSuccess(communityId);
    } catch (error) {
      console.error('Failed to create community:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem className="flex justify-center">
              <FormControl>
                <CommunityImageUpload onUploadSuccess={url => field.onChange(url)} currentAvatarUrl={field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Web Developers Hangout" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A brief, catchy description of your community." {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category for your community" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {Object.values(CommunityCategory).map(cat => (
                                <SelectItem key={cat} value={cat}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <CommunityTagsSelector tags={field.value} setTags={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Controller
            control={form.control}
            name="visibility"
            render={({ field }) => (
                <CommunityPrivacySettings
                    visibility={field.value}
                    setVisibility={(value) => {
                        field.onChange(value);
                        if (value === VisibilityLevel.PRIVATE) {
                            form.setValue('joinApproval', JoinApprovalType.APPROVAL, { shouldValidate: true });
                        }
                    }}
                    joinApproval={form.watch('joinApproval')}
                    setJoinApproval={(value) => form.setValue('joinApproval', value, { shouldValidate: true })}
                />
            )}
        />
        <FormField
          control={form.control}
          name="guidelines"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <CommunityGuidelinesEditor guidelines={field.value || ''} setGuidelines={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !form.formState.isValid} className="w-40">
            {loading ? <LoadingSpinner /> : 'Create Community'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
