// MyCommunities.tsx
// Placeholder for MyCommunities main page

import React, { useState } from 'react';
import { useUserCommunities } from './hooks/useUserCommunities';
import { CommunityCard } from './components/community-card/CommunityCard';
import { CommunityCardSkeleton } from './components/community-card/CommunityCardSkeleton';
import { EmptyState } from './components/common/EmptyState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/AuthContext';

const MyCommunities: React.FC = () => {
  const { currentUser } = useAuth();
  const { communities, loading } = useUserCommunities(currentUser?.uid);
  const [filter, setFilter] = useState<'all' | 'owner' | 'moderator'>('all');

  const filteredCommunities = communities.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'owner') return c.owner?.id === currentUser?.uid;
    if (filter === 'moderator') return c.moderators?.includes(currentUser?.uid || '') || c.owner?.id === currentUser?.uid;
    return true;
  });

  const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, i) => <CommunityCardSkeleton key={i} />)
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-24">
          <EmptyState
            title="Please Log In"
            description="You need to be logged in to view your communities."
            icon={<UserCheck className="h-12 w-12" />}
            action={
              <Button asChild>
                <Link to="/login">Log In</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-24">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <UserCheck className="h-10 w-10 text-primary" />
            My Communities
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Communities you have created or joined.
          </p>
        </header>

        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <Button variant={filter === 'all' ? 'secondary' : 'ghost'} onClick={() => setFilter('all')}>All</Button>
          <Button variant={filter === 'owner' ? 'secondary' : 'ghost'} onClick={() => setFilter('owner')}>Owned</Button>
          <Button variant={filter === 'moderator' ? 'secondary' : 'ghost'} onClick={() => setFilter('moderator')}>Moderating</Button>
        </div>
        
        <main>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons()}
            </div>
          ) : filteredCommunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunities.map(community => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Communities Yet"
              description="You haven't joined or created any communities. Why not explore and find one?"
              icon={<UserCheck className="h-12 w-12" />}
              action={
                <Button asChild>
                  <Link to="/communities">Discover Communities</Link>
                </Button>
              }
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default MyCommunities; 