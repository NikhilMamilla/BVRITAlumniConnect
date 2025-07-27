// SearchSuggestions.tsx
// Placeholder for SearchSuggestions component

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SearchService } from '../../services/searchService';
import { Community } from '../../types/community.types';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchSuggestionsProps {
  query: string;
  onSuggestionClick: (name: string) => void;
}

const searchService = SearchService.getInstance();

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ query, onSuggestionClick }) => {
  const [suggestions, setSuggestions] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      const results = await searchService.getSearchSuggestions(query);
      setSuggestions(results);
      setLoading(false);
    };

    fetchSuggestions();
  }, [query]);

  if (!query) {
    return null;
  }

  return (
    <Card className="absolute top-full mt-2 w-full z-10">
      <CardContent className="p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        ) : (
          suggestions.length > 0 ? (
            <ul className="space-y-1">
              {suggestions.map((community) => (
                <li
                  key={community.id}
                  className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
                  onClick={() => onSuggestionClick(community.name)}
                >
                  {community.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-2 text-center text-sm text-muted-foreground">No suggestions found.</p>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default SearchSuggestions; 