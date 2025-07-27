// FilterTags.tsx
// Placeholder for FilterTags component

import React from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { CommunityFilter } from '../../types/community.types';
import { X } from 'lucide-react';

interface FilterTagsProps {
  filters: CommunityFilter;
  onFilterChange: (newFilters: CommunityFilter) => void;
}

const FilterTags: React.FC<FilterTagsProps> = ({ filters, onFilterChange }) => {
  const { categories = [] } = filters;

  const removeCategory = (category: string) => {
    const newCategories = categories.filter((c) => c !== category);
    onFilterChange({ ...filters, categories: newCategories });
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm font-semibold">Active Filters:</span>
      {categories.map((category) => (
        <Badge key={category} variant="secondary" className="capitalize">
          {category}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1"
            onClick={() => removeCategory(category)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
};

export default FilterTags; 