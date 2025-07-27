// CommunityCard.tsx
// Placeholder for CommunityCard component

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Community } from '../../types/community.types';
import { CommunityBadges } from './CommunityBadges';
import { CommunityStats } from './CommunityStats';
import { CommunityJoinButton } from './CommunityJoinButton';
import { CommunityPreview } from './CommunityPreview';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Crown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import cardStyles from '../../styles/cards.module.css';
import { useAuth } from '@/AuthContext';

interface CommunityCardProps {
  community: Community;
  onClick?: (community: Community) => void;
  showMembershipStatus?: boolean;
  showTrending?: boolean;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ community, onClick, showMembershipStatus = false, showTrending = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const isOwner = currentUser && community.owner && currentUser.uid === community.owner.id;
  const isAdmin = currentUser && Array.isArray(community.admins) && community.admins.includes(currentUser.uid);

  const handleCardClick = () => {
    if (onClick) {
      onClick(community);
    } else {
      navigate(`/community/${community.slug || community.id}`);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => e.stopPropagation();

  const lastActivity = community.lastActivity
    ? formatDistanceToNow(community.lastActivity.toDate(), { addSuffix: true })
    : 'No activity yet';

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          className="h-full"
        >
          <Card
            onClick={handleCardClick}
            className="flex flex-col h-full cursor-pointer overflow-hidden transition-shadow hover:shadow-lg border-transparent hover:border-primary/20"
          >
            <CardHeader className="p-0 relative h-24">
              {community.banner && (
                <img src={community.banner} alt={`${community.name} banner`} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <Avatar className="absolute top-4 left-4 h-16 w-16 rounded-lg border-4 border-background">
                <AvatarImage src={community.avatar} alt={community.name} />
                <AvatarFallback>{community.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {showTrending && (
                <span className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded shadow">Trending</span>
              )}
              {/* Owner/Admin badge */}
              {isOwner && (
                <span className="absolute bottom-2 right-2 flex items-center gap-1 px-3 py-1 rounded-full shadow-lg text-white font-bold text-xs bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 border-2 border-white">
                  <Crown className="h-4 w-4 text-yellow-300 drop-shadow" /> Owner
                </span>
              )}
              {!isOwner && isAdmin && (
                <span className="absolute bottom-2 right-2 flex items-center gap-1 px-3 py-1 rounded-full shadow-lg text-white font-bold text-xs bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 border-2 border-white">
                  <Shield className="h-4 w-4 text-white drop-shadow" /> Admin
                </span>
              )}
              {/* Only show Member badge if not owner/admin */}
              {!isOwner && !isAdmin && showMembershipStatus && (
                <span className="absolute bottom-2 right-2 bg-blue-500 text-xs text-white px-2 py-1 rounded shadow">
                  Member
                </span>
              )}
            </CardHeader>

            <CardContent className="flex-grow p-4 pt-6">
              <h3 className="text-lg font-bold leading-tight truncate">{community.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {community.description}
              </p>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-4 p-4 pt-0">
              <div className="w-full flex justify-between items-center">
                <CommunityStats community={community} />
                <CommunityBadges community={community} />
              </div>
              <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Active {lastActivity}</span>
                </div>
                <div onClick={handleButtonClick}>
                  <CommunityJoinButton community={community} />
                </div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-auto p-0" 
        onClick={(e) => e.stopPropagation()}
        side="right" 
        align="start"
      >
        <CommunityPreview community={community} />
      </HoverCardContent>
    </HoverCard>
  );
}; 