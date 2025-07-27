
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Filter, 
  Search, 
  CheckCircle, 
  XCircle,
  Calendar,
  Clock,
  User,
  Briefcase,
  GraduationCap,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { db, auth } from '@/firebase'; // Import your Firebase configuration
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Define types
interface StudentRequest {
  id: string;
  student: {
    name: string;
    branch: string;
    year: string;
    profileImage?: string;
    id: string; // Student's user ID
  };
  requestType: 'Mentorship' | 'Project Collaboration' | 'Career Guidance' | 'Mock Interview';
  message: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
  dateRequested: string;
  timestamp: Timestamp;
  availabilityTime?: string;
  topic?: string;
  skills?: string[];
  mentorId: string; // The mentor's user ID
  studentId: string; // The student's user ID
  acceptMessage?: string;
  declineReason?: string;
}

const RequestLists: React.FC = () => {
  // Get current user
  const user = auth.currentUser;
  
  // State for all requests
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('newest');
  
  // State for selected request (for detailed view)
  const [selectedRequest, setSelectedRequest] = useState<StudentRequest | null>(null);
  const [viewDetailDialog, setViewDetailDialog] = useState(false);
  
  // States for accept/decline dialogs
  const [acceptDialog, setAcceptDialog] = useState(false);
  const [declineDialog, setDeclineDialog] = useState(false);
  const [acceptMessage, setAcceptMessage] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  // Fetch requests from Firestore
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
    // Query mentor's requests
    const q = query(
      collection(db, "mentorshipRequests"),
      where("mentorId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          student: {
            name: data.studentName || "Unknown Student",
            branch: data.studentBranch || "Unknown Branch",
            year: data.studentYear || "Unknown Year",
            profileImage: data.studentProfileImage || undefined,
            id: data.studentId
          },
          requestType: data.requestType,
          message: data.message,
          status: data.status,
          dateRequested: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }) : "Unknown Date",
          timestamp: data.timestamp,
          availabilityTime: data.availabilityTime,
          topic: data.topic,
          skills: data.skills || [],
          mentorId: data.mentorId,
          studentId: data.studentId,
          acceptMessage: data.acceptMessage,
          declineReason: data.declineReason
        } as StudentRequest;
      });

      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching requests: ", error);
      toast.error("Failed to load requests");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  // Filter requests based on filters
  const filteredRequests = requests.filter(request => {
    // Search filter
    const matchesSearch = 
      request.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Request type filter
    const matchesType = filterType === 'all' || request.requestType === filterType;
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    // Sort options
    if (sortOption === 'newest') {
      return b.timestamp.seconds - a.timestamp.seconds;
    } else if (sortOption === 'oldest') {
      return a.timestamp.seconds - b.timestamp.seconds;
    } else if (sortOption === 'nameAZ') {
      return a.student.name.localeCompare(b.student.name);
    } else if (sortOption === 'nameZA') {
      return b.student.name.localeCompare(a.student.name);
    }
    return 0;
  });

  // Handle view request details
  const handleViewRequest = (request: StudentRequest) => {
    setSelectedRequest(request);
    setViewDetailDialog(true);
  };

  // Handle preparing to accept a request
  const handlePrepareAccept = () => {
    setViewDetailDialog(false);
    setAcceptDialog(true);
  };

  // Handle preparing to decline a request
  const handlePrepareDecline = () => {
    setViewDetailDialog(false);
    setDeclineDialog(true);
  };

  // Handle accepting a request
  const handleAcceptRequest = async () => {
    if (!selectedRequest || !user) return;
    
    try {
      const requestRef = doc(db, "mentorshipRequests", selectedRequest.id);
      
      // Update the request status in Firestore
      await updateDoc(requestRef, {
        status: 'Accepted',
        acceptMessage: acceptMessage,
        acceptedAt: serverTimestamp()
      });
      
      // Create a new active mentorship
      await addDoc(collection(db, "mentorships"), {
        mentorId: user.uid,
        studentId: selectedRequest.studentId,
        studentName: selectedRequest.student.name,
        mentorName: user.displayName || "Mentor",
        requestType: selectedRequest.requestType,
        topic: selectedRequest.topic,
        skills: selectedRequest.skills,
        status: 'Active',
        createdAt: serverTimestamp(),
        originatingRequestId: selectedRequest.id
      });
      
      toast.success("Request accepted successfully");
      setAcceptDialog(false);
      setAcceptMessage('');
    } catch (error) {
      console.error("Error accepting request: ", error);
      toast.error("Failed to accept request");
    }
  };

  // Handle declining a request
  const handleDeclineRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      const requestRef = doc(db, "mentorshipRequests", selectedRequest.id);
      
      // Update the request status in Firestore
      await updateDoc(requestRef, {
        status: 'Declined',
        declineReason: declineReason,
        declinedAt: serverTimestamp()
      });
      
      toast.success("Request declined");
      setDeclineDialog(false);
      setDeclineReason('');
    } catch (error) {
      console.error("Error declining request: ", error);
      toast.error("Failed to decline request");
    }
  };

  // Handle marking a request as completed
  const handleMarkAsCompleted = async (requestId: string) => {
    try {
      const requestRef = doc(db, "mentorshipRequests", requestId);
      
      // Update the request status in Firestore
      await updateDoc(requestRef, {
        status: 'Completed',
        completedAt: serverTimestamp()
      });
      
      // Also update the corresponding mentorship if it exists
      const mentorshipsQuery = query(
        collection(db, "mentorships"),
        where("originatingRequestId", "==", requestId)
      );
      
      const unsubscribe = onSnapshot(mentorshipsQuery, (querySnapshot) => {
        querySnapshot.forEach(async (docSnapshot) => {
          const mentorshipRef = doc(db, "mentorships", docSnapshot.id);
          await updateDoc(mentorshipRef, {
            status: 'Completed',
            completedAt: serverTimestamp()
          });
        });
        unsubscribe();
      });
      
      toast.success("Request marked as completed");
      setViewDetailDialog(false);
    } catch (error) {
      console.error("Error completing request: ", error);
      toast.error("Failed to mark as completed");
    }
  };

  // Request type counts
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const acceptedCount = requests.filter(r => r.status === 'Accepted').length;
  const declinedCount = requests.filter(r => r.status === 'Declined').length;
  const completedCount = requests.filter(r => r.status === 'Completed').length;

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-blue-100 text-blue-700';
      case 'Accepted':
        return 'bg-green-100 text-green-700';
      case 'Declined':
        return 'bg-red-100 text-red-700';
      case 'Completed':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // If no user is logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl font-medium text-gray-600">Please log in to view your requests</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <MessageSquare className="h-6 w-6 text-blue-600 mr-2" />
          Request Management
        </h1>
        <div className="flex items-center">
          <Button variant="outline" className="mr-2">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            View Analytics
          </Button>
        </div>
      </div>

      {/* Request Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Pending Requests</p>
                <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{acceptedCount}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Declined</p>
                <p className="text-2xl font-bold text-red-600">{declinedCount}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-purple-600">{completedCount}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="col-span-1 md:col-span-3 lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by student name, topic, or message..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Request Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Mentorship">Mentorship</SelectItem>
                <SelectItem value="Project Collaboration">Project Collaboration</SelectItem>
                <SelectItem value="Career Guidance">Career Guidance</SelectItem>
                <SelectItem value="Mock Interview">Mock Interview</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Declined">Declined</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="nameAZ">Name (A-Z)</SelectItem>
                <SelectItem value="nameZA">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs for Request Categories */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="grid grid-cols-5 max-w-xl">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        {/* All Requests Tab */}
        <TabsContent value="all" className="mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium">Loading requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <MessageSquare className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No requests found</p>
                <p className="text-sm">Try changing your search or filter criteria</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Student</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Request Type</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Topic</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="py-4 px-6 text-right text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            {request.student.profileImage ? (
                              <img 
                                src={request.student.profileImage}
                                alt={request.student.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-blue-600 font-bold text-sm">
                                {request.student.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{request.student.name}</p>
                            <p className="text-xs text-gray-500">{request.student.branch} • {request.student.year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm">{request.requestType}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm">{request.topic || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm">{request.dateRequested}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
        
        {/* Pending Requests Tab */}
        <TabsContent value="pending" className="mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium">Loading requests...</p>
              </div>
            ) : filteredRequests.filter(r => r.status === 'Pending').length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <MessageSquare className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No pending requests</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Student</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Request Type</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Topic</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="py-4 px-6 text-right text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests
                    .filter(r => r.status === 'Pending')
                    .map((request) => (
                      <tr key={request.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              {request.student.profileImage ? (
                                <img 
                                  src={request.student.profileImage}
                                  alt={request.student.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-blue-600 font-bold text-sm">
                                  {request.student.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{request.student.name}</p>
                              <p className="text-xs text-gray-500">{request.student.branch} • {request.student.year}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.requestType}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.topic || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.dateRequested}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewRequest(request)}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedRequest(request);
                                setAcceptDialog(true);
                              }}
                            >
                              Accept
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                setSelectedRequest(request);
                                setDeclineDialog(true);
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
        
        {/* Accepted Requests Tab */}
        <TabsContent value="accepted" className="mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium">Loading requests...</p>
              </div>
            ) : filteredRequests.filter(r => r.status === 'Accepted').length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <CheckCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No accepted requests</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Student</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Request Type</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Topic</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="py-4 px-6 text-right text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests
                    .filter(r => r.status === 'Accepted')
                    .map((request) => (
                      <tr key={request.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              {request.student.profileImage ? (
                                <img 
                                  src={request.student.profileImage}
                                  alt={request.student.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-blue-600 font-bold text-sm">
                                  {request.student.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{request.student.name}</p>
                              <p className="text-xs text-gray-500">{request.student.branch} • {request.student.year}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.requestType}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.topic || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.dateRequested}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewRequest(request)}
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleMarkAsCompleted(request.id)}
                            >
                              Mark Completed
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
        
        {/* Declined Requests Tab */}
        <TabsContent value="declined" className="mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium">Loading requests...</p>
              </div>
            ) : filteredRequests.filter(r => r.status === 'Declined').length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <XCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No declined requests</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Student</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Request Type</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Topic</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Reason</th>
                    <th className="py-4 px-6 text-right text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests
                    .filter(r => r.status === 'Declined')
                    .map((request) => (
                      <tr key={request.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              {request.student.profileImage ? (
                                <img 
                                  src={request.student.profileImage}
                                  alt={request.student.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-blue-600 font-bold text-sm">
                                  {request.student.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{request.student.name}</p>
                              <p className="text-xs text-gray-500">{request.student.branch} • {request.student.year}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.requestType}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.topic || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.dateRequested}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600">{request.declineReason || 'No reason provided'}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewRequest(request)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
        
        {/* Completed Requests Tab */}
        <TabsContent value="completed" className="mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium">Loading requests...</p>
              </div>
            ) : filteredRequests.filter(r => r.status === 'Completed').length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <CheckCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No completed requests</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Student</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Request Type</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Topic</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="py-4 px-6 text-right text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests
                    .filter(r => r.status === 'Completed')
                    .map((request) => (
                      <tr key={request.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              {request.student.profileImage ? (
                                <img 
                                  src={request.student.profileImage}
                                  alt={request.student.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-blue-600 font-bold text-sm">
                                  {request.student.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{request.student.name}</p>
                              <p className="text-xs text-gray-500">{request.student.branch} • {request.student.year}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.requestType}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.topic || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{request.dateRequested}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewRequest(request)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* View Request Details Dialog */}
      <Dialog open={viewDetailDialog} onOpenChange={setViewDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              View complete details of the request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="mt-2 space-y-6">
              {/* Request Info Card */}
              <Card className="overflow-hidden border-t-4 border-blue-500">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{selectedRequest.requestType}</CardTitle>
                      <CardDescription className="text-sm flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {selectedRequest.dateRequested}
                      </CardDescription>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-4">
                    {/* Student Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          {selectedRequest.student.profileImage ? (
                            <img 
                              src={selectedRequest.student.profileImage}
                              alt={selectedRequest.student.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-600 font-bold">
                              {selectedRequest.student.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{selectedRequest.student.name}</p>
                          <p className="text-xs text-gray-500">{selectedRequest.student.branch} • {selectedRequest.student.year}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Request Details */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Request Details</h4>
                      
                      {selectedRequest.topic && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500">Topic</p>
                          <p className="font-medium">{selectedRequest.topic}</p>
                        </div>
                      )}
                      
                      {selectedRequest.availabilityTime && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500">Availability</p>
                          <p className="font-medium">{selectedRequest.availabilityTime}</p>
                        </div>
                      )}
                      
                      {selectedRequest.skills && selectedRequest.skills.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500">Skills</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRequest.skills.map((skill, index) => (
                              <span 
                                key={index} 
                                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">Message from Student</p>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="text-sm">{selectedRequest.message}</p>
                        </div>
                      </div>
                      
                      {selectedRequest.status === 'Accepted' && selectedRequest.acceptMessage && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-500 mb-2">Your Acceptance Message</p>
                          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                            <p className="text-sm">{selectedRequest.acceptMessage}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedRequest.status === 'Declined' && selectedRequest.declineReason && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-500 mb-2">Decline Reason</p>
                          <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                            <p className="text-sm">{selectedRequest.declineReason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                  <Button variant="outline" onClick={() => setViewDetailDialog(false)}>
                    Close
                  </Button>
                  
                  {selectedRequest.status === 'Pending' && (
                    <>
                      <Button 
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={handlePrepareDecline}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handlePrepareAccept}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                    </>
                  )}
                  
                  {selectedRequest.status === 'Accepted' && (
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleMarkAsCompleted(selectedRequest.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Accept Request Dialog */}
      <Dialog open={acceptDialog} onOpenChange={setAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Request</DialogTitle>
            <DialogDescription>
              You're accepting a request from {selectedRequest?.student.name}.
              This will create a new mentorship.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="accept-message" className="text-sm font-medium">
                Message to Student (Optional)
              </label>
              <textarea
                id="accept-message"
                className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write a message to the student about next steps..."
                value={acceptMessage}
                onChange={(e) => setAcceptMessage(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialog(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAcceptRequest}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Decline Request Dialog */}
      <Dialog open={declineDialog} onOpenChange={setDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Request</DialogTitle>
            <DialogDescription>
              You're declining a request from {selectedRequest?.student.name}.
              Please provide a reason for declining.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="decline-reason" className="text-sm font-medium">
                Reason for Declining <span className="text-red-500">*</span>
              </label>
              <textarea
                id="decline-reason"
                className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explain why you're declining this request..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialog(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeclineRequest}
              disabled={!declineReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestLists;