// CommunityRoles.tsx
// Placeholder for CommunityRoles component

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

const roles = [
    {
        name: 'Owner',
        description: 'Has all permissions, including deleting the community.',
        details: 'The creator of the community. Full control over all settings, members, and content. Can transfer ownership.'
    },
    {
        name: 'Admin',
        description: 'Can manage all aspects of the community, including members and settings.',
        details: 'Can edit community settings, manage all members (except the owner), and moderate all content.'
    },
    {
        name: 'Moderator',
        description: 'Can manage members and content, but cannot change community settings.',
        details: 'Can kick/ban members (except admins/owner), delete messages, and manage discussion posts and resources.'
    },
    {
        name: 'Member',
        description: 'Can participate in discussions and events.',
        details: 'Standard member with permissions to post, comment, and participate in community activities.'
    }
]

const CommunityRoles: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Roles</CardTitle>
        <CardDescription>
            These are the roles available in your community and their permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {roles.map(role => (
                    <TableRow key={role.name}>
                        <TableCell className="font-semibold">
                            <div className="flex items-center gap-2">
                                <span>{role.name}</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{role.details}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </TableCell>
                        <TableCell>{role.description}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CommunityRoles; 