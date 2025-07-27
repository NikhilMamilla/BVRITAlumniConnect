// CommunitySearch.tsx
// Placeholder for CommunitySearch component

import React, { useState, useEffect } from 'react';
import { Input } from '../../../../components/ui/input';
import { SearchService } from '../../services/searchService';
import { Community, CommunityFilter } from '../../types/community.types';
import { useDebounce } from '../../hooks/useDebounce';
import CommunityFilters from './CommunityFilters';
import SortOptions from './SortOptions';
import FilterTags from './FilterTags';
import SearchResults from './SearchResults';
import SearchSuggestions from './SearchSuggestions';

const searchService = SearchService.getInstance();

const CommunitySearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CommunityFilter>({});
  const [results, setResults] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = searchService.subscribeToCommunities(
      filters,
      debouncedSearchQuery,
      (newResults) => {
        setResults(newResults);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to search communities:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [debouncedSearchQuery, filters]);

  const handleSuggestionClick = (name: string) => {
    setSearchQuery(name);
    setShowSuggestions(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1">
        <CommunityFilters filters={filters} onFilterChange={setFilters} />
      </div>
      <div className="md:col-span-3 space-y-4">
        <div className="relative">
          <div className="flex space-x-2">
            <Input
              placeholder="Search for communities..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="flex-grow"
            />
            <SortOptions filters={filters} onFilterChange={setFilters} />
          </div>
          {showSuggestions && (
            <SearchSuggestions
              query={debouncedSearchQuery}
              onSuggestionClick={handleSuggestionClick}
            />
          )}
        </div>
        <FilterTags filters={filters} onFilterChange={setFilters} />
        
        <SearchResults results={results} loading={loading} />
      </div>
    </div>
  );
};

export default CommunitySearch; 