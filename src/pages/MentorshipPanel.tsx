import React, { useState, useEffect } from 'react';
import { 
  Handshake, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  Calendar, 
  Search,
  Filter,
  Trash2,
  BarChart,
  User,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db, auth } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  orderBy, 
  Timestamp,
  getDocs
} from 'firebase/firestore';

interface MentorshipRequest {
  id: string;
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

interface ActiveMentorship {
  id: string;
  studentId: string;
  studentName: string;
  studentBranch: string;
  studentYear: string;
  studentPhotoURL?: string;
  startDate: Timestamp;
  lastSessionDate?: Timestamp;
  topic: string;
  sessions: MentorshipSession[];
  status: 'active' | 'completed' | 'paused';
  notes?: string;
}

interface MentorshipSession {
  id: string;
  date: Timestamp;
  duration: number; // in minutes
  topic: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

const MentorshipPanel: React.FC = () => {
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [activeMentorships, setActiveMentorships] = useState<ActiveMentorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMentorship, setSelectedMentorship] = useState<ActiveMentorship | null>(null);
  const [newSessionDialogOpen, setNewSessionDialogOpen] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    date: "",
    time: "",
    duration: 30,
    topic: "",
    notes: ""
  });
  const [activeTab, setActiveTab] = useState("requests");

  useEffect(() => {
    // Ensure the user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("You must be logged in to view mentorship data");
      setLoading(false);
      return;
    }

    // Listen for mentorship requests
    const requestsQuery = query(
      collection(db, "mentorshipRequests"),
      where("mentorId", "==", currentUser.uid),
      orderBy("requestDate", "desc")
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests: MentorshipRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as MentorshipRequest);
      });
      setMentorshipRequests(requests);
    }, (error) => {
      console.error("Error fetching mentorship requests:", error);
      setError("Error loading mentorship requests. Please check your permissions.");
      setLoading(false);
    });

    // Listen for active mentorships
    const mentorshipsQuery = query(
      collection(db, "mentorships"),
      where("mentorId", "==", currentUser.uid),
      orderBy("startDate", "desc")
    );

    const unsubscribeMentorships = onSnapshot(mentorshipsQuery, (snapshot) => {
      const mentorships: ActiveMentorship[] = [];
      snapshot.forEach((doc) => {
        mentorships.push({ id: doc.id, ...doc.data() } as ActiveMentorship);
      });
      setActiveMentorships(mentorships);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching active mentorships:", error);
      if (!error) { // Only set error if not already set
        setError("Error loading mentorships. Please check your permissions.");
      }
      setLoading(false);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeMentorships();
    };
  }, []);

  const handleAcceptRequest = async (request: MentorshipRequest) => {
    try {
      // Update request status
      const requestRef = doc(db, "mentorshipRequests", request.id);
      await updateDoc(requestRef, {
        status: "accepted"
      });

      // Create new mentorship
      const mentorshipData = {
        mentorId: auth.currentUser?.uid,
        studentId: request.studentId,
        studentName: request.studentName,
        studentBranch: request.studentBranch,
        studentYear: request.studentYear,
        studentPhotoURL: request.studentPhotoURL,
        startDate: Timestamp.now(),
        topic: request.topic,
        sessions: [],
        status: "active",
        requestId: request.id
      };

      await addDoc(collection(db, "mentorships"), mentorshipData);
      
      // Notify student (in a real implementation, this might trigger a cloud function)
      // You could add notification logic here

    } catch (error) {
      console.error("Error accepting request:", error);
      setError("Failed to accept request. Please try again.");
    }
  };

  const handleRejectRequest = async (request: MentorshipRequest) => {
    try {
      const requestRef = doc(db, "mentorshipRequests", request.id);
      await updateDoc(requestRef, {
        status: "rejected"
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      setError("Failed to reject request. Please try again.");
    }
  };

  const handleCompleteMentorship = async (mentorship: ActiveMentorship) => {
    try {
      const mentorshipRef = doc(db, "mentorships", mentorship.id);
      await updateDoc(mentorshipRef, {
        status: "completed",
        completionDate: Timestamp.now()
      });
    } catch (error) {
      console.error("Error completing mentorship:", error);
      setError("Failed to complete mentorship. Please try again.");
    }
  };

  const handlePauseMentorship = async (mentorship: ActiveMentorship) => {
    try {
      const mentorshipRef = doc(db, "mentorships", mentorship.id);
      await updateDoc(mentorshipRef, {
        status: "paused"
      });
    } catch (error) {
      console.error("Error pausing mentorship:", error);
      setError("Failed to pause mentorship. Please try again.");
    }
  };

  const handleDeleteMentorship = async (mentorship: ActiveMentorship) => {
    if (window.confirm("Are you sure you want to delete this mentorship? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "mentorships", mentorship.id));
      } catch (error) {
        console.error("Error deleting mentorship:", error);
        setError("Failed to delete mentorship. Please try again.");
      }
    }
  };

  const handleAddSession = async () => {
    if (!selectedMentorship) return;
    
    try {
      const sessionDate = new Date(`${newSessionData.date}T${newSessionData.time}`);
      
      // Create a new session object
      const newSession: MentorshipSession = {
        id: Date.now().toString(), // Simple ID generation
        date: Timestamp.fromDate(sessionDate),
        duration: newSessionData.duration,
        topic: newSessionData.topic,
        notes: newSessionData.notes,
        status: "scheduled"
      };
      
      // Get the current sessions and add the new one
      const mentorshipRef = doc(db, "mentorships", selectedMentorship.id);
      const currentSessions = selectedMentorship.sessions || [];
      const updatedSessions = [...currentSessions, newSession];
      
      await updateDoc(mentorshipRef, {
        sessions: updatedSessions,
        lastUpdated: Timestamp.now()
      });
      
      // Reset form
      setNewSessionData({
        date: "",
        time: "",
        duration: 30,
        topic: "",
        notes: ""
      });
      
      setNewSessionDialogOpen(false);
    } catch (error) {
      console.error("Error adding session:", error);
      setError("Failed to add session. Please try again.");
    }
  };

  const handleUpdateSessionStatus = async (
    mentorship: ActiveMentorship, 
    sessionId: string, 
    newStatus: 'scheduled' | 'completed' | 'cancelled'
  ) => {
    try {
      const mentorshipRef = doc(db, "mentorships", mentorship.id);
      
      // Update the specific session's status
      const updatedSessions = mentorship.sessions.map(session => {
        if (session.id === sessionId) {
          return { ...session, status: newStatus };
        }
        return session;
      });
      
      await updateDoc(mentorshipRef, {
        sessions: updatedSessions,
        lastUpdated: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating session status:", error);
      setError("Failed to update session status. Please try again.");
    }
  };

  // Filter functions
  const getFilteredRequests = () => {
    return mentorshipRequests.filter(request => {
      // Apply status filter
      if (filterStatus !== "all" && request.status !== filterStatus) {
        return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          request.studentName.toLowerCase().includes(searchLower) ||
          request.topic.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  const getFilteredMentorships = () => {
    return activeMentorships.filter(mentorship => {
      // Apply status filter
      if (filterStatus !== "all" && mentorship.status !== filterStatus) {
        return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          mentorship.studentName.toLowerCase().includes(searchLower) ||
          mentorship.topic.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  // Format date from Timestamp
  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  // Format upcoming sessions
  const getUpcomingSessions = (mentorship: ActiveMentorship) => {
    if (!mentorship.sessions || mentorship.sessions.length === 0) {
      return "No scheduled sessions";
    }
    
    const now = new Date();
    const upcomingSessions = mentorship.sessions
      .filter(session => 
        session.status === "scheduled" && 
        session.date.toDate() > now
      )
      .sort((a, b) => a.date.seconds - b.date.seconds);
    
    if (upcomingSessions.length === 0) {
      return "No upcoming sessions";
    }
    
    const nextSession = upcomingSessions[0];
    return `Next: ${nextSession.date.toDate().toLocaleDateString()} - ${nextSession.topic}`;
  };

  // Get statistics
  const getStats = () => {
    const totalRequests = mentorshipRequests.length;
    const pendingRequests = mentorshipRequests.filter(r => r.status === 'pending').length;
    const activeMentorshipsCount = activeMentorships.filter(m => m.status === 'active').length;
    const completedMentorships = activeMentorships.filter(m => m.status === 'completed').length;
    
    return { totalRequests, pendingRequests, activeMentorshipsCount, completedMentorships };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading mentorship data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
        <div className="text-lg text-red-500 mb-4 font-medium">{error}</div>
        <p className="text-gray-600 mb-6 text-center max-w-lg">
          There was a problem loading your mentorship data. This may be due to network issues or insufficient permissions.
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
        <h1 className="text-2xl font-bold text-gray-800">Mentorship Panel</h1>
        <p className="text-gray-600">Manage your mentorship requests and active mentorships</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Pending Requests</p>
              <p className="text-2xl font-bold text-blue-800">{stats.pendingRequests}</p>
            </div>
            <MessageCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Active Mentorships</p>
              <p className="text-2xl font-bold text-green-800">{stats.activeMentorshipsCount}</p>
            </div>
            <Handshake className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">Completed</p>
              <p className="text-2xl font-bold text-purple-800">{stats.completedMentorships}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700">Total Requests</p>
              <p className="text-2xl font-bold text-amber-800">{stats.totalRequests}</p>
            </div>
            <BarChart className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Search by name, expertise, or keywords"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="w-full md:w-48">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        defaultValue="requests" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="requests">
            Mentorship Requests
            {stats.pendingRequests > 0 && (
              <Badge variant="default" className="ml-2 bg-blue-600">{stats.pendingRequests}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Mentorships
            {stats.activeMentorshipsCount > 0 && (
              <Badge variant="default" className="ml-2 bg-green-600">{stats.activeMentorshipsCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests">
          {getFilteredRequests().length === 0 ? (
            <div className="text-center p-10 border border-dashed rounded-lg">
              <MessageCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-700">No mentorship requests</h3>
              <p className="text-gray-500 mt-1">When students request your mentorship, they'll appear here.</p>
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
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        {request.studentPhotoURL ? (
                          <img 
                            src={request.studentPhotoURL} 
                            alt={request.studentName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">{request.studentName}</h3>
                        <p className="text-sm text-gray-600">{request.studentBranch} • {request.studentYear}</p>
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
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleAcceptRequest(request)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleRejectRequest(request)}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pl-0 md:pl-14">
                    <h4 className="font-medium text-gray-700">Topic: {request.topic}</h4>
                    <p className="text-gray-600 mt-1">{request.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Mentorships Tab */}
        <TabsContent value="active">
          {getFilteredMentorships().length === 0 ? (
            <div className="text-center p-10 border border-dashed rounded-lg">
              <Handshake className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-700">No active mentorships</h3>
              <p className="text-gray-500 mt-1">When you accept mentorship requests, they'll appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {getFilteredMentorships().map((mentorship) => (
                <div 
                  key={mentorship.id} 
                  className={`p-5 rounded-lg border ${
                    mentorship.status === 'active' 
                      ? 'border-green-200'
                      : mentorship.status === 'completed'
                      ? 'border-purple-200'
                      : 'border-amber-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        {mentorship.studentPhotoURL ? (
                          <img 
                            src={mentorship.studentPhotoURL} 
                            alt={mentorship.studentName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">{mentorship.studentName}</h3>
                        <p className="text-sm text-gray-600">{mentorship.studentBranch} • {mentorship.studentYear}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={
                              mentorship.status === 'active' 
                                ? 'border-green-500 text-green-700' 
                                : mentorship.status === 'completed'
                                ? 'border-purple-500 text-purple-700'
                                : 'border-amber-500 text-amber-700'
                            }
                          >
                            {mentorship.status.charAt(0).toUpperCase() + mentorship.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Started: {formatDate(mentorship.startDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 md:mt-0 flex flex-col items-end">
                      {mentorship.status === 'active' && (
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => setSelectedMentorship(mentorship)}
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                Schedule Session
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Schedule New Session</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Date</label>
                                    <Input 
                                      type="date" 
                                      value={newSessionData.date}
                                      onChange={(e) => setNewSessionData({...newSessionData, date: e.target.value})}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Time</label>
                                    <Input 
                                      type="time" 
                                      value={newSessionData.time}
                                      onChange={(e) => setNewSessionData({...newSessionData, time: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm font-medium">Duration (minutes)</label>
                                  <Select 
                                    value={newSessionData.duration.toString()}
                                    onValueChange={(value) => setNewSessionData({...newSessionData, duration: parseInt(value)})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="15">15 minutes</SelectItem>
                                      <SelectItem value="30">30 minutes</SelectItem>
                                      <SelectItem value="45">45 minutes</SelectItem>
                                      <SelectItem value="60">60 minutes</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm font-medium">Topic</label>
                                  <Input 
                                    placeholder="What will you discuss?" 
                                    value={newSessionData.topic}
                                    onChange={(e) => setNewSessionData({...newSessionData, topic: e.target.value})}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-sm font-medium">Notes (Optional)</label>
                                  <Input 
                                    placeholder="Any preparation or notes for the session" 
                                    value={newSessionData.notes}
                                    onChange={(e) => setNewSessionData({...newSessionData, notes: e.target.value})}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  onClick={handleAddSession}
                                  disabled={!newSessionData.date || !newSessionData.time || !newSessionData.topic}
                                >
                                  Schedule Session
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                onClick={() => setSelectedMentorship(mentorship)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Complete Mentorship</DialogTitle>
                              </DialogHeader>
                              <p className="py-4">
                                Are you sure you want to mark this mentorship with <strong>{mentorship.studentName}</strong> as completed?
                                This will move it to your completed mentorships history.
                              </p>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedMentorship(null)}>Cancel</Button>
                                <Button 
                                  onClick={() => {
                                    if (selectedMentorship) {
                                      handleCompleteMentorship(selectedMentorship);
                                      setSelectedMentorship(null);
                                    }
                                  }}
                                >
                                  Complete Mentorship
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-amber-300 text-amber-700 hover:bg-amber-50"
                            onClick={() => handlePauseMentorship(mentorship)}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        </div>
                      )}
                      
                      {mentorship.status === 'paused' && (
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            const mentorshipRef = doc(db, "mentorships", mentorship.id);
                            updateDoc(mentorshipRef, { status: "active" });
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resume Mentorship
                        </Button>
                      )}
                      
                      {/* Delete option for any status */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 mt-2"
                        onClick={() => handleDeleteMentorship(mentorship)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pl-0 md:pl-14">
                    <h4 className="font-medium text-gray-700">Topic: {mentorship.topic}</h4>{/* Session Information */}
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">{getUpcomingSessions(mentorship)}</p>
                      
                      {/* Collapsible Sessions List */}
                      {mentorship.sessions && mentorship.sessions.length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="link" className="p-0 mt-1 h-auto">
                              View {mentorship.sessions.length} session{mentorship.sessions.length !== 1 ? 's' : ''}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Sessions with {mentorship.studentName}</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-96 overflow-y-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2 px-3">Date</th>
                                    <th className="text-left py-2 px-3">Topic</th>
                                    <th className="text-left py-2 px-3">Duration</th>
                                    <th className="text-left py-2 px-3">Status</th>
                                    <th className="text-left py-2 px-3">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {mentorship.sessions
                                    .sort((a, b) => b.date.seconds - a.date.seconds)
                                    .map(session => (
                                      <tr key={session.id} className="border-b hover:bg-gray-50">
                                        <td className="py-2 px-3">
                                          {session.date.toDate().toLocaleDateString()} {' '}
                                          {session.date.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="py-2 px-3">{session.topic}</td>
                                        <td className="py-2 px-3">{session.duration} min</td>
                                        <td className="py-2 px-3">
                                          <Badge 
                                            variant="outline" 
                                            className={
                                              session.status === 'scheduled' 
                                                ? 'border-blue-500 text-blue-700' 
                                                : session.status === 'completed'
                                                ? 'border-green-500 text-green-700'
                                                : 'border-red-500 text-red-700'
                                            }
                                          >
                                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                          </Badge>
                                        </td>
                                        <td className="py-2 px-3">
                                          {session.status === 'scheduled' && (
                                            <div className="flex gap-1">
                                              <Button 
                                                size="sm" 
                                                variant="ghost"
                                                className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => handleUpdateSessionStatus(mentorship, session.id, 'completed')}
                                              >
                                                <CheckCircle className="h-4 w-4" />
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="ghost"
                                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleUpdateSessionStatus(mentorship, session.id, 'cancelled')}
                                              >
                                                <XCircle className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    
                    {/* Notes Display (if any) */}
                    {mentorship.notes && (
                      <div className="mt-3 bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700">{mentorship.notes}</p>
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => {
                          // Open chat with student in a real implementation
                          alert(`Chat with ${mentorship.studentName} would open here`);
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => {
                          // Open student profile in a real implementation
                          alert(`Profile for ${mentorship.studentName} would open here`);
                        }}
                      >
                        <User className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                          >
                            <Building2 className="h-4 w-4 mr-1" />
                            Add Notes
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Notes for {mentorship.studentName}</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <textarea 
                              className="w-full p-3 border border-gray-300 rounded-md h-40"
                              placeholder="Add your notes here..."
                              defaultValue={mentorship.notes || ''}
                            ></textarea>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => {
                                const textarea = document.querySelector('textarea');
                                if (textarea) {
                                  const notes = textarea.value;
                                  const mentorshipRef = doc(db, "mentorships", mentorship.id);
                                  updateDoc(mentorshipRef, { notes });
                                }
                              }}
                            >
                              Save Notes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Session Dialog */}
      <Dialog open={newSessionDialogOpen} onOpenChange={setNewSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule New Session</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Date</label>
                <Input 
                  type="date" 
                  value={newSessionData.date}
                  onChange={(e) => setNewSessionData({...newSessionData, date: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Time</label>
                <Input 
                  type="time" 
                  value={newSessionData.time}
                  onChange={(e) => setNewSessionData({...newSessionData, time: e.target.value})}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Select 
                value={newSessionData.duration.toString()}
                onValueChange={(value) => setNewSessionData({...newSessionData, duration: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Topic</label>
              <Input 
                placeholder="What will you discuss?" 
                value={newSessionData.topic}
                onChange={(e) => setNewSessionData({...newSessionData, topic: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input 
                placeholder="Any preparation or notes for the session" 
                value={newSessionData.notes}
                onChange={(e) => setNewSessionData({...newSessionData, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAddSession}
              disabled={!newSessionData.date || !newSessionData.time || !newSessionData.topic}
            >
              Schedule Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorshipPanel;