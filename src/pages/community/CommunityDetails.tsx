// CommunityDetails.tsx
// Placeholder for CommunityDetails main page

import React from 'react';
import { useParams, Outlet, NavLink } from 'react-router-dom';
import { CommunityProvider, useCommunityContext } from './contexts/CommunityContext';
import { CommunityHeader } from './components/common/CommunityHeader';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Rss, Users, MessageSquare, Calendar, Folder, Settings, Shield } from 'lucide-react';
import { CommunityService } from './services/communityService';
import { cn } from '@/lib/utils';
import styles from './styles/community.module.css';
import { ScrollArea } from '@/components/ui/scroll-area';

const CommunityDetailsLayout: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [isSidebarOpen, setSidebarOpen] = React.useState(false);
    const [communityId, setCommunityId] = React.useState<string | null>(null);
    const [isLoadingId, setIsLoadingId] = React.useState(true);
    const [errorId, setErrorId] = React.useState<string | null>(null);

    const { 
        setCurrentCommunityId, 
        currentCommunity, 
        loadingCommunity, 
        communityError,
        isModerator,
        isAdmin
    } = useCommunityContext();

    // Effect to resolve slug to an ID
    React.useEffect(() => {
        const resolveSlug = async () => {
            if (!slug) {
                setIsLoadingId(false);
                return;
            };
            setIsLoadingId(true);
            setErrorId(null);
            try {
                const community = await CommunityService.getInstance().getCommunityBySlug(slug);
                if (community) {
                    setCommunityId(community.id);
                } else {
                    setErrorId("Community not found.");
                }
            } catch (err) {
                setErrorId("Failed to fetch community.");
            } finally {
                setIsLoadingId(false);
            }
        };
        resolveSlug();
    }, [slug]);

    // Effect to set the resolved ID in the context
    React.useEffect(() => {
        if (communityId) {
            setCurrentCommunityId(communityId);
        }
        // Clean up when component unmounts or ID changes
        return () => setCurrentCommunityId(null);
    }, [communityId, setCurrentCommunityId]);

    if (isLoadingId || loadingCommunity) {
        return <div className="flex justify-center items-center h-screen"><LoadingSpinner size={48} /></div>;
    }

    if (errorId || communityError || !currentCommunity) {
        return (
            <div className="container mx-auto p-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {errorId || communityError?.message || "Could not load the community."}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const navLinkClass = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
    const activeNavLinkClass = "bg-primary/10 text-primary font-semibold";
    const inactiveNavLinkClass = "text-muted-foreground hover:bg-muted/50 hover:text-foreground";
    
    const canViewAdminFeatures = isModerator || isAdmin;

    const SidebarNav = () => (
        <nav className="space-y-1 p-2">
            <NavLink to="discussions" className={({ isActive }) => cn(navLinkClass, isActive ? activeNavLinkClass : inactiveNavLinkClass)}>
                <Rss className="h-5 w-5" /> Discussions
            </NavLink>
            <NavLink to="chat" className={({ isActive }) => cn(navLinkClass, isActive ? activeNavLinkClass : inactiveNavLinkClass)}>
                <MessageSquare className="h-5 w-5" /> Chat
            </NavLink>
            <NavLink to="members" className={({ isActive }) => cn(navLinkClass, isActive ? activeNavLinkClass : inactiveNavLinkClass)}>
                <Users className="h-5 w-5" /> Members
            </NavLink>
            <NavLink to="events" className={({ isActive }) => cn(navLinkClass, isActive ? activeNavLinkClass : inactiveNavLinkClass)}>
                <Calendar className="h-5 w-5" /> Events
            </NavLink>
            <NavLink to="resources" className={({ isActive }) => cn(navLinkClass, isActive ? activeNavLinkClass : inactiveNavLinkClass)}>
                <Folder className="h-5 w-5" /> Resources
            </NavLink>
            {canViewAdminFeatures && (
                <>
                    <div className="pt-4 mt-4 border-t">
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</h3>
                    </div>
                    <NavLink to="settings" className={({ isActive }) => cn(navLinkClass, isActive ? activeNavLinkClass : inactiveNavLinkClass)}>
                        <Settings className="h-5 w-5" /> Settings
                    </NavLink>
                    <NavLink to="analytics" className={({ isActive }) => cn(navLinkClass, isActive ? activeNavLinkClass : inactiveNavLinkClass)}>
                        <Shield className="h-5 w-5" /> Analytics
                    </NavLink>
                </>
            )}
        </nav>
    );

    return (
        <div className={styles.communityContainer}>
            <CommunityHeader onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
            <div className="container mx-auto flex flex-col lg:flex-row gap-8 px-4 py-6">
                {isSidebarOpen && (
                    <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
                )}
                <aside className={styles.communitySidebar + ' hidden lg:block lg:w-64 lg:flex-shrink-0'}>
                    <SidebarNav />
                </aside>
                <main className={styles.communityMain}>
                    <ScrollArea className="h-full w-full">
                        {currentCommunity && <Outlet />}
                    </ScrollArea>
                </main>
            </div>
        </div>
    );
}

const CommunityDetailsPage: React.FC = () => (
    <CommunityProvider>
        <CommunityDetailsLayout />
    </CommunityProvider>
);

export default CommunityDetailsPage; 