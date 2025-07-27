// CommunityDiscussions.tsx
// Placeholder for CommunityDiscussions main page

import React, { useState } from 'react';
import { useCommunityContext } from './contexts/CommunityContext';
import { DiscussionList } from './components/discussions/DiscussionList';
import { PinnedDiscussions } from './components/discussions/PinnedDiscussions';
import { CreateDiscussionModal } from './components/discussions/CreateDiscussionModal';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { EmptyState } from './components/common/EmptyState';
import { MessagesSquare } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { useNavigate } from 'react-router-dom';

const CommunityDiscussions: React.FC = () => {
    const { currentCommunity, isMember } = useCommunityContext();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // The modal is controlled from here, but the child components fetch their own data.
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    if (!currentCommunity || !currentUser) {
        return (
            <EmptyState 
                icon={<MessagesSquare className="h-12 w-12" />}
                title="No Community Selected"
                description="Discussions will be shown here once a community is selected."
            />
        );
    }
    
    const handleDiscussionCreated = (discussionId: string) => {
        setCreateModalOpen(false);
        navigate(`/community/${currentCommunity.slug}/discussion/${discussionId}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Discussions</h2>
                {isMember && (
                    <Button onClick={() => setCreateModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Start Discussion
                    </Button>
                )}
            </div>
            
            {/* These components are self-sufficient and only need the communityId */}
            <PinnedDiscussions communityId={currentCommunity.id} />
            <DiscussionList communityId={currentCommunity.id} />

            {/* The modal is rendered here and controlled by local state */}
            {isCreateModalOpen && (
                <CreateDiscussionModal
                    communityId={currentCommunity.id}
                    userId={currentUser.uid}
                    onSuccess={handleDiscussionCreated}
                />
            )}
        </div>
    );
};

export default CommunityDiscussions; 