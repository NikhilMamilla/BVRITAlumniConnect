import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, 
  MessageSquare, 
  Handshake, 
  Calendar, 
  Users, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Download,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Save,
  Plus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { auth, db } from '@/firebase'; // Use your existing firebase config
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  limit,
  getDocs,
  Timestamp,
  deleteDoc,
  type OrderByDirection
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface Communication {
  id: string;
  student: string;
  studentId: string;
  topic: string;
  type: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'canceled';
  rating?: number;
  duration?: number;
}

interface Student {
  id: string;
  name: string;
}

interface NewMeeting {
  student: string;
  studentId: string;
  type: 'mentorship' | 'interview-prep' | 'general';
  topic: string;
  date: string;
  time: string;
  expectedDuration: string;
  notes: string;
}

const CommunicationTracker = () => {
  // State variables
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalHours: 0,
    averageRating: 0,
    upcomingSessions: 0,
    uniqueStudents: 0
  });
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // New state for modal and form
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState<NewMeeting>({
    student: '',
    studentId: '',
    type: 'mentorship',
    topic: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    expectedDuration: '30',
    notes: ''
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!currentUser) return;
    setLoadingStudents(true);
    try {
      const mentorshipsRef = collection(db, 'mentorships');
      const mentorshipsQuery = query(
        mentorshipsRef,
        where('mentorId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(mentorshipsQuery);
      
      const uniqueStudents = new Map<string, Student>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.studentId && data.studentName) {
          uniqueStudents.set(data.studentId, {
            id: data.studentId,
            name: data.studentName
          });
        }
      });
      
      setStudents(Array.from(uniqueStudents.values()));
    } catch (err) {
      console.error("Error fetching students: ", err);
      setError("Failed to load students. Please try again.");
    } finally {
      setLoadingStudents(false);
    }
  }, [currentUser]);

  // Fetch students when modal opens
  useEffect(() => {
    if (showNewMeetingModal) {
      fetchStudents();
    }
  }, [showNewMeetingModal, fetchStudents]);

  // Fetch communications based on filters - this effect will re-run when filters change
  useEffect(() => {
    if (!currentUser) return;

    // Cleanup previous listener if it exists
    unsubscribe?.();

    const fetchCommunications = () => {
      setLoading(true);
      try {
        const meetingsRef = collection(db, 'meetings');
        const constraints = [];

        constraints.push(where('mentorId', '==', currentUser.uid));
        
        if (selectedPeriod === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          constraints.push(where('date', '>=', Timestamp.fromDate(oneWeekAgo)));
        } else if (selectedPeriod === 'month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          constraints.push(where('date', '>=', Timestamp.fromDate(oneMonthAgo)));
        }
        
        if (selectedType !== 'all') {
          constraints.push(where('type', '==', selectedType));
        }
        
        if (selectedStatus !== 'all') {
          constraints.push(where('status', '==', selectedStatus));
        }
        
        if (sortOrder !== 'none') {
          constraints.push(orderBy('date', sortOrder));
        }
        
        const meetingsQuery = query(meetingsRef, ...constraints);
        
        const unsubscribeSnapshot = onSnapshot(meetingsQuery, (snapshot) => {
          const meetingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate().toISOString().split('T')[0] || '',
            time: doc.data().date?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
          })) as Communication[];
          
          const filteredData = searchQuery ? 
            meetingsData.filter(comm => 
              comm.student?.toLowerCase().includes(searchQuery.toLowerCase()) || 
              comm.topic?.toLowerCase().includes(searchQuery.toLowerCase())
            ) : meetingsData;
          
          setCommunications(filteredData);
          calculateStats(filteredData);
          generateMonthlyData(meetingsData);
          setLoading(false);
        }, (err) => {
          console.error("Error fetching communications: ", err);
          setError("Failed to load communications. Please try again.");
          setLoading(false);
        });
        
        setUnsubscribe(() => unsubscribeSnapshot);
      } catch (err) {
        console.error("Error setting up communications listener: ", err);
        setError("Failed to set up communications tracker. Please try again.");
        setLoading(false);
      }
    };

    fetchCommunications();

    return () => {
      unsubscribe?.();
    };
  }, [currentUser, selectedPeriod, selectedType, selectedStatus, sortOrder, searchQuery, unsubscribe]);

  const calculateStats = (data: Communication[]) => {
    if (!data) return;

    const totalSessions = data.length;
    const totalHours = data.reduce((acc, curr) => acc + (curr.duration || 0) / 60, 0);
    const ratedSessions = data.filter(c => c.rating && c.rating > 0);
    const averageRating = ratedSessions.reduce((acc, curr) => acc + (curr.rating || 0), 0) / (ratedSessions.length || 1);
    const upcomingSessions = data.filter(c => c.status === 'scheduled').length;
    const uniqueStudents = new Set(data.map(c => c.studentId)).size;

    setStats({
      totalSessions,
      totalHours: parseFloat(totalHours.toFixed(1)),
      averageRating: parseFloat(averageRating.toFixed(1)),
      upcomingSessions,
      uniqueStudents
    });
  };

  const generateMonthlyData = (data: Communication[]) => {
    if (!data) return;
    const monthData: { [key: string]: number } = {};
    data.forEach(comm => {
      const month = new Date(comm.date).toLocaleString('default', { month: 'short' });
      monthData[month] = (monthData[month] || 0) + 1;
    });
    setMonthlyData(Object.entries(monthData).map(([name, value]) => ({ name, value })));
  };

  const handleSortClick = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };
  
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };
  
  const handleNewMeetingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { id: string; value: string } }) => {
    const { id, value } = e.target;
    setNewMeeting(prev => ({ ...prev, [id]: value }));
  };

  const handleNewMeetingSelectChange = (id: keyof NewMeeting, value: string) => {
    setNewMeeting(prev => ({ ...prev, [id]: value }));
  };

  const createMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMeeting.studentId) {
      toast.error('Please select a student.');
      return;
    }

    const { date, time, ...restOfMeeting } = newMeeting;
    const meetingTimestamp = Timestamp.fromDate(new Date(`${date}T${time}`));

    try {
      await addDoc(collection(db, 'meetings'), {
        ...restOfMeeting,
        date: meetingTimestamp,
        mentorId: currentUser.uid,
        mentorName: currentUser.displayName || 'Mentor',
        status: 'scheduled',
        createdAt: serverTimestamp()
      });
      toast.success('Meeting created successfully!');
      setShowNewMeetingModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create meeting.');
    }
  };

  const handleUpdateMeeting = async (meetingId: string, status: 'completed' | 'canceled', duration?: number, rating?: number, notes?: string) => {
    const meetingRef = doc(db, "meetings", meetingId);
    try {
      const updateData: any = { status, updatedAt: serverTimestamp() };
      if (duration) updateData.duration = duration;
      if (rating) updateData.rating = rating;
      if (notes) updateData.notes = notes;

      await updateDoc(meetingRef, updateData);
      toast.success(`Meeting marked as ${status}.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update meeting.');
    }
  };
  
  const exportData = () => {
    if (!communications.length) return;
    
    const headers = ['Student', 'Type', 'Topic', 'Date', 'Time', 'Duration', 'Status', 'Rating', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...communications.map(comm => [
        comm.student,
        comm.type,
        `"${comm.topic.replace(/"/g, '""')}"`, // Handle quotes in topic
        comm.date,
        comm.time,
        comm.duration || 0,
        comm.status,
        comm.rating || 0,
        `"${(comm.notes || '').replace(/"/g, '""')}"` // Handle quotes in notes
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `communications_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center">
        <p>Please sign in to access the Communication Tracker.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Communication Tracker</h1>
        <p className="text-gray-600">Track, analyze, and manage your student interactions and mentorship sessions</p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-8">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{stats.totalSessions}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Hours Mentored</h3>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
            <div className="flex items-center">
              <span className="text-yellow-500">★</span>
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Upcoming</h3>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{stats.upcomingSessions}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Unique Students</h3>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{stats.uniqueStudents}</p>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold flex items-center">
            <BarChart className="h-5 w-5 text-blue-600 mr-2" />
            Communication Analytics
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={exportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
        
        <div className="h-64 flex items-end justify-between space-x-2">
          {monthlyData.map((data, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="bg-blue-500 hover:bg-blue-600 rounded-t w-full transition-all cursor-pointer relative group"
                style={{ height: `${data.value > 0 ? (data.value * 20) + 20 : 8}px` }}
              >
                {data.value > 0 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {data.value} sessions
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 mt-2">{data.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by student name or topic..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedPeriod === 'all' ? 'default' : 'outline'} 
              className={selectedPeriod === 'all' ? 'bg-blue-600' : ''} 
              onClick={() => setSelectedPeriod('all')}
            >
              All Time
            </Button>
            <Button 
              variant={selectedPeriod === 'month' ? 'default' : 'outline'} 
              className={selectedPeriod === 'month' ? 'bg-blue-600' : ''} 
              onClick={() => setSelectedPeriod('month')}
            >
              Last Month
            </Button>
            <Button 
              variant={selectedPeriod === 'week' ? 'default' : 'outline'} 
              className={selectedPeriod === 'week' ? 'bg-blue-600' : ''} 
              onClick={() => setSelectedPeriod('week')}
            >
              Last Week
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <div className="border-t pt-4 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Communication Type</label>
              <select 
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="mentorship">Mentorship</option>
                <option value="project">Project Collaboration</option>
                <option value="career">Career Guidance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By Rating</label>
              <select 
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                onChange={(e) => {
                  setSortBy('rating');
                  setSortOrder(e.target.value as 'asc' | 'desc');
                }}
              >
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Add New Communication Button */}
      <div className="mb-6">
        <Button 
          className="flex items-center bg-blue-600"
          onClick={() => setShowNewMeetingModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule New Meeting
        </Button>
      </div>

      {/* Communication List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Communication History</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Loading communications...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                    <button 
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSortClick('student')}
                    >
                      Student {getSortIcon('student')}
                    </button>
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                    Type / Topic
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                    <button 
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSortClick('date')}
                    >
                      Date {getSortIcon('date')}
                    </button>
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                    Duration
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                    <button 
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSortClick('rating')}
                    >
                      Rating {getSortIcon('rating')}
                    </button>
                  </th>
                  <th className="relative py-3 px-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {communications.map((comm) => (
                  <tr key={comm.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{comm.student}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          comm.type === 'mentorship' ? 'bg-purple-100 text-purple-800' :
                          comm.type === 'project' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {comm.type?.charAt(0).toUpperCase() + comm.type?.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500 mt-1">{comm.topic}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">{formatDate(comm.date)}</div>
                      <div className="text-sm text-gray-500">{comm.time}</div>
                    </td>
                    <td className="py-4 px-6">
                      {comm.status === 'completed' ? (
                        <span className="text-sm text-gray-900">{comm.duration} min</span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        comm.status === 'completed' ? 'bg-green-100 text-green-800' :
                        comm.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {comm.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {comm.status === 'cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                        {comm.status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
                        {comm.status?.charAt(0).toUpperCase() + comm.status?.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {comm.rating > 0 ? (
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          <span>{comm.rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button size="sm" variant="outline" className="flex items-center text-xs">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
                {communications.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No communication records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex items-center justify-between p-6 border-t">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{communications.length}</span> communications
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>

      {/* New Meeting Modal */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Schedule New Meeting</h3>
              <button 
                onClick={() => setShowNewMeetingModal(false)} 
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={createMeeting} className="p-4">
              {/* Student Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                {loadingStudents ? (
                  <p className="text-sm text-gray-500">Loading students...</p>
                ) : (
                  <select
                    name="student"
                    value={newMeeting.student}
                    onChange={handleNewMeetingChange}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.name}>{student.name}</option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* Meeting Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
                <select
                  name="type"
                  value={newMeeting.type}
                  onChange={handleNewMeetingChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                  required
                >
                  <option value="mentorship">Mentorship</option>
                  <option value="project">Project Collaboration</option>
                  <option value="career">Career Guidance</option>
                </select>
              </div>
              
              {/* Topic */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <Input
                  type="text"
                  name="topic"
                  value={newMeeting.topic}
                  onChange={handleNewMeetingChange}
                  placeholder="What will you discuss?"
                  required
                />
              </div>
              
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <Input
                    type="date"
                    name="date"
                    value={newMeeting.date}
                    onChange={handleNewMeetingChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <Input
                    type="time"
                    name="time"
                    value={newMeeting.time}
                    onChange={handleNewMeetingChange}
                    required
                  />
                </div>
              </div>
              
              {/* Expected Duration */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Duration (minutes)
                </label>
                <Input
                  type="number"
                  name="expectedDuration"
                  value={newMeeting.expectedDuration}
                  onChange={handleNewMeetingChange}
                  min="5"
                  max="240"
                  required
                />
              </div>
              
              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Notes (optional)
                </label>
                <Textarea
                  id="notes"
                  placeholder="Enter meeting notes..."
                  className="w-full"
                  rows={3}
                  value={newMeeting.notes}
                  onChange={handleNewMeetingChange}
                />
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewMeetingModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600">
                  <Save className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationTracker;