import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Briefcase, 
  MapPin, 
  Calendar, 
  Star,
  Mail,
  ExternalLink,
  Linkedin,
  ArrowUpRight,
  GraduationCap
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  orderBy,
  limit,
  startAfter,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const AlumniDirectory = () => {
  const [alumni, setAlumni] = useState([]);
  const [filteredAlumni, setFilteredAlumni] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [filters, setFilters] = useState({
    branch: '',
    graduationYear: '',
    industry: '',
    location: '',
    availability: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [mentorshipRequested, setMentorshipRequested] = useState({});

  // Branch options for filter
  const branches = [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering'
  ];

  // Years for graduation filter
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => (currentYear - i).toString());

  // Industry options
  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Manufacturing',
    'Consulting',
    'E-commerce',
    'Automotive',
    'Energy',
    'Entertainment'
  ];

  useEffect(() => {
    const fetchAlumni = async () => {
      setIsLoading(true);
      try {
        const alumniRef = collection(db, 'alumni_profiles');
        const q = query(
          alumniRef,
          orderBy('fullName'),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        const alumniData = [];
        
        querySnapshot.forEach((doc) => {
          alumniData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        if (querySnapshot.docs.length > 0) {
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        }

        setAlumni(alumniData);
        setFilteredAlumni(alumniData);
        
        // Set up real-time listener for new alumni
        const unsubscribe = onSnapshot(
          query(alumniRef, orderBy('createdAt', 'desc'), limit(5)),
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const newAlumni = {
                  id: change.doc.id,
                  ...change.doc.data()
                };
                
                setAlumni(prevAlumni => {
                  // Check if this alumni is already in our list to avoid duplicates
                  if (!prevAlumni.find(a => a.id === newAlumni.id)) {
                    return [newAlumni, ...prevAlumni];
                  }
                  return prevAlumni;
                });
              }
            });
          },
          (error) => {
            console.error("Error in alumni real-time updates:", error);
          }
        );

        // Check existing mentorship requests
        const currentUser = auth.currentUser;
        if (currentUser) {
          const mentorshipRef = collection(db, 'students', currentUser.uid, 'mentorships');
          const mentorshipSnapshot = await getDocs(mentorshipRef);
          
          const requestedMentorships = {};
          mentorshipSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.mentorId) {
              requestedMentorships[data.mentorId] = data.status;
            }
          });
          
          setMentorshipRequested(requestedMentorships);
        }

        setIsLoading(false);
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching alumni:", error);
        setIsLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  // Load more alumni
  const loadMoreAlumni = async () => {
    if (!lastVisible) return;
    
    try {
      const alumniRef = collection(db, 'alumni_profiles');
      const q = query(
        alumniRef,
        orderBy('fullName'),
        startAfter(lastVisible),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const newAlumniData = [];
      
      querySnapshot.forEach((doc) => {
        newAlumniData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setAlumni(prevAlumni => [...prevAlumni, ...newAlumniData]);
        
        // Apply current filters to combined data
        const combinedData = [...alumni, ...newAlumniData];
        applyFilters(combinedData, searchQuery, filters);
      }
    } catch (error) {
      console.error("Error loading more alumni:", error);
    }
  };

  useEffect(() => {
    applyFilters(alumni, searchQuery, filters);
  }, [searchQuery, filters, alumni]);

  const applyFilters = (alumniList, query, filterOptions) => {
    let results = [...alumniList];
    
    // Apply search query
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      results = results.filter(
        alumni => 
          (alumni.fullName && alumni.fullName.toLowerCase().includes(lowercaseQuery)) || 
          (alumni.currentRole && alumni.currentRole.toLowerCase().includes(lowercaseQuery)) ||
          (alumni.company && alumni.company.toLowerCase().includes(lowercaseQuery)) ||
          (alumni.skills && Array.isArray(alumni.skills) && alumni.skills.some(skill => skill.toLowerCase().includes(lowercaseQuery)))
      );
    }
    
    // Apply filters
    if (filterOptions.branch) {
      results = results.filter(alumni => alumni.branch === filterOptions.branch);
    }
    
    if (filterOptions.graduationYear) {
      results = results.filter(alumni => alumni.graduationYear === filterOptions.graduationYear);
    }
    
    if (filterOptions.industry) {
      results = results.filter(alumni => alumni.industry === filterOptions.industry);
    }
    
    if (filterOptions.location) {
      results = results.filter(
        alumni => alumni.location && alumni.location.toLowerCase().includes(filterOptions.location.toLowerCase())
      );
    }
    
    if (filterOptions.availability) {
      results = results.filter(alumni => alumni.isAvailableForMentorship === true);
    }
    
    setFilteredAlumni(results);
  };

  const resetFilters = () => {
    setFilters({
      branch: '',
      graduationYear: '',
      industry: '',
      location: '',
      availability: false
    });
    setSearchQuery('');
  };

  const handleAlumniSelect = (alumni) => {
    setSelectedAlumni(alumni);
  };

  const closeAlumniDetail = () => {
    setSelectedAlumni(null);
  };

  const requestMentorship = async (mentorId) => {
    if (!auth.currentUser) return;
    
    try {
      // Update local state
      setMentorshipRequested(prev => ({
        ...prev,
        [mentorId]: 'pending'
      }));
      
      // Get current user data
      const userDoc = await getDoc(doc(db, 'students', auth.currentUser.uid));
      const userData = userDoc.data();
      
      // Add to student's mentorships collection
      const studentMentorshipRef = doc(collection(db, 'students', auth.currentUser.uid, 'mentorships'));
      await setDoc(studentMentorshipRef, {
        mentorId,
        status: 'pending',
        timestamp: new Date()
      });
      
      // Add to mentor's mentorshipRequests collection
      const mentorRequestDoc = doc(collection(db, 'alumni_profiles', mentorId, 'mentorshipRequests'));
      await setDoc(mentorRequestDoc, {
        studentId: auth.currentUser.uid,
        studentName: userData?.fullName || 'Student',
        branch: userData?.branch || '',
        year: userData?.year || '',
        status: 'pending',
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error("Error requesting mentorship:", error);
      // Reset on error
      setMentorshipRequested(prev => {
        const newState = {...prev};
        delete newState[mentorId];
        return newState;
      });
      alert("Failed to request mentorship. Please try again later.");
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Alumni Directory</h1>
        <p className="text-gray-600">
          Connect with BVRIT alumni for mentorship, networking, and career opportunities.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search by name, role, company or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
          
          {/* Filter Toggle */}
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
          </Button>
          
          {/* Apply Filters Button (Mobile) */}
          {showFilters && (
            <Button 
              onClick={() => setShowFilters(false)}
              className="md:hidden w-full"
            >
              Apply Filters
            </Button>
          )}
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <div className="pt-4 border-t mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Branch Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select 
                value={filters.branch}
                onChange={(e) => setFilters({...filters, branch: e.target.value})}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            
            {/* Graduation Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
              <select 
                value={filters.graduationYear}
                onChange={(e) => setFilters({...filters, graduationYear: e.target.value})}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select 
                value={filters.industry}
                onChange={(e) => setFilters({...filters, industry: e.target.value})}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">All Industries</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <Input
                type="text"
                placeholder="City or Country"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="w-full"
              />
            </div>
            
            {/* Available for Mentorship */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.availability}
                  onChange={(e) => setFilters({...filters, availability: e.target.checked})}
                  className="rounded text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Available for Mentorship</span>
              </label>
            </div>
            
            {/* Reset Filters */}
            <div className="col-span-1 md:col-span-5 flex justify-end">
              <Button 
                variant="ghost" 
                onClick={resetFilters}
                className="text-sm"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Alumni List */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-t-blue-600 border-b-blue-600 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading alumni...</p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4">
              {filteredAlumni.length} {filteredAlumni.length === 1 ? 'Result' : 'Results'}
            </h2>
            
            {filteredAlumni.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-2">No alumni found matching your criteria</p>
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="mt-2"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {filteredAlumni.map((alumnus) => (
                    <div 
                      key={alumnus.id}
                      onClick={() => handleAlumniSelect(alumnus)}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md cursor-pointer transition-shadow"
                    >
                      <div className="flex items-center mb-4">
                        <div className="flex-shrink-0">
                          {alumnus.profilePicture ? (
                            <img 
                              src={alumnus.profilePicture} 
                              alt={alumnus.fullName} 
                              className="w-14 h-14 rounded-full object-cover" 
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">
                                {alumnus.fullName ? alumnus.fullName.charAt(0).toUpperCase() : 'A'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-lg">{alumnus.fullName}</h3>
                          <p className="text-gray-600 text-sm">Class of {alumnus.graduationYear || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {alumnus.currentRole && (
                          <div className="flex items-start">
                            <Briefcase size={16} className="mt-1 text-gray-500 mr-2 flex-shrink-0" />
                            <p className="text-sm">{alumnus.currentRole} at {alumnus.company || 'N/A'}</p>
                          </div>
                        )}
                        
                        {alumnus.location && (
                          <div className="flex items-start">
                            <MapPin size={16} className="mt-1 text-gray-500 mr-2 flex-shrink-0" />
                            <p className="text-sm">{alumnus.location}</p>
                          </div>
                        )}
                        
                        {alumnus.branch && (
                          <div className="flex items-start">
                            <GraduationCap size={16} className="mt-1 text-gray-500 mr-2 flex-shrink-0" />
                            <p className="text-sm">{alumnus.branch}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Skills */}
                      {alumnus.skills && Array.isArray(alumnus.skills) && alumnus.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {alumnus.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                          {alumnus.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{alumnus.skills.length - 3} more</Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Mentorship Availability */}
                      <div className="mt-4 flex justify-between items-center">
                        {alumnus.isAvailableForMentorship ? (
                          <div className="flex items-center">
                            <Star size={14} className="text-yellow-500 mr-1" />
                            <span className="text-sm text-green-600">Available for mentorship</span>
                          </div>
                        ) : (
                          <div></div>
                        )}
                        <Button size="sm" variant="ghost" className="text-blue-600">
                          View Profile <ArrowUpRight size={14} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Load More Button */}
                {filteredAlumni.length < alumni.length || lastVisible ? (
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={loadMoreAlumni}
                      variant="outline"
                      disabled={!lastVisible}
                    >
                      Load More Alumni
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>

      {/* Alumni Detail Modal */}
      {selectedAlumni && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {selectedAlumni.profilePicture ? (
                    <img 
                      src={selectedAlumni.profilePicture} 
                      alt={selectedAlumni.fullName} 
                      className="w-16 h-16 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">
                        {selectedAlumni.fullName ? selectedAlumni.fullName.charAt(0).toUpperCase() : 'A'}
                      </span>
                    </div>
                  )}
                  <div className="ml-4">
                    <h2 className="text-xl font-bold">{selectedAlumni.fullName}</h2>
                    <p className="text-gray-600">{selectedAlumni.currentRole} at {selectedAlumni.company}</p>
                  </div>
                </div>
                <button 
                  onClick={closeAlumniDetail}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Bio section */}
                  {selectedAlumni.bio && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">About</h3>
                      <p className="text-gray-700">{selectedAlumni.bio}</p>
                    </div>
                  )}
                  
                  {/* Professional Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Professional Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <Briefcase size={18} className="text-gray-500 mr-3 mt-1" />
                        <div>
                          <p className="font-medium">{selectedAlumni.currentRole}</p>
                          <p className="text-sm text-gray-600">{selectedAlumni.company}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <GraduationCap size={18} className="text-gray-500 mr-3 mt-1" />
                        <div>
                          <p className="font-medium">{selectedAlumni.branch}</p>
                          <p className="text-sm text-gray-600">Class of {selectedAlumni.graduationYear}</p>
                        </div>
                      </div>
                      
                      {selectedAlumni.location && (
                        <div className="flex items-start">
                          <MapPin size={18} className="text-gray-500 mr-3 mt-1" />
                          <p>{selectedAlumni.location}</p>
                        </div>
                      )}
                      
                      {selectedAlumni.industry && (
                        <div className="flex items-start">
                          <Briefcase size={18} className="text-gray-500 mr-3 mt-1" />
                          <p>{selectedAlumni.industry}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Skills */}
                  {selectedAlumni.skills && Array.isArray(selectedAlumni.skills) && selectedAlumni.skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Skills & Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAlumni.skills.map((skill, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Experience */}
                  {selectedAlumni.experience && Array.isArray(selectedAlumni.experience) && selectedAlumni.experience.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Work Experience</h3>
                      <div className="space-y-4">
                        {selectedAlumni.experience.map((exp, index) => (
                          <div key={index} className="border-l-2 border-gray-200 pl-4">
                            <p className="font-medium">{exp.role}</p>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-sm text-gray-500">{exp.duration}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Contact & Actions Panel */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  {/* Contact Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      {selectedAlumni.email && (
                        <div className="flex items-center">
                          <Mail size={16} className="text-gray-500 mr-2" />
                          <a href={`mailto:${selectedAlumni.email}`} className="text-blue-600 hover:underline">{selectedAlumni.email}</a>
                        </div>
                      )}
                      
                      {selectedAlumni.linkedIn && (
                        <div className="flex items-center">
                          <Linkedin size={16} className="text-gray-500 mr-2" />
                          <a href={selectedAlumni.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                            LinkedIn Profile <ExternalLink size={12} className="ml-1" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Mentorship */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Mentorship</h3>
                    {selectedAlumni.isAvailableForMentorship ? (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                        <div className="flex items-center text-green-700 mb-2">
                          <Star size={16} className="mr-2" />
                          <p className="font-medium">Available for Mentorship</p>
                        </div>
                        <p className="text-sm text-green-600">This alumnus has indicated they are willing to mentor students.</p>
                      </div>
                    ) : (
                      <div className="bg-gray-100 border border-gray-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-gray-600">This alumnus may not be actively looking for mentees right now.</p>
                      </div>
                    )}
                    
                    {mentorshipRequested[selectedAlumni.id] ? (
                      <Button 
                        disabled
                        className="w-full"
                      >
                        {mentorshipRequested[selectedAlumni.id] === 'pending' ? 'Mentorship Requested' : 
                         mentorshipRequested[selectedAlumni.id] === 'accepted' ? 'Mentorship Active' : 
                         'Request Declined'}
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => requestMentorship(selectedAlumni.id)}
                        disabled={!selectedAlumni.isAvailableForMentorship}
                      >
                        Request Mentorship
                      </Button>
                    )}
                  </div>
                  
                  {/* Other Actions */}
                  <div>
                    <Button variant="outline" className="w-full mb-2">
                      Send Message
                    </Button>
                    <Button variant="ghost" className="w-full text-gray-600">
                      Save Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniDirectory;