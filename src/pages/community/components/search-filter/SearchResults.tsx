// SearchResults.tsx
// Placeholder for SearchResults component

import React from 'react';
import { CommunityCard } from '../community-card/CommunityCard';
import { Community } from '../../types/community.types';
import { Skeleton } from '../../../../components/ui/skeleton';

interface SearchResultsProps {
  results: Community[];
  loading: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  if (results.length === 0) {
    return <p>No communities found matching your criteria.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {results.map((community) => (
        <CommunityCard key={community.id} community={community} />
      ))}
    </div>
  );
};

export default SearchResults; 