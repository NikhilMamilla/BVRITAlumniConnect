// ResourceSearch.tsx
// Advanced Resource Search Component with Real-time Integration

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  Calendar,
  FileText,
  Video,
  Image,
  Link,
  Code,
  Presentation,
  BookOpen,
  Database,
  Wrench,
  Star,
  Download,
  Eye,
  Clock,
  TrendingUp,
  Bookmark,
  Share2,
  Tag,
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { debounce } from 'lodash';

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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../../../../components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '../../../../components/ui/sheet';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Skeleton } from '../../../../components/ui/skeleton';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../../../../components/ui/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../components/ui/avatar';
import { Separator } from '../../../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';

// Types and Services
import { 
  ResourceType, 
  ResourceStatus, 
  ResourceVisibility, 
  ResourceCategory,
  ResourceSearchRequest,
  ResourceListResponse,
  Resource
} from '../../types/resource.types';
import { useCommunityResources } from '../../hooks/useCommunityResources';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { useCommunityPermissions } from '../../hooks/useCommunityPermissions';
import { cn } from '../../../../lib/utils';

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

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

// Sort Options
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent', icon: Clock },
  { value: 'popular', label: 'Most Popular', icon: TrendingUp },
  { value: 'downloads', label: 'Most Downloaded', icon: Download },
  { value: 'views', label: 'Most Viewed', icon: Eye },
  { value: 'title', label: 'Title A-Z', icon: FileText },
  { value: 'uploader', label: 'Uploader A-Z', icon: User }
] as const;

// Difficulty Options
const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-800' },
  { value: 'expert', label: 'Expert', color: 'bg-purple-100 text-purple-800' },
];

interface ResourceSearchProps {
  communityId?: string;
  currentUserId: string;
  currentUserName: string;
  className?: string;
  onResourceSelect?: (resource: Resource) => void;
  showFilters?: boolean;
  showSort?: boolean;
  showAdvancedSearch?: boolean;
  maxResults?: number;
}

