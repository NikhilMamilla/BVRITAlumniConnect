import { useState, useEffect } from 'react';
import { CommunityService } from '../services/communityService';
import { Community } from '../types/community.types';

export const useCommunity = (slugOrId: string | undefined) => {
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugOrId) {
      setLoading(false);
      setCommunity(null);
      setError(null);
      return;
    }

    const fetchCommunity = async () => {
      setLoading(true);
      setError(null);
      try {
        const communityService = CommunityService.getInstance();
        const fetchedCommunity = await communityService.getCommunityBySlug(slugOrId);
        setCommunity(fetchedCommunity);
      } catch (error) {
        console.error('Error fetching community:', error);
        setCommunity(null);
        setError(error instanceof Error ? error.message : 'Failed to fetch community');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [slugOrId]);

  return { community, loading, error };
}; 