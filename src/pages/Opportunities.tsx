import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Calendar, MapPin, Plus, Send } from 'lucide-react';
import { authService } from '@/services/auth';
import { opportunitiesService } from '@/services/opportunities';
import { toast } from '@/hooks/use-toast';

const Opportunities = () => {
  const navigate = useNavigate();
  const opportunities = opportunitiesService.getOpportunities();
  const currentUser = authService.getCurrentUser();
  const isAlumni = currentUser?.type === 'alumni';

  const handleApply = (opportunityId: string) => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to apply for opportunities",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    opportunitiesService.applyForOpportunity(opportunityId, currentUser.id);
    toast({
      title: "Application Submitted",
      description: "Your application has been submitted successfully"
    });
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'internship':
        return 'secondary';
      case 'full-time':
        return 'default';
      case 'part-time':
        return 'outline';
      case 'contract':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div>
      <div className="container mx-auto px-4 py-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Opportunities</h1>
          {isAlumni && (
            <Button onClick={() => navigate('/opportunities/create')}>
              <Plus className="mr-2" />
              Post Opportunity
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.length > 0 ? (
            opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{opportunity.title}</CardTitle>
                    <Badge variant={getBadgeVariant(opportunity.type)}>
                      {opportunity.type}
                    </Badge>
                  </div>
                  <CardDescription>{opportunity.company}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{opportunity.description}</p>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      {opportunity.location}
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="mt-auto">
                  {!isAlumni && (
                    <Button 
                      onClick={() => handleApply(opportunity.id)}
                      className="w-full"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Apply Now
                    </Button>
                  )}
                  {isAlumni && opportunity.createdBy === currentUser?.email && (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/opportunities/edit/${opportunity.id}`)}
                      className="w-full"
                    >
                      Edit Opportunity
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No opportunities found</h3>
              {isAlumni && (
                <p className="text-muted-foreground mt-1">Post an opportunity to help students connect with your company.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Opportunities;
