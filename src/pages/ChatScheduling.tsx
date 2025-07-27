import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MessageCircle, 
  ChevronRight, 
  PlusCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

// Firebase imports
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '@/firebase'; // Assume you have this setup

interface Meeting {
  id: string;
  studentName: string;
  studentId: string;
  mentorId: string;
  topic: string;
  date: string;
  dateTimestamp: Timestamp;
  timeString: string;
  duration: string;
  platform: string;
  link?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'canceled';
}

interface MeetingRequest {
  id: string;
  studentName: string;
  studentId: string;
  mentorId: string;
  topic: string;
  requestDate: string;
  requestTimestamp: Timestamp;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Student {
  id: string;
  name: string;
  // add other student properties if available
}

const ChatScheduling = () => {
    const user = auth.currentUser; // Get the current user from Firebase Auth
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  
  // State for data from Firebase
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MeetingRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState({
    student: "",
    studentId: "",
    topic: "",
    date: "",
    time: "",
    duration: "30 min",
    platform: "Google Meet",
    link: "",
    notes: ""
  });
  
  // Fetch students for dropdown
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "users"),
      where("role", "==", "student")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    });
    
    return unsubscribe;
  }, [user]);
  
  // Fetch upcoming meetings
  useEffect(() => {
    if (!user) return;
    
    // Get the date string for today to compare with stored dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, "meetings"),
      where("mentorId", "==", user.uid),
      where("dateTimestamp", ">=", today),
      orderBy("dateTimestamp", "asc"),
      orderBy("timeString", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetings = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.dateString // Use formatted date string for display
        };
      });
      
      setUpcomingMeetings(meetings);
    });
    
    return unsubscribe;
  }, [user]);
  
  // Fetch past meetings
  useEffect(() => {
    if (!user) return;
    
    // Get the date string for today to compare with stored dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, "meetings"),
      where("mentorId", "==", user.uid),
      where("dateTimestamp", "<", today),
      orderBy("dateTimestamp", "desc"),
      orderBy("timeString", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetings = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.dateString // Use formatted date string for display
        };
      });
      
      setPastMeetings(meetings);
    });
    
    return unsubscribe;
  }, [user]);
  
  // Fetch pending requests
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "meetingRequests"),
      where("mentorId", "==", user.uid),
      where("status", "==", "pending"),
      orderBy("requestTimestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert timestamp to formatted date string
        const requestDate = data.requestTimestamp.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        return {
          id: doc.id,
          ...data,
          requestDate
        };
      });
      
      setPendingRequests(requests);
    });
    
    return unsubscribe;
  }, [user]);
  
  const handleScheduleNew = () => {
    // Reset form data
    setFormData({
      student: "",
      studentId: "",
      topic: "",
      date: "",
      time: "",
      duration: "30 min",
      platform: "Google Meet",
      link: "",
      notes: ""
    });
    setEditingMeetingId(null);
    setShowScheduleForm(true);
  };
  
  const handleEditMeeting = async (id) => {
    try {
      const meetingRef = doc(db, "meetings", id);
      const meetingSnap = await getDoc(meetingRef);
      
      if (meetingSnap.exists()) {
        const meetingData = meetingSnap.data();
        
        // Format the date for the date input
        const dateObj = meetingData.dateTimestamp.toDate();
        const formattedDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
        
        setFormData({
          student: meetingData.studentName,
          studentId: meetingData.studentId,
          topic: meetingData.topic,
          date: formattedDate,
          time: meetingData.timeString,
          duration: meetingData.duration,
          platform: meetingData.platform,
          link: meetingData.link || "",
          notes: meetingData.notes || ""
        });
        
        setEditingMeetingId(id);
        setShowScheduleForm(true);
      }
    } catch (error) {
      console.error("Error fetching meeting data:", error);
      toast({
        title: "Error",
        description: "Could not load meeting details. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCancelScheduling = () => {
    setShowScheduleForm(false);
    setEditingMeetingId(null);
  };
  
  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleSelectChange = (field: 'student' | 'duration' | 'platform', value: string) => {
    if (field === "student") {
      const selectedStudent = students.find(s => s.id === value);
      setFormData(prev => ({
        ...prev,
        student: selectedStudent?.name || "",
        studentId: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  const handleSubmitSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const isEditing = editingMeetingId !== null;
      
      // Validate form
      if (!formData.student || !formData.studentId || !formData.topic || !formData.date || !formData.time) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }
      
      // Create date object from form inputs
      const [year, month, day] = formData.date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day); // Month is 0-indexed in JS
      
      // Format date string for display
      const dateString = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Prepare meeting data
      const meetingData: any = {
        mentorId: user.uid,
        mentorName: user.displayName,
        studentId: formData.studentId,
        studentName: formData.student,
        topic: formData.topic,
        dateTimestamp: Timestamp.fromDate(dateObj),
        dateString: dateString,
        timeString: formData.time,
        duration: formData.duration,
        platform: formData.platform,
        link: formData.link,
        notes: formData.notes,
        status: "Scheduled",
        updatedAt: serverTimestamp()
      };
      
      if (isEditing) {
        // Update existing meeting
        const meetingRef = doc(db, "meetings", editingMeetingId);
        await updateDoc(meetingRef, meetingData);
        toast({
          title: "Meeting Updated",
          description: `Your meeting with ${formData.student} has been updated.`
        });
      } else {
        // Add new meeting
        meetingData.createdAt = serverTimestamp();
        await addDoc(collection(db, "meetings"), meetingData);
        toast({
          title: "Meeting scheduled",
          description: "The meeting has been successfully scheduled."
        });
      }
      
      // Reset form
      setShowScheduleForm(false);
      setEditingMeetingId(null);
      
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error",
        description: "Could not save the meeting. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCancelMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to cancel this meeting?")) return;
    
    try {
      const meetingRef = doc(db, "meetings", meetingId);
      await updateDoc(meetingRef, {
        status: "canceled",
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "Meeting Canceled",
        description: "The meeting has been successfully canceled."
      });
    } catch (error) {
      console.error("Error canceling meeting:", error);
      toast({
        title: "Error",
        description: "Could not cancel the meeting. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleAcceptRequest = async (request: MeetingRequest) => {
    // Open the scheduling form pre-filled with the request data
    setFormData({
      student: request.studentName,
      studentId: request.studentId,
      topic: request.topic,
      date: "",
      time: "",
      duration: "30 min",
      platform: "Google Meet",
      link: "",
      notes: ""
    });
    setEditingMeetingId(null); // It's a new meeting, not an edit
    setShowScheduleForm(true);
    
    // You might want to update the request status to 'accepted' here
    // For simplicity, we'll just open the form. A more robust implementation
    // would also handle the request state update.
    const requestRef = doc(db, "meetingRequests", request.id);
    await updateDoc(requestRef, { status: 'accepted' });
  };
  
  const handleRejectRequest = async (requestId: string) => {
    try {
      const requestRef = doc(db, "meetingRequests", requestId);
      await updateDoc(requestRef, {
        status: "rejected",
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Request Rejected",
        description: "The meeting request has been rejected."
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: "Could not reject the request. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const ScheduleForm = () => {
    const isEditing = editingMeetingId !== null;
    
    return (
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? 'Edit Meeting' : 'Schedule New Meeting'}
        </h3>
        
        <form onSubmit={handleSubmitSchedule}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="student">Student</Label>
              <Select 
                value={formData.student} 
                onValueChange={(value) => handleSelectChange("student", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="topic">Meeting Topic</Label>
              <Input 
                id="topic" 
                placeholder="E.g., Career Guidance, Project Review" 
                value={formData.topic}
                onChange={handleFormChange}
              />
            </div>
            
            <div>
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date" 
                value={formData.date}
                onChange={handleFormChange}
              />
            </div>
            
            <div>
              <Label htmlFor="time">Time</Label>
              <Input 
                id="time" 
                type="time" 
                value={formData.time}
                onChange={handleFormChange}
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select 
                value={formData.duration} 
                onValueChange={(value) => handleSelectChange("duration", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15 min">15 minutes</SelectItem>
                  <SelectItem value="30 min">30 minutes</SelectItem>
                  <SelectItem value="45 min">45 minutes</SelectItem>
                  <SelectItem value="60 min">1 hour</SelectItem>
                  <SelectItem value="90 min">1.5 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="platform">Meeting Platform</Label>
              <Select 
                value={formData.platform} 
                onValueChange={(value) => handleSelectChange("platform", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Google Meet">Google Meet</SelectItem>
                  <SelectItem value="Zoom">Zoom</SelectItem>
                  <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                  <SelectItem value="Skype">Skype</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="link">Meeting Link</Label>
            <Input 
              id="link" 
              placeholder="Paste meeting URL" 
              value={formData.link}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="mb-6">
            <Label htmlFor="notes">Meeting Notes/Agenda</Label>
            <textarea 
              id="notes" 
              className="w-full p-2 border rounded-md h-24" 
              placeholder="Describe the purpose and agenda of the meeting"
              value={formData.notes}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancelScheduling}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {isEditing ? 'Update Meeting' : 'Schedule Meeting'}
            </Button>
          </div>
        </form>
      </Card>
    );
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Chat Scheduling</h2>
        <p className="text-gray-600">Schedule and manage your mentorship sessions with students</p>
      </div>

      {/* Action Button */}
      <div className="mb-6">
        <Button 
          className="bg-blue-600 hover:bg-blue-700 flex items-center" 
          onClick={handleScheduleNew}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Schedule New Meeting
        </Button>
      </div>

      {/* Schedule Form */}
      {showScheduleForm && <ScheduleForm />}

      {/* Calendar View */}
      <Card className="mb-8 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
          Your Schedule Calendar
        </h3>
        <div className="bg-gray-100 p-6 rounded-md text-center">
          <p className="text-gray-500">Calendar view will be implemented here</p>
          <p className="text-sm text-gray-400 mt-2">Google Calendar or similar integration</p>
        </div>
      </Card>

      {/* Meetings Tabs */}
      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming" className="px-6">Upcoming Meetings</TabsTrigger>
          <TabsTrigger value="pending" className="px-6">Pending Requests</TabsTrigger>
          <TabsTrigger value="past" className="px-6">Past Meetings</TabsTrigger>
        </TabsList>

        {/* Upcoming Meetings */}
        <TabsContent value="upcoming">
          <div className="space-y-4">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <Card key={meeting.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">{meeting.studentName}</h4>
                      </div>
                      <p className="text-gray-700 mb-1">{meeting.topic}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" /> 
                          {meeting.dateString}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" /> 
                          {meeting.timeString} ({meeting.duration})
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" /> 
                          {meeting.platform}
                        </span>
                      </div>
                      {meeting.notes && (
                        <p className="text-sm text-gray-500 mt-2">
                          <span className="font-medium">Notes:</span> {meeting.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex mt-4 md:mt-0 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditMeeting(meeting.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleCancelMeeting(meeting.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                  
                  {meeting.link && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md flex justify-between items-center">
                      <span className="text-sm text-blue-700 truncate">
                        Meeting link: {meeting.link}
                      </span>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => window.open(meeting.link, '_blank')}
                      >
                        Join Meeting
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No upcoming meetings scheduled</p>
                <Button 
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={handleScheduleNew}
                >
                  Schedule a Meeting
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Pending Requests */}
        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <Card key={request.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">{request.studentName}</h4>
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                          Awaiting Schedule
                        </span>
                      </div>
                      <p className="text-gray-700 mb-1">{request.topic}</p>
                      <p className="text-sm text-gray-600 mb-3">
                        Requested on: {request.requestDate}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Message:</span> {request.message}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Preferred Times:</span> {request.preferredTimes}
                      </p>
                    </div>
                    <div className="flex mt-4 md:mt-0">
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleScheduleNew}
                      >
                        Schedule Meeting
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No pending meeting requests</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Past Meetings */}
        <TabsContent value="past">
          <div className="space-y-4">
            {pastMeetings.length > 0 ? (
              pastMeetings.map((meeting) => (
                <Card key={meeting.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">{meeting.studentName}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          meeting.status === 'Completed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {meeting.status}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-1">{meeting.topic}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" /> 
                          {meeting.dateString}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" /> 
                          {meeting.timeString} ({meeting.duration})
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" /> 
                          {meeting.platform}
                        </span>
                      </div>
                      {meeting.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                          <span className="font-medium">Notes:</span> {meeting.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex mt-4 md:mt-0 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                      >
                        Add Notes
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={handleScheduleNew}
                      >
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No past meetings found</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatScheduling;