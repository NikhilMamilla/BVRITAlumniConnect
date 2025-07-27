// ResourceApproval.tsx
// Advanced Resource Approval Component for Community Moderators

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ExternalLink,
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
  Archive,
  Flag,
  MoreHorizontal,
  RefreshCw,
  BarChart3,
  Users,
  Calendar,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Bookmark,
  Edit,
  Trash2,
  Send,
  Ban,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../../components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../../../../components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../../../../components/ui/dialog';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '../../../../components/ui/sheet';
import { Textarea } from '../../../../components/ui/textarea';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Progress } from '../../../../components/ui/progress';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../../../../components/ui/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Separator } from '../../../../components/ui/separator';

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
import { useCommunityContext } from '../../contexts/CommunityContext';
import { cn } from '../../../../lib/utils';

// Utility functions (if not available in utils)
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Resource Type Icons Mapping
const RESOURCE_TYPE_ICONS = {
  [ResourceType.DOCUMENT]: FileText,
  [ResourceType.VIDEO]: Video,
  [ResourceType.AUDIO]: Video,
  [ResourceType.IMAGE]: Image,
  [ResourceType.CODE]: Code,
  [ResourceType.LINK]: Link,
  [ResourceType.PRESENTATION]: Presentation,
  [ResourceType.EBOOK]: BookOpen,
  [ResourceType.DATASET]: Database,
  [ResourceType.TOOL]: Wrench
} as const;

// Status Options
const STATUS_OPTIONS = [
  { value: ResourceStatus.PENDING, label: 'Pending Review', icon: Clock, color: 'text-yellow-600' },
  { value: ResourceStatus.REJECTED, label: 'Rejected', icon: XCircle, color: 'text-red-600' },
  { value: ResourceStatus.REPORTED, label: 'Reported', icon: Flag, color: 'text-orange-600' }
] as const;

// Sort Options
const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'uploaderName-asc', label: 'Uploader A-Z' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'type-asc', label: 'Type A-Z' }
] as const;

interface ResourceApprovalProps {
  communityId?: string;
  currentUserId: string;
  currentUserName: string;
  className?: string;
}

