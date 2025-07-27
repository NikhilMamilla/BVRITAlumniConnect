// ResourceDownload.tsx
// Placeholder for ResourceDownload component

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Video, 
  Image, 
  Code, 
  Link, 
  BookOpen, 
  Database, 
  Wrench,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Shield,
  TrendingUp,
  Users,
  Star,
  Bookmark,
  Share2,
  MoreVertical,
  Info,
  History,
  BarChart3,
  Settings,
  Zap,
  Globe,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../components/ui/avatar';
import { Progress } from '../../../../components/ui/progress';
import { Separator } from '../../../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Skeleton } from '../../../../components/ui/skeleton';

// Types and Services
import { 
  ResourceType,
  type Resource, 
  type ResourceDownload, 
  type ResourceBookmark,
  type ResourceStatsResponse,
  type UseResourceReturn
} from '../../types/resource.types';
import { resourceService } from '../../services/resourceService';
import { useCommunityResources } from '../../hooks/useCommunityResources';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useLocalStorage } from '../../hooks/useLocalStorage';

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

// Download Status Types
type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'error' | 'paused' | 'cancelled';

interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

interface DownloadHistory {
  resourceId: string;
  downloadedAt: Date;
  method: 'direct' | 'stream' | 'view';
  status: 'success' | 'error';
  fileSize?: number;
}

interface ResourceDownloadProps {
  resource: Resource;
  onDownloadComplete?: (resourceId: string, method: string) => void;
  onDownloadError?: (resourceId: string, error: string) => void;
  showAnalytics?: boolean;
  showHistory?: boolean;
  compact?: boolean;
}

