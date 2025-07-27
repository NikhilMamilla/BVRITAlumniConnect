// CommunityBreadcrumb.tsx
// Placeholder for CommunityBreadcrumb component

import React, { useMemo } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home, Slash } from 'lucide-react';
import { useCommunity } from '../../hooks/useCommunity';
import { Skeleton } from '@/components/ui/skeleton';
import { useDiscussion } from '../../hooks/useDiscussion';
import { cn } from '@/lib/utils';

const breadcrumbNameMap: { [key: string]: string } = {
  'community': 'Community',
  'discover': 'Discover',
  'discussions': 'Discussions',
  'members': 'Members',
  'events': 'Events',
  'settings': 'Settings',
};

const CommunityName = ({ slug }: { slug: string }) => {
  const { community, loading } = useCommunity(slug);
  if (loading) return <Skeleton className="h-5 w-24" />;
  return <>{community?.name || slug}</>;
};

const DiscussionTitle = ({ discussionId }: { discussionId: string }) => {
  const { discussion, loading } = useDiscussion(discussionId);
  if (loading) return <Skeleton className="h-5 w-24" />;
  return <>{discussion?.title || discussionId}</>;
};

interface CommunityBreadcrumbProps {
  className?: string;
}

export const CommunityBreadcrumb: React.FC<CommunityBreadcrumbProps> = ({ className }) => {
  const location = useLocation();
  const params = useParams<{ communitySlug?: string; discussionId?: string }>();

  const pathnames = useMemo(() => location.pathname.split('/').filter((x) => x), [location.pathname]);

  if (pathnames.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className={cn("hidden md:flex", className)} aria-label="Breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" aria-label="Home"><Home className="h-4 w-4" /></Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          let breadcrumbContent: React.ReactNode = value;
          if (index === 1 && params.communitySlug) {
            breadcrumbContent = <CommunityName slug={params.communitySlug} />;
          } else if (index === 3 && params.discussionId) {
            breadcrumbContent = <DiscussionTitle discussionId={params.discussionId} />;
          } else {
            breadcrumbContent = breadcrumbNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);
          }

          if (value === 'community' && index === 0) return null;

          return (
            <React.Fragment key={to}>
              <BreadcrumbSeparator>
                <Slash />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="truncate max-w-48" aria-current="page">{breadcrumbContent}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={to} aria-label={typeof breadcrumbContent === 'string' ? breadcrumbContent : undefined}>{breadcrumbContent}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}; 