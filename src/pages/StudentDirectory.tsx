import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  GraduationCap,
  Mail,
  MessageCircle,
  ArrowUpRight,
  User,
  Code
} from 'lucide-react';

interface StudentData {
  id: string;
  fullName: string;
  email: string;
  branch?: string;
  year?: string;
  profilePicture?: string;
  skills?: string[];
  bio?: string;
  interests?: string[];
  projects?: {
    title: string;
    description: string;
    technologies: string[];
  }[];
}

const StudentDirectory: React.FC = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [filters, setFilters] = useState({
    branch: '',
    year: '',
    skills: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const navigate = useNavigate();

  // Branch options for filter
  const branches = [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering'
  ];

  // Years for year filter
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const studentsRef = collection(db, 'students');
        const q = query(
          studentsRef,
          orderBy('fullName'),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        const studentsData: StudentData[] = [];
        
        querySnapshot.forEach((doc) => {
          studentsData.push({
            id: doc.id,
            ...doc.data() as StudentData
          });
        });

        if (querySnapshot.docs.length > 0) {
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        }

        setStudents(studentsData);
        setFilteredStudents(studentsData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Load more students
  const loadMoreStudents = async () => {
    if (!lastVisible) return;
    
    try {
      const studentsRef = collection(db, 'students');
      const q = query(
        studentsRef,
        orderBy('fullName'),
        startAfter(lastVisible),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const newStudentsData: StudentData[] = [];
      
      querySnapshot.forEach((doc) => {
        newStudentsData.push({
          id: doc.id,
          ...doc.data() as StudentData
        });
      });

      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setStudents(prevStudents => [...prevStudents, ...newStudentsData]);
        
        // Apply current filters to combined data
        const combinedData = [...students, ...newStudentsData];
        applyFilters(combinedData, searchQuery, filters);
      }
    } catch (error) {
      console.error("Error loading more students:", error);
    }
  };

  useEffect(() => {
    applyFilters(students, searchQuery, filters);
  }, [searchQuery, filters, students]);

  const applyFilters = (studentsList: StudentData[], query: string, filterOptions: typeof filters) => {
    let results = [...studentsList];
    
    // Apply search query
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      results = results.filter(
        student => 
          (student.fullName && student.fullName.toLowerCase().includes(lowercaseQuery)) || 
          (student.branch && student.branch.toLowerCase().includes(lowercaseQuery)) ||
          (student.skills && Array.isArray(student.skills) && student.skills.some(skill => skill.toLowerCase().includes(lowercaseQuery)))
      );
    }
    
    // Apply filters
    if (filterOptions.branch) {
      results = results.filter(student => student.branch === filterOptions.branch);
    }
    
    if (filterOptions.year) {
      results = results.filter(student => student.year === filterOptions.year);
    }
    
    if (filterOptions.skills) {
      results = results.filter(
        student => student.skills && Array.isArray(student.skills) && 
        student.skills.some(skill => skill.toLowerCase().includes(filterOptions.skills.toLowerCase()))
      );
    }
    
    setFilteredStudents(results);
  };

  const resetFilters = () => {
    setFilters({
      branch: '',
      year: '',
      skills: ''
    });
    setSearchQuery('');
  };

  const handleStudentSelect = (student: StudentData) => {
    setSelectedStudent(student);
  };

  const closeStudentDetail = () => {
    setSelectedStudent(null);
  };

  const handleContactStudent = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Student Directory</h1>
        <p className="text-gray-600">
          Browse and connect with BVRIT students, find project collaborators, and discover student talent.
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
              placeholder="Search by name, branch or skills..."
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
          <div className="pt-4 border-t mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
            
            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select 
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: e.target.value})}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <Input
                type="text"
                placeholder="e.g. React, Python, Machine Learning"
                value={filters.skills}
                onChange={(e) => setFilters({...filters, skills: e.target.value})}
                className="w-full"
              />
            </div>
            
            {/* Reset Filters */}
            <div className="col-span-1 md:col-span-3 flex justify-end">
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

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-t-blue-600 border-b-blue-600 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading students...</p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4">
              {filteredStudents.length} {filteredStudents.length === 1 ? 'Result' : 'Results'}
            </h2>
            
            {filteredStudents.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-2">No students found matching your criteria</p>
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
                  {filteredStudents.map((student) => (
                    <div 
                      key={student.id}
                      onClick={() => handleStudentSelect(student)}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md cursor-pointer transition-shadow"
                    >
                      <div className="flex items-center mb-4">
                        <div className="flex-shrink-0">
                          {student.profilePicture ? (
                            <img 
                              src={student.profilePicture} 
                              alt={student.fullName} 
                              className="w-14 h-14 rounded-full object-cover" 
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">
                                {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-lg">{student.fullName}</h3>
                          <p className="text-gray-600 text-sm">{student.year || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {student.branch && (
                          <div className="flex items-start">
                            <GraduationCap size={16} className="mt-1 text-gray-500 mr-2 flex-shrink-0" />
                            <p className="text-sm">{student.branch}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Skills */}
                      {student.skills && Array.isArray(student.skills) && student.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {student.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                          {student.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{student.skills.length - 3} more</Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-end items-center">
                        <Button size="sm" variant="ghost" className="text-blue-600">
                          View Profile <ArrowUpRight size={14} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Load More Button */}
                {filteredStudents.length < students.length || lastVisible ? (
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={loadMoreStudents}
                      variant="outline"
                      disabled={!lastVisible}
                    >
                      Load More Students
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {selectedStudent.profilePicture ? (
                    <img 
                      src={selectedStudent.profilePicture} 
                      alt={selectedStudent.fullName} 
                      className="w-16 h-16 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">
                        {selectedStudent.fullName ? selectedStudent.fullName.charAt(0).toUpperCase() : 'S'}
                      </span>
                    </div>
                  )}
                  <div className="ml-4">
                    <h2 className="text-xl font-bold">{selectedStudent.fullName}</h2>
                    <p className="text-gray-600">{selectedStudent.branch} • {selectedStudent.year}</p>
                  </div>
                </div>
                <button 
                  onClick={closeStudentDetail}
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
                  {selectedStudent.bio && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">About</h3>
                      <p className="text-gray-700">{selectedStudent.bio}</p>
                    </div>
                  )}
                  
                  {/* Academic Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Academic Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <GraduationCap size={18} className="text-gray-500 mr-3 mt-1" />
                        <div>
                          <p className="font-medium">{selectedStudent.branch}</p>
                          <p className="text-sm text-gray-600">{selectedStudent.year}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Skills */}
                  {selectedStudent.skills && Array.isArray(selectedStudent.skills) && selectedStudent.skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.skills.map((skill, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Interests */}
                  {selectedStudent.interests && Array.isArray(selectedStudent.interests) && selectedStudent.interests.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.interests.map((interest, index) => (
                          <Badge key={index} variant="outline" className="text-gray-700 hover:bg-gray-100">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Projects */}
                  {selectedStudent.projects && Array.isArray(selectedStudent.projects) && selectedStudent.projects.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Projects</h3>
                      <div className="space-y-4">
                        {selectedStudent.projects.map((project, index) => (
                          <div key={index} className="border-l-2 border-gray-200 pl-4">
                            <p className="font-medium">{project.title}</p>
                            <p className="text-sm text-gray-700 mb-2">{project.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {project.technologies.map((tech, techIndex) => (
                                <Badge key={techIndex} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
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
                      {selectedStudent.email && (
                        <div className="flex items-center">
                          <Mail size={16} className="text-gray-500 mr-2" />
                          <a href={`mailto:${selectedStudent.email}`} className="text-blue-600 hover:underline">
                            {selectedStudent.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div>
                    <Button 
                      className="w-full mb-2"
                      onClick={() => selectedStudent.email && handleContactStudent(selectedStudent.email)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Student
                    </Button>
                    <Button variant="outline" className="w-full mb-2">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button variant="ghost" className="w-full text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      View Full Profile
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

export default StudentDirectory;