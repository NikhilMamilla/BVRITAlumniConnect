import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  GraduationCap, 
  Handshake, 
  BookOpen, 
  MessageCircle, 
  Settings, 
  Home, 
  ChevronRight, 
  Bell, 
  User,
  Clock,
  PlusCircle,
  ThumbsUp,
  MessageSquare,
  BarChart,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckCircle,
  XCircle,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ChatbotUI from '@/components/Chatbot/ChatbotUI';
import AlumniDirectory from '@/pages/AlumniDirectory';
import StudentEvents from '@/pages/StudentEvents';
import StudentOpportunities from '@/pages/StudentOpportunities';
import MentorshipRequests from '@/pages/MentorshipRequests';
import StudentProfile from '@/pages/StudentProfile';
import StudentSettings from '@/pages/StudentSettings';
import Chatbot from './Chatbot';  
import StudentIntroForm from '@/pages/StudentIntroForm';
import CommunitiesHub from '@/pages/community/CommunitiesHub';
import { auth, db } from '@/firebase';

// Firebase imports
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc,
  writeBatch
} from 'firebase/firestore';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('home');
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // States for real-time data
  const [notifications, setNotifications] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [activeConnections, setActiveConnections] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [opportunityApplications, setOpportunityApplications] = useState([]);
  
  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    sentRequestsCount: 0,
    activeMentorshipsCount: 0,
    upcomingMeetingsCount: 0,
    eventsRegisteredCount: 0,
    pendingApplicationsCount: 0
  });

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        // If not authenticated, redirect to login
        navigate('/login');
        return;
      }
      
      // Get student profile
      const getStudentProfile = async () => {
        const profileQuery = query(
          collection(db, 'students'),
          where('userId', '==', user.uid)
        );
        
        try {
          const profileSnapshot = await getDocs(profileQuery);
          if (!profileSnapshot.empty) {
            setStudentProfile({
              id: profileSnapshot.docs[0].id,
              ...profileSnapshot.docs[0].data()
            });
          } else {
            // If user doesn't have a student profile, redirect to create one
            navigate('/student/create-profile');
          }
        } catch (error) {
          console.error("Error getting student profile:", error);
        } finally {
          setLoading(false);
        }
      };
      
      getStudentProfile();
    });
    
    return () => unsubscribeAuth();
  }, [navigate]);

  // Load notifications when student profile is available
  useEffect(() => {
    if (!studentProfile) return;
    
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', studentProfile.userId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        read: doc.data().readAt !== null,
        time: formatTimestamp(doc.data().timestamp)
      }));
      
      setNotifications(notificationsList);
    });
    
    return () => unsubscribeNotifications();
  }, [studentProfile]);

  // Load sent mentorship requests
  useEffect(() => {
    if (!studentProfile) return;
    
    const requestsQuery = query(
      collection(db, 'mentorshipRequests'),
      where('studentId', '==', studentProfile.userId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribeRequests = onSnapshot(requestsQuery, async (snapshot) => {
      const requestsList = [];
      let pendingCount = 0;
      
      // Process each document
      for (const doc of snapshot.docs) {
        const requestData = doc.data();
        
        // Get alumni details
        try {
          const alumniQuery = query(
            collection(db, 'alumni_profiles'),
            where('userId', '==', requestData.mentorId)
          );
          
          const alumniSnapshot = await getDocs(alumniQuery);
          if (!alumniSnapshot.empty) {
            const alumniData = alumniSnapshot.docs[0].data();
            
            const requestItem = {
              id: doc.id,
              alumni: alumniData.fullName,
              company: alumniData.company,
              position: alumniData.jobTitle,
              requestType: requestData.type,
              status: requestData.status,
              date: formatTimestamp(requestData.createdAt),
              alumniId: requestData.mentorId
            };
            
            requestsList.push(requestItem);
            
            if (requestData.status === 'pending') {
              pendingCount++;
            }
          }
        } catch (error) {
          console.error("Error getting alumni details:", error);
        }
      }
      
      setMentorshipRequests(requestsList);
      setMetrics(prev => ({...prev, sentRequestsCount: pendingCount}));
    });
    
    return () => unsubscribeRequests();
  }, [studentProfile]);

  // Load active mentorship connections
  useEffect(() => {
    if (!studentProfile) return;
    
    const mentorshipsQuery = query(
      collection(db, 'mentorships'),
      where('studentId', '==', studentProfile.userId),
      where('status', '==', 'active')
    );
    
    const unsubscribeMentorships = onSnapshot(mentorshipsQuery, async (snapshot) => {
      const connectionsList = [];
      
      for (const doc of snapshot.docs) {
        const mentorshipData = doc.data();
        
        try {
          const alumniQuery = query(
            collection(db, 'alumni_profiles'),
            where('userId', '==', mentorshipData.mentorId)
          );
          
          const alumniSnapshot = await getDocs(alumniQuery);
          if (!alumniSnapshot.empty) {
            const alumniData = alumniSnapshot.docs[0].data();
            
            connectionsList.push({
              id: doc.id,
              mentor: alumniData.fullName,
              company: alumniData.company,
              position: alumniData.jobTitle,
              topic: mentorshipData.topic,
              startDate: formatTimestamp(mentorshipData.createdAt)
            });
          }
        } catch (error) {
          console.error("Error getting alumni details for mentorship:", error);
        }
      }
      
      setActiveConnections(connectionsList);
      setMetrics(prev => ({...prev, activeMentorshipsCount: connectionsList.length}));
    });
    
    return () => unsubscribeMentorships();
  }, [studentProfile]);

  // Load upcoming meetings
  useEffect(() => {
    if (!studentProfile) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const meetingsQuery = query(
      collection(db, 'meetings'),
      where('studentId', '==', studentProfile.userId),
      where('startTime', '>=', today),
      orderBy('startTime', 'asc'),
      limit(5)
    );
    
    const unsubscribeMeetings = onSnapshot(meetingsQuery, async (snapshot) => {
      const meetingsList = [];
      
      for (const doc of snapshot.docs) {
        const meetingData = doc.data();
        
        try {
          // Get alumni details
          const alumniQuery = query(
            collection(db, 'alumni_profiles'),
            where('userId', '==', meetingData.alumniId)
          );
          
          const alumniSnapshot = await getDocs(alumniQuery);
          if (!alumniSnapshot.empty) {
            const alumniData = alumniSnapshot.docs[0].data();
            
            const startTime = meetingData.startTime.toDate();
            
            meetingsList.push({
              id: doc.id,
              with: alumniData.fullName,
              topic: meetingData.topic,
              date: startTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              time: startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
              platform: meetingData.platform || 'Virtual Meeting'
            });
          }
        } catch (error) {
          console.error("Error getting alumni details for meeting:", error);
        }
      }
      
      setUpcomingMeetings(meetingsList);
      setMetrics(prev => ({...prev, upcomingMeetingsCount: meetingsList.length}));
    });
    
    return () => unsubscribeMeetings();
  }, [studentProfile]);

  // Load upcoming events
  useEffect(() => {
    if (!studentProfile) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get events student has registered for
    const registrationsQuery = query(
      collection(db, 'eventRegistrations'),
      where('userId', '==', studentProfile.userId)
    );
    
    const loadEvents = async () => {
      try {
        // Get registered events
        const registrationsSnapshot = await getDocs(registrationsQuery);
        const registeredEventIds = registrationsSnapshot.docs.map(doc => doc.data().eventId);
        
        const registeredEvents = [];
        for (const eventId of registeredEventIds) {
          const eventDoc = await getDocs(query(
            collection(db, 'events'),
            where('__name__', '==', eventId),
            where('eventDate', '>=', today)
          ));
          
          if (!eventDoc.empty) {
            const eventData = eventDoc.docs[0].data();
            
            // Get host details
            let hostName = "BVRIT Alumni";
            if (eventData.creatorId) {
              const hostQuery = query(
                collection(db, 'alumni_profiles'),
                where('userId', '==', eventData.creatorId)
              );
              
              const hostSnapshot = await getDocs(hostQuery);
              if (!hostSnapshot.empty) {
                hostName = hostSnapshot.docs[0].data().fullName;
              }
            }
            
            registeredEvents.push({
              id: eventDoc.docs[0].id,
              title: eventData.title,
              date: formatTimestamp(eventData.eventDate),
              hostedBy: hostName,
              venue: eventData.venue || 'Online',
              attendees: eventData.attendeeCount || 0
            });
          }
        }
        
        // Sort events by date
        const sortedEvents = registeredEvents.sort((a, b) => {
          // Ensure dates are valid before creating Date objects
          if (!a.date || !b.date) return 0;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        setUpcomingEvents(sortedEvents);
        setMetrics(prev => ({
          ...prev, 
          eventsRegisteredCount: sortedEvents.length
        }));
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };
    
    loadEvents();
    
    // We don't set up a real-time listener for events to reduce reads
    // Instead, refresh events when navigating to the events page
    const refreshInterval = setInterval(loadEvents, 300000); // refresh every 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [studentProfile]);

  // Load opportunity applications
  useEffect(() => {
    if (!studentProfile) return;
    
    const applicationsQuery = query(
      collection(db, 'opportunityApplications'),
      where('studentId', '==', studentProfile.userId),
      orderBy('appliedAt', 'desc')
    );
    
    const unsubscribeApplications = onSnapshot(applicationsQuery, async (snapshot) => {
      const applicationsList = [];
      let pendingCount = 0;
      
      for (const doc of snapshot.docs) {
        const applicationData = doc.data();
        
        try {
          const opportunityQuery = query(
            collection(db, 'opportunities'),
            where('__name__', '==', applicationData.opportunityId)
          );
          
          const opportunitySnapshot = await getDocs(opportunityQuery);
          if (!opportunitySnapshot.empty) {
            const opportunityData = opportunitySnapshot.docs[0].data();
            
            const applicationItem = {
              id: doc.id,
              title: opportunityData.title,
              company: opportunityData.company,
              type: opportunityData.type,
              status: applicationData.status,
              appliedDate: formatTimestamp(applicationData.appliedAt)
            };
            
            applicationsList.push(applicationItem);
            
            if (applicationData.status === 'pending') {
              pendingCount++;
            }
          }
        } catch (error) {
          console.error("Error getting opportunity details:", error);
        }
      }
      
      setOpportunityApplications(applicationsList);
      setMetrics(prev => ({...prev, pendingApplicationsCount: pendingCount}));
    });
    
    return () => unsubscribeApplications();
  }, [studentProfile]);

  // Helper function for formatting timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Convert Firebase timestamp to JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleMarkAsRead = async (notificationIds: string[]) => {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);
    notificationIds.forEach((id) => {
      const notificationRef = doc(db, 'users', auth.currentUser.uid, 'notifications', id);
      batch.update(notificationRef, { read: true });
    });
    await batch.commit();
    setNotifications(prev => prev.map(n => notificationIds.includes(n.id) ? { ...n, read: true } : n));
  };
  
  const handleClearAll = async () => {
    // Implementation of handleClearAll function
  };
  
  // Function to toggle sidebar on mobile
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Function to handle navigation item click on mobile
  const handleNavItemClick = (pageId) => {
    setActivePage(pageId);
    // Close sidebar on mobile after navigation
    setIsSidebarOpen(false);
  };
  
  // Function to create new mentorship request
  const createMentorshipRequest = async (mentorId, requestType) => {
    try {
      await addDoc(collection(db, 'mentorshipRequests'), {
        studentId: studentProfile.userId,
        mentorId: mentorId,
        type: requestType,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create notification for mentor
      await addDoc(collection(db, 'notifications'), {
        recipientId: mentorId,
        content: `${studentProfile.fullName} has requested mentorship for ${requestType}`,
        type: 'mentorship_request',
        timestamp: serverTimestamp(),
        readAt: null
      });
      
    } catch (error) {
      console.error("Error creating mentorship request:", error);
    }
  };

  if (loading || !studentProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar - hidden on mobile and displayed as overlay when toggled */}
      <div className={`${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } transition-transform duration-300 fixed lg:relative w-64 bg-white shadow-md h-full z-30 lg:flex lg:flex-shrink-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BVRIT Connect</h1>
              <p className="text-sm text-gray-500">Student Dashboard</p>
            </div>
            <button 
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={toggleSidebar}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-6 flex-1 overflow-y-auto">
            <ul>
              {[
                { id: 'home', name: 'Home', icon: <Home className="w-5 h-5" /> },
                { id: 'alumni', name: 'Alumni Directory', icon: <Users className="w-5 h-5" /> },
                { id: 'events', name: 'Events', icon: <Calendar className="w-5 h-5" /> },
                { id: 'opportunities', name: 'Opportunities Board', icon: <Briefcase className="w-5 h-5" /> },
                { id: 'communities', name: 'Communities', icon: <BookOpen className="w-5 h-5" /> },
                { id: 'mentorship', name: 'Mentorship Requests', icon: <Handshake className="w-5 h-5" /> },
                { id: 'communication', name: 'Communication', icon: <MessageCircle className="w-5 h-5" /> },
                { id: 'profile', name: 'Profile', icon: <User className="w-5 h-5" /> },
                { id: 'settings', name: 'Settings', icon: <Settings className="w-5 h-5" /> },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavItemClick(item.id)}
                    className={`flex items-center w-full p-3 px-6 ${
                      activePage === item.id
                        ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm py-4 px-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center">
            {/* Hamburger menu - visible only on mobile */}
            <button 
              className="mr-4 p-1 rounded-md text-gray-700 hover:bg-gray-100 lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="text-lg font-semibold text-gray-800">
              {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-gray-100"
              >
                <Bell className="h-6 w-6 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-20">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Notifications</h3>
                    <button 
                      onClick={() => handleMarkAsRead(notifications.map(n => n.id))}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-b hover:bg-gray-50 ${notification.read ? '' : 'bg-blue-50'}`}
                        >
                          <p className="text-sm">{notification.content}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">No notifications yet</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {studentProfile.profilePictureUrl ? (
                <img 
                  src={studentProfile.profilePictureUrl} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div className="hidden sm:block">
                <div className="font-medium text-sm">{studentProfile.fullName}</div>
                <div className="text-xs text-gray-500">{studentProfile.branch} • {studentProfile.year} Year</div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Dashboard Content */}
        <main className="p-4 md:p-8">
          {activePage === 'home' && (
            <div className="space-y-6 md:space-y-8">
              {/* Dashboard Stats */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-500">Mentorship Requests</p>
                      <h3 className="text-xl md:text-3xl font-bold mt-1">{metrics.sentRequestsCount}</h3>
                    </div>
                    <div className="p-2 md:p-3 bg-blue-50 rounded-full">
                      <MessageSquare className="h-4 w-4 md:h-6 md:w-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-3 md:mt-4">
                    <Button 
                      variant="ghost" 
                      className="text-xs md:text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
                      onClick={() => setActivePage('mentorship')}
                    >
                      Manage requests
                      <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Mentorships</p>
                      <h3 className="text-3xl font-bold mt-1">{metrics.activeMentorshipsCount}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full">
                      <GraduationCap className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
                      onClick={() => setActivePage('mentorship')}
                    >
                      View active mentorships
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Upcoming Meetings</p>
                      <h3 className="text-3xl font-bold mt-1">{metrics.upcomingMeetingsCount}</h3>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-full">
                      <CalendarIcon className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
                      onClick={() => setActivePage('communication')}
                    >
                      View calendar
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Applications</p>
                      <h3 className="text-3xl font-bold mt-1">{metrics.pendingApplicationsCount}</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-full">
                      <Briefcase className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
                      onClick={() => setActivePage('opportunities')}
                    >
                      Track applications
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Active Mentorships Section */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Your Active Mentorships</h2>
                  <Button 
                    variant="ghost" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setActivePage('alumni')}
                  >
                    Find more mentors
                  </Button>
                </div><div className="p-6">
                  {activeConnections.length > 0 ? (
                    <div className="space-y-4">
                      {activeConnections.map(connection => (
                        <div key={connection.id} className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                          <div className="bg-green-100 rounded-full p-3 mr-4">
                            <GraduationCap className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium">{connection.mentor}</h4>
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                                Active
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{connection.company} • {connection.position}</p>
                            <p className="text-sm text-gray-600">Topic: {connection.topic}</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              Since {connection.startDate}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Handshake className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-600">No active mentorships</h3>
                      <p className="text-gray-500 mt-1">Connect with alumni mentors to get started</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActivePage('alumni')}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Find Mentors
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Meetings */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Upcoming Meetings</h2>
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => setActivePage('communication')}
                    >
                      Schedule new
                    </Button>
                  </div>
                  
                  <div className="p-6">
                    {upcomingMeetings.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingMeetings.map(meeting => (
                          <div key={meeting.id} className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                            <div className="bg-purple-100 rounded-full p-3 mr-4">
                              <ClockIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{meeting.topic}</h4>
                              <p className="text-sm text-gray-600">with {meeting.with}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {meeting.date}
                                <span className="mx-2">•</span>
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {meeting.time}
                                <span className="mx-2">•</span>
                                {meeting.platform}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <CalendarIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">No upcoming meetings</h3>
                        <p className="text-gray-500 mt-1">Schedule a meeting with a mentor</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setActivePage('communication')}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Schedule Meeting
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Mentorship Requests */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Your Mentorship Requests</h2>
                  </div>
                  
                  <div className="p-6">
                    {mentorshipRequests.length > 0 ? (
                      <div className="space-y-4">
                        {mentorshipRequests.slice(0, 3).map(request => (
                          <div key={request.id} className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                            <div className={`rounded-full p-3 mr-4 ${
                              request.status === 'accepted' ? 'bg-green-100' : 
                              request.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                              <MessageSquare className={`h-5 w-5 ${
                                request.status === 'accepted' ? 'text-green-600' : 
                                request.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium">{request.alumni}</h4>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  request.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                                  request.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{request.company} • {request.position}</p>
                              <p className="text-sm text-gray-600">Request Type: {request.requestType}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                Sent on: {request.date}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Handshake className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">No mentorship requests</h3>
                        <p className="text-gray-500 mt-1">Reach out to alumni for guidance and support</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Events & Opportunities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Events */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Upcoming Events</h2>
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => setActivePage('events')}
                    >
                      View all
                    </Button>
                  </div>
                  
                  <div className="p-6">
                    {upcomingEvents.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingEvents.map(event => (
                          <div key={event.id} className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                            <div className="bg-red-100 rounded-full p-3 mr-4">
                              <Calendar className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-gray-600">Hosted by: {event.hostedBy}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {event.date}
                                <span className="mx-2">•</span>
                                <Building2 className="h-3 w-3 mr-1" />
                                {event.venue}
                                <span className="mx-2">•</span>
                                <Users className="h-3 w-3 mr-1" />
                                {event.attendees} attendees
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">No upcoming events</h3>
                        <p className="text-gray-500 mt-1">Register for events to network with alumni</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setActivePage('events')}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Browse Events
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Opportunity Applications */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Your Applications</h2>
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => setActivePage('opportunities')}
                    >
                      Find opportunities
                    </Button>
                  </div>
                  
                  <div className="p-6">
                    {opportunityApplications.length > 0 ? (
                      <div className="space-y-4">
                        {opportunityApplications.map(application => (
                          <div key={application.id} className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                            <div className="bg-green-100 rounded-full p-3 mr-4">
                              <Briefcase className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium">{application.title}</h4>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  application.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                                  application.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {application.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{application.company} • {application.type}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                Applied: {application.appliedDate}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Briefcase className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">No applications yet</h3>
                        <p className="text-gray-500 mt-1">Apply for opportunities posted by alumni</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setActivePage('opportunities')}
                        >
                          <Briefcase className="h-4 w-4 mr-2" />
                          Browse Opportunities
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Communities Section */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Your Communities</h2>
                  <Button 
                    variant="ghost" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setActivePage('communities')}
                  >
                    Explore all
                  </Button>
                </div>
                
                <div className="p-6">
                  {joinedCommunities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {joinedCommunities.map(community => (
                        <div key={community.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center mb-3">
                            <div className="bg-blue-100 rounded-full p-3">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                              {community.members} Members
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{community.name}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{community.description}</p>
                          <p className="text-sm text-blue-600 mt-2">
                            {community.newPosts} new posts this week
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-4"
                            onClick={() => navigate(`/communities/${community.id}`)}
                          >
                            View Community
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-600">No communities joined</h3>
                      <p className="text-gray-500 mt-1">Join communities to connect with alumni and peers</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActivePage('communities')}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Explore Communities
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Chatbot UI */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">BVRIT Connect Assistant</h2>
                </div>
                <div className="p-6">
                  <Chatbot />
                </div>
              </div>
            </div>
          )}
          
          {/* Sub-pages */}
          {activePage === 'alumni' && <AlumniDirectory />}
          {activePage === 'events' && <StudentEvents />}
          {activePage === 'opportunities' && <StudentOpportunities />}
          {activePage === 'communities' && <CommunitiesHub />}
          {activePage === 'mentorship' && <MentorshipRequests />}
          {activePage === 'profile' && <StudentProfile />}
          {activePage === 'settings' && <StudentSettings />}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;