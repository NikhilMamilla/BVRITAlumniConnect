// SortOptions.tsx
// Placeholder for SortOptions component

import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../components/ui/dropdown-menu';
import { Button } from '../../../../components/ui/button';
import { CommunityFilter } from '../../types/community.types';
import { ArrowUpDown } from 'lucide-react';

type SortKey = 'createdAt' | 'memberCount' | 'lastActivity';

interface SortOptionsProps {
  filters: CommunityFilter;
  onFilterChange: (newFilters: CommunityFilter) => void;
}

const sortOptions: { label: string; key: SortKey }[] = [
  { label: 'Latest', key: 'createdAt' },
  { label: 'Most Members', key: 'memberCount' },
  { label: 'Most Active', key: 'lastActivity' },
];

const SortOptions: React.FC<SortOptionsProps> = ({ filters, onFilterChange }) => {
  const handleSortChange = (key: SortKey) => {
    onFilterChange({ ...filters, sortBy: key, sortOrder: 'desc' });
  };
  
  const currentSortLabel = sortOptions.find(opt => opt.key === filters.sortBy)?.label || 'Sort by';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          {currentSortLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {sortOptions.map((option) => (
          <DropdownMenuItem key={option.key} onClick={() => handleSortChange(option.key)}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortOptions; 