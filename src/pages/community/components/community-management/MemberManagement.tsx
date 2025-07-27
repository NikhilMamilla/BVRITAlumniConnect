// MemberManagement.tsx
// Placeholder for MemberManagement component

import React, { useState, useEffect, useMemo } from 'react';
import { MemberService } from '../../services/memberService';
import { DetailedCommunityMember } from '../../types/member.types';
import { CommunityRole, MemberStatus } from '../../types/community.types';
import MemberCard from './MemberCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '@/components/ui/button';

interface MemberManagementProps {
  communityId: string;
}

const memberService = MemberService.getInstance();

const MemberManagement: React.FC<MemberManagementProps> = ({ communityId }) => {
  const [allMembers, setAllMembers] = useState<DetailedCommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<CommunityRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  useEffect(() => {
    setLoading(true);
    // Subscription is now simpler: it fetches ALL members. Filtering is done client-side.
    const unsubscribe = memberService.subscribeToMembers(
      communityId,
      {}, // No filters, get all members
      (newMembers) => {
        setAllMembers(newMembers);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load members:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [communityId]);

  const filteredMembers = useMemo(() => {
    return allMembers.filter(member => {
      const roleMatch = roleFilter === 'all' || member.role === roleFilter;
      const statusMatch = statusFilter === 'all' || member.status === statusFilter;
      const searchMatch = !debouncedSearchTerm ||
        (member.userDetails?.name?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
        (member.userDetails?.email?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase());
      return roleMatch && statusMatch && searchMatch;
    });
  }, [allMembers, roleFilter, statusFilter, debouncedSearchTerm]);

  const clearFilters = () => {
    setRoleFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Member Management</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
          <Input 
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
        <Select onValueChange={(value: CommunityRole | 'all') => setRoleFilter(value)} value={roleFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="member">Member</SelectItem>
            </SelectContent>
        </Select>
        <Select onValueChange={(value: MemberStatus | 'all') => setStatusFilter(value)} value={statusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
        </Select>
        <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
      </div>
      {loading ? (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
      {!loading && filteredMembers.length === 0 && <p>No members found.</p>}
    </div>
  );
};

export default MemberManagement; 