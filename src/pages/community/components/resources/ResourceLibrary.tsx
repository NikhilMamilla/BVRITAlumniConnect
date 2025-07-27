import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  SortDesc,
  RefreshCw,
  FileText,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
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
import { Skeleton } from '../../../../components/ui/skeleton';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../../../../components/ui/tooltip';

// Types and Services
import { 
  ResourceType, 
  ResourceStatus, 
  ResourceVisibility, 
  ResourceCategory
} from '../../types/resource.types';
import type { Resource, ResourceStatsResponse } from '../../types/resource.types';
import { useCommunityResources } from '../../hooks/useCommunityResources';
import { useCommunityPermissions } from '../../hooks/useCommunityPermissions';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { formatNumber } from '../../utils/formatHelpers';
import { cn } from '../../../../lib/utils';

// Import ResourceCard component
import ResourceCard from './ResourceCard';

// Sort Options
const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'downloadCount-desc', label: 'Most Downloaded' },
  { value: 'viewCount-desc', label: 'Most Viewed' },
  { value: 'likeCount-desc', label: 'Most Liked' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' }
] as const;

interface ResourceLibraryProps {
  communityId?: string;
  currentUserId: string;
  currentUserRole: 'student' | 'alumni';
  currentUserName: string;
  showUploadButton?: boolean;
  showModerationTools?: boolean;
  showAnalytics?: boolean;
  className?: string;
}

export default function ResourceLibrary({
  communityId: propCommunityId,
  currentUserId,
  currentUserRole,
  currentUserName,
  showUploadButton = true,
  showModerationTools = false,
  showAnalytics = true,
  className
}: ResourceLibraryProps) {
  const params = useParams();
  const navigate = useNavigate();
  
  // Get community ID from props or URL params
  const communityId = propCommunityId || params.communityId;
  
  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ResourceType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ResourceCategory[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ResourceStatus[]>([]);
  const [selectedVisibilities, setSelectedVisibilities] = useState<ResourceVisibility[]>([]);
  const [stats, setStats] = useState<ResourceStatsResponse | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Hooks
  const { 
    resources, 
    loading, 
    error, 
    getResourceStats
  } = useCommunityResources(communityId || '');

  const { 
    isModerator, 
    isAdmin, 
    isOwner, 
    isMember 
  } = useCommunityPermissions(communityId || '', currentUserId);

  const { currentCommunity } = useCommunityContext();

  // Permission checks
  const canUpload = isMember && (currentUserRole === 'alumni' || isModerator || isAdmin);
  const canModerate = isModerator || isAdmin || isOwner;
  const canViewAnalytics = canModerate;

  // Parse sort options
  const [sortField, sortDirection] = useMemo(() => {
    const [field, direction] = sortBy.split('-');
    return [field, direction as 'asc' | 'desc'];
  }, [sortBy]);

  // Filtered and sorted resources
  const filteredResources = useMemo(() => {
    let filtered = resources;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query)) ||
        resource.uploaderName.toLowerCase().includes(query)
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

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(resource => selectedStatuses.includes(resource.status));
    }

    // Apply visibility filter
    if (selectedVisibilities.length > 0) {
      filtered = filtered.filter(resource => selectedVisibilities.includes(resource.visibility));
    }

    return filtered;
  }, [resources, searchQuery, selectedTypes, selectedCategories, selectedStatuses, selectedVisibilities]);

  // Load resource stats
  useEffect(() => {
    if (communityId && canViewAnalytics) {
      getResourceStats(communityId)
        .then(setStats)
        .catch(console.error);
    }
  }, [communityId, canViewAnalytics, getResourceStats]);

  // Handle resource actions
  const handleResourceUpdate = useCallback((resourceId: string, updates: Partial<Resource>) => {
    toast.success('Resource updated successfully');
  }, []);

  const handleResourceDelete = useCallback((resourceId: string) => {
    toast.success('Resource deleted successfully');
  }, []);

  // Render stats cards
  const renderStatsCards = () => {
    if (!stats || !showAnalytics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Resources</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalResources)}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalDownloads)}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalViews)}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Uploads</p>
                <p className="text-2xl font-bold">{stats.recentUploads.length}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render resource grid
  const renderResourceGrid = () => (
    <div className={cn(
      "grid gap-4",
      viewMode === 'grid' 
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
        : "grid-cols-1"
    )}>
      {filteredResources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          communityId={communityId || ''}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          currentUserName={currentUserName}
          showActions={true}
          showStats={true}
          showModeration={showModerationTools}
          variant={viewMode === 'grid' ? 'default' : 'detailed'}
          onResourceUpdate={handleResourceUpdate}
          onResourceDelete={handleResourceDelete}
        />
      ))}
    </div>
  );

  // Render loading skeletons
  const renderLoadingSkeletons = () => (
    <div className={cn(
      "grid gap-4",
      viewMode === 'grid' 
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
        : "grid-cols-1"
    )}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <Card className="p-8 text-center">
      <CardContent className="space-y-4">
        <FileText className="w-16 h-16 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold">No resources found</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedTypes.length > 0 || selectedCategories.length > 0
              ? "Try adjusting your search or filters"
              : "Be the first to share a resource in this community"
            }
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => navigate(`/communities/${communityId}/resources/upload`)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Resource
          </Button>
        )}
      </CardContent>
    </Card>
  );

  // Render error state
  const renderErrorState = () => (
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
  );

  if (!communityId) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <h3 className="text-lg font-semibold">Community not found</h3>
          <p className="text-muted-foreground">The requested community could not be found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resource Library</h1>
          <p className="text-muted-foreground">
            {currentCommunity?.name ? `${currentCommunity.name} Resources` : 'Community Resources'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {showAnalytics && canViewAnalytics && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showStats ? 'Hide' : 'Show'} Analytics
            </Button>
          )}
          
          {canUpload && showUploadButton && (
            <Button onClick={() => navigate(`/communities/${communityId}/resources/upload`)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Resource
            </Button>
          )}
        </div>
      </div>

      {/* Analytics */}
      {showStats && renderStatsCards()}

      {/* Search and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
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

            {/* View Mode */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'grid' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grid View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'list' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>List View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
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

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${filteredResources.length} resource${filteredResources.length !== 1 ? 's' : ''} found`}
        </p>
        
        {!loading && filteredResources.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      {/* Resources Grid/List */}
      {loading ? (
        renderLoadingSkeletons()
      ) : error ? (
        renderErrorState()
      ) : filteredResources.length === 0 ? (
        renderEmptyState()
      ) : (
        renderResourceGrid()
      )}
    </div>
  );
} 