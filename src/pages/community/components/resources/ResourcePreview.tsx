// ResourcePreview.tsx
// Placeholder for ResourcePreview component

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileText, 
  Video, 
  Image, 
  Code, 
  Link, 
  BookOpen, 
  Database, 
  Wrench,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Eye,
  Download,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription
} from '@/components/ui/alert';

// Types and Services
import {
  ResourceType,
  type Resource,
  type LinkPreview
} from '../../types/resource.types';
import {
  resourceService
} from '../../services/resourceService';

// Resource Type Icons Mapping
const RESOURCE_TYPE_ICONS: Record<ResourceType, React.ComponentType<{ className?: string }>> = {
  [ResourceType.DOCUMENT]: FileText,
  [ResourceType.PRESENTATION]: FileText,
  [ResourceType.VIDEO]: Video,
  [ResourceType.AUDIO]: FileText,
  [ResourceType.IMAGE]: Image,
  [ResourceType.CODE]: Code,
  [ResourceType.LINK]: Link,
  [ResourceType.EBOOK]: BookOpen,
  [ResourceType.DATASET]: Database,
  [ResourceType.TOOL]: Wrench,
};

// Mime Type to Preview Component Mapping
const PREVIEW_COMPONENTS: Record<string, React.ComponentType<{ src: string }>> = {
  'application/pdf': ({ src }) => <iframe src={src} className="w-full h-full" title="PDF Preview" />,
  'image/jpeg': ({ src }) => <img src={src} alt="JPEG Preview" className="w-full h-full object-contain" />,
  'image/png': ({ src }) => <img src={src} alt="PNG Preview" className="w-full h-full object-contain" />,
  'image/gif': ({ src }) => <img src={src} alt="GIF Preview" className="w-full h-full object-contain" />,
  'video/mp4': ({ src }) => <video src={src} controls className="w-full h-full" />,
  'text/plain': ({ src }) => <iframe src={src} className="w-full h-full" title="Text Preview" />,
  'text/html': ({ src }) => <iframe src={src} sandbox="allow-scripts" className="w-full h-full" title="HTML Preview" />,
};

interface ResourcePreviewProps {
  resource: Resource;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  onPreviewError?: (error: string) => void;
}

export default function ResourcePreview({
  resource,
  showTitle = true,
  showDescription = true,
  showActions = true,
  onPreviewError,
}: ResourcePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);

  const getPreviewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (resource.type === 'link' && resource.externalUrl) {
        const preview = await resourceService.getLinkPreview(resource.externalUrl);
        setLinkPreview(preview);
      } else if (resource.fileUrl) {
        // In a real scenario, you might have different ways to get preview data
        // For now, we'll just use the fileUrl
        setPreviewData(resource.fileUrl);
      } else {
        setError('No preview available for this resource type');
      }
    } catch (err) {
      console.error('Failed to get preview data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not load preview';
      setError(errorMessage);
      onPreviewError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resource, onPreviewError]);

  useEffect(() => {
    getPreviewData();
  }, [getPreviewData]);

  const PreviewComponent = useMemo(() => {
    if (resource.mimeType && PREVIEW_COMPONENTS[resource.mimeType]) {
      return PREVIEW_COMPONENTS[resource.mimeType];
    }
    return null;
  }, [resource.mimeType]);

  const ResourceIcon = RESOURCE_TYPE_ICONS[resource.type];

  const renderLoading = () => (
    <div className="flex items-center justify-center h-64">
      <Skeleton className="w-full h-full" />
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center h-64 bg-red-50 text-red-700 rounded-lg">
      <AlertTriangle className="h-12 w-12 mb-4" />
      <p className="font-semibold">Preview Unavailable</p>
      <p className="text-sm">{error}</p>
    </div>
  );

  const renderPreviewContent = () => {
    if (resource.type === 'link' && linkPreview) {
      return (
        <a href={resource.externalUrl} target="_blank" rel="noopener noreferrer" className="block hover:bg-muted/50 rounded-lg p-4">
          <div className="flex gap-4">
            {linkPreview.image && (
              <img src={linkPreview.image} alt="Link Preview" className="w-32 h-32 object-cover rounded-md" />
            )}
            <div className="flex-1">
              <h4 className="font-bold">{linkPreview.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{linkPreview.description}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <img src={linkPreview.favicon} alt="" className="h-4 w-4" />
                <span>{linkPreview.siteName}</span>
              </div>
            </div>
          </div>
        </a>
      );
    }

    if (previewData && PreviewComponent) {
      return (
        <AspectRatio ratio={16 / 9}>
          <PreviewComponent src={previewData} />
        </AspectRatio>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 bg-muted/50 rounded-lg">
        <ResourceIcon className="h-16 w-16 text-muted-foreground" />
        <p className="mt-4 font-semibold">No preview available for this file type</p>
        <p className="text-sm text-muted-foreground">You can download the file to view it.</p>
        <Button size="sm" className="mt-4">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-4">
          {showTitle && <h3 className="text-xl font-bold">{resource.title}</h3>}
          {showDescription && <p className="text-muted-foreground">{resource.description}</p>}

          <div className="relative">
            {loading ? renderLoading() : error ? renderError() : renderPreviewContent()}
          </div>

          {showActions && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                {resource.viewCount} Views
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {resource.downloadCount} Downloads
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <h4 className="font-semibold">Share Resource</h4>
                  <p className="text-sm text-muted-foreground">Share this resource with others.</p>
                  {/* Add sharing options here */}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 