export default function ResourceApproval({
  communityId: propCommunityId,
  currentUserId,
  currentUserName,
  className
}: ResourceApprovalProps) {
  const params = useParams();
  const { currentCommunity, currentMember } = useCommunityContext();
  
  // Get community ID from props or URL params
  const communityId = propCommunityId || params.communityId || currentCommunity?.id;
  
  // State management
  const [selectedStatus, setSelectedStatus] = useState<ResourceStatus>(ResourceStatus.PENDING);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ResourceType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ResourceCategory[]>([]);
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [stats, setStats] = useState<{
    pending: number;
    rejected: number;
    reported: number;
    total: number;
  }>({ pending: 0, rejected: 0, reported: 0, total: 0 });

  // Approval/Rejection state
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    resource: Resource | null;
    action: 'approve' | 'reject' | 'archive';
  }>({ open: false, resource: null, action: 'approve' });
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Hooks
  const { 
    resources, 
    loading, 
    error, 
    approveResource,
    rejectResource,
    archiveResource,
    deleteResource
  } = useCommunityResources(communityId || '');

  const { 
    isModerator, 
    isAdmin, 
    isOwner 
  } = useCommunityPermissions(communityId || '', currentUserId);

  // Permission checks
  const canModerate = isModerator || isAdmin || isOwner;
  const canBulkActions = canModerate && selectedResources.size > 0;

  // Filter resources by status and other criteria
  const filteredResources = useMemo(() => {
    let filtered = resources.filter(resource => resource.status === selectedStatus);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.uploaderName.toLowerCase().includes(query) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(resource => selectedTypes.includes(resource.type));
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(resource => selectedCategories.includes(resource.category));
    }

    return filtered;
  }, [resources, selectedStatus, searchQuery, selectedTypes, selectedCategories]);

  // Sort resources
  const sortedResources = useMemo(() => {
    const [field, direction] = sortBy.split('-');
    return [...filteredResources].sort((a, b) => {
      let aValue: string | number | Date = a[field as keyof Resource] as string | number | Date;
      let bValue: string | number | Date = b[field as keyof Resource] as string | number | Date;
      
      if (field === 'createdAt') {
        aValue = aValue instanceof Date ? aValue : (aValue as unknown as { toDate(): Date }).toDate();
        bValue = bValue instanceof Date ? bValue : (bValue as unknown as { toDate(): Date }).toDate();
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredResources, sortBy]);

  // Calculate stats
  useEffect(() => {
    const stats = {
      pending: resources.filter(r => r.status === ResourceStatus.PENDING).length,
      rejected: resources.filter(r => r.status === ResourceStatus.REJECTED).length,
      reported: resources.filter(r => r.status === ResourceStatus.REPORTED).length,
      total: resources.length
    };
    setStats(stats);
  }, [resources]);

  // Handle resource selection
  const handleResourceSelect = useCallback((resourceId: string, selected: boolean) => {
    setSelectedResources(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(resourceId);
      } else {
        newSet.delete(resourceId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedResources(new Set(sortedResources.map(r => r.id)));
    } else {
      setSelectedResources(new Set());
    }
  }, [sortedResources]);

  // Handle approval actions
  const handleApprove = useCallback(async (resourceId: string, notes?: string) => {
    try {
      await approveResource(resourceId, currentUserId, notes);
      toast.success('Resource approved successfully');
      setApprovalDialog({ open: false, resource: null, action: 'approve' });
      setApprovalNotes('');
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve resource');
    }
  }, [approveResource, currentUserId]);

  const handleReject = useCallback(async (resourceId: string, reason: string) => {
    try {
      await rejectResource(resourceId, currentUserId, reason);
      toast.success('Resource rejected successfully');
      setApprovalDialog({ open: false, resource: null, action: 'reject' });
      setRejectionReason('');
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject resource');
    }
  }, [rejectResource, currentUserId]);

  const handleArchive = useCallback(async (resourceId: string) => {
    try {
      await archiveResource(resourceId, currentUserId);
      toast.success('Resource archived successfully');
      setApprovalDialog({ open: false, resource: null, action: 'archive' });
    } catch (error) {
      console.error('Archive error:', error);
      toast.error('Failed to archive resource');
    }
  }, [archiveResource, currentUserId]);

  // Bulk actions
  const handleBulkApprove = useCallback(async () => {
    const promises = Array.from(selectedResources).map(id => 
      approveResource(id, currentUserId, 'Bulk approved')
    );
    try {
      await Promise.all(promises);
      toast.success(`Approved ${selectedResources.size} resources`);
      setSelectedResources(new Set());
    } catch (error) {
      console.error('Bulk approve error:', error);
      toast.error('Failed to approve some resources');
    }
  }, [selectedResources, approveResource, currentUserId]);

  const handleBulkReject = useCallback(async () => {
    const promises = Array.from(selectedResources).map(id => 
      rejectResource(id, currentUserId, 'Bulk rejected')
    );
    try {
      await Promise.all(promises);
      toast.success(`Rejected ${selectedResources.size} resources`);
      setSelectedResources(new Set());
    } catch (error) {
      console.error('Bulk reject error:', error);
      toast.error('Failed to reject some resources');
    }
  }, [selectedResources, rejectResource, currentUserId]);

  // Render resource card
  const renderResourceCard = (resource: Resource) => {
    const TypeIcon = RESOURCE_TYPE_ICONS[resource.type] || FileText;
    const isSelected = selectedResources.has(resource.id);
    const canTakeAction = canModerate;

    return (
      <Card key={resource.id} className={cn(
        "transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-blue-500 bg-blue-50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Selection checkbox */}
            {canModerate && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleResourceSelect(resource.id, e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            )}

            {/* Resource icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <TypeIcon className="w-6 h-6 text-gray-600" />
              </div>
            </div>

            {/* Resource content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {resource.description}
                  </p>
                  
                  {/* Metadata */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {resource.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {resource.category.replace('_', ' ')}
                    </Badge>
                    {resource.difficulty && (
                      <Badge variant="outline" className="text-xs">
                        {resource.difficulty}
                      </Badge>
                    )}
                    {resource.fileSize && (
                      <span className="text-xs text-gray-500">
                        {formatFileSize(resource.fileSize)}
                      </span>
                    )}
                  </div>

                  {/* Uploader info */}
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={resource.uploaderAvatar} />
                      <AvatarFallback className="text-xs">
                        {resource.uploaderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">
                      {resource.uploaderName} ({resource.uploaderRole})
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(resource.createdAt.toDate(), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Preview button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(resource.fileUrl || resource.externalUrl, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Preview Resource</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Action dropdown */}
                  {canTakeAction && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        
                        <DropdownMenuItem 
                          onClick={() => setApprovalDialog({ 
                            open: true, 
                            resource, 
                            action: 'approve' 
                          })}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => setApprovalDialog({ 
                            open: true, 
                            resource, 
                            action: 'reject' 
                          })}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => setApprovalDialog({ 
                            open: true, 
                            resource, 
                            action: 'archive' 
                          })}
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render stats cards
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reported</p>
              <p className="text-2xl font-bold text-orange-600">{stats.reported}</p>
            </div>
            <Flag className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Resources</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!canModerate) {
    return (
      <Card className="max-w-xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>Resource Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center">
            <Shield className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-lg font-semibold mb-2">Access Denied</p>
            <p className="text-muted-foreground">
              You do not have permission to approve resources. Only moderators and admins can access this feature.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resource Approval</h1>
          <p className="text-muted-foreground">
            Review and moderate community resources
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      {renderStatsCards()}

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ResourceStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className={cn("w-4 h-4", option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {canBulkActions && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectedResources.size} resource{selectedResources.size !== 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" size="sm" onClick={() => setSelectedResources(new Set())}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkApprove}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkReject}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${sortedResources.length} resource${sortedResources.length !== 1 ? 's' : ''} found`}
        </p>
        
        {canModerate && sortedResources.length > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedResources.size === sortedResources.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-muted-foreground">Select All</span>
          </div>
        )}
      </div>

      {/* Resources List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive" />
            <div>
              <h3 className="text-lg font-semibold">Error loading resources</h3>
              <p className="text-muted-foreground">
                {error?.message || 'Something went wrong. Please try again.'}
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : sortedResources.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <CheckCircle className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No resources to review</h3>
              <p className="text-muted-foreground">
                All resources in this status have been reviewed.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedResources.map(renderResourceCard)}
        </div>
      )}

      {/* Approval/Rejection Dialog */}
      <Dialog 
        open={approvalDialog.open} 
        onOpenChange={(open) => setApprovalDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.action === 'approve' && 'Approve Resource'}
              {approvalDialog.action === 'reject' && 'Reject Resource'}
              {approvalDialog.action === 'archive' && 'Archive Resource'}
            </DialogTitle>
            <DialogDescription>
              {approvalDialog.resource?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {approvalDialog.action === 'approve' && (
              <div>
                <label className="text-sm font-medium">Approval Notes (Optional)</label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={3}
                />
              </div>
            )}
            
            {approvalDialog.action === 'reject' && (
              <div>
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this resource is being rejected..."
                  rows={3}
                  required
                />
              </div>
            )}
            
            {approvalDialog.action === 'archive' && (
              <div className="text-sm text-muted-foreground">
                This resource will be archived and hidden from the community. This action can be undone later.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalDialog({ open: false, resource: null, action: 'approve' })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!approvalDialog.resource) return;
                
                if (approvalDialog.action === 'approve') {
                  handleApprove(approvalDialog.resource.id, approvalNotes);
                } else if (approvalDialog.action === 'reject') {
                  if (!rejectionReason.trim()) {
                    toast.error('Please provide a rejection reason');
                    return;
                  }
                  handleReject(approvalDialog.resource.id, rejectionReason);
                } else if (approvalDialog.action === 'archive') {
                  handleArchive(approvalDialog.resource.id);
                }
              }}
              className={cn(
                approvalDialog.action === 'approve' && "bg-green-600 hover:bg-green-700",
                approvalDialog.action === 'reject' && "bg-red-600 hover:bg-red-700",
                approvalDialog.action === 'archive' && "bg-gray-600 hover:bg-gray-700"
              )}
            >
              {approvalDialog.action === 'approve' && 'Approve'}
              {approvalDialog.action === 'reject' && 'Reject'}
              {approvalDialog.action === 'archive' && 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 