// DiscussionTags.tsx
// Placeholder for DiscussionTags component

import React, { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { TagTrend } from '../../types/analytics.types';
import { X, Tag } from 'lucide-react';

interface DiscussionTagsProps {
  initialTags: string[];
  onTagsChange: (tags: string[]) => void;
  communityId: string;
  isEditable?: boolean;
  maxTags?: number;
}

const DiscussionTags: React.FC<DiscussionTagsProps> = ({
  initialTags,
  onTagsChange,
  communityId,
  isEditable = true,
  maxTags = 10,
}) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState('');
  const [trendingTags, setTrendingTags] = useState<TagTrend[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingTags = async () => {
      if (!communityId) return;
      setIsLoading(true);
      setError(null);
      try {
        const analytics = await analyticsService.getTrendAnalytics(communityId, 'weekly');
        const emergingTags = analytics[0]?.emergingTags || [];
        setTrendingTags(emergingTags);
        if (!analytics.length || !emergingTags.length) {
          setTrendingTags([]);
        }
      } catch (err) {
        console.error("Failed to fetch trending tags:", {
          error: err,
          communityId,
          attemptedPath: `/communityAnalytics?communityId=${communityId}&type=trend&period=weekly`
        });
        setError(`Couldn't load trending tags. Details: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrendingTags();
  }, [communityId]);

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    onTagsChange(newTags);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value) {
      const filteredSuggestions = trendingTags
        .map(t => t.tag)
        .filter(tag => tag.toLowerCase().startsWith(value.toLowerCase()) && !tags.includes(tag));
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleAddTag = useCallback((tagToAdd: string) => {
    const newTag = tagToAdd.trim();
    if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
      const newTags = [...tags, newTag];
      setTags(newTags);
      onTagsChange(newTags);
      setInputValue('');
      setSuggestions([]);
    }
  }, [tags, onTagsChange, maxTags]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {isEditable && (
        <div className="relative">
          <div className="flex items-center border border-gray-300 rounded-md p-2 flex-wrap gap-2 focus-within:ring-2 focus-within:ring-blue-500">
            <Tag className="h-5 w-5 text-gray-400" />
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-sm font-medium px-2 py-1 rounded-full">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="rounded-full hover:bg-gray-300"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={tags.length >= maxTags ? 'Tag limit reached' : 'Add a tag...'}
              className="flex-grow bg-transparent outline-none text-sm"
              disabled={tags.length >= maxTags}
            />
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion}
                  onClick={() => handleAddTag(suggestion)}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Tags:</span>
        {tags.length > 0 ? (
          tags.map((tag) => (
            <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500">No tags added.</span>
        )}
      </div>

      {isLoading && <div className="text-sm text-gray-500">Loading trending tags...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      {!error && !isLoading && trendingTags.length === 0 && (
        <div className="text-sm text-gray-500">No trending tags yet.</div>
      )}
      
      {!isLoading && !error && trendingTags.length > 0 && (
         <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 mt-2">
            <span className="text-sm font-medium text-gray-600">Trending:</span>
            {trendingTags.slice(0, 5).map(trend => (
              <button
                key={trend.tag}
                onClick={() => handleAddTag(trend.tag)}
                disabled={tags.includes(trend.tag) || !isEditable || tags.length >= maxTags}
                className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-200"
              >
                {trend.tag}
              </button>
            ))}
         </div>
      )}
    </div>
  );
};

export default DiscussionTags; 