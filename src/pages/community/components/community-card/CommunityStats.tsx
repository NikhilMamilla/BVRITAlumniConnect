// CommunityStats.tsx
// Placeholder for CommunityStats component

import React from 'react';
import { Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Community } from '../../types/community.types';
import { useOnlineMembers } from '../../hooks/useOnlineMembers';
import { Skeleton } from '@/components/ui/skeleton';

interface CommunityStatsProps {
  community: Pick<Community, 'id' | 'memberCount'>;
  className?: string;
}

const AvatarPile: React.FC<{ communityId: string }> = ({ communityId }) => {
    const { onlineMembers, loading } = useOnlineMembers(communityId, 5);
  
    if (loading) {
      return <Skeleton className="h-6 w-24" />;
    }
  
    if (onlineMembers.length === 0) {
      return null;
    }
  
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center -space-x-2">
            {onlineMembers.map((member) => (
              <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={member.userDetails.avatar} alt={member.userDetails.name} />
                <AvatarFallback>{member.userDetails.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{onlineMembers.length} members currently online</p>
        </TooltipContent>
      </Tooltip>
    );
  };
  

export const CommunityStats: React.FC<CommunityStatsProps> = ({ community, className }) => {
  return (
    <TooltipProvider delayDuration={100}>
      <div className={`flex items-center gap-4 text-sm text-muted-foreground ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-default">
              <Users className="h-4 w-4" />
              <span>{community.memberCount.toLocaleString()}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{community.memberCount.toLocaleString()} members</p>
          </TooltipContent>
        </Tooltip>

        <AvatarPile communityId={community.id} />
      </div>
    </TooltipProvider>
  );
}; 