export default function ResourceDownload({
  resource,
  onDownloadComplete,
  onDownloadError,
  showAnalytics = true,
  showHistory = true,
  compact = false
}: ResourceDownloadProps) {
  // Context and Hooks
  const { currentMember } = useCommunityContext();
  const { trackDownload, bookmarkResource, likeResource } = useCommunityResources(
    resource.communityId,
    { sortBy: 'createdAt', sortOrder: 'desc' }
  );

  // State Management
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    bytesDownloaded: 0,
    totalBytes: 0,
    percentage: 0,
    speed: 0,
    estimatedTimeRemaining: 0
  });
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [resourceStats, setResourceStats] = useState<ResourceStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [downloadMethod, setDownloadMethod] = useState<'direct' | 'stream' | 'view'>('direct');

  // Refs
  const downloadAbortController = useRef<AbortController | null>(null);
  const downloadStartTime = useRef<number>(0);
  const lastProgressUpdate = useRef<number>(0);

  // Local Storage for download history
  const [storedDownloadHistory, setStoredDownloadHistory] = useLocalStorage<DownloadHistory[]>(
    `download_history_${resource.id}`,
    []
  );

  // Load download history from localStorage
  useEffect(() => {
    setDownloadHistory(storedDownloadHistory);
  }, [storedDownloadHistory]);

  // Check if resource is bookmarked/liked (this would typically come from a real-time subscription)
  useEffect(() => {
    // TODO: Implement real-time subscription to check bookmark/like status
    // For now, using localStorage as a simple check
    const bookmarked = localStorage.getItem(`bookmark_${resource.id}`) === 'true';
    const liked = localStorage.getItem(`like_${resource.id}`) === 'true';
    setIsBookmarked(bookmarked);
    setIsLiked(liked);
  }, [resource.id]);

  // Load resource stats
  const loadResourceStats = useCallback(async () => {
    if (!showAnalytics) return;
    
    setLoadingStats(true);
    try {
      const stats = await resourceService.getResourceStats(resource.communityId);
      setResourceStats(stats);
    } catch (error) {
      console.error('Failed to load resource stats:', error);
      toast.error('Failed to load resource statistics');
    } finally {
      setLoadingStats(false);
    }
  }, [resource.communityId, showAnalytics]);

  // Download functions
  const startDownload = useCallback(async (method: 'direct' | 'stream' | 'view' = 'direct') => {
    if (!currentMember) {
      toast.error('You must be logged in to download resources');
      return;
    }

    if (downloadStatus === 'downloading') {
      toast.error('Download already in progress');
      return;
    }

    setDownloadMethod(method);
    setDownloadStatus('downloading');
    setDownloadProgress({
      bytesDownloaded: 0,
      totalBytes: resource.fileSize || 0,
      percentage: 0,
      speed: 0,
      estimatedTimeRemaining: 0
    });

    downloadStartTime.current = Date.now();
    lastProgressUpdate.current = Date.now();
    downloadAbortController.current = new AbortController();

    try {
      // Track download in Firestore
      await trackDownload(
        resource.id,
        currentMember.userId,
        resource.communityId,
        method,
        navigator.userAgent,
        '127.0.0.1' // In a real app, this would come from the server
      );

      // Simulate download progress for demonstration
      // In a real implementation, this would be handled by the actual file download
      if (resource.fileUrl) {
        await simulateDownload(resource.fileUrl, method);
      } else if (resource.externalUrl) {
        // For external links, just track the visit
        window.open(resource.externalUrl, '_blank');
        setDownloadStatus('completed');
        onDownloadComplete?.(resource.id, method);
      }

      // Add to download history
      const newDownload: DownloadHistory = {
        resourceId: resource.id,
        downloadedAt: new Date(),
        method,
        status: 'success',
        fileSize: resource.fileSize
      };

      const updatedHistory = [newDownload, ...downloadHistory.slice(0, 9)]; // Keep last 10
      setDownloadHistory(updatedHistory);
      setStoredDownloadHistory(updatedHistory);

      toast.success(`Resource downloaded successfully via ${method}`);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('error');
      onDownloadError?.(resource.id, error instanceof Error ? error.message : 'Download failed');
      toast.error('Download failed. Please try again.');
    }
  }, [
    currentMember,
    downloadStatus,
    resource,
    trackDownload,
    downloadHistory,
    setStoredDownloadHistory,
    onDownloadComplete,
    onDownloadError
  ]);

  const simulateDownload = async (fileUrl: string, method: string) => {
    return new Promise<void>((resolve, reject) => {
      const totalBytes = resource.fileSize || 1024 * 1024; // 1MB default
      let downloadedBytes = 0;
      const chunkSize = 1024 * 10; // 10KB chunks
      const interval = 50; // Update every 50ms

      const downloadInterval = setInterval(() => {
        if (downloadAbortController.current?.signal.aborted) {
          clearInterval(downloadInterval);
          reject(new Error('Download cancelled'));
          return;
        }

        downloadedBytes += chunkSize;
        if (downloadedBytes >= totalBytes) {
          downloadedBytes = totalBytes;
          clearInterval(downloadInterval);
          setDownloadProgress({
            bytesDownloaded: totalBytes,
            totalBytes,
            percentage: 100,
            speed: 0,
            estimatedTimeRemaining: 0
          });
          setDownloadStatus('completed');
          resolve();
          return;
        }

        const now = Date.now();
        const timeElapsed = (now - lastProgressUpdate.current) / 1000;
        const speed = chunkSize / timeElapsed;
        const remainingBytes = totalBytes - downloadedBytes;
        const estimatedTimeRemaining = speed > 0 ? remainingBytes / speed : 0;

        setDownloadProgress({
          bytesDownloaded: downloadedBytes,
          totalBytes,
          percentage: (downloadedBytes / totalBytes) * 100,
          speed,
          estimatedTimeRemaining
        });

        lastProgressUpdate.current = now;
      }, interval);
    });
  };

  const pauseDownload = useCallback(() => {
    if (downloadStatus === 'downloading') {
      downloadAbortController.current?.abort();
      setDownloadStatus('paused');
      toast.info('Download paused');
    }
  }, [downloadStatus]);

  const resumeDownload = useCallback(() => {
    if (downloadStatus === 'paused') {
      startDownload(downloadMethod);
    }
  }, [downloadStatus, downloadMethod, startDownload]);

  const cancelDownload = useCallback(() => {
    if (downloadStatus === 'downloading' || downloadStatus === 'paused') {
      downloadAbortController.current?.abort();
      setDownloadStatus('cancelled');
      setDownloadProgress({
        bytesDownloaded: 0,
        totalBytes: 0,
        percentage: 0,
        speed: 0,
        estimatedTimeRemaining: 0
      });
      toast.info('Download cancelled');
    }
  }, [downloadStatus]);

  const handleBookmark = useCallback(async () => {
    if (!currentMember) {
      toast.error('You must be logged in to bookmark resources');
      return;
    }

    try {
      await bookmarkResource(
        resource.id,
        currentMember.userId,
        resource.communityId,
        'My Bookmarks',
        resource.tags,
        `Bookmarked on ${new Date().toLocaleDateString()}`
      );
      setIsBookmarked(!isBookmarked);
      localStorage.setItem(`bookmark_${resource.id}`, (!isBookmarked).toString());
      toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
    } catch (error) {
      console.error('Bookmark failed:', error);
      toast.error('Failed to bookmark resource');
    }
  }, [currentMember, resource, bookmarkResource, isBookmarked]);

  const handleLike = useCallback(async () => {
    if (!currentMember) {
      toast.error('You must be logged in to like resources');
      return;
    }

    try {
      await likeResource(resource.id, currentMember.userId);
      setIsLiked(!isLiked);
      localStorage.setItem(`like_${resource.id}`, (!isLiked).toString());
      toast.success(isLiked ? 'Removed like' : 'Liked resource');
    } catch (error) {
      console.error('Like failed:', error);
      toast.error('Failed to like resource');
    }
  }, [currentMember, resource, likeResource, isLiked]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getResourceIcon = () => {
    const IconComponent = RESOURCE_TYPE_ICONS[resource.type];
    return <IconComponent className="h-5 w-5" />;
  };

  const getStatusIcon = () => {
    switch (downloadStatus) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'downloading':
        return <Download className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <RotateCcw className="h-4 w-4 text-gray-500" />;
      default:
        return <Download className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (downloadStatus) {
      case 'completed':
        return 'Download Complete';
      case 'error':
        return 'Download Failed';
      case 'downloading':
        return 'Downloading...';
      case 'paused':
        return 'Download Paused';
      case 'cancelled':
        return 'Download Cancelled';
      default:
        return 'Ready to Download';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => startDownload()}
          disabled={downloadStatus === 'downloading'}
          className="flex items-center gap-2"
        >
          {getStatusIcon()}
          {downloadStatus === 'downloading' ? 'Downloading...' : 'Download'}
        </Button>
        
        {downloadStatus === 'downloading' && (
          <Progress value={downloadProgress.percentage} className="w-20" />
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Main Download Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={resource.uploaderAvatar} alt={resource.uploaderName} />
                    <AvatarFallback className="bg-primary/10">
                      {getResourceIcon()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">
                    {resource.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resource.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {resource.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {resource.category}
                    </Badge>
                    {resource.fileSize && (
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(resource.fileSize)}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {resource.downloadCount} downloads
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBookmark}
                      className={isBookmarked ? 'text-blue-500' : ''}
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className={isLiked ? 'text-red-500' : ''}
                    >
                      <Star className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isLiked ? 'Remove like' : 'Like resource'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share resource</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>More options</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Download Status */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <p className="font-medium">{getStatusText()}</p>
                  {downloadStatus === 'downloading' && (
                    <p className="text-sm text-muted-foreground">
                      {formatSpeed(downloadProgress.speed)} • {formatTime(downloadProgress.estimatedTimeRemaining)} remaining
                    </p>
                  )}
                </div>
              </div>
              
              {downloadStatus === 'downloading' && (
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatFileSize(downloadProgress.bytesDownloaded)} / {formatFileSize(downloadProgress.totalBytes)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {downloadProgress.percentage.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {downloadStatus === 'downloading' && (
              <div className="space-y-2">
                <Progress value={downloadProgress.percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Downloading...</span>
                  <span>{downloadProgress.percentage.toFixed(1)}%</span>
                </div>
              </div>
            )}

            {/* Download Actions */}
            <div className="flex items-center gap-2">
              {downloadStatus === 'idle' && (
                <>
                  <Button onClick={() => startDownload('direct')} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  {resource.externalUrl && (
                    <Button variant="outline" onClick={() => startDownload('view')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Link
                    </Button>
                  )}
                </>
              )}

              {downloadStatus === 'downloading' && (
                <>
                  <Button variant="outline" onClick={pauseDownload} className="flex-1">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button variant="destructive" onClick={cancelDownload}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}

              {downloadStatus === 'paused' && (
                <>
                  <Button onClick={resumeDownload} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                  <Button variant="destructive" onClick={cancelDownload}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}

              {(downloadStatus === 'completed' || downloadStatus === 'error' || downloadStatus === 'cancelled') && (
                <Button onClick={() => startDownload('direct')} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Again
                </Button>
              )}
            </div>

            {/* Resource Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Uploaded by</p>
                <p className="text-muted-foreground">{resource.uploaderName}</p>
              </div>
              <div>
                <p className="font-medium">Upload date</p>
                <p className="text-muted-foreground">
                  {formatDistanceToNow(resource.createdAt.toDate(), { addSuffix: true })}
                </p>
              </div>
              <div>
                <p className="font-medium">Status</p>
                <Badge variant={resource.status === 'approved' ? 'default' : 'secondary'}>
                  {resource.status}
                </Badge>
              </div>
              <div>
                <p className="font-medium">Visibility</p>
                <div className="flex items-center gap-1">
                  {resource.visibility === 'public' ? (
                    <Globe className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  <span className="text-muted-foreground capitalize">
                    {resource.visibility.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics and History Tabs */}
        {(showAnalytics || showHistory) && (
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {showAnalytics && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
              {showHistory && <TabsTrigger value="history">Download History</TabsTrigger>}
            </TabsList>

            {showAnalytics && (
              <TabsContent value="analytics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Resource Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingStats ? (
                      <div className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : resourceStats ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold">{resourceStats.totalDownloads}</p>
                          <p className="text-sm text-muted-foreground">Total Downloads</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold">{resourceStats.totalViews}</p>
                          <p className="text-sm text-muted-foreground">Total Views</p>
                        </div>
                      </div>
                    ) : (
                      <Button onClick={loadResourceStats} variant="outline">
                        Load Analytics
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {showHistory && (
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Download History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {downloadHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No download history yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {downloadHistory.map((download, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                download.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                              }`}>
                                {download.status === 'success' ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <AlertCircle className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium capitalize">{download.method} download</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(download.downloadedAt, { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            {download.fileSize && (
                              <Badge variant="outline" className="text-xs">
                                {formatFileSize(download.fileSize)}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </TooltipProvider>
  );
} 