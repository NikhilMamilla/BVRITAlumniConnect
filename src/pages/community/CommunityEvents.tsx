// CommunityEvents.tsx
// Placeholder for CommunityEvents main page

import React from 'react';
import { useCommunityContext } from './contexts/CommunityContext';
import { useCommunityEvents } from './hooks/useCommunityEvents';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import EventCard from './components/events/EventCard';
import CreateEventModal from './components/events/CreateEventModal';
import { EmptyState } from './components/common/EmptyState';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommunityEvents: React.FC = () => {
    const { currentCommunity, isModerator } = useCommunityContext();
    const navigate = useNavigate();

    const communityId = currentCommunity?.id;

    // Correctly passing the communityId within a filter object and as an array
    const { events, loading, error } = useCommunityEvents(
        { communityIds: communityId ? [communityId] : [] },
        { sortBy: 'startTime', sortOrder: 'asc' }
    );
    
    if (!currentCommunity) {
        return (
            <EmptyState 
                icon={<Calendar className="h-12 w-12" />}
                title="No Community Selected"
                description="Events will be shown here once a community is selected."
            />
        );
    }
    
    const handleEventCreated = (eventId: string) => {
        navigate(`/community/${currentCommunity.id}/events/${eventId}`);
    };

    const handleSelectEvent = (eventId: string) => {
        navigate(`/community/${currentCommunity.id}/events/${eventId}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Community Events</h2>
                {isModerator && (
                    <CreateEventModal 
                        communityId={currentCommunity.id} 
                        onEventCreated={handleEventCreated} 
                    />
                )}
            </div>

            {loading && <div className="flex justify-center p-8"><LoadingSpinner /></div>}

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Events</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                </Alert>
            )}

            {!loading && !error && events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.map(event => (
                        <EventCard key={event.id} event={event} onSelectEvent={handleSelectEvent} />
                    ))}
                </div>
            ) : (
                !loading && !error && (
                    <EmptyState
                        icon={<Calendar className="h-12 w-12" />}
                        title="No Upcoming Events"
                        description="There are currently no events scheduled for this community."
                    />
                )
            )}
        </div>
    );
};

export default CommunityEvents; 