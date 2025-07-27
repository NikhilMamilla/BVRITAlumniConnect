import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Briefcase, User, Save, Users, FileText, Paperclip } from 'lucide-react';
import { authService } from '@/services/auth';
import { eventsService } from '@/services/events';
import { opportunitiesService } from '@/services/opportunities';
import { alumniService } from '@/services/alumni';
import { findMatchingAlumni } from '@/components/Chatbot/chatbotUtils';
import AlumniCard from '@/components/AlumniCard';
import { toast } from '@/hooks/use-toast';

const ProfileContent = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  // This should not happen if Profile parent handles loading/auth state correctly
  if (!currentUser) {
    return <div>Loading user profile...</div>;
  }
  
  // Generate user identifier - either roll number or first 10 chars of email
  const userIdentifier = currentUser.type === 'student' 
    ? (currentUser.rollNumber || currentUser.email.substring(0, 10)) 
    : (currentUser.position || '');
  
  // Set initial state based on user data
  const [userData, setUserData] = useState({
    name: currentUser.name || '',
    email: currentUser.email || '',
    bio: currentUser.bio || '',
    interests: Array.isArray(currentUser.interests) 
      ? currentUser.interests.join(', ') 
      : (currentUser.interests || ''),
    skills: Array.isArray(currentUser.skills) 
      ? currentUser.skills.join(', ') 
      : (currentUser.skills || ''),
    enrollmentYear: currentUser.enrollmentYear || '',
    branch: currentUser.branch || '',
    graduationYear: currentUser.graduationYear || '',
    company: currentUser.company || '',
    position: currentUser.position || '',
    resumeFile: null,
    resumeUrl: currentUser.resumeUrl || '',
  });
  
  // State for alumni recommendations
  const [recommendedAlumni, setRecommendedAlumni] = useState([]);
  
  // Generate alumni recommendations based on user profile
  useEffect(() => {
    if (currentUser.type === 'student') {
      const userProfile = {
        interests: Array.isArray(currentUser.interests) 
          ? currentUser.interests 
          : (currentUser.interests || '').split(',').map(item => item.trim()).filter(item => item),
        skills: Array.isArray(currentUser.skills) 
          ? currentUser.skills 
          : (currentUser.skills || '').split(',').map(item => item.trim()).filter(item => item)
      };
      
      // Use the findMatchingAlumni utility from chatbotUtils
      const matchingAlumni = findMatchingAlumni(userProfile);
      setRecommendedAlumni(matchingAlumni);
    }
  }, [currentUser]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // In a real app, you would upload this file to a storage service
      // For now, we'll just store the file object and generate a local URL
      setUserData(prev => ({ 
        ...prev, 
        resumeFile: file,
        resumeUrl: URL.createObjectURL(file)
      }));
      
      toast({
        title: "Resume Selected",
        description: `File "${file.name}" selected. Click Save Changes to update your profile.`,
      });
    }
  };
  
  // Handle save changes
  const handleSave = () => {
    const updatedUser = {
      ...currentUser,
      name: userData.name,
      bio: userData.bio,
      interests: userData.interests.split(',').map(item => item.trim()),
      skills: userData.skills.split(',').map(item => item.trim()),
      resumeUrl: userData.resumeUrl,
      // Type-specific fields will be included based on user type
      ...(currentUser.type === 'student' ? {
        enrollmentYear: userData.enrollmentYear,
        branch: userData.branch,
      } : {
        graduationYear: userData.graduationYear,
        company: userData.company,
        position: userData.position,
      })
    };
    
    // Save to localStorage (in a real app, this would be an API call)
    localStorage.setItem('current_user', JSON.stringify(updatedUser));
    
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully.",
    });
  };
  
  // Get registered events for student
  const registeredEvents = currentUser.type === 'student'
    ? eventsService.getEvents().filter(event => 
        event.registeredUsers && event.registeredUsers.includes(currentUser.id)
      )
    : [];
  
  // Get applied opportunities for student
  const appliedOpportunities = currentUser.type === 'student'
    ? opportunitiesService.getOpportunities().filter(opp => 
        opp.applicants && opp.applicants.includes(currentUser.id)
      )
    : [];
  
  // Determine which tab to show based on route parameter
  let defaultTab = 'profile';
  if (section === 'registered-events') defaultTab = 'events';
  if (section === 'applied-opportunities') defaultTab = 'opportunities';
  if (section === 'recommended-alumni') defaultTab = 'recommended';
  
  return (
    <div>
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile Details
            </TabsTrigger>
            
            {currentUser.type === 'student' && (
              <>
                <TabsTrigger 
                  value="events" 
                  onClick={() => navigate('/profile/registered-events')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Registered Events
                </TabsTrigger>
                <TabsTrigger 
                  value="opportunities" 
                  onClick={() => navigate('/profile/applied-opportunities')}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  Applied Opportunities
                </TabsTrigger>
                <TabsTrigger 
                  value="recommended" 
                  onClick={() => navigate('/profile/recommended-alumni')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Recommended Alumni
                </TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={userData.name} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      value={userData.email} 
                      disabled 
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>
                
                {currentUser.type === 'student' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rollNumber">Roll Number/ID</Label>
                      <Input 
                        id="rollNumber" 
                        name="rollNumber" 
                        value={userIdentifier} 
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">ID cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enrollmentYear">Enrollment Year</Label>
                      <Input 
                        id="enrollmentYear" 
                        name="enrollmentYear" 
                        value={userData.enrollmentYear} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input 
                        id="branch" 
                        name="branch" 
                        value={userData.branch} 
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input 
                        id="position" 
                        name="position" 
                        value={userData.position} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">Graduation Year</Label>
                      <Input 
                        id="graduationYear" 
                        name="graduationYear" 
                        value={userData.graduationYear} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input 
                        id="company" 
                        name="company" 
                        value={userData.company} 
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="interests">Interests</Label>
                  <Input 
                    id="interests" 
                    name="interests" 
                    value={userData.interests} 
                    onChange={handleChange}
                    placeholder="Separate with commas"
                  />
                  <p className="text-xs text-muted-foreground">Separate interests with commas</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <Input 
                    id="skills" 
                    name="skills" 
                    value={userData.skills} 
                    onChange={handleChange}
                    placeholder="Separate with commas (e.g. JavaScript, React, Python)"
                  />
                  <p className="text-xs text-muted-foreground">Separate skills with commas</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    name="bio" 
                    value={userData.bio} 
                    onChange={handleChange}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="resume">Resume</Label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => document.getElementById('resume-upload')?.click()} type="button">
                      <Paperclip className="mr-2 h-4 w-4" />
                      {userData.resumeUrl ? 'Change Resume' : 'Attach Resume'}
                    </Button>
                    <Input
                      id="resume-upload"
                      name="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {userData.resumeUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={userData.resumeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Resume
                        </a>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Upload your resume (PDF, DOC, or DOCX)</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Registered Events</CardTitle>
                <CardDescription>
                  Events you have registered for
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registeredEvents.length > 0 ? (
                  <div className="grid gap-4">
                    {registeredEvents.map(event => (
                      <div key={event.id} className="border rounded-md p-4">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm mt-2">{event.location}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">You have not registered for any events yet.</p>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => navigate('/events')}>
                  Browse Events
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle>Applied Opportunities</CardTitle>
                <CardDescription>
                  Opportunities you have applied for
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appliedOpportunities.length > 0 ? (
                  <div className="grid gap-4">
                    {appliedOpportunities.map(opp => (
                      <div key={opp.id} className="border rounded-md p-4">
                        <div className="font-medium">{opp.title}</div>
                        <div className="text-sm text-muted-foreground">{opp.company}</div>
                        <div className="text-sm mt-2">
                          Application deadline: {new Date(opp.deadline).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">You have not applied for any opportunities yet.</p>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => navigate('/opportunities')}>
                  Browse Opportunities
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommended">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Alumni</CardTitle>
                <CardDescription>
                  Alumni who match your interests and might be good connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendedAlumni.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendedAlumni.map(alumni => (
                      <AlumniCard key={alumni.id} alumni={alumni} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-2">No alumni recommendations yet.</p>
                    <p className="text-sm">Try adding more interests to your profile to get personalized recommendations.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => navigate('/alumni')}>
                  Browse All Alumni
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  if (isAuthenticated === null) {
    // Render a loading state while checking auth
    return (
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-8">Loading Profile...</h1>
      </div>
    );
  }

  return <ProfileContent />;
};

export default Profile;
