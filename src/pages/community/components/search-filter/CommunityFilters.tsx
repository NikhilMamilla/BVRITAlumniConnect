// CommunityFilters.tsx
// Placeholder for CommunityFilters component

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Label } from '../../../../components/ui/label';
import { CommunityCategory, CommunityFilter, JoinApprovalType } from '../../types/community.types';

interface CommunityFiltersProps {
  filters: CommunityFilter;
  onFilterChange: (newFilters: CommunityFilter) => void;
}

const allCategories: CommunityCategory[] = [
  CommunityCategory.TECHNOLOGY,
  CommunityCategory.CAREER,
  CommunityCategory.ACADEMICS,
  CommunityCategory.PROJECTS,
  CommunityCategory.INTERNSHIPS,
  CommunityCategory.PLACEMENTS,
  CommunityCategory.RESEARCH,
  CommunityCategory.INNOVATION,
  CommunityCategory.ENTREPRENEURSHIP,
  CommunityCategory.SOCIAL,
  CommunityCategory.SPORTS,
  CommunityCategory.ARTS,
  CommunityCategory.VOLUNTEER,
  CommunityCategory.MENTORSHIP,
  CommunityCategory.GENERAL
];

const allJoinTypes: { id: JoinApprovalType, label: string }[] = [
  { id: JoinApprovalType.OPEN, label: 'Open to All' },
  { id: JoinApprovalType.APPROVAL, label: 'Approval Required' },
  { id: JoinApprovalType.INVITE_ONLY, label: 'Invite Only' },
];

const CommunityFilters: React.FC<CommunityFiltersProps> = ({ filters, onFilterChange }) => {
  const handleCategoryChange = (category: CommunityCategory) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];
    
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handleJoinTypeChange = (joinType: JoinApprovalType) => {
    const currentJoinTypes = filters.joinType || [];
    const newJoinTypes = currentJoinTypes.includes(joinType)
      ? currentJoinTypes.filter((j) => j !== joinType)
      : [...currentJoinTypes, joinType];

    onFilterChange({ ...filters, joinType: newJoinTypes });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Category</h3>
          <div className="grid grid-cols-2 gap-2">
            {allCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={filters.categories?.includes(category)}
                  onCheckedChange={() => handleCategoryChange(category)}
                />
                <Label htmlFor={category} className="capitalize">{category}</Label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mt-4 mb-2">Join Type</h3>
          <div className="space-y-2">
            {allJoinTypes.map((joinType) => (
              <div key={joinType.id} className="flex items-center space-x-2">
                <Checkbox
                  id={joinType.id}
                  checked={filters.joinType?.includes(joinType.id)}
                  onCheckedChange={() => handleJoinTypeChange(joinType.id)}
                />
                <Label htmlFor={joinType.id}>{joinType.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityFilters; 