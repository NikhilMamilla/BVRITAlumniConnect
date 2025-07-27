// ModeratorPanel.tsx
// Placeholder for ModeratorPanel component

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MemberManagement from './MemberManagement';
import CommunitySettings from './CommunitySettings';
import CommunityAnalytics from './CommunityAnalytics';
import CommunityRoles from './CommunityRoles';

interface ModeratorPanelProps {
  communityId: string;
}

const ModeratorPanel: React.FC<ModeratorPanelProps> = ({ communityId }) => {
  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="roles">Roles</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      <TabsContent value="members">
        <MemberManagement communityId={communityId} />
      </TabsContent>
      <TabsContent value="roles">
        <CommunityRoles />
      </TabsContent>
      <TabsContent value="settings">
        <CommunitySettings communityId={communityId} />
      </TabsContent>
      <TabsContent value="analytics">
        <CommunityAnalytics communityId={communityId} />
      </TabsContent>
    </Tabs>
  );
};

export default ModeratorPanel; 