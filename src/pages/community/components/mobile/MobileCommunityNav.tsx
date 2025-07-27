// MobileCommunityNav.tsx
// Placeholder for MobileCommunityNav component

import { useUserCommunities } from '../../hooks/useUserCommunities';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { Community } from '../../types/community.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import mobileStyles from '../../styles/mobile.module.css';

export default function MobileCommunityNav() {
  const { communities, loading } = useUserCommunities();
  const { currentCommunity, setCurrentCommunityId } = useCommunityContext();

  const handleCommunitySelect = (community) => {
    setCurrentCommunityId(community.id);
  };

  if (loading) {
    return <div>Loading communities...</div>;
  }

  return (
    <div className={mobileStyles.mobileNav}>
      <div className="flex flex-col space-y-2 p-2">
        {communities.map((community) => (
          <Button
            key={community.id}
            variant={currentCommunity?.id === community.id ? 'secondary' : 'ghost'}
            className={mobileStyles.mobileNavItem}
            onClick={() => handleCommunitySelect(community)}
          >
            <Avatar className={mobileStyles.mobileNavIcon}>
              <AvatarImage src={community.avatar} alt={community.name} />
              <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{community.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
} 