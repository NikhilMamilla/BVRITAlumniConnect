// LiveEventStream.tsx
// Placeholder for LiveEventStream component

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommunityEvent } from '../../types/event.types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Video } from 'lucide-react';

interface LiveEventStreamProps {
  event: CommunityEvent;
}

const LiveEventStream: React.FC<LiveEventStreamProps> = ({ event }) => {
  if (!event.liveStream || !event.liveStream.isLive) {
    return (
      <Alert>
        <Video className="h-4 w-4" />
        <AlertTitle>Event Not Live</AlertTitle>
        <AlertDescription>
          The live stream for this event has not started yet or has already ended.
        </AlertDescription>
      </Alert>
    );
  }

  const { platform, streamUrl } = event.liveStream;

  // Basic embed for YouTube. This can be expanded for other platforms.
  const getEmbedUrl = (url: string) => {
    if (platform === 'youtube') {
      const videoId = url.split('v=')[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // For other platforms, we might need different logic or a library.
    return url;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Stream</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-w-16 aspect-h-9">
          <iframe
            src={getEmbedUrl(streamUrl)}
            title="Live Stream"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveEventStream; 