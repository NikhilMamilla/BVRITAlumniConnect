// CreateCommunity.tsx
// Placeholder for CreateCommunity main page

import React from 'react';
import { CreateCommunityForm } from './components/community-creation/CreateCommunityForm';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { EmptyState } from './components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CreateCommunityPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = (communityId: string) => {
    toast.success('Community created successfully!');
    navigate(`/community/${communityId}`); // Navigate to the new community's page
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };
  
  if (!currentUser) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
            <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-24">
                <EmptyState
                    title="Authentication Required"
                    description="You must be logged in to create a community."
                    icon={<PlusCircle className="h-12 w-12" />}
                    action={
                        <Button asChild>
                            <Link to="/login">Log In</Link>
                        </Button>
                    }
                />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-24 max-w-4xl">
          <header className="mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-3">
                  <PlusCircle className="h-10 w-10 text-primary" />
                  Create a New Community
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                  Build a space for people to connect and share.
              </p>
          </header>

          <Card>
              <CardHeader>
                  <CardTitle>Community Details</CardTitle>
                  <CardDescription>
                      Fill out the form below to set up your new community. You can change these details later.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <CreateCommunityForm
                      onSuccess={handleSuccess}
                      onCancel={handleCancel}
                  />
              </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default CreateCommunityPage; 