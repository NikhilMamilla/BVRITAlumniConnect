import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Heart, 
  Bookmark, 
  Share2, 
  MoreVertical, 
  Eye, 
  FileText, 
  Video, 
  Image, 
  Link, 
  Code, 
  Presentation, 
  BookOpen, 
  Database, 
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Archive,
  Flag,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

// Types and Services
import { 
  ResourceType, 
  ResourceStatus, 
  ResourceVisibility, 
  ResourceCategory,
  ResourceReportReason,
  ApprovalStatus
} from '../../types/resource.types';
import type { Resource } from '../../types/resource.types';
import { useCommunityResources } from '../../hooks/useCommunityResources';
import { useCommunityPermissions } from '../../hooks/useCommunityPermissions';
import { formatFileSize, formatDate } from '../../utils/formatHelpers';
import { getFileExtension, getMimeType } from '../../utils/fileHelpers';
import { cn } from '@/lib/utils';

// Resource Type Icons Mapping
const RESOURCE_TYPE_ICONS = {
  [ResourceType.DOCUMENT]: FileText,
  [ResourceType.VIDEO]: Video,
  [ResourceType.AUDIO]: Video, // Using video icon for audio
  [ResourceType.IMAGE]: Image,
  [ResourceType.CODE]: Code,
  [ResourceType.LINK]: Link,
  [ResourceType.PRESENTATION]: Presentation,
  [ResourceType.EBOOK]: BookOpen,
  [ResourceType.DATASET]: Database,
  [ResourceType.TOOL]: Wrench
} as const;

// Resource Status Colors
const RESOURCE_STATUS_COLORS = {
  [ResourceStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ResourceStatus.APPROVED]: 'bg-green-100 text-green-800 border-green-200',
  [ResourceStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
  [ResourceStatus.ARCHIVED]: 'bg-gray-100 text-gray-800 border-gray-200',
  [ResourceStatus.REPORTED]: 'bg-orange-100 text-orange-800 border-orange-200'
} as const;

// Resource Visibility Colors
const RESOURCE_VISIBILITY_COLORS = {
  [ResourceVisibility.PUBLIC]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ResourceVisibility.COMMUNITY_ONLY]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ResourceVisibility.MEMBERS_ONLY]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [ResourceVisibility.MODERATORS_ONLY]: 'bg-amber-100 text-amber-800 border-amber-200'
} as const;

// Difficulty Colors
const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advanced: 'bg-red-100 text-red-800 border-red-200'
} as const;

interface ResourceCardProps {
  resource: Resource;
  communityId: string;
  currentUserId: string;
  currentUserRole: 'student' | 'alumni';
  currentUserName: string;
  showActions?: boolean;
  showStats?: boolean;
  showModeration?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  onResourceUpdate?: (resourceId: string, updates: Partial<Resource>) => void;
  onResourceDelete?: (resourceId: string) => void;
  className?: string;
}

