// CommunityImageUpload.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { FileUploadService } from '../../services/fileUploadService';
import { Camera } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface CommunityImageUploadProps {
  onUploadSuccess: (url: string) => void;
  currentAvatarUrl?: string;
}

const fileUploadService = FileUploadService.getInstance();

export const CommunityImageUpload: React.FC<CommunityImageUploadProps> = ({ onUploadSuccess, currentAvatarUrl }) => {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep preview in sync with currentAvatarUrl prop
  useEffect(() => {
    setPreview(currentAvatarUrl || null);
  }, [currentAvatarUrl]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('File size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const downloadFile = await fileUploadService.uploadFile(file, {
        communityId: 'global', // or pass a real communityId if available
        uploadedBy: 'anonymous', // TODO: pass real user ID if available
        type: 'avatar',
        onProgress: () => {},
      });
      onUploadSuccess(downloadFile.url);
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      console.error("Upload Error:", error);
      toast.error('Failed to upload image. Please try again.');
      setPreview(currentAvatarUrl || null); // Revert preview on error
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess, currentAvatarUrl]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar
          className="h-24 w-24 cursor-pointer border-2 border-dashed border-muted-foreground hover:border-primary"
          onClick={handleAvatarClick}
        >
          <AvatarImage src={preview || undefined} alt="Community Avatar" />
          <AvatarFallback className="text-muted-foreground">
            <Camera size={32} />
          </AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <LoadingSpinner />
          </div>
        )}
      </div>
      <Button variant="outline" onClick={handleAvatarClick} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Change Avatar'}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif"
        disabled={uploading}
      />
       <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB.</p>
    </div>
  );
};