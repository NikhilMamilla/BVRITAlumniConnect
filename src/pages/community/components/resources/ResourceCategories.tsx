// ResourceCategories.tsx
// Placeholder for ResourceCategories component

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Tag, 
  Loader2, 
  AlertTriangle,
  LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Types and Services
import type { ResourceCategoryInfo, ResourceStatsResponse, ResourceCategory } from '../../types/resource.types';
import { resourceService } from '../../services/resourceService';
import { useCommunityContext } from '../../contexts/CommunityContext';

interface ResourceCategoriesProps {
  onSelectCategory: (category: ResourceCategory | null) => void;
  selectedCategory: ResourceCategory | null;
}

interface CategoryWithCount extends ResourceCategoryInfo {
  count: number;
  children: CategoryWithCount[];
}

export default function ResourceCategories({
  onSelectCategory,
  selectedCategory,
}: ResourceCategoriesProps) {
  const { currentCommunity } = useCommunityContext();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const buildCategoryTree = (
    categoryList: ResourceCategoryInfo[],
    stats: ResourceStatsResponse | null
  ): CategoryWithCount[] => {
    const categoryMap: Record<string, CategoryWithCount> = {};
    const rootCategories: CategoryWithCount[] = [];

    categoryList.forEach(category => {
      categoryMap[category.id] = {
        ...category,
        count: stats?.resourcesByCategory[category.name as ResourceCategory] || 0,
        children: [],
      };
    });

    Object.values(categoryMap).forEach(category => {
      let totalCount = category.count;
      Object.values(categoryMap).forEach(child => {
        if (child.parentCategoryId === category.id) {
          totalCount += child.count;
        }
      });
      category.count = totalCount;

      if (category.parentCategoryId && categoryMap[category.parentCategoryId]) {
        categoryMap[category.parentCategoryId].children.push(category);
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  };

  const fetchCategoriesAndStats = useCallback(async () => {
    if (!currentCommunity) return;

    setLoading(true);
    setError(null);
    try {
      const [categoryList, stats] = await Promise.all([
        resourceService.getResourceCategories(currentCommunity.id),
        resourceService.getResourceStats(currentCommunity.id),
      ]);

      const categoryTree = buildCategoryTree(categoryList, stats);
      setCategories(categoryTree);
    } catch (err) {
      console.error('Failed to load categories:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not load categories';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentCommunity]);

  useEffect(() => {
    fetchCategoriesAndStats();
  }, [fetchCategoriesAndStats]);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const renderCategory = (category: CategoryWithCount, level: number = 0) => (
    <Collapsible
      key={category.id}
      open={openCategories[category.id]}
      onOpenChange={() => toggleCategory(category.id)}
      className="w-full"
    >
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full justify-start pl-${level * 4}`}
            onClick={() => onSelectCategory(category.name as ResourceCategory)}
          >
            {category.children.length > 0 && (
              <>{openCategories[category.id] ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}</>
            )}
            <Folder className={`h-4 w-4 mr-2 ${selectedCategory === category.name ? 'text-primary' : ''}`} />
            <span className={`flex-1 text-left ${selectedCategory === category.name ? 'font-bold' : ''}`}>
              {category.name}
            </span>
          </Button>
        </CollapsibleTrigger>
        <Badge variant={selectedCategory === category.name ? 'default' : 'secondary'}>
          {category.count}
        </Badge>
      </div>
      <CollapsibleContent>
        {category.children.map(child => renderCategory(child, level + 1))}
      </CollapsibleContent>
    </Collapsible>
  );

  const renderLoading = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center p-4 bg-red-50 text-red-700 rounded-lg">
      <AlertTriangle className="h-8 w-8 mb-2" />
      <p className="font-semibold">Error Loading Categories</p>
      <p className="text-sm">{error}</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={fetchCategoriesAndStats}>
        Try Again
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" />
          Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : (
          <div className="space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-start ${!selectedCategory ? 'font-bold' : ''}`}
              onClick={() => onSelectCategory(null)}
            >
              <Folder className={`h-4 w-4 mr-2 ${!selectedCategory ? 'text-primary' : ''}`} />
              All Categories
            </Button>
            {categories.map(category => renderCategory(category))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 