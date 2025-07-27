// DiscussionList.tsx
// Placeholder for DiscussionList component

import React, { useState, useEffect } from 'react';
import { discussionService } from '../../services/discussionService';
import { Discussion, DiscussionCategory } from '../../types/discussion.types';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageSquare, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DiscussionVoting } from './DiscussionVoting';
import { formatRelativeTime } from '../../utils/dateHelpers';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useAuth } from '../../../../AuthContext';

interface DiscussionListProps {
  communityId: string;
}

const PAGE_SIZE = 15;

type SortBy = 'createdAt' | 'voteScore' | 'replyCount';
type CategoryOrAll = DiscussionCategory | 'all';

export const DiscussionList: React.FC<DiscussionListProps> = ({ communityId }) => {
  const { currentUser } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [category, setCategory] = useState<CategoryOrAll>('all');

  useEffect(() => {
    setIsLoading(true);
    setDiscussions([]);
    setLastVisible(null);
    setHasMore(true);

    const unsubscribe = discussionService.subscribeToDiscussions(
      communityId,
      (initialDiscussions) => {
        setDiscussions(initialDiscussions);
        if (initialDiscussions.length < PAGE_SIZE) {
            setHasMore(false);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching discussions:", err);
        setError("Failed to load discussions.");
        setIsLoading(false);
      },
      {
        category: category === 'all' ? undefined : category,
        sortBy,
        sortOrder: 'desc',
        limit: PAGE_SIZE
      }
    );
    
    // We also need to get the last document for pagination, which the subscription doesn't provide.
    // So we run a one-time fetch for the initial batch to get the 'lastVisible' document.
    discussionService.getDiscussions(communityId, { 
        category: category === 'all' ? undefined : category,
        sortBy,
        sortOrder: 'desc'
    }, PAGE_SIZE)
    .then(({ lastVisible: lv }) => {
        setLastVisible(lv as QueryDocumentSnapshot<DocumentData> | null);
    });

    return () => unsubscribe();
  }, [communityId, sortBy, category]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const { discussions: newDiscussions, lastVisible: newLastVisible } = await discussionService.getDiscussions(
        communityId,
        {
          category: category === 'all' ? undefined : category,
          sortBy,
          sortOrder: 'desc',
        },
        PAGE_SIZE,
        lastVisible
      );
      
      setDiscussions(prev => [...prev, ...newDiscussions]);
      setLastVisible(newLastVisible as QueryDocumentSnapshot<DocumentData> | null);
      if (newDiscussions.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more discussions:", err);
      setError("Failed to load more discussions.");
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  const allCategories: CategoryOrAll[] = ['all', ...Object.values(DiscussionCategory)];

  return (
    <div className="space-y-4">
        <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryOrAll)}>
                    <TabsList>
                        {allCategories.map(cat => <TabsTrigger key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</TabsTrigger>)}
                    </TabsList>
                </Tabs>
                <div className="w-full sm:w-auto">
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt">Latest</SelectItem>
                            <SelectItem value="voteScore">Top Voted</SelectItem>
                            <SelectItem value="replyCount">Most Replied</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
        
        {isLoading && <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!isLoading && discussions.length === 0 && (
            <div className="text-center py-16 text-gray-500">
                <MessageSquare size={48} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No discussions yet</h3>
                <p>Be the first to start a conversation!</p>
            </div>
        )}

        <ul className="space-y-4">
            {discussions.map(d => (
                <Card key={d.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-start space-x-4">
                        <DiscussionVoting item={d} userId={currentUser?.uid || ''} itemType="discussion"/>
                        <div className="flex-grow">
                            <Link to={`/community/${communityId}/discussion/${d.id}`}>
                                <h3 className="text-lg font-bold hover:text-blue-600">{d.title}</h3>
                            </Link>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                <div className="flex items-center space-x-1">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={d.authorInfo.photoURL}/>
                                        <AvatarFallback>{d.authorInfo.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{d.authorInfo.displayName}</span>
                                </div>
                                <span>{formatRelativeTime(d.createdAt)}</span>
                                <div className="flex items-center space-x-1"><MessageSquare size={14}/><span>{d.replyCount || 0} replies</span></div>
                                <div className="flex items-center space-x-1"><Eye size={14}/><span>{d.viewCount || 0} views</span></div>
                            </div>
                             <div className="mt-2 flex flex-wrap gap-2">
                                {d.tags.slice(0, 5).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </ul>

        {hasMore && !isLoading && (
            <div className="text-center">
                <Button onClick={loadMore} disabled={isLoadingMore}>
                    {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Load More
                </Button>
            </div>
        )}
    </div>
  );
}; 