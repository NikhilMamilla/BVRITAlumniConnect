// EmptyState.tsx
// Placeholder for EmptyState component

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <section
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg border-2 border-dashed border-border animate-fade-in',
        className
      )}
      aria-live="polite"
      tabIndex={-1}
      role="status"
    >
      <div className="text-muted-foreground mb-4 animate-bounce-slow" aria-hidden="true">{icon}</div>
      <h3 className="text-xl font-semibold text-foreground" tabIndex={0}>{title}</h3>
      <p className="mt-1 text-muted-foreground" tabIndex={0}>{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
};

// Add animation to global CSS if not present:
// .animate-fade-in { animation: fadeIn 0.5s ease; }
// .animate-bounce-slow { animation: bounce 2s infinite; } 