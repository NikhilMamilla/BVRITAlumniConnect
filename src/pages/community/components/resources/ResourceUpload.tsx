// ResourceUpload.tsx
// Placeholder for ResourceUpload component

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import { Progress } from '../../../../components/ui/progress';
import { Badge } from '../../../../components/ui/badge';
import { Skeleton } from '../../../../components/ui/skeleton';
import { cn } from '../../../../lib/utils';
import { ResourceType, ResourceCategory, ResourceVisibility } from '../../types/resource.types';
import { useCommunityPermissions } from '../../hooks/useCommunityPermissions';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { FileUploadService } from '../../services/fileUploadService';
import { resourceService } from '../../services/resourceService';
import { validateFileType, validateFileSize, ALLOWED_FILE_TYPES } from '../../utils/fileHelpers';
import { formatFileSize } from '../../utils/formatHelpers';

const MAX_FILE_SIZE_MB = 100;
const MAX_TAGS = 8;

const resourceTypeOptions = Object.entries(ResourceType).map(([key, value]) => ({ label: key.charAt(0) + key.slice(1).toLowerCase(), value }));
const resourceCategoryOptions = Object.entries(ResourceCategory).map(([key, value]) => ({ label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value }));
const resourceVisibilityOptions = Object.entries(ResourceVisibility).map(([key, value]) => ({ label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value }));

export default function ResourceUpload() {
  const params = useParams();
  const navigate = useNavigate();
  const { currentCommunity, currentMember } = useCommunityContext();
  const communityId = params.communityId || currentCommunity?.id;
  const currentUserId = currentMember?.userId;
  const currentUserName = currentMember?.userDetails?.name;
  const currentUserRole = currentMember?.role;
  const currentUserAvatar = currentMember?.userDetails?.avatar;

  // Permissions
  const { isMember, isModerator, isAdmin } = useCommunityPermissions(communityId, currentUserId);
  const canUpload = isMember && (currentUserRole === 'alumni_mentor' || isModerator || isAdmin);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ResourceType>(ResourceType.DOCUMENT);
  const [category, setCategory] = useState<ResourceCategory>(ResourceCategory.TUTORIAL);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [visibility, setVisibility] = useState<ResourceVisibility>(ResourceVisibility.PUBLIC);
  const [allowComments, setAllowComments] = useState(true);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tag helpers
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < MAX_TAGS) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };
  const handleRemoveTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!validateFileType(f)) {
      setError('Invalid file type.');
      return;
    }
    if (!validateFileSize(f, MAX_FILE_SIZE_MB)) {
      setError(`File exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }
    setFile(f);
    setError(null);
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!canUpload) {
      setError('You do not have permission to upload resources.');
      return;
    }
    if (!title.trim() || !description.trim() || !communityId) {
      setError('Title, description, and community are required.');
      return;
    }
    if (type !== ResourceType.LINK && !file) {
      setError('Please select a file to upload.');
      return;
    }
    if (type === ResourceType.LINK && !externalUrl.trim()) {
      setError('Please provide a valid external URL.');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;
      let mimeType = '';
      // Upload file if not a link
      if (file && type !== ResourceType.LINK) {
        const metadata = await FileUploadService.getInstance().uploadFile(file, {
          communityId,
          uploadedBy: currentUserId,
          type: 'resource',
          onProgress: setUploadProgress
        });
        fileUrl = metadata.url;
        fileName = metadata.name;
        fileSize = metadata.size;
        mimeType = metadata.type;
      }
      // Map community role to 'student' | 'alumni'
      const uploaderRole: 'student' | 'alumni' =
        currentUserRole === 'alumni_mentor' ? 'alumni' : 'student';
      // Create resource document
      const resourceId = await resourceService.createResource({
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        communityId,
        visibility,
        tags,
        file: undefined, // not needed, we use fileUrl
        externalUrl: type === ResourceType.LINK ? externalUrl.trim() : undefined,
        difficulty,
        allowComments,
        uploadedBy: currentUserId,
        uploaderName: currentUserName,
        uploaderRole,
        uploaderAvatar: currentUserAvatar,
        isApproved: isModerator || isAdmin,
      });
      setSuccess(true);
      toast.success('Resource uploaded successfully!');
      setTimeout(() => navigate(`/communities/${communityId}/resources`), 1200);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!canUpload) {
    return (
      <Card className="max-w-xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>Upload Resource</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mb-2" />
            <p className="text-lg font-semibold mb-2">You do not have permission to upload resources.</p>
            <p className="text-muted-foreground">Only eligible members, alumni, or moderators can upload resources.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>Upload Resource</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="font-medium">Title <span className="text-destructive">*</span></label>
            <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} required disabled={uploading} />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Description <span className="text-destructive">*</span></label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} required disabled={uploading} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <label className="font-medium">Type</label>
              <Select value={type} onValueChange={v => setType(v as ResourceType)} disabled={uploading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {resourceTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="font-medium">Category</label>
              <Select value={category} onValueChange={v => setCategory(v as ResourceCategory)} disabled={uploading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {resourceCategoryOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-medium">Tags</label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => (e.key === 'Enter' ? (e.preventDefault(), handleAddTag()) : undefined)}
                placeholder="Add tag and press Enter"
                maxLength={32}
                disabled={uploading || tags.length >= MAX_TAGS}
              />
              <Button type="button" onClick={handleAddTag} disabled={uploading || !tagInput.trim() || tags.length >= MAX_TAGS}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.map(tag => (
                <Badge key={tag} className="bg-blue-100 text-blue-700 cursor-pointer" onClick={() => handleRemoveTag(tag)}>{tag} ×</Badge>
              ))}
              {tags.length === 0 && <span className="text-muted-foreground text-sm">No tags</span>}
            </div>
          </div>
          {type === ResourceType.LINK ? (
            <div className="space-y-2">
              <label className="font-medium">External URL <span className="text-destructive">*</span></label>
              <Input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://..." required disabled={uploading} />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="font-medium">File <span className="text-destructive">*</span></label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_FILE_TYPES.map(ext => '.' + ext).join(',')}
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                {file && <span className="text-sm text-muted-foreground">{file.name} ({formatFileSize(file.size)})</span>}
              </div>
              <div className="text-xs text-muted-foreground">Allowed: {ALLOWED_FILE_TYPES.join(', ')}. Max {MAX_FILE_SIZE_MB}MB.</div>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <label className="font-medium">Visibility</label>
              <Select value={visibility} onValueChange={v => setVisibility(v as ResourceVisibility)} disabled={uploading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {resourceVisibilityOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="font-medium">Difficulty</label>
              <Select value={difficulty} onValueChange={v => setDifficulty(v as 'beginner' | 'intermediate' | 'advanced')} disabled={uploading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={allowComments} onChange={e => setAllowComments(e.target.checked)} disabled={uploading} id="allow-comments" />
            <label htmlFor="allow-comments" className="text-sm">Allow comments</label>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /> {error}</div>
          )}
          {uploading && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading... <Progress value={uploadProgress} className="flex-1" />
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-600"><CheckCircle className="w-4 h-4" /> Resource uploaded successfully!</div>
          )}
          <Button type="submit" disabled={uploading} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Resource'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 