import React, { useState, useEffect } from 'react';
import { 
  User, 
  Edit, 
  Save, 
  Plus, 
  X, 
  FileText, 
  Camera, 
  Mail, 
  Book, 
  Calendar, 
  School, 
  Star, 
  Upload, 
  Trash,
  Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";
import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  setDoc,
  deleteField
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const StudentProfile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState({
    fullName: '',
    rollNumber: '',
    branch: '',
    yearOfStudy: '',
    areasOfInterest: [],
    technicalSkills: [],
    linkedInUrl: '',
    githubUrl: '',
    resumeUrl: '',
    profilePicture: '',
    email: '',
    lookingFor: [],
    bio: '',
    projects: []
  });
  
  const [newInterest, setNewInterest] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newLookingFor, setNewLookingFor] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [newProject, setNewProject] = useState({ title: '', description: '', url: '' });
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const branchOptions = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI & ML', 'DATA SCIENCE', 'CHEMICAL', 'OTHER'];
  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const lookingForOptions = ['Mentorship', 'Internships', 'Career Guidance', 'Projects', 'Research Opportunities'];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchUserProfile(user.uid);
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const fetchUserProfile = async (userId) => {
    setIsLoading(true);
    try {
      // First try to get document by user ID
      const userDocRef = doc(db, 'students', userId);
      let userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        // If not found by user.uid, try to find by userId field
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          userDocSnap = querySnapshot.docs[0];
        } else {
          console.log("No profile found for this user");
          // Create default profile
          await setDoc(userDocRef, {
            userId: userId,
            email: auth.currentUser.email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          userDocSnap = await getDoc(userDocRef);
        }
      }
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setProfileData({
          fullName: data.fullName || '',
          rollNumber: data.rollNumber || '',
          branch: data.branch || '',
          yearOfStudy: data.yearOfStudy || '',
          areasOfInterest: data.areasOfInterest || [],
          technicalSkills: data.technicalSkills || [],
          linkedInUrl: data.linkedInUrl || '',
          githubUrl: data.githubUrl || '',
          resumeUrl: data.resumeUrl || '',
          profilePicture: data.profilePicture || '',
          email: data.email || auth.currentUser.email,
          lookingFor: data.lookingFor || [],
          bio: data.bio || '',
          projects: data.projects || []
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUpdateError("Failed to load profile data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim() !== '' && !profileData.areasOfInterest.includes(newInterest.trim())) {
      setProfileData({
        ...profileData,
        areasOfInterest: [...profileData.areasOfInterest, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest) => {
    setProfileData({
      ...profileData,
      areasOfInterest: profileData.areasOfInterest.filter(item => item !== interest)
    });
  };

  const handleAddSkill = () => {
    if (newSkill.trim() !== '' && !profileData.technicalSkills.includes(newSkill.trim())) {
      setProfileData({
        ...profileData,
        technicalSkills: [...profileData.technicalSkills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setProfileData({
      ...profileData,
      technicalSkills: profileData.technicalSkills.filter(item => item !== skill)
    });
  };

  const handleLookingForChange = (option) => {
    if (profileData.lookingFor.includes(option)) {
      setProfileData({
        ...profileData,
        lookingFor: profileData.lookingFor.filter(item => item !== option)
      });
    } else {
      setProfileData({
        ...profileData,
        lookingFor: [...profileData.lookingFor, option]
      });
    }
  };

  const handleAddProject = () => {
    if (newProject.title.trim() !== '' && newProject.description.trim() !== '') {
      setProfileData({
        ...profileData,
        projects: [...profileData.projects, { ...newProject, id: Date.now().toString() }]
      });
      setNewProject({ title: '', description: '', url: '' });
      setIsAddingProject(false);
    }
  };

  const handleRemoveProject = (projectId) => {
    setProfileData({
      ...profileData,
      projects: profileData.projects.filter(project => project.id !== projectId)
    });
  };

  const handleResumeChange = (e) => {
    if (e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleProfilePicChange = (e) => {
    if (e.target.files[0]) {
      setProfilePicFile(e.target.files[0]);
    }
  };

  const uploadProfilePicture = async () => {
    if (!profilePicFile) return null;
    
    try {
      const storageRef = ref(storage, `students/${currentUser.uid}/profile-picture`);
      await uploadBytes(storageRef, profilePicFile);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  };

  const uploadResume = async () => {
    if (!resumeFile) return null;
    
    try {
      const storageRef = ref(storage, `students/${currentUser.uid}/resume`);
      await uploadBytes(storageRef, resumeFile);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading resume:", error);
      throw error;
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setUpdateError('');
    setUpdateSuccess(false);
    
    try {
      const userDocRef = doc(db, 'students', currentUser.uid);
      
      let updatedData = {
        ...profileData,
        updatedAt: serverTimestamp()
      };
      
      // Upload new profile picture if selected
      if (profilePicFile) {
        const profilePicURL = await uploadProfilePicture();
        if (profilePicURL) {
          updatedData.profilePicture = profilePicURL;
        }
      }
      
      // Upload new resume if selected
      if (resumeFile) {
        const resumeURL = await uploadResume();
        if (resumeURL) {
          updatedData.resumeUrl = resumeURL;
        }
      }
      
      await updateDoc(userDocRef, updatedData);
      
      setIsEditing(false);
      setUpdateSuccess(true);
      
      // Reset file states
      setResumeFile(null);
      setProfilePicFile(null);
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error updating profile:", error);
      setUpdateError("Failed to update profile. Please try again.");
    }
  };

  const handleDeleteResume = async () => {
    if (!currentUser || !profileData.resumeUrl) return;
    
    try {
      // Delete file from storage
      const resumeRef = ref(storage, `students/${currentUser.uid}/resume`);
      await deleteObject(resumeRef);
      
      // Update Firestore document
      const userDocRef = doc(db, 'students', currentUser.uid);
      await updateDoc(userDocRef, {
        resumeUrl: deleteField()
      });
      
      // Update local state
      setProfileData({
        ...profileData,
        resumeUrl: ''
      });
      
    } catch (error) {
      console.error("Error deleting resume:", error);
      setUpdateError("Failed to delete resume. Please try again.");
    }
  };

  const getInitials = () => {
    if (!profileData.fullName) return 'ST';
    
    const nameParts = profileData.fullName.split(' ');
    const firstInitial = nameParts[0] ? nameParts[0][0] : '';
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : '';
    
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading profile data...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm mb-8 relative">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32 rounded-t-xl"></div>
        <div className="px-8 pb-8 pt-16 relative">
          {/* Profile Picture */}
          <div className="absolute -top-12 left-8">
            {profileData.profilePicture ? (
              <img 
                src={profileData.profilePicture} 
                alt="Profile" 
                className="w-24 h-24 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white">
                <span className="text-blue-600 font-bold text-2xl">{getInitials()}</span>
              </div>
            )}
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 p-2 rounded-full text-white cursor-pointer">
                <Camera className="h-4 w-4" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleProfilePicChange}
                />
              </label>
            )}
          </div>
          
          {/* Edit/Save Button */}
          <div className="absolute top-4 right-4">
            {isEditing ? (
              <Button
                onClick={handleSaveProfile}
                className="flex items-center bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="mt-4">
            {isEditing ? (
              <input 
                type="text"
                value={profileData.fullName}
                onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                className="text-2xl font-bold mb-1 w-full border-b border-gray-300 focus:outline-none focus:border-blue-500"
                placeholder="Full Name"
              />
            ) : (
              <h2 className="text-2xl font-bold mb-1">{profileData.fullName || 'Complete Your Profile'}</h2>
            )}
            
            <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                {profileData.email}
              </div>
              {profileData.branch && (
                <div className="flex items-center">
                  <Book className="h-4 w-4 mr-1" />
                  {profileData.branch}
                </div>
              )}
              {profileData.yearOfStudy && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {profileData.yearOfStudy}
                </div>
              )}
              {profileData.rollNumber && (
                <div className="flex items-center">
                  <School className="h-4 w-4 mr-1" />
                  {profileData.rollNumber}
                </div>
              )}
            </div>
            
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Write a short bio about yourself..."
              />
            ) : (
              profileData.bio && (
                <p className="text-gray-700 mb-4">
                  {profileData.bio}
                </p>
              )
            )}
            
            {/* Social Links */}
            <div className="flex gap-4 mt-4">
              {isEditing ? (
                <div className="space-y-4 w-full">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={profileData.linkedInUrl}
                      onChange={(e) => setProfileData({...profileData, linkedInUrl: e.target.value})}
                      className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={profileData.githubUrl}
                      onChange={(e) => setProfileData({...profileData, githubUrl: e.target.value})}
                      className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="GitHub URL"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {profileData.linkedInUrl && (
                    <a 
                      href={profileData.linkedInUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 rounded-full"
                    >
                        <User className="h-5 w-5" />
                    </a>
                  )}
                  {profileData.githubUrl && (
                    <a 
                      href={profileData.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full"
                    >
                      <User className="h-5 w-5" />
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Success and Error Messages */}
      {updateSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Profile updated successfully!
        </div>
      )}
      
      {updateError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {updateError}
        </div>
      )}
      
      {/* Education and Basic Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <School className="h-5 w-5 text-blue-600 mr-2" />
          Education & Basic Details
        </h3>
        
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
              <input 
                type="text"
                value={profileData.rollNumber}
                onChange={(e) => setProfileData({...profileData, rollNumber: e.target.value})}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your roll number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <select
                value={profileData.branch}
                onChange={(e) => setProfileData({...profileData, branch: e.target.value})}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Branch</option>
                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year of Study</label>
              <select
                value={profileData.yearOfStudy}
                onChange={(e) => setProfileData({...profileData, yearOfStudy: e.target.value})}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Looking For</label>
              <div className="space-y-2">
                {lookingForOptions.map((option) => (
                  <div key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`looking-for-${option}`}
                      checked={profileData.lookingFor.includes(option)}
                      onChange={() => handleLookingForChange(option)}
                      className="mr-2"
                    />
                    <label htmlFor={`looking-for-${option}`}>{option}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm text-gray-500">Roll Number</h4>
              <p className="font-medium">{profileData.rollNumber || 'Not specified'}</p>
            </div>
            
            <div>
              <h4 className="text-sm text-gray-500">Branch</h4>
              <p className="font-medium">{profileData.branch || 'Not specified'}</p>
            </div>
            
            <div>
              <h4 className="text-sm text-gray-500">Year of Study</h4>
              <p className="font-medium">{profileData.yearOfStudy || 'Not specified'}</p>
            </div>
            
            <div>
              <h4 className="text-sm text-gray-500">Looking For</h4>
              {profileData.lookingFor.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {profileData.lookingFor.map((item) => (
                    <span 
                      key={item} 
                      className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-medium">Not specified</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Skills and Interests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Areas of Interest */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <Star className="h-5 w-5 text-blue-600 mr-2" />
            Areas of Interest
          </h3>
          
          {isEditing ? (
            <div>
              <div className="flex mb-4">
                <input 
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  className="flex-1 p-3 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add an interest"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                />
                <button
                  onClick={handleAddInterest}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r-md"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {profileData.areasOfInterest.map((interest, index) => (
                  <div key={index} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full flex items-center">
                    {interest}
                    <button 
                      onClick={() => handleRemoveInterest(interest)}
                      className="ml-2 text-blue-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profileData.areasOfInterest.length > 0 ? (
                profileData.areasOfInterest.map((interest, index) => (
                  <span key={index} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No areas of interest specified</p>
              )}
            </div>
          )}
        </div>
        
        {/* Technical Skills */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            Technical Skills
          </h3>
          
          {isEditing ? (
            <div>
              <div className="flex mb-4">
                <input 
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 p-3 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a skill"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <button
                  onClick={handleAddSkill}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r-md"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {profileData.technicalSkills.map((skill, index) => (
                  <div key={index} className="bg-green-100 text-green-600 px-3 py-1 rounded-full flex items-center">
                    {skill}
                    <button 
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-green-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profileData.technicalSkills.length > 0 ? (
                profileData.technicalSkills.map((skill, index) => (
                  <span key={index} className="bg-green-100 text-green-600 px-3 py-1 rounded-full">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No technical skills specified</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Resume Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          Resume
        </h3>
        
        {isEditing ? (
          <div className="space-y-4">
            {profileData.resumeUrl && (
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <span>Current Resume</span>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={profileData.resumeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    View
                  </a>
                  <button 
                    onClick={handleDeleteResume}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
            
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
              <p className="mb-2 text-sm text-gray-500">Upload a new resume (PDF preferred)</p>
              <input
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
              />
              <label 
                htmlFor="resume-upload" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-block cursor-pointer"
              >
                Browse Files
              </label>
              {resumeFile && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {resumeFile.name}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            {profileData.resumeUrl ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  <span>Resume uploaded</span></div>
                <a 
                  href={profileData.resumeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm flex items-center"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  View Resume
                </a>
              </div>
            ) : (
              <p className="text-gray-500">No resume uploaded yet</p>
            )}
          </div>
        )}
      </div>
      
      {/* Projects Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <Book className="h-5 w-5 text-blue-600 mr-2" />
          Projects
        </h3>
        
        {isEditing ? (
          <div className="space-y-6">
            {/* Existing Projects */}
            {profileData.projects.map((project, index) => (
              <div key={index} className="border rounded-md p-4 relative">
                <button 
                  onClick={() => handleRemoveProject(project.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <Trash className="h-4 w-4" />
                </button>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                  <input 
                    type="text"
                    value={project.title}
                    onChange={(e) => {
                      const updatedProjects = [...profileData.projects];
                      updatedProjects[index].title = e.target.value;
                      setProfileData({...profileData, projects: updatedProjects});
                    }}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={project.description}
                    onChange={(e) => {
                      const updatedProjects = [...profileData.projects];
                      updatedProjects[index].description = e.target.value;
                      setProfileData({...profileData, projects: updatedProjects});
                    }}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project URL (Optional)</label>
                  <input 
                    type="text"
                    value={project.url || ''}
                    onChange={(e) => {
                      const updatedProjects = [...profileData.projects];
                      updatedProjects[index].url = e.target.value;
                      setProfileData({...profileData, projects: updatedProjects});
                    }}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            ))}
            
            {/* Add New Project Form */}
            {isAddingProject ? (
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-3">Add New Project</h4>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                  <input 
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter project title"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe your project"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project URL (Optional)</label>
                  <input 
                    type="text"
                    value={newProject.url}
                    onChange={(e) => setNewProject({...newProject, url: e.target.value})}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={handleAddProject}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Project
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingProject(false);
                      setNewProject({ title: '', description: '', url: '' });
                    }}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingProject(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New Project
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {profileData.projects.length > 0 ? (
              profileData.projects.map((project, index) => (
                <div 
                  key={index} 
                  className="border rounded-md p-4 hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-lg mb-2">{project.title}</h4>
                  <p className="text-gray-600 mb-3">{project.description}</p>
                  
                  {project.url && (
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                    >
                      <Github className="h-4 w-4 mr-1" />
                      View Project
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No projects added yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;