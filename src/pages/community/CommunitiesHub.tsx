import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommunities } from './hooks/useCommunities';
import { useUserCommunities } from './hooks/useUserCommunities';
import { useCommunitySearch } from './hooks/useCommunitySearch';
import { useDebounce } from './hooks/useDebounce';
import { useNotifications } from './hooks/useNotifications';
import { useCommunityAnalytics } from './hooks/useCommunityAnalytics';
import { useAuth } from '@/AuthContext';
import { QueryDocumentSnapshot } from 'firebase/firestore';

// Components
import CommunityFilters from './components/search-filter/CommunityFilters';
import { CommunityCard } from './components/community-card/CommunityCard';
import { CommunityCardSkeleton } from './components/community-card/CommunityCardSkeleton';
import { CreateCommunityModal } from './components/community-creation/CreateCommunityModal';
import { EmptyState } from './components/common/EmptyState';
import NotificationBell from './components/notifications/NotificationBell';
import CommunityAnalytics from './components/community-management/CommunityAnalytics';
import MobileCommunityNav from './components/mobile/MobileCommunityNav';

// UI Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icons
import { 
  AlertTriangle, 
  Compass, 
  LayoutGrid, 
  List, 
  Search, 
  Plus,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  BookOpen,
  Award,
  Bell,
  Settings,
  Filter,
  Globe,
  Lock,
  Star,
  Activity
} from 'lucide-react';

// Types
import { Community, CommunityFilter, CommunityCategory } from './types/community.types';
import { useMobile } from '@/hooks/use-mobile';

