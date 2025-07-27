// PinnedDiscussions.tsx
// Placeholder for PinnedDiscussions component

import React, { useState, useEffect } from 'react';
import { discussionService } from '../../services/discussionService';
import type { Discussion } from '../../types/discussion.types';
import { Pin, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Assuming you have a routing solution like react-router-dom
import { Link } from 'react-router-dom'; 

interface PinnedDiscussionsProps {
  communityId: string;
}

export const PinnedDiscussions: React.FC<PinnedDiscussionsProps> = ({ communityId }) => {
  const [pinnedDiscussions, setPinnedDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = discussionService.subscribeToPinnedDiscussions(
      communityId,
      (discussions) => {
        setPinnedDiscussions(discussions);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching pinned discussions:", err);
        setError("Failed to load pinned discussions.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [communityId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Pin className="mr-2 h-5 w-5 text-yellow-500" /> Pinned Discussions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-24">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
       <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center">
             <Pin className="mr-2 h-5 w-5" /> Pinned Discussions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  // Don't render the component if there are no pinned discussions to show.
  if (pinnedDiscussions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-bold">
          <Pin className="mr-3 h-6 w-6 text-yellow-500" />
          Pinned Discussions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {pinnedDiscussions.map((discussion) => (
            <li key={discussion.id} className="border-b last:border-b-0 pb-4 last:pb-0">
              <Link to={`/community/${communityId}/discussion/${discussion.id}`} className="block hover:bg-gray-50 p-2 rounded-md -m-2">
                <h4 className="font-semibold text-base mb-1 truncate">{discussion.title}</h4>
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                         <Avatar className="h-6 w-6">
                            <AvatarImage src={discussion.authorInfo.photoURL} />
                            <AvatarFallback>{discussion.authorInfo.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{discussion.authorInfo.displayName}</span>
                    </div>
                   <div className="flex items-center space-x-1">
                        <MessageSquare size={16}/>
                        <span>{discussion.replyCount || 0}</span>
                   </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}; 