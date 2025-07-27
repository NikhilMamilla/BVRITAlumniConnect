// CommunityGuidelinesEditor.tsx
// Placeholder for CommunityGuidelinesEditor component

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CommunityGuidelinesEditorProps {
  guidelines: string;
  setGuidelines: (guidelines: string) => void;
}

export const CommunityGuidelinesEditor: React.FC<CommunityGuidelinesEditorProps> = ({ guidelines, setGuidelines }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="guidelines">Community Guidelines</Label>
      <Textarea
        id="guidelines"
        value={guidelines}
        onChange={(e) => setGuidelines(e.target.value)}
        placeholder="Set the rules and tone for your community. Be clear about what is and isn't allowed."
        rows={8}
        className="resize-y"
      />
      <p className="text-xs text-muted-foreground">
        Use Markdown for formatting. A good set of guidelines fosters a healthy community.
      </p>
    </div>
  );
}; 