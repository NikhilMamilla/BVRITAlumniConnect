// DiscussionSearch.tsx
// Placeholder for DiscussionSearch component

import React, { useState, useEffect, useCallback } from 'react';
import { searchService } from '../../services/searchService';
import { Discussion, DiscussionCategory, DiscussionStatus, DiscussionSearchParams } from '../../types/discussion.types';
import type { SearchResult } from '../../types/common.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// A custom hook for debouncing input
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

interface DiscussionSearchProps {
  communityId: string;
}

export const DiscussionSearch: React.FC<DiscussionSearchProps> = ({ communityId }) => {
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState<DiscussionCategory | null>(null);
  const [results, setResults] = useState<SearchResult<Discussion> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  const performSearch = useCallback(async () => {
    if (!debouncedQuery && tags.length === 0 && !category) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const searchParams: Partial<DiscussionSearchParams> = {
        communityId,
        query: debouncedQuery,
        tags: tags.length > 0 ? tags : undefined,
        category: category || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 20,
      };
      const searchResults = await searchService.searchDiscussions(searchParams);
      setResults(searchResults);
    } catch (err) {
      console.error("Error searching discussions:", err);
      setError("An error occurred during the search.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, tags, category, communityId]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const allCategories = Object.values(DiscussionCategory);

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search discussions..."
            className="pl-10"
          />
        </div>
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                    <SlidersHorizontal size={16} />
                    <span>Filters</span>
                    {(tags.length > 0 || category) && <Badge variant="secondary">{tags.length + (category ? 1 : 0)}</Badge>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px]" align="end">
                <div className="space-y-4 p-4">
                    <h4 className="font-medium">Filter by Category</h4>
                    <Command>
                        <CommandInput placeholder="Search category..." />
                        <CommandList>
                            <CommandEmpty>No category found.</CommandEmpty>
                            <CommandGroup>
                                {allCategories.map((cat) => (
                                <CommandItem key={cat} onSelect={() => setCategory(cat === category ? null : cat)}>
                                    <span className={category === cat ? 'font-bold' : ''}>{cat}</span>
                                </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                    {/* Tag input could be a more advanced component, for now a simple text input */}
                    <h4 className="font-medium">Filter by Tags</h4>
                    <Input 
                        placeholder="e.g., react, typescript"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value) {
                                setTags([...new Set([...tags, ...e.currentTarget.value.split(',').map(t=>t.trim())])]);
                                e.currentTarget.value = '';
                            }
                        }}
                    />
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => <Badge key={tag} variant="secondary">{tag} <X size={12} className="ml-1 cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))} /></Badge>)}
                    </div>
                </div>
            </PopoverContent>
        </Popover>

      </div>

      {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {results && (
        <Card>
            <CardHeader>
                <CardTitle>
                    {results.results.length} results found
                    <span className="text-sm text-gray-500 ml-2">({results.searchTime}ms)</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {results.results.length === 0 ? (
                    <p className="text-center text-gray-500">No discussions found matching your criteria.</p>
                ) : (
                    <ul className="space-y-4">
                        {results.results.map(discussion => (
                            <li key={discussion.id}>
                                <Link to={`/community/${communityId}/discussion/${discussion.id}`} className="block p-4 rounded-lg hover:bg-gray-50">
                                    <h3 className="font-bold">{discussion.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">{discussion.content}</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                        {discussion.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}; 