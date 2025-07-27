// CommunityResources.tsx
// Placeholder for CommunityResources main page

import React, { useState, useMemo } from 'react';
import { useCommunityContext } from './contexts/CommunityContext';
import { useCommunityResources } from './hooks/useCommunityResources';
import { useDebounce } from './hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Folder, LayoutGrid, List, AlertTriangle } from 'lucide-react';
import ResourceCard from './components/resources/ResourceCard';
import ResourceApproval from './components/resources/ResourceApproval';
import ResourceUpload from './components/resources/ResourceUpload';
import { EmptyState } from './components/common/EmptyState';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ResourceType, ResourceCategory, ResourceVisibility, ResourceStatus } from './types/resource.types';
import { cn } from '@/lib/utils';

type SortOption = 'newest' | 'oldest' | 'name';

interface ResourceFilters {
  status?: ResourceStatus[];
  type?: ResourceType[];
  category?: ResourceCategory[];
  visibility?: ResourceVisibility[];
  search?: string;
}

const CommunityResources: React.FC = () => {
    const { currentCommunity, isMember, isModerator } = useCommunityContext();
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<ResourceFilters>({});
    const [sort, setSort] = useState<SortOption>('newest');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    const queryFilter = useMemo(() => ({
        ...filters,
        search: debouncedSearchTerm,
    }), [filters, debouncedSearchTerm]);

    const communityId = currentCommunity?.id;
    const { resources, loading, error, approveResource } = useCommunityResources(communityId || '', { 
        filters: queryFilter,
        sortBy: sort === 'newest' ? 'createdAt' : sort === 'oldest' ? 'createdAt' : 'title',
        sortOrder: sort === 'oldest' ? 'asc' : 'desc'
    });

    if (!currentCommunity) {
        return (
            <EmptyState 
                icon={<Folder className="h-12 w-12" />}
                title="No Community Selected"
                description="Resources will be shown here once a community is selected."
            />
        );
    }
    
    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Resources</h2>
                {isMember && (
                    <Button onClick={() => setUploadModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Upload Resource
                    </Button>
                )}
            </header>

            {isModerator && (
                <ResourceApproval 
                    communityId={currentCommunity.id}
                    currentUserId=""
                    currentUserName=""
                />
            )}

            <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-card">
                <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow"
                />
                <div className="flex gap-2">
                    <Select onValueChange={(value) => setSort(value as SortOption)} defaultValue={sort}>
                        <SelectTrigger className="w-full md:w-[150px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                            <SelectItem value="name">Name (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}>
                        {layout === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {loading && <div className="flex justify-center p-8"><LoadingSpinner /></div>}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Resources</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                </Alert>
            )}

            {!loading && !error && resources.length > 0 ? (
                <div className={cn('gap-6', layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4')}>
                    {resources.map(resource => (
                        <ResourceCard 
                            key={resource.id} 
                            resource={resource}
                            communityId={currentCommunity.id}
                            currentUserId=""
                            currentUserRole="student"
                            currentUserName=""
                        />
                    ))}
                </div>
            ) : (
                !loading && !error && (
                     <EmptyState
                        icon={<Folder className="h-12 w-12" />}
                        title="No Resources Found"
                        description="This community doesn't have any shared resources yet."
                    />
                )
            )}
            
            {isMember && isUploadModalOpen && (
                <ResourceUpload />
            )}
        </div>
    );
};

export default CommunityResources; 