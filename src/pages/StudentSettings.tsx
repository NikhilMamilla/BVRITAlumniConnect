import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Mail, 
  Lock, 
  Trash2, 
  Save,
  Globe,
  EyeOff,
  CheckCircle,
  X,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { 
  updateEmail, 
  updatePassword, 
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  signOut
} from 'firebase/auth';
import { db, auth } from '@/firebase';
import { useNavigate } from 'react-router-dom';

const StudentSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form fields
  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    branch: '',
    year: '',
    areasOfInterest: [],
    technicalSkills: [],
    linkedInUrl: '',
    githubUrl: '',
    lookingFor: [],
    profileVisibility: 'all', // public, alumni, none
    emailVisibility: 'mentors', // all, mentors, none
    allowMentorshipRequests: true,
    allowEventNotifications: true,
    allowOpportunityNotifications: true,
    allowCommunityNotifications: true
  });

  // Security form fields
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: ''
  });

  // Get current user and profile data
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      setUser(auth.currentUser);
      try {
        // First try to get document by user ID
        const userDocRef = doc(db, 'students', auth.currentUser.uid);
        let userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          // If not found by user.uid, try to find by userId field
          const studentsRef = collection(db, 'students');
          const q = query(studentsRef, where('userId', '==', auth.currentUser.uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            userDocSnap = querySnapshot.docs[0];
          } else {
            setMessage({ type: 'error', text: 'Profile not found. Please complete your profile setup.' });
            navigate('/profile/setup');
            return;
          }
        }
        
        const profileData = userDocSnap.data();
        setProfile(profileData);
        
        // Populate form data
        setFormData({
          fullName: profileData.fullName || '',
          rollNumber: profileData.rollNumber || '',
          branch: profileData.branch || '',
          year: profileData.year || '',
          areasOfInterest: profileData.areasOfInterest || [],
          technicalSkills: profileData.technicalSkills || [],
          linkedInUrl: profileData.linkedInUrl || '',
          githubUrl: profileData.githubUrl || '',
          lookingFor: profileData.lookingFor || [],
          profileVisibility: profileData.settings?.profileVisibility || 'all',
          emailVisibility: profileData.settings?.emailVisibility || 'mentors',
          allowMentorshipRequests: profileData.settings?.allowMentorshipRequests !== false,
          allowEventNotifications: profileData.settings?.allowEventNotifications !== false,
          allowOpportunityNotifications: profileData.settings?.allowOpportunityNotifications !== false,
          allowCommunityNotifications: profileData.settings?.allowCommunityNotifications !== false
        });
        
        setSecurityForm({
          ...securityForm,
          newEmail: auth.currentUser.email
        });
        
      } catch (error) {
        console.error("Error fetching profile:", error);
        setMessage({ type: 'error', text: 'Failed to load profile data. Please try again.' });
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, [navigate]);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle multi-select fields
  const handleMultiSelectChange = (field, value) => {
    if (formData[field].includes(value)) {
      // Remove if already exists
      setFormData({
        ...formData,
        [field]: formData[field].filter(item => item !== value)
      });
    } else {
      // Add if doesn't exist
      setFormData({
        ...formData,
        [field]: [...formData[field], value]
      });
    }
  };

  // Handle security form changes
  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityForm({
      ...securityForm,
      [name]: value
    });
  };

  // Save profile settings
  const saveProfileSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const userDocRef = doc(db, 'students', user.uid);
      
      // Update the settings in the user profile
      await updateDoc(userDocRef, {
        fullName: formData.fullName,
        rollNumber: formData.rollNumber,
        branch: formData.branch,
        year: formData.year,
        areasOfInterest: formData.areasOfInterest,
        technicalSkills: formData.technicalSkills,
        linkedInUrl: formData.linkedInUrl,
        githubUrl: formData.githubUrl,
        lookingFor: formData.lookingFor,
        settings: {
          profileVisibility: formData.profileVisibility,
          emailVisibility: formData.emailVisibility,
          allowMentorshipRequests: formData.allowMentorshipRequests,
          allowEventNotifications: formData.allowEventNotifications,
          allowOpportunityNotifications: formData.allowOpportunityNotifications,
          allowCommunityNotifications: formData.allowCommunityNotifications,
          lastUpdated: new Date()
        }
      });
      
      setMessage({ type: 'success', text: 'Profile settings updated successfully!' });
    } catch (error) {
      console.error("Error updating settings:", error);
      setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Update email address
  const updateEmailAddress = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Check if email is changed
      if (securityForm.newEmail === user.email) {
        setMessage({ type: 'info', text: 'New email is the same as current email.' });
        setSaving(false);
        return;
      }
      
      // Check if email ends with @bvrit.ac.in
      if (!securityForm.newEmail.endsWith('@bvrit.ac.in')) {
        setMessage({ type: 'error', text: 'Email must end with @bvrit.ac.in' });
        setSaving(false);
        return;
      }
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        securityForm.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await updateEmail(user, securityForm.newEmail);
      
      setMessage({ type: 'success', text: 'Email updated successfully! Please verify your new email address.' });
      
      // Clear password field
      setSecurityForm({
        ...securityForm,
        currentPassword: ''
      });
    } catch (error) {
      console.error("Error updating email:", error);
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'Incorrect current password.' });
      } else if (error.code === 'auth/email-already-in-use') {
        setMessage({ type: 'error', text: 'Email already in use by another account.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update email. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  // Update password
  const updateUserPassword = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Check if passwords match
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        setSaving(false);
        return;
      }
      
      // Check password strength
      if (securityForm.newPassword.length < 8) {
        setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
        setSaving(false);
        return;
      }
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        securityForm.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, securityForm.newPassword);
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      
      // Clear password fields
      setSecurityForm({
        ...securityForm,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'Incorrect current password.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update password. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  
  const initiateAccountDeletion = () => {
    setShowDeleteConfirm(true);
  };
  
  const cancelAccountDeletion = () => {
    setShowDeleteConfirm(false);
    setDeletePassword('');
  };
  
  const confirmAccountDeletion = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        deletePassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Delete user data from Firestore
      // 1. Delete mentorship requests
      const mentorshipRef = collection(db, 'students', user.uid, 'mentorships');
      const mentorshipSnapshot = await getDocs(mentorshipRef);
      
      for (const docSnapshot of mentorshipSnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }
      
      // 2. Delete notifications
      const notificationsRef = collection(db, 'students', user.uid, 'notifications');
      const notificationsSnapshot = await getDocs(notificationsRef);
      
      for (const docSnapshot of notificationsSnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }
      
      // 3. Delete user profile
      await deleteDoc(doc(db, 'students', user.uid));
      
      // 4. Delete authentication account
      await deleteUser(user);
      
      // Redirect to landing page
      navigate('/');
    } catch (error) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'Incorrect password.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' });
      }
      setShowDeleteConfirm(false);
      setDeletePassword('');
    } finally {
      setSaving(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      setMessage({ type: 'error', text: 'Failed to sign out. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 mb-6 rounded-lg flex items-center justify-between ${
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          <div className="flex items-center">
            {message.type === 'error' && <X className="w-5 h-5 mr-2" />}
            {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
            {message.type === 'info' && <Info className="w-5 h-5 mr-2" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-gray-600 hover:text-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-6 font-medium ${
            activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-3 px-6 font-medium ${
            activeTab === 'notifications' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`py-3 px-6 font-medium ${
            activeTab === 'privacy' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
          }`}
        >
          <EyeOff className="w-4 h-4 inline mr-2" />
          Privacy
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-3 px-6 font-medium ${
            activeTab === 'security' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Security
        </button>
      </div>
      
      {/* Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Branch</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics & Communications (ECE)</option>
                <option value="EEE">Electrical & Electronics (EEE)</option>
                <option value="MECH">Mechanical Engineering</option>
                <option value="CIVIL">Civil Engineering</option>
                <option value="CHEM">Chemical Engineering</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Areas of Interest</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                'Web Development',
                'Mobile Development',
                'AI/ML',
                'Data Science',
                'Cloud Computing',
                'IoT',
                'Cybersecurity',
                'UI/UX Design',
                'Blockchain',
                'DevOps',
                'Quantum Computing',
                'AR/VR'
              ].map(area => (
                <div key={area} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`interest-${area}`}
                    checked={formData.areasOfInterest.includes(area)}
                    onChange={() => handleMultiSelectChange('areasOfInterest', area)}
                    className="mr-2"
                  />
                  <label htmlFor={`interest-${area}`} className="text-sm">{area}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Technical Skills</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'JavaScript',
                'Python',
                'Java',
                'C++',
                'React',
                'Angular',
                'Vue',
                'Node.js',
                'Express',
                'Django',
                'Flask',
                'SpringBoot',
                'AWS',
                'Azure',
                'GCP',
                'Docker',
                'Kubernetes',
                'MongoDB',
                'PostgreSQL',
                'MySQL'
              ].map(skill => (
                <div key={skill} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`skill-${skill}`}
                    checked={formData.technicalSkills.includes(skill)}
                    onChange={() => handleMultiSelectChange('technicalSkills', skill)}
                    className="mr-2"
                  />
                  <label htmlFor={`skill-${skill}`} className="text-sm">{skill}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile URL</label>
              <input
                type="text"
                name="linkedInUrl"
                value={formData.linkedInUrl}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/username"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Profile URL</label>
              <input
                type="text"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleInputChange}
                placeholder="https://github.com/username"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">I'm Looking For</label>
            <div className="flex flex-wrap gap-3">
              {['Mentorship', 'Internships', 'Career Guidance', 'Project Collaboration', 'Full-time Job'].map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleMultiSelectChange('lookingFor', item)}
                  className={`px-4 py-2 rounded-full text-sm ${
                    formData.lookingFor.includes(item)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button
              onClick={saveProfileSettings}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 flex items-center"
            >
              {saving ? 'Saving...' : 'Save Changes'}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium mb-4">Notification Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Mentorship Requests</h3>
                <p className="text-sm text-gray-600">Receive notifications when alumni respond to your mentorship requests</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="allowMentorshipRequests"
                  checked={formData.allowMentorshipRequests}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Event Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications about upcoming events and webinars</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="allowEventNotifications"
                  checked={formData.allowEventNotifications}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Opportunity Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications about new job and internship opportunities</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="allowOpportunityNotifications"
                  checked={formData.allowOpportunityNotifications}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Community Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications about activity in your communities</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="allowCommunityNotifications"
                  checked={formData.allowCommunityNotifications}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button
              onClick={saveProfileSettings}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 flex items-center"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium mb-4">Privacy Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
              <p className="text-sm text-gray-500 mb-3">Choose who can see your profile information</p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="visibility-all"
                    name="profileVisibility"
                    value="all"
                    checked={formData.profileVisibility === 'all'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="visibility-all" className="text-sm">
                    <span className="font-medium">All BVRIT Members</span> - Students and Alumni can view your profile
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="visibility-alumni"
                    name="profileVisibility"
                    value="alumni"
                    checked={formData.profileVisibility === 'alumni'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="visibility-alumni" className="text-sm">
                    <span className="font-medium">Alumni Only</span> - Only alumni can view your profile
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="visibility-none"
                    name="profileVisibility"
                    value="none"
                    checked={formData.profileVisibility === 'none'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="visibility-none" className="text-sm">
                    <span className="font-medium">Private</span> - Only you can view your profile
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Visibility</label>
              <p className="text-sm text-gray-500 mb-3">Choose who can see your email address</p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="email-all"
                    name="emailVisibility"
                    value="all"
                    checked={formData.emailVisibility === 'all'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="email-all" className="text-sm">
                    <span className="font-medium">All BVRIT Members</span> - Students and Alumni can see your email
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="email-mentors"
                    name="emailVisibility"
                    value="mentors"
                    checked={formData.emailVisibility === 'mentors'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="email-mentors" className="text-sm">
                    <span className="font-medium">Mentors Only</span> - Only alumni mentors can see your email
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="email-none"
                    name="emailVisibility"
                    value="none"
                    checked={formData.emailVisibility === 'none'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="email-none" className="text-sm">
                    <span className="font-medium">Private</span> - No one can see your email
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button
              onClick={saveProfileSettings}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 flex items-center"
            >
              {saving ? 'Saving...' : 'Save Privacy Settings'}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium mb-4">Security Settings</h2>
          
          <div className="border rounded-lg p-4 mb-6">
            <h3 className="text-md font-medium mb-4">Change Email Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={securityForm.currentPassword}
                  onChange={handleSecurityChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Email Address</label>
                <input
                  type="email"
                  name="newEmail"
                  value={securityForm.newEmail}
                  onChange={handleSecurityChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Must end with @bvrit.ac.in</p>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={updateEmailAddress}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center"
                >
                  {saving ? 'Updating...' : 'Update Email'}
                  <Mail className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 mb-6">
            <h3 className="text-md font-medium mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={securityForm.currentPassword}
                  onChange={handleSecurityChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={securityForm.newPassword}
                  onChange={handleSecurityChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={securityForm.confirmPassword}
                  onChange={handleSecurityChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={updateUserPassword}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                  <Lock className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 border-red-200 bg-red-50">
            <h3 className="text-md font-medium mb-2 text-red-700">Delete Account</h3>
            <p className="text-sm text-red-600 mb-4">
              Deleting your account will permanently remove all your data. This action cannot be undone.
            </p>
            
            {showDeleteConfirm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter Your Password to Confirm</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={confirmAccountDeletion}
                    disabled={saving}
                    className="bg-red-600 hover:bg-red-700 flex items-center"
                  >
                    {saving ? 'Processing...' : 'Confirm Deletion'}
                    <Trash2 className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    onClick={cancelAccountDeletion}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={initiateAccountDeletion}
                className="bg-red-600 hover:bg-red-700 flex items-center"
              >
                Delete Account
                <Trash2 className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSignOut}
              className="bg-gray-600 hover:bg-gray-700 flex items-center"
            >
              Sign Out
              <Globe className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSettings;