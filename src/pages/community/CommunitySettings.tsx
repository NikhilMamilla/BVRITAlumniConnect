// CommunitySettings.tsx
// Placeholder for CommunitySettings main page

import React, { useState } from 'react';
import { useCommunityContext } from './contexts/CommunityContext';
import { useAuth } from '@/AuthContext';
import CommunitySettingsComponent from './components/community-management/CommunitySettings';
import CommunityRoles from './components/community-management/CommunityRoles';
import DeleteCommunityModal from './components/community-management/DeleteCommunityModal';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { EmptyState } from './components/common/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import formStyles from './styles/forms.module.css';
import styles from './styles/community.module.css';

const CommunitySettingsPage: React.FC = () => {
    const { 
        currentCommunity, 
        loadingCommunity, 
        isAdmin, 
        isOwner,
        members,
        updateCommunity,
        deleteCommunity
    } = useCommunityContext();
    const { currentUser } = useAuth();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    
    // Only owners and admins can view this page
    if (!isAdmin && !isOwner) {
        return (
            <EmptyState
                icon={<ShieldAlert className="h-12 w-12 text-destructive" />}
                title="Access Denied"
                description="You do not have permission to view this page."
            />
        );
    }

    if (loadingCommunity) {
        return <div className={formStyles.form}><LoadingSpinner /></div>;
    }

    if (!currentCommunity || !currentUser) {
        return (
            <EmptyState 
                icon={<Settings className="h-12 w-12" />}
                title="No Community Selected"
                description="Settings will be available once a community is selected."
            />
        );
    }
    
    return (
        <div className={styles.communityContainer}>
            <div className="container mx-auto p-8">
                <CommunitySettingsComponent communityId={currentCommunity.id} />
                <CommunityRoles />
                <button className="mt-6 text-destructive underline" onClick={() => setDeleteModalOpen(true)}>
                  Delete Community
                </button>
                <DeleteCommunityModal 
                  isOpen={isDeleteModalOpen}
                  onClose={() => setDeleteModalOpen(false)}
                  communityId={currentCommunity.id}
                  communityName={currentCommunity.name}
                />
            </div>
        </div>
    );
};

export default CommunitySettingsPage; 