interface SearchFilters {
  query: string;
  types: ResourceType[];
  categories: ResourceCategory[];
  difficulties: string[];
  uploaderRoles: ('student' | 'alumni')[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  tags: string[];
  minDownloads: number;
  minViews: number;
  isApproved: boolean | null;
  isFeatured: boolean | null;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
}

export default function ResourceSearch({
  communityId: propCommunityId,
  currentUserId,
  currentUserName,
  className,
  onResourceSelect,
  showFilters = true,
  showSort = true,
  showAdvancedSearch = true,
  maxResults = 50
}: ResourceSearchProps) {
  const params = useParams();
  const { currentCommunity, currentMember } = useCommunityContext();
  
  // Get community ID from props or URL params
  const communityId = propCommunityId || params.communityId || currentCommunity?.id;
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    types: [],
    categories: [],
    difficulties: [],
    uploaderRoles: [],
    dateRange: { start: null, end: null },
    tags: [],
    minDownloads: 0,
    minViews: 0,
    isApproved: null,
    isFeatured: null
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Resource[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<IntersectionObserver>();

  // Hooks
  const { 
    resources, 
    loading, 
    error, 
    fetchMoreResources 
  } = useCommunityResources(communityId || '');

  const { 
    isModerator, 
    isAdmin, 
    isOwner 
  } = useCommunityPermissions(communityId || '', currentUserId);

  // Permission checks
  const canModerate = isModerator || isAdmin || isOwner;

  // Filter resources based on search criteria
  const filterResources = useCallback((
    resources: Resource[], 
    searchRequest: ResourceSearchRequest, 
    filters: SearchFilters
  ): Resource[] => {
    let filtered = resources.filter(resource => {
      // Basic visibility and status checks
      if (!canModerate && resource.status !== ResourceStatus.APPROVED) {
        return false;
      }

      // Text search
      if (searchRequest.query) {
        const query = searchRequest.query.toLowerCase();
        const matchesTitle = resource.title.toLowerCase().includes(query);
        const matchesDescription = resource.description.toLowerCase().includes(query);
        const matchesTags = resource.tags.some(tag => tag.toLowerCase().includes(query));
        const matchesUploader = resource.uploaderName.toLowerCase().includes(query);
        
        if (!matchesTitle && !matchesDescription && !matchesTags && !matchesUploader) {
          return false;
        }
      }

      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(resource.type)) {
        return false;
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(resource.category)) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulties.length > 0 && resource.difficulty && !filters.difficulties.includes(resource.difficulty)) {
        return false;
      }

      // Uploader role filter
      if (filters.uploaderRoles.length > 0 && !filters.uploaderRoles.includes(resource.uploaderRole)) {
        return false;
      }

      // Tags filter
      if (filters.tags.length > 0 && !filters.tags.some(tag => resource.tags.includes(tag))) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const resourceDate = resource.createdAt.toDate();
        if (resourceDate < filters.dateRange.start || resourceDate > filters.dateRange.end) {
          return false;
        }
      }

      // Download count filter
      if (filters.minDownloads > 0 && resource.downloadCount < filters.minDownloads) {
        return false;
      }

      // View count filter
      if (filters.minViews > 0 && resource.viewCount < filters.minViews) {
        return false;
      }

      // Approval status filter
      if (filters.isApproved !== null && (resource.status === ResourceStatus.APPROVED) !== filters.isApproved) {
        return false;
      }

      // Featured filter
      if (filters.isFeatured !== null && resource.isFeatured !== filters.isFeatured) {
        return false;
      }

      return true;
    });

    // Sort results
    switch (searchRequest.sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.likeCount + b.bookmarkCount) - (a.likeCount + a.bookmarkCount));
        break;
      case 'downloads':
        filtered.sort((a, b) => b.downloadCount - a.downloadCount);
        break;
      case 'views':
        filtered.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'uploader':
        filtered.sort((a, b) => a.uploaderName.localeCompare(b.uploaderName));
        break;
    }

    return filtered;
  }, [canModerate]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, filters: SearchFilters, sortBy: string) => {
      if (!communityId) return;
      
      setIsSearching(true);
      try {
        const searchRequest: ResourceSearchRequest = {
          query: query.trim() || undefined,
          communityId,
          type: filters.types.length === 1 ? filters.types[0] : undefined,
          category: filters.categories.length === 1 ? filters.categories[0] : undefined,
          tags: filters.tags.length > 0 ? filters.tags : undefined,
          difficulty: filters.difficulties.length === 1 ? filters.difficulties[0] : undefined,
          uploaderRole: filters.uploaderRoles.length === 1 ? filters.uploaderRoles[0] : undefined,
          dateRange: filters.dateRange.start && filters.dateRange.end ? {
            start: filters.dateRange.start,
            end: filters.dateRange.end
          } : undefined,
          sortBy: sortBy as 'recent' | 'popular' | 'downloads' | 'rating',
          limit: maxResults
        };

        // Use the existing resources from the hook and filter them
        const filteredResources = filterResources(resources, searchRequest, filters);
        setSearchResults(filteredResources);
        setTotalResults(filteredResources.length);
        setHasMore(filteredResources.length >= maxResults);
        setLastDoc(null);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Failed to perform search');
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [communityId, resources, maxResults, filterResources]
  );

  // Load more results
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !communityId) return;
    
    setIsLoadingMore(true);
    try {
      const moreResources = await fetchMoreResources(
        communityId,
        {
          status: [ResourceStatus.APPROVED],
          type: filters.types.length > 0 ? filters.types : undefined,
          category: filters.categories.length > 0 ? filters.categories : undefined,
          visibility: [ResourceVisibility.PUBLIC, ResourceVisibility.COMMUNITY_ONLY]
        },
        sortBy === 'recent' ? 'createdAt' : sortBy === 'downloads' ? 'downloadCount' : 'viewCount',
        'desc',
        maxResults,
        lastDoc
      );
      
      if (moreResources.length > 0) {
        setSearchResults(prev => [...prev, ...moreResources]);
        setLastDoc(moreResources[moreResources.length - 1]);
        setHasMore(moreResources.length >= maxResults);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, communityId, fetchMoreResources, filters, sortBy, maxResults, lastDoc]);

  // Save search
  const saveSearch = useCallback(() => {
    const searchName = prompt('Enter a name for this search:');
    if (!searchName?.trim()) return;
    
    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      filters: { ...filters, query: searchQuery },
      createdAt: new Date()
    };
    
    setSavedSearches(prev => [newSavedSearch, ...prev]);
    localStorage.setItem('savedResourceSearches', JSON.stringify([newSavedSearch, ...savedSearches]));
    toast.success('Search saved successfully');
  }, [filters, searchQuery, savedSearches]);

  // Load saved search
  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
    setSearchQuery(savedSearch.filters.query);
    setShowSavedSearches(false);
    toast.success(`Loaded search: ${savedSearch.name}`);
  }, []);

  // Delete saved search
  const deleteSavedSearch = useCallback((searchId: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== searchId);
    setSavedSearches(updatedSearches);
    localStorage.setItem('savedResourceSearches', JSON.stringify(updatedSearches));
    toast.success('Search deleted');
  }, [savedSearches]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      types: [],
      categories: [],
      difficulties: [],
      uploaderRoles: [],
      dateRange: { start: null, end: null },
      tags: [],
      minDownloads: 0,
      minViews: 0,
      isApproved: null,
      isFeatured: null
    });
    setSearchQuery('');
    toast.success('Filters cleared');
  }, []);

  // Effect to trigger search when filters change
  useEffect(() => {
    if (communityId) {
      debouncedSearch(searchQuery, filters, sortBy);
    }
  }, [searchQuery, filters, sortBy, communityId, debouncedSearch]);

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedResourceSearches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedSearches(parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt)
        })));
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    }
  }, []);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // Render resource card
  const renderResourceCard = (resource: Resource) => {
    const TypeIcon = RESOURCE_TYPE_ICONS[resource.type] || FileText;
    const isSelected = false; // Could be used for multi-select

    return (
      <Card 
        key={resource.id} 
        className={cn(
          "transition-all duration-200 hover:shadow-md cursor-pointer",
          isSelected && "ring-2 ring-blue-500 bg-blue-50"
        )}
        onClick={() => onResourceSelect?.(resource)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
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
                      <Badge variant="outline" className={cn("text-xs", 
                        DIFFICULTY_OPTIONS.find(d => d.value === resource.difficulty)?.color
                      )}>
                        {resource.difficulty}
                      </Badge>
                    )}
                    {resource.fileSize && (
                      <span className="text-xs text-gray-500">
                        {formatFileSize(resource.fileSize)}
                      </span>
                    )}
                    {resource.isFeatured && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  {/* Tags */}
                  {resource.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {resource.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {resource.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{resource.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Uploader info and stats */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
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

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(resource.viewCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {formatNumber(resource.downloadCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        {formatNumber(resource.bookmarkCount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render advanced filters
  const renderAdvancedFilters = () => (
    <div className="space-y-4">
      {/* Resource Types */}
      <div>
        <label className="text-sm font-medium mb-2 block">Resource Types</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(ResourceType).map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={filters.types.includes(type)}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    types: checked 
                      ? [...prev.types, type]
                      : prev.types.filter(t => t !== type)
                  }));
                }}
              />
              <label htmlFor={`type-${type}`} className="text-sm">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="text-sm font-medium mb-2 block">Categories</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(ResourceCategory).map(category => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    categories: checked 
                      ? [...prev.categories, category]
                      : prev.categories.filter(c => c !== category)
                  }));
                }}
              />
              <label htmlFor={`category-${category}`} className="text-sm">
                {category.replace('_', ' ')}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty Levels */}
      <div>
        <label className="text-sm font-medium mb-2 block">Difficulty</label>
        <div className="space-y-2">
          {DIFFICULTY_OPTIONS.map(difficulty => (
            <div key={difficulty.value} className="flex items-center space-x-2">
              <Checkbox
                id={`difficulty-${difficulty.value}`}
                checked={filters.difficulties.includes(difficulty.value)}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    difficulties: checked 
                      ? [...prev.difficulties, difficulty.value]
                      : prev.difficulties.filter(d => d !== difficulty.value)
                  }));
                }}
              />
              <label htmlFor={`difficulty-${difficulty.value}`} className="text-sm">
                {difficulty.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Uploader Roles */}
      <div>
        <label className="text-sm font-medium mb-2 block">Uploader Role</label>
        <div className="space-y-2">
          {['student', 'alumni'].map(role => (
            <div key={role} className="flex items-center space-x-2">
              <Checkbox
                id={`role-${role}`}
                checked={filters.uploaderRoles.includes(role as 'student' | 'alumni')}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    uploaderRoles: checked 
                      ? [...prev.uploaderRoles, role as 'student' | 'alumni']
                      : prev.uploaderRoles.filter(r => r !== role)
                  }));
                }}
              />
              <label htmlFor={`role-${role}`} className="text-sm capitalize">
                {role}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Min Downloads */}
      <div>
        <label className="text-sm font-medium mb-2 block">Minimum Downloads</label>
        <Input
          type="number"
          value={filters.minDownloads}
          onChange={(e) => setFilters(prev => ({ ...prev, minDownloads: parseInt(e.target.value) || 0 }))}
          placeholder="0"
          min="0"
        />
      </div>

      {/* Min Views */}
      <div>
        <label className="text-sm font-medium mb-2 block">Minimum Views</label>
        <Input
          type="number"
          value={filters.minViews}
          onChange={(e) => setFilters(prev => ({ ...prev, minViews: parseInt(e.target.value) || 0 }))}
          placeholder="0"
          min="0"
        />
      </div>

      {/* Approval Status */}
      <div>
        <label className="text-sm font-medium mb-2 block">Approval Status</label>
        <Select
          value={filters.isApproved === null ? 'all' : filters.isApproved ? 'approved' : 'pending'}
          onValueChange={(value) => {
            setFilters(prev => ({
              ...prev,
              isApproved: value === 'all' ? null : value === 'approved'
            }));
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="approved">Approved Only</SelectItem>
            <SelectItem value="pending">Pending Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Featured Status */}
      <div>
        <label className="text-sm font-medium mb-2 block">Featured Status</label>
        <Select
          value={filters.isFeatured === null ? 'all' : filters.isFeatured ? 'featured' : 'not-featured'}
          onValueChange={(value) => {
            setFilters(prev => ({
              ...prev,
              isFeatured: value === 'all' ? null : value === 'featured'
            }));
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="featured">Featured Only</SelectItem>
            <SelectItem value="not-featured">Not Featured</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (!communityId) {
    return (
      <Card className="max-w-xl mx-auto mt-10">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <Search className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No Community Selected</h3>
              <p className="text-muted-foreground">
                Please select a community to search resources.
              </p>
            </div>
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
          <h1 className="text-2xl font-bold">Resource Search</h1>
          <p className="text-muted-foreground">
            Find resources in the community
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {showAdvancedSearch && (
            <Button variant="outline" size="sm" onClick={saveSearch}>
              <Save className="w-4 h-4 mr-2" />
              Save Search
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search resources by title, description, tags, or uploader..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
                )}
              </div>
            </div>

            {/* Sort Options */}
            {showSort && (
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Advanced Filters Toggle */}
            {showFilters && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Advanced Search Filters</SheetTitle>
                    <SheetDescription>
                      Refine your search with advanced filters
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    {renderAdvancedFilters()}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isSearching ? 'Searching...' : `${totalResults} resource${totalResults !== 1 ? 's' : ''} found`}
        </p>
        
        {savedSearches.length > 0 && (
          <DropdownMenu open={showSavedSearches} onOpenChange={setShowSavedSearches}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Saved Searches ({savedSearches.length})
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Saved Searches</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {savedSearches.map(search => (
                <DropdownMenuItem key={search.id} onClick={() => loadSavedSearch(search)}>
                  <div className="flex-1">
                    <div className="font-medium">{search.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(search.createdAt, { addSuffix: true })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedSearch(search.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Search Results */}
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
            <Search className="w-16 h-16 mx-auto text-destructive" />
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
      ) : searchResults.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <Search className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No resources found</h3>
              <p className="text-muted-foreground">
                {searchQuery || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== null && f !== '' && f !== 0)
                  ? 'Try adjusting your search criteria or filters.'
                  : 'No resources available in this community yet.'
                }
              </p>
            </div>
            {(searchQuery || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== null && f !== '' && f !== 0)) && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {searchResults.map(renderResourceCard)}
        </div>
      )}
    </div>
  );
}