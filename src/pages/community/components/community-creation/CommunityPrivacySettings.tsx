// CommunityPrivacySettings.tsx
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Lock, Globe } from 'lucide-react';
import { VisibilityLevel } from '../../types/common.types';
import { JoinApprovalType } from '../../types/community.types';

interface CommunityPrivacySettingsProps {
  visibility: VisibilityLevel;
  setVisibility: (visibility: VisibilityLevel) => void;
  joinApproval: JoinApprovalType;
  setJoinApproval: (joinApproval: JoinApprovalType) => void;
}

export const CommunityPrivacySettings: React.FC<CommunityPrivacySettingsProps> = ({
  visibility,
  setVisibility,
  joinApproval,
  setJoinApproval,
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe size={20} /> Community Visibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={visibility} onValueChange={(value) => setVisibility(value as VisibilityLevel)}>
            <div className="flex items-start space-x-4 p-4 rounded-md hover:bg-muted/50">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public" className="w-full">
                <span className="font-semibold">Public</span>
                <p className="text-sm text-muted-foreground">Anyone can find this community, view its content, and see its members.</p>
              </Label>
            </div>
            <div className="flex items-start space-x-4 p-4 rounded-md hover:bg-muted/50">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="w-full">
                <span className="font-semibold">Private</span>
                <p className="text-sm text-muted-foreground">Only invited members can find this community and see its content and members.</p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} /> Join Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={joinApproval} onValueChange={(value) => setJoinApproval(value as JoinApprovalType)}>
            <div className="flex items-start space-x-4 p-4 rounded-md hover:bg-muted/50">
              <RadioGroupItem value="open" id="open" />
              <Label htmlFor="open" className="w-full">
                <span className="font-semibold">Open</span>
                <p className="text-sm text-muted-foreground">Anyone can join instantly. Best for large, public communities.</p>
              </Label>
            </div>
            <div className="flex items-start space-x-4 p-4 rounded-md hover:bg-muted/50">
              <RadioGroupItem value="approval_required" id="approval" />
              <Label htmlFor="approval" className="w-full">
                <span className="font-semibold">Approval Required</span>
                <p className="text-sm text-muted-foreground">Members must request to join, and an admin or moderator must approve them.</p>
              </Label>
            </div>
            <div className="flex items-start space-x-4 p-4 rounded-md hover:bg-muted/50">
              <RadioGroupItem value="invite_only" id="invite" />
              <Label htmlFor="invite" className="w-full">
                <span className="font-semibold">Invite Only</span>
                <p className="text-sm text-muted-foreground">Only users who receive an invitation can join. The community won't appear in search results.</p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
};
