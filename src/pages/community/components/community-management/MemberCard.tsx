// MemberCard.tsx
// Placeholder for MemberCard component

import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DetailedCommunityMember } from '../../types/member.types';
import MemberActions from './MemberActions';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { useAuth } from '@/AuthContext';

interface MemberCardProps {
  member: DetailedCommunityMember;
}

const MemberCard: React.FC<MemberCardProps> = ({ member }) => {
  const { currentCommunity } = useCommunityContext();
  const { currentUser: authUser } = useAuth();
  
  if (!currentCommunity) return null; // Should not happen if structured correctly, but a good safeguard.

  const user = member.userDetails;
  
  const getStatusVariant = (status: string) => {
      switch (status) {
          case 'active': return 'default';
          case 'suspended': return 'destructive';
          default: return 'secondary';
      }
  }

  const joinDate = member.joinedAt instanceof Timestamp 
    ? member.joinedAt.toDate() 
    : member.joinedAt;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-lg">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        {authUser?.uid !== member.userId && (
          <MemberActions communityId={currentCommunity.id} member={member} />
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="capitalize text-sm">{member.role}</Badge>
            <Badge variant={getStatusVariant(member.status)} className="capitalize text-sm">{member.status}</Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
          <p className="text-xs text-muted-foreground">
            Joined {formatDistanceToNow(joinDate as Date)}
        </p>
      </CardFooter>
    </Card>
  );
};

export default MemberCard; 