import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  User, 
  Building2, 
  BookOpen, 
  Calendar, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Star,
  Filter as FilterIcon,
  School
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetFooter, 
  SheetClose 
} from "@/components/ui/sheet";
import { db, auth } from '@/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore';

interface MentorProfile {
  id: string;
  name: string;
  photoURL?: string;
  department: string;
  position: string;
  expertise: string[];
  bio: string;
  availability: string;
  rating?: number;
  reviewCount?: number;
  subjects?: string[];
}

interface MentorshipRequest {
  id: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  studentBranch: string;
  studentYear: string;
  requestDate: Timestamp;
  status: 'pending' | 'accepted' | 'rejected';
  topic: string;
  message: string;
  studentPhotoURL?: string;
}

const MentorshipRequests: React.FC = () => {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [myRequests, setMyRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterExpertise, setFilterExpertise] = useState('all');
  const [filterRequestStatus, setFilterRequestStatus] = useState('all');
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [requestFormData, setRequestFormData] = useState({
    topic: '',
    message: ''
  });
  
  const [activeTab, setActiveTab] = useState('explore');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  
  // Get all unique departments and expertise areas from mentors
  const departments = [...new Set(mentors.map(mentor => mentor.department))];
  const expertiseAreas = [...new Set(mentors.flatMap(mentor => mentor.expertise))];
  
  useEffect(() => {
    // Ensure the user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("You must be logged in to view mentors and request mentorship");
      setLoading(false);
      return;
    }
    
    // Fetch all mentors
    const mentorsQuery = query(
      collection(db, "mentors"),
      // You might want to add filters here based on availability or status
      orderBy("name")
    );
    
    const unsubscribeMentors = onSnapshot(mentorsQuery, (snapshot) => {
      const mentorData: MentorProfile[] = [];
      snapshot.forEach((doc) => {
        mentorData.push({ id: doc.id, ...doc.data() } as MentorProfile);
      });
      setMentors(mentorData);
    }, (err) => {
      console.error("Error fetching mentors:", err);
      setError("Error loading mentors. Please try again later.");
    });
    
    // Fetch user's mentorship requests
    const requestsQuery = query(
      collection(db, "mentorshipRequests"),
      where("studentId", "==", currentUser.uid),
      orderBy("requestDate", "desc")
    );
    
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests: MentorshipRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as MentorshipRequest);
      });
      setMyRequests(requests);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching mentorship requests:", err);
      if (!error) {
        setError("Error loading your mentorship requests. Please try again later.");
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribeMentors();
      unsubscribeRequests();
    };
  }, [error]);
  
  const handleSendMentorshipRequest = async () => {
    if (!selectedMentor) return;
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("You must be logged in to request mentorship");
        return;
      }
      
      // Get student info
      const studentDoc = await getDoc(doc(db, "students", currentUser.uid));
      if (!studentDoc.exists()) {
        setError("Student profile not found. Please complete your profile first.");
        return;
      }
      
      const studentData = studentDoc.data();
      
      // Create request
      const requestData = {
        mentorId: selectedMentor.id,
        mentorName: selectedMentor.name,
        studentId: currentUser.uid,
        studentName: studentData.name || currentUser.displayName,
        studentBranch: studentData.branch || 'Not specified',
        studentYear: studentData.year || 'Not specified',
        studentPhotoURL: currentUser.photoURL || null,
        requestDate: serverTimestamp(),
        status: 'pending',
        topic: requestFormData.topic,
        message: requestFormData.message
      };
      
      await addDoc(collection(db, "mentorshipRequests"), requestData);
      
      // Reset form
      setRequestFormData({
        topic: '',
        message: ''
      });
      
      // Close dialog
      setSelectedMentor(null);
      setDialogOpen(false);
      
      // Show success message
      alert("Mentorship request sent successfully!");
      
    } catch (err) {
      console.error("Error sending mentorship request:", err);
      setError("Failed to send mentorship request. Please try again.");
    }
  };
  
  const handleCancelRequest = async (request: MentorshipRequest) => {
    if (window.confirm("Are you sure you want to cancel this mentorship request?")) {
      try {
        await deleteDoc(doc(db, "mentorshipRequests", request.id));
      } catch (err) {
        console.error("Error canceling request:", err);
        setError("Failed to cancel request. Please try again.");
      }
    }
  };
  
  // Format date from Timestamp
  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };
  
  // Filter functions
  const getFilteredMentors = () => {
    return mentors.filter(mentor => {
      // Filter by search query (name, department, position, expertise)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = mentor.name.toLowerCase().includes(query);
        const deptMatch = mentor.department.toLowerCase().includes(query);
        const posMatch = mentor.position.toLowerCase().includes(query);
        const expertiseMatch = mentor.expertise.some(exp => 
          exp.toLowerCase().includes(query)
        );
        
        if (!(nameMatch || deptMatch || posMatch || expertiseMatch)) {
          return false;
        }
      }
      
      // Filter by department
      if (filterDepartment !== 'all' && mentor.department !== filterDepartment) {
        return false;
      }
      
      // Filter by expertise
      if (filterExpertise !== 'all' && !mentor.expertise.includes(filterExpertise)) {
        return false;
      }
      
      return true;
    });
  };
  
  const getFilteredRequests = () => {
    return myRequests.filter(request => {
      // Filter by status
      if (filterRequestStatus !== 'all' && request.status !== filterRequestStatus) {
        return false;
      }
      
      // Filter by search query (mentor name or topic)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          request.mentorName.toLowerCase().includes(query) ||
          request.topic.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };
  
  // Generate star rating display
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const starCount = 5;
    const fullStars = Math.floor(rating);
    
    return (
      <div className="flex">
        {[...Array(starCount)].map((_, i) => (
          <Star 
            key={i}
            className={`h-4 w-4 ${i < fullStars ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading mentors and requests...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
        <div className="text-lg text-red-500 mb-4 font-medium">{error}</div>
        <p className="text-gray-600 mb-6 text-center max-w-lg">
          There was a problem loading the mentorship data. This may be due to network issues or insufficient permissions.
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-full">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mentorship Requests</h1>
        <p className="text-gray-600">Find mentors and request mentorship</p>
      </div>
      
      <Tabs 
        defaultValue="explore" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="explore">
            Explore Mentors
          </TabsTrigger>
          <TabsTrigger value="myrequests">
            My Requests
            {myRequests.length > 0 && (
              <Badge variant="default" className="ml-2 bg-blue-600">{myRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Explore Mentors Tab */}
        <TabsContent value="explore">
          {/* Search and filters for mentors */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by name, department, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="hidden md:flex gap-3">
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterExpertise} onValueChange={setFilterExpertise}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Filter by expertise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas of Expertise</SelectItem>
                  {expertiseAreas.map(exp => (
                    <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex md:hidden items-center gap-2"
                >
                  <FilterIcon className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
              </SheetTrigger>
              
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Filter Mentors</SheetTitle>
                  <SheetDescription>
                    Apply filters to find the right mentor
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 flex flex-col gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Department</h3>
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Area of Expertise</h3>
                    <Select value={filterExpertise} onValueChange={setFilterExpertise}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by expertise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Areas of Expertise</SelectItem>
                        {expertiseAreas.map(exp => (
                          <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button>Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Mentors Grid */}
          {getFilteredMentors().length === 0 ? (
            <div className="text-center p-10 border border-dashed rounded-lg">
              <School className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-700">No mentors found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredMentors().map((mentor) => (
                <Card key={mentor.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {mentor.photoURL ? (
                            <img
                              src={mentor.photoURL}
                              alt={mentor.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{mentor.name}</CardTitle>
                          <CardDescription>{mentor.position}</CardDescription>
                        </div>
                      </div>
                      {renderStars(mentor.rating)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-2">
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{mentor.department}</span>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Expertise</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mentor.expertise.map((exp, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 line-clamp-3">{mentor.bio}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Availability: {mentor.availability}</span>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="border-t pt-3">
                    <Dialog open={dialogOpen && selectedMentor?.id === mentor.id} onOpenChange={(open) => {
                      if (!open) {
                        setSelectedMentor(null);
                      }
                      setDialogOpen(open);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setSelectedMentor(mentor);
                            setDialogOpen(true);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Request Mentorship
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Request Mentorship</DialogTitle>
                          <DialogDescription>
                            Send a mentorship request to {mentor.name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex items-start gap-4 py-4">
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {mentor.photoURL ? (
                              <img
                                src={mentor.photoURL}
                                alt={mentor.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-6 w-6 text-gray-600" />
                            )}
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-gray-900">{mentor.name}</h3>
                            <p className="text-sm text-gray-600">{mentor.position}</p>
                            <p className="text-sm text-gray-600">{mentor.department}</p>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 py-2">
                          <div className="grid gap-2">
                            <label className="text-sm font-medium">Topic of Mentorship</label>
                            <Input 
                              placeholder="Briefly describe the topic or area you need guidance with"
                              value={requestFormData.topic}
                              onChange={(e) => setRequestFormData({...requestFormData, topic: e.target.value})}
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <label className="text-sm font-medium">Message</label>
                            <Textarea 
                              placeholder="Introduce yourself and explain why you're interested in this mentorship"
                              rows={5}
                              value={requestFormData.message}
                              onChange={(e) => setRequestFormData({...requestFormData, message: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter className="mt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedMentor(null);
                              setDialogOpen(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSendMentorshipRequest}
                            disabled={!requestFormData.topic || !requestFormData.message}
                          >
                            Send Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* My Requests Tab */}
        <TabsContent value="myrequests">
          {/* Search and filters for requests */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by mentor or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="w-full sm:w-48">
              <Select value={filterRequestStatus} onValueChange={setFilterRequestStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Requests List */}
          {getFilteredRequests().length === 0 ? (
            <div className="text-center p-10 border border-dashed rounded-lg">
              <MessageCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-700">No mentorship requests yet</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery || filterRequestStatus !== 'all' 
                  ? "Try adjusting your filters or search terms." 
                  : "Find mentors and send requests to get started."}
              </p>
              {(!searchQuery && filterRequestStatus === 'all') && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('explore')}
                >
                  Explore Mentors
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {getFilteredRequests().map((request) => (
                <div 
                  key={request.id} 
                  className={`p-4 rounded-lg border ${
                    request.status === 'pending' 
                      ? 'border-blue-200 bg-blue-50'
                      : request.status === 'accepted'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">{request.mentorName}</h3>
                        <div className="mt-1">
                          <Badge 
                            variant="outline" 
                            className={
                              request.status === 'pending' 
                                ? 'border-blue-500 text-blue-700' 
                                : request.status === 'accepted'
                                ? 'border-green-500 text-green-700'
                                : 'border-red-500 text-red-700'
                            }
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 md:mt-0 text-right flex flex-col items-end">
                      <p className="text-sm text-gray-500">
                        Requested: {formatDate(request.requestDate)}
                      </p>
                      
                      <div className="mt-2">
                        {request.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleCancelRequest(request)}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Cancel Request
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pl-0 md:pl-14">
                    <h4 className="font-medium text-gray-700">Topic: {request.topic}</h4>
                    <p className="text-gray-600 mt-1">{request.message}</p>
                    
                    {request.status === 'accepted' && (
                      <div className="mt-3 p-3 bg-green-100 rounded-md">
                        <p className="text-sm text-green-800">
                          <CheckCircle className="inline h-4 w-4 mr-1" />
                          Your mentorship request has been accepted! Check your notifications or email 
                          for details on next steps.
                        </p>
                      </div>
                    )}
                    
                    {request.status === 'rejected' && (
                      <div className="mt-3 p-3 bg-red-100 rounded-md">
                        <p className="text-sm text-red-800">
                          This mentorship request was declined. The mentor may not have availability 
                          at this time or might not be the best fit for your topic.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MentorshipRequests;