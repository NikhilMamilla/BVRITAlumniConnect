import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  PlusCircle,
  Calendar,
  Building2,
  Users,
  ChevronDown,
  AlertCircle,
  X,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
  increment
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const AlumniOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState('');
  const [viewMode, setViewMode] = useState('allOpportunities'); // 'myOpportunities' or 'allOpportunities'
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
  
  // New opportunity form state
  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    description: '',
    requirements: '',
    deadline: '',
    applicationLink: '',
    applicationEmail: ''
  });
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentOpportunityId, setCurrentOpportunityId] = useState(null);
  
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
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOpportunity({
      ...newOpportunity,
      [name]: value
    });
  };
  
  // Handle application form input changes
  const handleApplicationInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData({
      ...applicationData,
      [name]: value
    });
  };
  
  // Create new opportunity
  const handleCreateOpportunity = async () => {
    // Check if user is authenticated
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post opportunities.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate required fields
    if (!newOpportunity.title || !newOpportunity.company || !newOpportunity.description) {
      setFormError('Please fill out all required fields (Title, Company, and Description)');
      return;
    }
    
    try {
        const opportunityData = {
            ...newOpportunity,
            creatorId: currentUser.uid,
            creatorName: currentUser.displayName || 'Anonymous',
            creatorPhoto: currentUser.photoURL || '',
            applications: 0,
            active: true,
            createdAt: serverTimestamp(),
          };
      
      if (isEditMode && currentOpportunityId) {
        // Update existing opportunity
        await updateDoc(doc(db, "opportunities", currentOpportunityId), opportunityData);
        
        toast({
          title: "Success",
          description: "Your opportunity has been updated.",
          variant: "default"
        });
      } else {
        // Create new opportunity
        await addDoc(collection(db, "opportunities"), opportunityData);
        
        toast({
          title: "Success",
          description: "Your opportunity has been posted.",
          variant: "default"
        });
      }
      
      // Reset form
      setNewOpportunity({
        title: '',
        company: '',
        location: '',
        type: 'Full-time',
        description: '',
        requirements: '',
        deadline: '',
        applicationLink: '',
        applicationEmail: ''
      });
      setFormError('');
      setShowCreateForm(false);
      setIsEditMode(false);
      setCurrentOpportunityId(null);
    } catch (error) {
      console.error("Error creating opportunity: ", error);
      setFormError('Failed to save opportunity. Please try again.');
      toast({
        title: "Error",
        description: "Failed to save opportunity. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Edit opportunity
  const handleEdit = (opportunity) => {
    setNewOpportunity({
      title: opportunity.title,
      company: opportunity.company,
      location: opportunity.location || '',
      type: opportunity.type || 'Full-time',
      description: opportunity.description,
      requirements: opportunity.requirements || '',
      deadline: opportunity.deadline || '',
      applicationLink: opportunity.applicationLink || '',
      applicationEmail: opportunity.applicationEmail || ''
    });
    setIsEditMode(true);
    setCurrentOpportunityId(opportunity.id);
    setShowCreateForm(true);
  };
  
  // Delete opportunity
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteDoc(doc(db, "opportunities", deleteId));
      
      setShowDeleteConfirm(false);
      setDeleteId(null);
      
      toast({
        title: "Success",
        description: "Opportunity has been deleted.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error deleting opportunity: ", error);
      toast({
        title: "Error",
        description: "Failed to delete opportunity. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle applying for an opportunity
  const handleApply = async () => {
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
    
    try {
      // First, create an application document
      const applicationInfo = {
        opportunityId: applicationData.opportunityId,
        studentId: currentUser.uid,
        studentName: currentUser.displayName || 'Anonymous Student',
        studentEmail: currentUser.email,
        message: applicationData.message,
        resume: applicationData.resume,
        status: 'pending', // pending, accepted, rejected
        appliedAt: serverTimestamp(),
        // Get the opportunity owner's ID for permissions
        opportunityOwnerId: opportunities.find(opp => opp.id === applicationData.opportunityId)?.createdBy
      };
      
      await addDoc(collection(db, "applications"), applicationInfo);
      
      // Then, increment the applications counter on the opportunity
      const opportunityRef = doc(db, "opportunities", applicationData.opportunityId);
      await updateDoc(opportunityRef, {
        applications: increment(1)
      });
      
      // Reset form and state
      setApplicationData({
        opportunityId: null,
        message: '',
        resume: ''
      });
      setIsApplying(false);
      
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error("Error applying for opportunity: ", error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Check if user can edit an opportunity
  const canEditOpportunity = (opportunity) => {
    return currentUser && opportunity.createdBy === currentUser.uid;
  };
  
  // Filter opportunities based on search term, filter type, and view mode
  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = 
      opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opportunity.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opportunity.description && opportunity.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by job type
    const matchesType = filterType === 'all' || opportunity.type === filterType;
    
    // Filter by ownership (for "My Opportunities" view)
    const matchesOwnership = viewMode === 'allOpportunities' || 
      (viewMode === 'myOpportunities' && opportunity.createdBy === currentUser?.uid);
    
    return matchesSearch && matchesType && matchesOwnership;
  });
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'No deadline';
    
    try {
      // Handle both Firestore Timestamps and string dates
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Show authentication status
  const renderAuthStatus = () => {
    if (!currentUser) {
      return (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are not signed in. Some features may be limited.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <Briefcase className="h-6 w-6 mr-2 text-blue-600" />
          Opportunities Board
        </h1>
        <p className="text-gray-600">
          Create and manage opportunities for BVRIT students or browse opportunities posted by alumni.
        </p>
        {renderAuthStatus()}
      </div>
      
      {/* Action Bar */}
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
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              // Check if user is authenticated before opening form
              if (!currentUser) {
                toast({
                  title: "Authentication Required",
                  description: "Please sign in to post opportunities.",
                  variant: "destructive"
                });
                return;
              }
              
              setIsEditMode(false);
              setCurrentOpportunityId(null);
              setNewOpportunity({
                title: '',
                company: '',
                location: '',
                type: 'Full-time',
                description: '',
                requirements: '',
                deadline: '',
                applicationLink: '',
                applicationEmail: ''
              });
              setFormError('');
              setShowCreateForm(true);
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Post New Opportunity
          </Button>
        </div>
      </div>
      
      {/* View Toggle Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${viewMode === 'allOpportunities' 
            ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => setViewMode('allOpportunities')}
        >
          Browse All Opportunities
        </button>
        <button
          className={`px-4 py-2 ${viewMode === 'myOpportunities' 
            ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => {
            // Check if user is authenticated before switching to my opportunities
            if (!currentUser) {
              toast({
                title: "Authentication Required",
                description: "Please sign in to view your opportunities.",
                variant: "destructive"
              });
              return;
            }
            setViewMode('myOpportunities');
          }}
        >
          My Posted Opportunities
        </button>
      </div>
      
      {/* Opportunities List */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-6">
          {viewMode === 'myOpportunities' ? 'Your Posted Opportunities' : 'Browse All Opportunities'}
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
                </div>
                
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{opportunity.applications || 0} applications</span>
                </div>
                
                <div className="flex justify-between">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
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
                            <h4 className="font-medium mb-1">Applications</h4>
                            <p className="text-gray-700">{opportunity.applications || 0} students applied</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Deadline</h4>
                            <p className="text-gray-700">{formatDate(opportunity.deadline)}</p>
                          </div>
                        </div>
                        
                        {(opportunity.applicationLink || opportunity.applicationEmail) && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">How to Apply</h4>
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
                        {canEditOpportunity(opportunity) ? (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => handleEdit(opportunity)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                setDeleteId(opportunity.id);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </>
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
                  
                  <div className="flex space-x-2">
                    {canEditOpportunity(opportunity) ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(opportunity)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => {
                            setDeleteId(opportunity.id);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </>
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
                viewMode === 'myOpportunities' ? 
                  'You haven\'t posted any opportunities yet' :
                  'No opportunities available at the moment'
              }
            </p>
            {!searchTerm && filterType === 'all' && viewMode === 'myOpportunities' && currentUser && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowCreateForm(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Post New Opportunity
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Create/Edit Opportunity Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Opportunity' : 'Post New Opportunity'}
            </DialogTitle>
          </DialogHeader>
          
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="mb-2">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Frontend Developer Intern"
                  value={newOpportunity.title}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="company" className="mb-2">
                  Company <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="e.g. Google"
                  value={newOpportunity.company}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location" className="mb-2">
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g. Hyderabad, Remote"
                  value={newOpportunity.location}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="type" className="mb-2">
                  Job Type
                </Label>
                <Select
                  name="type"
                  value={newOpportunity.type}
                  onValueChange={(value) => 
                    setNewOpportunity({...newOpportunity, type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description" className="mb-2">
                Job Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter detailed job description, responsibilities, etc."
                className="h-32"
                value={newOpportunity.description}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="requirements" className="mb-2">
                Requirements
              </Label>
              <Textarea
                id="requirements"
                name="requirements"
                placeholder="Enter skills, qualifications, experience required"
                className="h-24"
                value={newOpportunity.requirements}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deadline" className="mb-2">
                  Application Deadline
                </Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={newOpportunity.deadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applicationLink" className="mb-2">
                  Application Link
                </Label>
                <Input
                  id="applicationLink"
                  name="applicationLink"
                  placeholder="e.g. https://company.com/apply"
                  value={newOpportunity.applicationLink}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="applicationEmail" className="mb-2">
                  Application Email
                </Label>
                <Input
                  id="applicationEmail"
                  name="applicationEmail"
                  placeholder="e.g. careers@company.com"
                  value={newOpportunity.applicationEmail}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between items-center mt-6">
            
            <Button variant="outline" onClick={() => {
              setShowCreateForm(false);
              setFormError('');
            }}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateOpportunity}>
              {isEditMode ? 'Update Opportunity' : 'Post Opportunity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete this opportunity? This action cannot be undone.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlumniOpportunities;