// SwipeableCard.tsx
// Placeholder for SwipeableCard component

import React from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipe: () => void;
  className?: string;
}

const SWIPE_THRESHOLD = 50; // pixels

export default function SwipeableCard({ children, onSwipe, className }: SwipeableCardProps) {
  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe();
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className={className}
    >
      <Card>
        <CardContent className="p-4">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
} 