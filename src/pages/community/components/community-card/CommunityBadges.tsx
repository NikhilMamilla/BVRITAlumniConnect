// CommunityBadges.tsx
// Placeholder for CommunityBadges component

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Sparkles, TrendingUp, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Community } from '../../types/community.types';
import { VisibilityLevel } from '../../types/common.types';
import { differenceInDays } from 'date-fns';

interface CommunityBadgesProps {
  community: Pick<Community, 'createdAt' | 'visibility' | 'engagementScore'> & { isVerified?: boolean };
  className?: string;
}

export const CommunityBadges: React.FC<CommunityBadgesProps> = ({ community, className }) => {
  const isNew = community.createdAt && differenceInDays(new Date(), community.createdAt.toDate()) <= 7;
  const isTrending = community.engagementScore > 100; // Example threshold

  return (
    <TooltipProvider delayDuration={100}>
      <div className={`flex items-center gap-2 ${className}`}>
        {community.isVerified && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="border-green-500/50 text-green-600">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verified
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>This community is officially verified.</p></TooltipContent>
          </Tooltip>
        )}
        {isTrending && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="border-orange-500/50 text-orange-600">
                <TrendingUp className="mr-1 h-3.5 w-3.5" /> Trending
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>This community has high engagement.</p></TooltipContent>
          </Tooltip>
        )}
        {isNew && (
           <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="border-blue-500/50 text-blue-600">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> New
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>Created within the last 7 days.</p></TooltipContent>
          </Tooltip>
        )}
         {community.visibility === VisibilityLevel.PRIVATE && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="border-slate-500/50 text-slate-600">
                <Lock className="mr-1 h-3.5 w-3.5" /> Private
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>This is a private, invite-only community.</p></TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}; 