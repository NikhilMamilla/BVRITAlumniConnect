// CommunitySidebar.tsx
// Placeholder for CommunitySidebar component

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserCommunities } from '../../hooks/useUserCommunities';
import { useAuth } from '@/AuthContext';
import { CreateCommunityModal } from '../community-creation/CreateCommunityModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, Pin, PinOff, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineMembers } from '../../hooks/useOnlineMembers';
import { useCommunityMember } from '../../hooks/useCommunityMember';
import { UserService } from '@/services/user';
import { Alumni } from '@/types/alumni';
import { db } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface CommunitySidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
    to: string;
    children: React.ReactNode;
    onClick: () => void;
    isPinned?: boolean;
    onPin?: () => void;
    onUnpin?: () => void;
    unreadCount?: number;
    onlineMembers?: { photoURL?: string; displayName?: string; id: string }[];
}> = ({
    to,
    children,
    onClick,
    isPinned,
    onPin,
    onUnpin,
    unreadCount,
    onlineMembers = [],
}) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary',
                isActive && 'bg-primary/10 text-primary font-semibold'
            )
        }
        tabIndex={0}
        aria-current={undefined}
    >
        {children}
        {/* Unread badge */}
        {typeof unreadCount === 'number' && unreadCount > 0 && (
            <span className="ml-auto mr-2 inline-flex items-center justify-center rounded-full bg-destructive text-xs text-white px-2 py-0.5 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
            </span>
        )}
        {/* Online avatars */}
        {onlineMembers.length > 0 && (
            <span className="flex -space-x-2 ml-2">
                {onlineMembers.slice(0, 3).map((m) => (
                    <Avatar key={m.id} className="h-6 w-6 border-2 border-background -ml-1">
                        <AvatarImage src={m.photoURL} alt={m.displayName} />
                        <AvatarFallback>{m.displayName?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                ))}
                {onlineMembers.length > 3 && (
                    <span className="ml-1 text-xs text-muted-foreground">+{onlineMembers.length - 3}</span>
                )}
            </span>
        )}
        {/* Pin/unpin button */}
        {onPin && !isPinned && (
            <Button
                variant="ghost"
                size="icon"
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                tabIndex={-1}
                aria-label="Pin community"
                onClick={e => { e.preventDefault(); e.stopPropagation(); onPin(); }}
            >
                <Pin className="h-4 w-4" />
            </Button>
        )}
        {onUnpin && isPinned && (
            <Button
                variant="ghost"
                size="icon"
                className="ml-2 text-primary opacity-100"
                tabIndex={-1}
                aria-label="Unpin community"
                onClick={e => { e.preventDefault(); e.stopPropagation(); onUnpin(); }}
            >
                <PinOff className="h-4 w-4" />
            </Button>
        )}
    </NavLink>
);

const CommunityNavItem: React.FC<{
    community: any; // Using 'any' for simplicity, should be 'Community' type
    onLinkClick: () => void;
    isPinned: boolean;
    onPin: (id: string) => void;
    onUnpin: (id: string) => void;
}> = ({ community, onLinkClick, isPinned, onPin, onUnpin }) => {
    const { currentUser } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const { onlineMembers } = useOnlineMembers(community.id, 5);

    // Real-time unread count
    useEffect(() => {
        if (!currentUser) return;
        
        const memberId = `${currentUser.uid}_${community.id}`;
        const memberRef = doc(db, 'communityMembers', memberId);
        
        let lastSeen: number | null = null;
        
        const unsubMember = onSnapshot(memberRef, (snap) => {
            lastSeen = snap.exists() ? (snap.data().lastSeen?.toMillis?.() || 0) : 0;

            const messagesRef = doc(db, 'communities', community.id, 'meta', 'chat');
            const unsubMsg = onSnapshot(messagesRef, (metaSnap) => {
                const latestMsg = metaSnap.exists() ? metaSnap.data().latestMessageAt?.toMillis?.() || 0 : 0;
                setUnreadCount(latestMsg > lastSeen! ? 1 : 0); // Assuming 1 for simplicity
            });
            return unsubMsg;
        });

        return () => {
            unsubMember();
        };
    }, [community.id, currentUser]);
    
    const onlineAvatars = useMemo(() => onlineMembers.map(m => ({
        id: m.userId,
        photoURL: m.userDetails?.photoURL,
        displayName: m.userDetails?.displayName || m.userId,
    })), [onlineMembers]);

    return (
        <NavItem
            to={`/community/${community.slug || community.id}`}
            onClick={onLinkClick}
            isPinned={isPinned}
            onPin={() => onPin(community.id)}
            onUnpin={() => onUnpin(community.id)}
            unreadCount={unreadCount}
            onlineMembers={onlineAvatars}
        >
            <Avatar className="h-8 w-8">
                <AvatarImage src={community.avatar} alt={community.name} />
                <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate">{community.name}</span>
        </NavItem>
    );
};

