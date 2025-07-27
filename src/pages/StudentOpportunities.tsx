import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Calendar,
  Building2,
  Users,
  ChevronDown,
  AlertCircle,
  UserCheck,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from '@/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp, 
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const StudentOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [formError, setFormError] = useState('');
  const [viewOpportunity, setViewOpportunity] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({
    opportunityId: null,
    message: '',
    resume: ''
  });
  
  // Direct Firebase Auth instead of AuthContext
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  const { toast } = useToast(); // For showing notifications
  
  // Status badge styles map
  const statusStyles = {
    'pending': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    'reviewing': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    'accepted': 'bg-green-100 text-green-800 hover:bg-green-200',
    'rejected': 'bg-red-100 text-red-800 hover:bg-red-200',
    'interview': 'bg-purple-100 text-purple-800 hover:bg-purple-200'
  };
  
  // Status icon map
  const statusIcons = {
    'pending': <Clock className="h-4 w-4 mr-1" />,
    'reviewing': <FileText className="h-4 w-4 mr-1" />,
    'accepted': <CheckCircle className="h-4 w-4 mr-1" />,
    'rejected': <XCircle className="h-4 w-4 mr-1" />,
    'interview': <Users className="h-4 w-4 mr-1" />
  };
  
  // Fetch opportunities from Firestore with real-time updates
  useEffect(() => {
    const fetchOpportunities = () => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, "opportunities"), 
          orderBy("createdAt", "desc")
        );
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const opportunitiesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setOpportunities(opportunitiesData);
          setIsLoading(false);
        }, (error) => {
          console.error("Error getting real-time updates: ", error);
          setIsLoading(false);
          toast({
            title: "Error",
            description: "Failed to load opportunities. Please refresh the page.",
            variant: "destructive"
          });
        });
        
        // Return the unsubscribe function to stop listening when component unmounts
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up opportunities listener: ", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to connect to the database. Please refresh the page.",
          variant: "destructive"
        });
      }
    };
    
    const unsubscribe = fetchOpportunities();
    
    // Clean up listener when component unmounts
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [toast]);
  
  // Fetch student's applications with real-time updates
  useEffect(() => {
    const fetchApplications = () => {
      if (!currentUser) return null;
      
      try {
        const q = query(
          collection(db, "applications"),
          where("studentId", "==", currentUser.uid),
          orderBy("appliedAt", "desc")
        );
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const applicationsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Enrich applications with opportunity details
          const opportunitiesWithDetails = await Promise.all(
            applicationsData.map(async (application: any) => {
              try {
                if (application.opportunityId) {
                  const opportunityRef = doc(db, "opportunities", application.opportunityId);
                  const opportunitySnap = await getDoc(opportunityRef);
                  if (opportunitySnap.exists()) {
                    return {
                      ...application,
                      opportunity: {
                        id: opportunitySnap.id,
                        ...opportunitySnap.data()
                      }
                    };
                  }
                }
                return { ...application, opportunity: null };
              } catch (error) {
                console.error(`Error getting opportunity ${application.opportunityId}:`, error);
                return { ...application, opportunity: null, error: true };
              }
            })
          );
          
          setApplications(opportunitiesWithDetails);
        }, (error) => {
          console.error("Error getting applications updates: ", error);
          toast({
            title: "Error",
            description: "Failed to load your applications. Please refresh the page.",
            variant: "destructive"
          });
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up applications listener: ", error);
        toast({
          title: "Error",
          description: "Failed to connect to the database. Please refresh the page.",
          variant: "destructive"
        });
      }
    };
    
    const unsubscribe = fetchApplications();
    
    // Clean up listener when component unmounts
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, toast]);
  
  // Handle application form input changes
  const handleApplicationInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData({
      ...applicationData,
      [name]: value
    });
  };
  
  // Submit application
  const handleSubmitApplication = async () => {
    // Check if user is authenticated
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for opportunities.",
        variant: "destructive"
      });
      return;
    }
    
    if (!applicationData.opportunityId) return;
    
    // Basic validation
    if (!applicationData.message.trim()) {
      setFormError('Please provide a message to the recruiter.');
      return;
    }
    
    try {
      // Check if already applied
      const existingApplicationsQuery = query(
        collection(db, "applications"),
        where("studentId", "==", currentUser.uid),
        where("opportunityId", "==", applicationData.opportunityId)
      );
      
      const existingApplications = await getDocs(existingApplicationsQuery);
      
      if (!existingApplications.empty) {
        setFormError('You have already applied for this opportunity.');
        return;
      }
      
      // Get opportunity details for reference
      const opportunityRef = doc(db, "opportunities", applicationData.opportunityId);
      const opportunitySnap = await getDoc(opportunityRef);
      
      if (!opportunitySnap.exists()) {
        setFormError('This opportunity no longer exists.');
        return;
      }
      
      const opportunityData = opportunitySnap.data();
      
      // Create an application document
      const applicationInfo = {
        opportunityId: applicationData.opportunityId,
        studentId: currentUser.uid,
        studentName: currentUser.displayName || 'Anonymous Student',
        studentEmail: currentUser.email,
        message: applicationData.message,
        resume: applicationData.resume,
        status: 'pending', // pending, reviewing, accepted, rejected, interview
        appliedAt: serverTimestamp(),
        // Get the opportunity owner's ID for permissions
        opportunityOwnerId: opportunityData.creatorId,
        companyName: opportunityData.company,
        jobTitle: opportunityData.title
      };
      
      await addDoc(collection(db, "applications"), applicationInfo);
      
      // Update the opportunity's application count
      await updateDoc(opportunityRef, {
        applications: (opportunityData.applications || 0) + 1
      });
      
      // Reset form and state
      setApplicationData({
        opportunityId: null,
        message: '',
        resume: ''
      });
      setIsApplying(false);
      setFormError('');
      
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error("Error applying for opportunity: ", error);
      setFormError('Failed to submit application. Please try again.');
    }
  };
  
  // Check if already applied to an opportunity
  const hasApplied = (opportunityId) => {
    return applications.some(app => app.opportunityId === opportunityId);
  };
  
  // Filter opportunities based on search term and filter type
  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = 
      opportunity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opportunity.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opportunity.description && opportunity.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by job type
    const matchesType = filterType === 'all' || opportunity.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'No deadline';
    
    try {
      // Handle both Firestore Timestamps and string dates
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : 
                  typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Check if deadline has passed
  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    
    try {
      const deadlineDate = deadline instanceof Timestamp ? deadline.toDate() : 
                         typeof deadline === 'string' ? new Date(deadline) : deadline;
      const today = new Date();
      return deadlineDate < today;
    } catch (error) {
      return false;
    }
  };

  // Show authentication status
  const renderAuthStatus = () => {
    if (!currentUser) {
      return (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are not signed in. Please sign in to apply for opportunities.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  // Capitalize first letter of status
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <Briefcase className="h-6 w-6 mr-2 text-blue-600" />
          Student Opportunities
        </h1>
        <p className="text-gray-600">
          Explore job and internship opportunities posted by BVRIT alumni and track your applications.
        </p>
        {renderAuthStatus()}
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="browse">Browse Opportunities</TabsTrigger>
          <TabsTrigger 
            value="applications" 
            onClick={() => {
              if (!currentUser) {
                toast({
                  title: "Authentication Required",
                  description: "Please sign in to view your applications.",
                  variant: "destructive"
                });
                setActiveTab("browse");
                return;
              }
            }}
          >
            My Applications
          </TabsTrigger>
        </TabsList>
        
        {/* Browse Opportunities Tab */}
        <TabsContent value="browse">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-grow gap-3">
                <div className="relative flex-grow">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search opportunities..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      {filterType === 'all' ? 'All Types' : filterType}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilterType('all')}>
                      All Types
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('Full-time')}>
                      Full-time
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('Part-time')}>
                      Part-time
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('Internship')}>
                      Internship
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('Contract')}>
                      Contract
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          {/* Opportunities List */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-6">
              Available Opportunities
            </h2>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading opportunities...</p>
              </div>
            ) : filteredOpportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredOpportunities.map((opportunity) => (
                  <div 
                    key={opportunity.id} 
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{opportunity.title}</h3>
                        <div className="flex items-center text-gray-600 mt-1">
                          <Building2 className="h-4 w-4 mr-1" />
                          <span>{opportunity.company}</span>
                          {opportunity.location && (
                            <span className="ml-2">• {opportunity.location}</span>
                          )}
                        </div>
                      </div>
                      <Badge className={`
                        ${opportunity.type === 'Full-time' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                          opportunity.type === 'Internship' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                          opportunity.type === 'Part-time' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                          'bg-orange-100 text-orange-800 hover:bg-orange-200'}
                      `}>
                        {opportunity.type}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {opportunity.description}
                    </p>
                    
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Deadline: {formatDate(opportunity.deadline)}</span>
                      {isDeadlinePassed(opportunity.deadline) && (
                        <Badge variant="outline" className="ml-2 text-red-500 border-red-200">
                          Expired
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{opportunity.applications || 0} applications</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <BookOpen className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{opportunity.title}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            <div className="flex items-center mb-3">
                              <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="font-medium">{opportunity.company}</span>
                              {opportunity.location && (
                                <span className="ml-2 text-gray-600">• {opportunity.location}</span>
                              )}
                            </div>
                            
                            <Badge className={`mb-4 ${
                              opportunity.type === 'Full-time' ? 'bg-green-100 text-green-800' : 
                                opportunity.type === 'Internship' ? 'bg-blue-100 text-blue-800' :
                                opportunity.type === 'Part-time' ? 'bg-purple-100 text-purple-800' :
                                'bg-orange-100 text-orange-800'
                            }`}>
                              {opportunity.type}
                            </Badge>
                            
                            <div className="mb-4">
                              <h4 className="font-medium mb-2">Description</h4>
                              <p className="text-gray-700 whitespace-pre-line">{opportunity.description}</p>
                            </div>
                            
                            {opportunity.requirements && (
                              <div className="mb-4">
                                <h4 className="font-medium mb-2">Requirements</h4>
                                <p className="text-gray-700 whitespace-pre-line">{opportunity.requirements}</p>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="font-medium mb-1">Posted By</h4>
                                <p className="text-gray-700">{opportunity.creatorName || 'Anonymous Alumni'}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-1">Deadline</h4>
                                <p className="text-gray-700">
                                  {formatDate(opportunity.deadline)}
                                  {isDeadlinePassed(opportunity.deadline) && (
                                    <span className="ml-2 text-red-500">(Expired)</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            
                            {(opportunity.applicationLink || opportunity.applicationEmail) && (
                              <div className="mb-4">
                                <h4 className="font-medium mb-2">External Application</h4>
                                {opportunity.applicationLink && (
                                  <p className="text-gray-700 mb-1">
                                    Application Link: <a href={opportunity.applicationLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                                      {opportunity.applicationLink}
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  </p>
                                )}
                                {opportunity.applicationEmail && (
                                  <p className="text-gray-700">
                                    Email: <a href={`mailto:${opportunity.applicationEmail}`} className="text-blue-600 hover:underline">{opportunity.applicationEmail}</a>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            {hasApplied(opportunity.id) ? (
                              <Button disabled className="bg-gray-200 text-gray-600 hover:bg-gray-200 cursor-not-allowed">
                                Already Applied
                              </Button>
                            ) : isDeadlinePassed(opportunity.deadline) ? (
                              <Button disabled className="bg-gray-200 text-gray-600 hover:bg-gray-200 cursor-not-allowed">
                                Deadline Passed
                              </Button>
                            ) : (
                              <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                  // Check if user is authenticated before allowing to apply
                                  if (!currentUser) {
                                    toast({
                                      title: "Authentication Required",
                                      description: "Please sign in to apply for this opportunity.",
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                  
                                  setApplicationData({
                                    ...applicationData,
                                    opportunityId: opportunity.id
                                  });
                                  setIsApplying(true);
                                }}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Apply Now
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <div>
                        {hasApplied(opportunity.id) ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Applied
                          </Badge>
                        ) : isDeadlinePassed(opportunity.deadline) ? (
                          <Badge variant="outline" className="text-red-500 border-red-200">
                            Expired
                          </Badge>
                        ) : (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => {
                              // Check if user is authenticated before allowing to apply
                              if (!currentUser) {
                                toast({
                                  title: "Authentication Required",
                                  description: "Please sign in to apply for this opportunity.",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              setApplicationData({
                                ...applicationData,
                                opportunityId: opportunity.id
                              });
                              setIsApplying(true);
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">No opportunities found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterType !== 'all' ? 
                    'Try adjusting your search or filters' : 
                    'No opportunities available at the moment'
                  }
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* My Applications Tab */}
        <TabsContent value="applications">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-6">
              My Applications
            </h2>
            
            {!currentUser ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">Authentication Required</h3>
                <p className="text-gray-500 mb-4">
                  Please sign in to view your applications.
                </p>
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-6">
                {applications.map((application) => (
                  <div 
                    key={application.id} 
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {application.opportunity?.title || application.jobTitle || 'Unknown Position'}
                        </h3>
                        <div className="flex items-center text-gray-600 mt-1">
                          <Building2 className="h-4 w-4 mr-1" />
                          <span>{application.opportunity?.company || application.companyName || 'Unknown Company'}</span>
                        </div>
                      </div>
                      <Badge className={statusStyles[application.status] || 'bg-gray-100 text-gray-800'}>
                        {statusIcons[application.status] || null}
                        {capitalizeFirstLetter(application.status || 'pending')}
                      </Badge>
                    </div>
                    
                    <div className="text-gray-500 text-sm mb-3">
                      Applied on: {formatDate(application.appliedAt)}
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-medium text-sm mb-1">Your Message</h4>
                      <p className="text-gray-700 text-sm">{application.message}</p>
                    </div>
                    
                    {application.resume && (
                      <div className="mb-3">
                        <h4 className="font-medium text-sm mb-1">Your Resume</h4>
                        <p className="text-gray-700 text-sm">{application.resume}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <BookOpen className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                          </DialogHeader>
                          
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {application.opportunity?.title || application.jobTitle || 'Unknown Position'}
                                </h3>
                                <div className="flex items-center text-gray-600 mt-1">
                                  <Building2 className="h-4 w-4 mr-1" />
                                  <span>{application.opportunity?.company || application.companyName || 'Unknown Company'}</span>
                                </div>
                              </div>
                              <Badge className={statusStyles[application.status] || 'bg-gray-100 text-gray-800'}>
                                {statusIcons[application.status] || null}
                                {capitalizeFirstLetter(application.status || 'pending')}
                              </Badge>
                            </div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="font-medium mb-1">Application Date</h4>
                                <p className="text-gray-700">{formatDate(application.appliedAt)}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-1">Status</h4>
                                <p className="text-gray-700 flex items-center">
                                  {statusIcons[application.status] || null}
                                  {capitalizeFirstLetter(application.status || 'pending')}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <h4 className="font-medium mb-1">Your Message</h4>
                              <p className="text-gray-700">{application.message}</p>
                            </div>
                            
                            {application.resume && (
                              <div className="mb-4">
                                <h4 className="font-medium mb-1">Your Resume</h4>
                                <p className="text-gray-700">{application.resume}</p>
                              </div>
                            )}
                            
                            {application.feedback && (
                              <div className="mb-4">
                                <h4 className="font-medium mb-1">Feedback</h4>
                                <p className="text-gray-700">{application.feedback}</p>
                              </div>
                            )}
                          </div>
                          
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Close</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      {application.status === 'rejected' && (
                        <Badge variant="outline" className="text-red-500 border-red-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">No applications yet</h3>
                <p className="text-gray-500 mb-4">
                  You haven't applied to any opportunities yet.
                </p>
                <Button 
                  onClick={() => setActiveTab("browse")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Browse Opportunities
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Application Dialog */}
      <Dialog open={isApplying} onOpenChange={setIsApplying}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Opportunity</DialogTitle>
          </DialogHeader>
          
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="message" className="mb-2">
                Message to Recruiter <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Introduce yourself and explain why you're a good fit for this role"
                className="h-32"
                value={applicationData.message}
                onChange={handleApplicationInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="resume" className="mb-2">
                Resume URL (optional)
              </Label>
              <Input
                id="resume"
                name="resume"
                placeholder="Link to your resume (Google Drive, OneDrive, etc.)"
                value={applicationData.resume}
                onChange={handleApplicationInputChange}
              />
            </div>
          </div>
          
          <DialogFooter className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={() => {
              setIsApplying(false);
              setFormError('');
            }}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmitApplication}>
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentOpportunities;