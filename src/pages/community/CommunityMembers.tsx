// CommunityMembers.tsx
// Placeholder for CommunityMembers main page

import React, { useState, useMemo } from 'react';
import { useCommunityContext } from './contexts/CommunityContext';
import { useCommunityMembers } from './hooks/useCommunityMembers';
import { useDebounce } from './hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MemberCard from './components/community-management/MemberCard';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { EmptyState } from './components/common/EmptyState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Users } from 'lucide-react';
import { MemberSearchFilters } from './types/member.types';
import { CommunityRole } from './types/community.types';

interface MemberGridProps {
    communityId: string;
    filters: MemberSearchFilters;
}

const MemberGrid: React.FC<MemberGridProps> = ({ communityId, filters }) => {
    const { members, loading, error } = useCommunityMembers(communityId, { filters });

    if (loading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Members</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    if (members.length === 0) {
        return (
            <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No Members Found"
                description="No members match the current search or filters."
            />
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => (
                <MemberCard key={member.id} member={member} />
            ))}
        </div>
    );
};

const CommunityMembers: React.FC = () => {
    const { currentCommunity } = useCommunityContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<MemberSearchFilters>({});
    
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const queryFilters = useMemo(() => ({
        ...filters,
        name: debouncedSearchTerm
    }), [filters, debouncedSearchTerm]);

    const handleRoleFilterChange = (role: CommunityRole | 'all') => {
        setFilters(prev => {
            const newFilters = { ...prev };
            if (role === 'all') {
                delete newFilters.roles;
            } else {
                newFilters.roles = [role];
            }
            return newFilters;
        });
    };

    if (!currentCommunity) {
        return (
            <EmptyState 
                icon={<Users className="h-12 w-12" />}
                title="No Community Selected"
                description="Members will be shown here once a community is selected."
            />
        );
    }
    
    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold">Community Members</h2>
                <p className="text-muted-foreground">Browse and manage the members of this community.</p>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <Input 
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select onValueChange={handleRoleFilterChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="moderator">Moderators</SelectItem>
                        <SelectItem value="member">Members</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <MemberGrid communityId={currentCommunity.id} filters={queryFilters} />
        </div>
    );
};

export default CommunityMembers; 