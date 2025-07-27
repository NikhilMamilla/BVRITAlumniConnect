// CommunitySearch.tsx
// Placeholder for CommunitySearch main page

import React, { useState, useMemo } from 'react';
import { useCommunities } from './hooks/useCommunities';
import { useDebounce } from './hooks/useDebounce';
import { Community, CommunityFilter } from './types/community.types';
import { CommunityCard } from './components/community-card/CommunityCard';
import { CommunityCardSkeleton } from './components/community-card/CommunityCardSkeleton';
import CommunitySearch from './components/search-filter/CommunitySearch';
import CommunityFilters from './components/search-filter/CommunityFilters';
import { EmptyState } from './components/common/EmptyState';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { AlertTriangle, Search } from 'lucide-react';

const CommunitySearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CommunityFilter>({});

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const queryFilter = useMemo(() => {
    // Only apply the search term if it's not empty
    if (debouncedSearchTerm && debouncedSearchTerm.length > 2) {
      return { ...filters, search: debouncedSearchTerm };
    }
    return filters;
  }, [filters, debouncedSearchTerm]);

  const { communities, loading, error } = useCommunities(queryFilter);

  const handleFilterChange = (newFilters: Partial<CommunityFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const showResults = debouncedSearchTerm && debouncedSearchTerm.length > 2;

  const renderSkeletons = () => (
    Array.from({ length: 6 }).map((_, i) => <CommunityCardSkeleton key={i} />)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-24">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center justify-center gap-3">
            <Search className="h-10 w-10 text-primary" />
            Search for Communities
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Use keywords, categories, or tags to find communities.
          </p>
        </header>

        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-grow">
                  <CommunitySearch />
              </div>
              <CommunityFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to perform search. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        <main>
          {!showResults && (
              <EmptyState
                  icon={<Search className="h-12 w-12" />}
                  title="Start by typing"
                  description="Enter a search term to find communities."
              />
          )}
          {showResults && loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons()}
            </div>
          )}
          {showResults && !loading && communities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community: Community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          )}
          {showResults && !loading && communities.length === 0 && (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="No Communities Found"
              description="Your search did not match any communities. Please try different keywords."
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default CommunitySearchPage; 