export default function ResourceCard({
  resource,
  communityId,
  currentUserId,
  currentUserRole,
  currentUserName,
  showActions = true,
  showStats = true,
  showModeration = false,
  variant = 'default',
  onResourceUpdate,
  onResourceDelete,
  className
}: ResourceCardProps) {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<ResourceReportReason | ''>('');
  const [reportDescription, setReportDescription] = useState('');

  // Hooks
  const { 
    likeResource, 
    bookmarkResource, 
    trackDownload, 
    reportResource,
    approveResource,
    rejectResource,
    archiveResource,
    deleteResource
  } = useCommunityResources(communityId);

  const { 
    isModerator, 
    isAdmin, 
    isOwner, 
    isMember 
  } = useCommunityPermissions(communityId, currentUserId);

  // Memoized values
  const TypeIcon = useMemo(() => RESOURCE_TYPE_ICONS[resource.type] || FileText, [resource.type]);
  const isResourceOwner = useMemo(() => resource.uploadedBy === currentUserId, [resource.uploadedBy, currentUserId]);
  const canInteract = useMemo(() => 
    resource.status === ResourceStatus.APPROVED && 
    resource.visibility !== ResourceVisibility.MODERATORS_ONLY && 
    (resource.visibility === ResourceVisibility.PUBLIC || 
     resource.visibility === ResourceVisibility.COMMUNITY_ONLY || 
     resource.visibility === ResourceVisibility.MEMBERS_ONLY), 
    [resource.status, resource.visibility]
  );

  // Permission checks
  const canModerate = isModerator || isAdmin || isOwner;
  const canDelete = isResourceOwner || canModerate;
  const canEdit = isResourceOwner || canModerate;
  const canApprove = canModerate;
  const canReject = canModerate;
  const canArchive = canModerate;

  // Format resource data
  const formattedFileSize = useMemo(() => 
    resource.fileSize ? formatFileSize(resource.fileSize) : null, 
    [resource.fileSize]
  );

  const formattedDate = useMemo(() => 
    formatDate(resource.createdAt, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }), 
    [resource.createdAt]
  );

  const timeAgo = useMemo(() => 
    formatDistanceToNow(resource.createdAt.toDate(), { addSuffix: true }), 
    [resource.createdAt]
  );

  const fileExtension = useMemo(() => 
    resource.fileName ? getFileExtension(resource.fileName) : null, 
    [resource.fileName]
  );

  // Action handlers
  const handleDownload = useCallback(async () => {
    if (!canInteract) {
      toast.error('You do not have permission to download this resource');
      return;
    }

    setIsDownloading(true);
    try {
      // Track download
      await trackDownload(
        resource.id, 
        currentUserId, 
        communityId, 
        'direct',
        navigator.userAgent
      );

      // Handle actual download
      if (resource.type === ResourceType.LINK && resource.externalUrl) {
        window.open(resource.externalUrl, '_blank');
        toast.success('Opening external link');
      } else if (resource.fileUrl) {
        const link = document.createElement('a');
        link.href = resource.fileUrl;
        link.download = resource.fileName || `resource-${resource.id}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started');
      } else {
        toast.error('Download link not available');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download resource');
    } finally {
      setIsDownloading(false);
    }
  }, [resource, currentUserId, communityId, canInteract, trackDownload]);

  const handleLike = useCallback(async () => {
    if (!canInteract) {
      toast.error('You do not have permission to like this resource');
      return;
    }

    setIsLiking(true);
    try {
      await likeResource(resource.id, currentUserId);
      toast.success('Resource liked');
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to like resource');
    } finally {
      setIsLiking(false);
    }
  }, [resource.id, currentUserId, canInteract, likeResource]);

  const handleBookmark = useCallback(async () => {
    if (!canInteract) {
      toast.error('You do not have permission to bookmark this resource');
      return;
    }

    setIsBookmarking(true);
    try {
      await bookmarkResource(resource.id, currentUserId, communityId);
      toast.success('Resource bookmarked');
    } catch (error) {
      console.error('Bookmark error:', error);
      toast.error('Failed to bookmark resource');
    } finally {
      setIsBookmarking(false);
    }
  }, [resource.id, currentUserId, communityId, canInteract, bookmarkResource]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: resource.title,
        text: resource.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  }, [resource.title, resource.description]);

  const handleReport = useCallback(async () => {
    if (!reportReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    try {
      await reportResource(
        resource.id,
        currentUserId,
        currentUserName,
        currentUserRole,
        reportReason,
        reportDescription,
        'content'
      );
      toast.success('Resource reported successfully');
      setShowReportDialog(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Failed to report resource');
    }
  }, [resource.id, currentUserId, currentUserName, currentUserRole, reportReason, reportDescription, reportResource]);

  const handleApprove = useCallback(async () => {
    try {
      await approveResource(resource.id, currentUserId, 'Approved by moderator');
      toast.success('Resource approved');
      onResourceUpdate?.(resource.id, { status: ResourceStatus.APPROVED, approvalStatus: ApprovalStatus.MANUALLY_APPROVED });
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve resource');
    }
  }, [resource.id, currentUserId, approveResource, onResourceUpdate]);

  const handleReject = useCallback(async () => {
    try {
      await rejectResource(resource.id, currentUserId, 'Rejected by moderator');
      toast.success('Resource rejected');
      onResourceUpdate?.(resource.id, { status: ResourceStatus.REJECTED, approvalStatus: ApprovalStatus.REQUIRES_CHANGES });
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject resource');
    }
  }, [resource.id, currentUserId, rejectResource, onResourceUpdate]);

  const handleArchive = useCallback(async () => {
    try {
      await archiveResource(resource.id, currentUserId);
      toast.success('Resource archived');
      onResourceUpdate?.(resource.id, { status: ResourceStatus.ARCHIVED });
    } catch (error) {
      console.error('Archive error:', error);
      toast.error('Failed to archive resource');
    }
  }, [resource.id, currentUserId, archiveResource, onResourceUpdate]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteResource(resource.id);
      toast.success('Resource deleted');
      onResourceDelete?.(resource.id);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete resource');
    }
  }, [resource.id, deleteResource, onResourceDelete]);

  // Render functions
  const renderStatusBadge = () => (
    <Badge 
      variant="outline" 
      className={cn(
        'text-xs font-medium',
        RESOURCE_STATUS_COLORS[resource.status]
      )}
    >
      {resource.status === ResourceStatus.PENDING && <Clock className="w-3 h-3 mr-1" />}
      {resource.status === ResourceStatus.APPROVED && <CheckCircle className="w-3 h-3 mr-1" />}
      {resource.status === ResourceStatus.REJECTED && <AlertTriangle className="w-3 h-3 mr-1" />}
      {resource.status === ResourceStatus.ARCHIVED && <Archive className="w-3 h-3 mr-1" />}
      {resource.status === ResourceStatus.REPORTED && <Flag className="w-3 h-3 mr-1" />}
      {resource.status}
    </Badge>
  );

  const renderVisibilityBadge = () => (
    <Badge 
      variant="outline" 
      className={cn(
        'text-xs font-medium',
        RESOURCE_VISIBILITY_COLORS[resource.visibility]
      )}
    >
      {resource.visibility.replace('_', ' ')}
    </Badge>
  );

  const renderDifficultyBadge = () => resource.difficulty && (
    <Badge 
      variant="outline" 
      className={cn(
        'text-xs font-medium',
        DIFFICULTY_COLORS[resource.difficulty]
      )}
    >
      {resource.difficulty}
    </Badge>
  );

  const renderFileInfo = () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <TypeIcon className="w-4 h-4" />
      {resource.type === ResourceType.LINK ? (
        <span>External Link</span>
      ) : (
        <>
          <span className="uppercase">{fileExtension}</span>
          {formattedFileSize && <span>• {formattedFileSize}</span>}
        </>
      )}
    </div>
  );

  const renderStats = () => showStats && (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Download className="w-4 h-4" />
        <span>{resource.downloadCount}</span>
      </div>
      <div className="flex items-center gap-1">
        <Eye className="w-4 h-4" />
        <span>{resource.viewCount}</span>
      </div>
      <div className="flex items-center gap-1">
        <Heart className="w-4 h-4" />
        <span>{resource.likeCount}</span>
      </div>
      <div className="flex items-center gap-1">
        <Bookmark className="w-4 h-4" />
        <span>{resource.bookmarkCount}</span>
      </div>
    </div>
  );

  const renderActions = () => showActions && (
    <div className="flex items-center gap-2">
      {canInteract && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="h-8 w-8 p-0"
                >
                  {isDownloading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : resource.type === ResourceType.LINK ? (
                    <ExternalLink className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {resource.type === ResourceType.LINK ? 'Open Link' : 'Download'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isLiking}
                  className="h-8 w-8 p-0"
                >
                  <Heart className={cn("w-4 h-4", isLiking && "animate-pulse")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Like</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  disabled={isBookmarking}
                  className="h-8 w-8 p-0"
                >
                  <Bookmark className={cn("w-4 h-4", isBookmarking && "animate-pulse")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bookmark</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 w-8 p-0"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          {canInteract && (
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              {resource.type === ResourceType.LINK ? 'Open Link' : 'Download'}
            </DropdownMenuItem>
          )}

          {(isResourceOwner || canEdit) && (
            <DropdownMenuItem onClick={() => navigate(`/communities/${communityId}/resources/${resource.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}

          {showModeration && canModerate && resource.status === ResourceStatus.PENDING && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Moderation</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleApprove}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReject}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Reject
              </DropdownMenuItem>
            </>
          )}

          {(isResourceOwner || canDelete) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{resource.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {canInteract && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <Flag className="w-4 h-4 mr-2" />
                Report
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Main render
  return (
    <TooltipProvider>
      <Card className={cn(
        "group transition-all duration-200 hover:shadow-md",
        variant === 'compact' && "p-2",
        variant === 'detailed' && "p-6",
        className
      )}>
        <CardHeader className={cn(
          "pb-3",
          variant === 'compact' && "p-2 pb-1",
          variant === 'detailed' && "p-0 pb-4"
        )}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <TypeIcon className="w-5 h-5 text-muted-foreground" />
                <CardTitle className={cn(
                  "text-base font-semibold line-clamp-2",
                  variant === 'compact' && "text-sm",
                  variant === 'detailed' && "text-lg"
                )}>
                  {resource.title}
                </CardTitle>
              </div>
              
              <CardDescription className={cn(
                "text-sm text-muted-foreground line-clamp-2 mb-3",
                variant === 'compact' && "text-xs mb-2",
                variant === 'detailed' && "text-base mb-4"
              )}>
                {resource.description}
              </CardDescription>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {renderStatusBadge()}
                {renderVisibilityBadge()}
                {renderDifficultyBadge()}
                {resource.isFeatured && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {resource.isPinned && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    Pinned
                  </Badge>
                )}
              </div>

              {variant !== 'compact' && renderFileInfo()}
            </div>

            {variant !== 'compact' && (
              <Avatar className="w-8 h-8">
                <AvatarImage src={resource.uploaderAvatar} alt={resource.uploaderName} />
                <AvatarFallback className="text-xs">
                  {resource.uploaderName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardHeader>

        <CardContent className={cn(
          "pt-0",
          variant === 'compact' && "p-2 pt-0",
          variant === 'detailed' && "p-0"
        )}>
          {variant === 'detailed' && (
            <div className="space-y-3">
              {resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 5).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{resource.tags.length - 5} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>By {resource.uploaderName}</span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                </div>
                {renderStats()}
              </div>
            </div>
          )}

          {variant === 'default' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{resource.uploaderName}</span>
                <span>•</span>
                <span>{timeAgo}</span>
              </div>
              {renderStats()}
            </div>
          )}
        </CardContent>

        <CardFooter className={cn(
          "pt-3",
          variant === 'compact' && "p-2 pt-1",
          variant === 'detailed' && "p-0 pt-4"
        )}>
          {renderActions()}
        </CardFooter>
      </Card>

      {/* Report Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Please select a reason for reporting "{resource.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as ResourceReportReason)}
                className="w-full mt-1 p-2 border border-input rounded-md"
              >
                <option value="">Select a reason</option>
                <option value={ResourceReportReason.INAPPROPRIATE_CONTENT}>Inappropriate Content</option>
                <option value={ResourceReportReason.COPYRIGHT_VIOLATION}>Copyright Violation</option>
                <option value={ResourceReportReason.SPAM}>Spam</option>
                <option value={ResourceReportReason.MISLEADING_INFO}>Misleading Information</option>
                <option value={ResourceReportReason.BROKEN_LINK}>Broken Link</option>
                <option value={ResourceReportReason.VIRUS_MALWARE}>Virus/Malware</option>
                <option value={ResourceReportReason.DUPLICATE}>Duplicate</option>
                <option value={ResourceReportReason.OTHER}>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please provide additional details..."
                className="w-full mt-1 p-2 border border-input rounded-md"
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setReportReason('');
              setReportDescription('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReport}>
              Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