const CommunityList: React.FC<{
    onLinkClick: () => void;
    pinnedCommunityIds: string[];
    onPin: (id: string) => void;
    onUnpin: (id: string) => void;
}> = ({ onLinkClick, pinnedCommunityIds, onPin, onUnpin }) => {
    const { communities, loading } = useUserCommunities();

    const sortedCommunities = useMemo(() => {
        const pinned = communities.filter(c => pinnedCommunityIds.includes(c.id));
        const unpinned = communities.filter(c => !pinnedCommunityIds.includes(c.id))
                                   .sort((a, b) => a.name.localeCompare(b.name));
        return [...pinned, ...unpinned];
    }, [communities, pinnedCommunityIds]);

    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <nav className="flex flex-col gap-1" aria-label="Joined communities">
            {sortedCommunities.map((community) => (
                <CommunityNavItem
                    key={community.id}
                    community={community}
                    onLinkClick={onLinkClick}
                    isPinned={pinnedCommunityIds.includes(community.id)}
                    onPin={onPin}
                    onUnpin={onUnpin}
                />
            ))}
        </nav>
    );
};

export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ isOpen, setIsOpen }) => {
    const { currentUser } = useAuth();
    const [user, setUser] = useState<Alumni | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // Real-time user doc for pinned communities
    useEffect(() => {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        const unsub = onSnapshot(userRef, (snap) => {
            setUser(snap.exists() ? ({ id: snap.id, ...snap.data() } as Alumni) : null);
            setLoadingUser(false);
        });
        return () => unsub();
    }, [currentUser]);

    const handlePin = useCallback(async (communityId: string) => {
        if (!currentUser) return;
        await UserService.pinCommunity(currentUser.uid, communityId);
    }, [currentUser]);

    const handleUnpin = useCallback(async (communityId: string) => {
        if (!currentUser) return;
        await UserService.unpinCommunity(currentUser.uid, communityId);
    }, [currentUser]);

    const handleLinkClick = () => setIsOpen(false);

    return (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
            aria-label="Sidebar"
        >
            <div className="flex h-full max-h-screen flex-col gap-4">
                <div className="flex h-16 items-center border-b px-4">
                    <Users className="h-6 w-6 mr-2" />
                    <h2 className="text-lg font-semibold">My Communities</h2>
                </div>
                <div className="flex-1 p-2">
                    <div className="mb-4">
                        <CreateCommunityModal />
                    </div>
                    <nav className="flex flex-col gap-2">
                        <NavItem to="/communities/discover" onClick={handleLinkClick}>
                            <Compass className="h-5 w-5" />
                            Discover
                        </NavItem>
                    </nav>
                    <hr className="my-4" />
                    <h3 className="px-3 text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                        Joined
                    </h3>
                    <ScrollArea className="flex-grow h-[calc(100%-12rem)]">
                        {loadingUser || !user ? (
                            <div className="space-y-2">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 px-3 py-2">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <CommunityList
                                onLinkClick={handleLinkClick}
                                pinnedCommunityIds={user.pinnedCommunityIds || []}
                                onPin={handlePin}
                                onUnpin={handleUnpin}
                            />
                        )}
                    </ScrollArea>
                </div>
            </div>
        </aside>
    );
}; 