// CreateCommunityModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreateCommunityForm } from './CreateCommunityForm';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CreateCommunityModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSuccess = (communityId: string) => {
    setIsOpen(false);
    navigate(`/community/${communityId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Community
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-2xl rounded-2xl border-0 p-0 overflow-hidden">
        <div className="max-h-[80vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-700">Create a New Community</DialogTitle>
            <DialogDescription className="text-base text-gray-600 mb-4">
              Start a new space for alumni and students to connect. Fill out the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <CreateCommunityForm onSuccess={handleSuccess} onCancel={() => setIsOpen(false)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};