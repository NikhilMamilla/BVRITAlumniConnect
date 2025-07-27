// CommunityHeader.tsx
// Placeholder for CommunityHeader component

import React, { useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/AuthContext';
import { Menu, Search, LogOut, Settings, UserCircle, Bell } from 'lucide-react';
import { CommunityBreadcrumb } from './CommunityBreadcrumb';
import { useCommunitySearch } from '../../hooks/useCommunitySearch';
import { useNotifications } from '../../hooks/useNotifications';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import styles from '../../styles/community.module.css';

interface CommunityHeaderProps {
  onMenuClick: () => void;
}

const UserNav: React.FC = () => {
    const { currentUser, logout } = useAuth();
  
    if (!currentUser) return null;
  
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser.photoURL || ''} alt={currentUser.displayName || 'User'} />
              <AvatarFallback>{currentUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{currentUser.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <NavLink to="/profile"><UserCircle className="mr-2 h-4 w-4" />Profile</NavLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <NavLink to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</NavLink>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  
const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center rounded-full bg-destructive text-xs text-white px-1.5 py-0.5 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={markAllAsRead} className="text-xs p-0 h-auto">Mark all as read</Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-muted-foreground text-sm text-center">No notifications yet.</div>
          ) : notifications.map((n) => (
            <DropdownMenuItem key={n.id} className={cn('flex flex-col gap-1 items-start whitespace-normal', !n.readAt && 'bg-muted/50')}>
                <p className="font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const { communities, communitiesLoading, searchCommunities } = useCommunitySearch();
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowResults(true);
    if (newQuery) {
        searchCommunities(newQuery);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowResults(false), 200); // Delay to allow click
  };

  return (
    <div className="relative w-full sm:w-auto">
      <form className="ml-auto flex-1 sm:flex-initial" onSubmit={(e) => e.preventDefault()}>
        <Input
            ref={inputRef}
            type="search"
            placeholder="Search communities..."
            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            value={query}
            onChange={handleInput}
            onFocus={() => setShowResults(true)}
            onBlur={handleBlur}
            aria-label="Global search"
        />
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      </form>
      {showResults && query && (
        <div className="absolute z-50 mt-2 w-full bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="font-semibold text-xs text-muted-foreground mb-1 px-2">Communities</div>
            {communitiesLoading ? (
                 <div className="p-2 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
            ): communities.length === 0 ? (
                <div className="text-xs text-muted-foreground p-2">No results found for "{query}".</div>
            ) : communities.map(c => (
                <div key={c.id} className="p-2 hover:bg-muted rounded cursor-pointer text-sm">
                    {c.name}
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({ onMenuClick }) => {
  return (
    <header className={styles.communityHeader}>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Open sidebar">
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
      <div className={styles.communityHeaderContent}>
        <CommunityBreadcrumb className={styles.communityBreadcrumb} />
        <div className="flex w-full items-center gap-2 md:ml-auto">
          <GlobalSearch />
          <NotificationBell />
          <UserNav />
        </div>
      </div>
    </header>
  );
}; 