const CommunitiesHub: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isMobile = useMobile();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CommunityFilter>({ isActive: true });
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'discover' | 'my-communities' | 'trending' | 'analytics'>('discover');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const queryFilter = useMemo(() => ({
    ...filters,
    searchQuery: debouncedSearchTerm,
  }), [filters, debouncedSearchTerm]);

  // Hooks
  const { communities: allCommunities, loading, error, fetchMoreCommunities } = useCommunities(queryFilter);
  const { communities: userCommunities, loading: userCommunitiesLoading } = useUserCommunities(currentUser?.uid);
  const { communities: searchCommunities, communitiesLoading } = useCommunitySearch();
  const { notifications, unreadCount } = useNotifications(currentUser?.uid);
  const { communityAnalytics: analytics, communityLoading: analyticsLoading } = useCommunityAnalytics({});

  // Pagination state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Effects
  useEffect(() => {
    setCommunities(allCommunities);
    setHasMore(true);
    setLastDoc(null);
  }, [allCommunities]);

  // Handlers
  const handleLoadMore = async () => {
    if (!hasMore || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const { communities: newCommunities, hasMore: newHasMore, lastDoc: newLastDoc } = 
        await fetchMoreCommunities(queryFilter, { limit: 9, startAfter: lastDoc });
      setCommunities(prev => [...prev, ...newCommunities]);
      setLastDoc(newLastDoc);
      setHasMore(newHasMore);
    } catch (e) {
      console.error("Failed to fetch more communities", e);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<CommunityFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleCommunityClick = (community: Community) => {
    navigate(`/community/${community.slug || community.id}`);
  };

  const handleCreateCommunity = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setShowCreateModal(true);
  };

  // Render functions
  const renderSkeletons = () => (
    Array.from({ length: 9 }).map((_, i) => <CommunityCardSkeleton key={i} />)
  );

  const renderCommunityStats = () => {
    const latestAnalytics = analytics && analytics.length > 0 ? analytics[0] : undefined;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{latestAnalytics?.studentsCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Alumni</p>
                <p className="text-2xl font-bold">{latestAnalytics?.alumniCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">{latestAnalytics?.totalMessages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Events</p>
                <p className="text-2xl font-bold">{latestAnalytics?.totalEvents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMyCommunitiesTab = () => (
    <div className="space-y-6">
      {userCommunitiesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderSkeletons()}
        </div>
      ) : userCommunities.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your Communities</h2>
            <Badge variant="secondary">{userCommunities.length} communities</Badge>
          </div>
          <div className={`grid gap-6 ${layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {userCommunities.map((community: Community) => (
              <CommunityCard 
                key={community.id} 
                community={community} 
                onClick={() => handleCommunityClick(community)}
                showMembershipStatus={true}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Users className="h-16 w-16 text-muted-foreground" />}
          title="No Communities Yet"
          description="You haven't joined any communities yet. Explore and join communities that interest you."
          action={
            <Button onClick={() => setActiveTab('discover')}>
              Discover Communities
            </Button>
          }
        />
      )}
    </div>
  );

  const renderTrendingTab = () => {
    const trendingCommunities = communities
      .filter(c => c.growthRate && c.growthRate > 0)
      .sort((a, b) => (b.growthRate || 0) - (a.growthRate || 0))
      .slice(0, 12);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-500" />
          <h2 className="text-2xl font-semibold">Trending Communities</h2>
        </div>
        {trendingCommunities.length > 0 ? (
          <div className={`grid gap-6 ${layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {trendingCommunities.map((community: Community) => (
              <CommunityCard 
                key={community.id} 
                community={community} 
                onClick={() => handleCommunityClick(community)}
                showTrending={true}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<TrendingUp className="h-16 w-16 text-muted-foreground" />}
            title="No Trending Communities"
            description="Check back later for trending communities."
          />
        )}
      </div>
    );
  };

  const renderDiscoverTab = () => {
    const displayCommunities = searchTerm ? searchCommunities : allCommunities;
    const isLoading = searchTerm ? communitiesLoading : loading;
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label="Toggle filters"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle filters</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}
                    aria-label={`Switch to ${layout === 'grid' ? 'list' : 'grid'} view`}
                  >
                    {layout === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switch to {layout === 'grid' ? 'list' : 'grid'} view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button onClick={handleCreateCommunity} className="gap-2">
              <Plus className="h-4 w-4" />
              {!isMobile && "Create Community"}
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <CommunityFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message || "Failed to load communities. Please try again later."}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && displayCommunities.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderSkeletons()}
          </div>
        ) : displayCommunities.length > 0 ? (
          <>
            <div className={`grid gap-6 ${layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {displayCommunities.map((community: Community) => (
                <CommunityCard 
                  key={community.id} 
                  community={community} 
                  onClick={() => handleCommunityClick(community)}
                  showMembershipStatus={true}
                  showTrending={true}
                />
              ))}
            </div>
            {hasMore && !searchTerm && (
              <div className="flex justify-center">
                <Button 
                  onClick={handleLoadMore} 
                  disabled={isFetchingMore}
                  variant="outline"
                  className="gap-2"
                >
                  {isFetchingMore ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Loading...
                    </>
                  ) : (
                    'Load More Communities'
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Search className="h-16 w-16 text-muted-foreground" />}
            title="No Communities Found"
            description="No communities matched your search criteria. Try adjusting your filters or search terms."
            action={
              <Button onClick={() => {
                setSearchTerm('');
                setFilters({ isActive: true });
              }}>
                Clear Filters
              </Button>
            }
          />
        )}
      </div>
    );
  };

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-semibold">Community Analytics</h2>
      </div>
      
      {analyticsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderSkeletons()}
        </div>
      ) : (
        analytics.length > 0 && analytics[0]?.communityId ? (
          <CommunityAnalytics communityId={analytics[0].communityId} />
        ) : (
          <p>No analytics data available.</p>
        )
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileCommunityNav />
        <div className="p-4 pt-20">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'discover' | 'my-communities' | 'trending' | 'analytics')}>
            <TabsContent value="discover">{renderDiscoverTab()}</TabsContent>
            <TabsContent value="my-communities">{renderMyCommunitiesTab()}</TabsContent>
            <TabsContent value="trending">{renderTrendingTab()}</TabsContent>
            <TabsContent value="analytics">{renderAnalyticsTab()}</TabsContent>
          </Tabs>
        </div>
        {showCreateModal && (
          <CreateCommunityModal />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-24">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Compass className="h-10 w-10 text-primary" />
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Communities Hub</h1>
                  <p className="text-lg text-muted-foreground">
                    Connect, collaborate, and grow with like-minded individuals
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {currentUser && (
                <NotificationBell />
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/communities/settings')}
                aria-label="Community settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Analytics Overview */}
        {!analyticsLoading && renderCommunityStats()}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'discover' | 'my-communities' | 'trending' | 'analytics')}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover" className="gap-2">
              <Compass className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="my-communities" className="gap-2">
              <Users className="h-4 w-4" />
              My Communities
              {userCommunities.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {userCommunities.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {renderDiscoverTab()}
          </TabsContent>

          <TabsContent value="my-communities" className="space-y-6">
            {renderMyCommunitiesTab()}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            {renderTrendingTab()}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {renderAnalyticsTab()}
          </TabsContent>
        </Tabs>

        {/* Create Community Modal */}
        {showCreateModal && (
          <CreateCommunityModal />
        )}
      </div>
    </div>
  );
};

export default CommunitiesHub;