import { useState, useEffect } from 'react';
import { CommunityService } from '../services/communityService';
import { Community } from '../types/community.types';

export const useUserCommunities = (userId: string | undefined) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserCommunities = async () => {
      setLoading(true);
      try {
        const communityService = CommunityService.getInstance();
        const userCommunities = await communityService.getCommunities({
          createdBy: userId
        });
        setCommunities(userCommunities.communities);
      } catch (error) {
        console.error('Error fetching user communities:', error);
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCommunities();
  }, [userId]);

  return { communities, loading };
}; 