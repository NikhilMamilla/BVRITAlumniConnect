// CommunityPreview.tsx
// Placeholder for CommunityPreview component

import React from 'react';
import { Button } from '@/components/ui/button';
import { Community } from '../../types/community.types';
import { CommunityStats } from './CommunityStats';
import { CommunityBadges } from './CommunityBadges';
import { ArrowRight, Crown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';

interface CommunityPreviewProps {
  community: Community;
}

export const CommunityPreview: React.FC<CommunityPreviewProps> = ({ community }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isOwner = currentUser && community.owner && currentUser.uid === community.owner.id;
  const isAdmin = currentUser && Array.isArray(community.admins) && community.admins.includes(currentUser.uid);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-sm">
      <div>
        <h4 className="font-bold text-lg flex items-center gap-2">
          {community.name}
          {isOwner && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full shadow-lg text-white font-bold text-xs bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 border-2 border-white">
              <Crown className="h-4 w-4 text-yellow-300 drop-shadow" /> Owner
            </span>
          )}
          {!isOwner && isAdmin && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full shadow-lg text-white font-bold text-xs bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 border-2 border-white">
              <Shield className="h-4 w-4 text-white drop-shadow" /> Admin
            </span>
          )}
        </h4>
        <div className="mt-2">
            <CommunityBadges community={community} />
        </div>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-4">
          {community.longDescription || community.description}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {community.tags.slice(0, 5).map(tag => (
          <span key={tag} className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
            {tag}
          </span>
        ))}
      </div>

      <hr className="border-border/50" />

      <div className="flex justify-between items-center">
        <CommunityStats community={community} />
        <Button size="sm" onClick={() => navigate(`/community/${community.slug || community.id}`)}>
          View Community <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}; 