// CommunityChat.tsx
// Placeholder for CommunityChat main page

import React from 'react';
import { ChatProvider } from './contexts/ChatContext';
import { useCommunityContext } from './contexts/CommunityContext';
import ChatContainer from './components/chat/ChatContainer';
import { EmptyState } from './components/common/EmptyState';
import { MessageSquareOff } from 'lucide-react';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const CommunityChatPage: React.FC = () => {
    const { currentCommunity, loadingCommunity } = useCommunityContext();

    if (loadingCommunity) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
    }

    if (!currentCommunity) {
        return (
            <EmptyState
                icon={<MessageSquareOff className="h-12 w-12" />}
                title="No Community Selected"
                description="The chat interface will appear here once a community is selected."
            />
        );
    }
    
    return (
        <ChatProvider communityId={currentCommunity.id}>
            <div className="h-[calc(100vh-200px)]">
                <ChatContainer />
            </div>
        </ChatProvider>
    );
};

export default CommunityChatPage; 