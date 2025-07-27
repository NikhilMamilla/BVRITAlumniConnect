import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Upload, 
  Github, 
  Linkedin, 
  GraduationCap,
  BookOpen,
  Code,
  Briefcase,
  User,
  Star,
  Clock,
  Globe,
  Award,
  DollarSign
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { auth, db, storage } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AlumniProfileForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [formData, setFormData] = useState({
    // Basic Information
    fullName: '',
    email: '',
    graduationYear: '',
    branch: '',
    
    // Professional Details
    currentJobTitle: '',
    companyName: '',
    industry: '',
    yearsOfExperience: '',
    location: '',
    
    // Social Links
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    
    // Skills & Expertise
    skills: '',
    expertise: '',
    areaOfExpertise: '',
    achievements: '',
    
    // Bio & Description
    shortBio: '',
    interests: '',
    
    // Mentorship Details
    availableForMentorship: false,
    typeOfSupport: [],
    mentoringAreas: [],
    maxMentees: '5',
    preferredMeetingTypes: [],
    responseTime: 'Within 24 hours',
    
    // Fees Structure
    isFree: true,
    sessionFee: '0',
    monthlyFee: '0',
    
    // Availability
    isAvailable: true,
    availableSlots: '3',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (value, name) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked, name) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleMultiSelectChange = (value, name) => {
    setFormData(prev => {
      let currentArray = [...prev[name]];
      if (currentArray.includes(value)) {
        currentArray = currentArray.filter(item => item !== value);
      } else {
        currentArray.push(value);
      }
      return { ...prev, [name]: currentArray };
    });
  };

  const handleResumeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleProfilePictureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePictureFile(e.target.files[0]);
    }
  };

  const uploadFileToStorage = async (file, path) => {
    if (!file) return null;
    
    const fileRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to create a profile.",
            variant: "destructive",
        });
        return;
    }
    const userId = auth.currentUser.uid;

    setIsLoading(true);
    
    try {
      // Upload profile picture if exists
      const photoURL = profilePictureFile 
        ? await uploadFileToStorage(profilePictureFile, 'profile-pictures')
        : null;
      
      // Upload resume if exists
      const resumeURL = resumeFile 
        ? await uploadFileToStorage(resumeFile, 'resumes')
        : null;
      
      // Process arrays from comma-separated strings
      const skillsArray = formData.skills ? formData.skills.split(',').map(s => s.trim()) : [];
      const expertiseArray = formData.expertise ? formData.expertise.split(',').map(s => s.trim()) : [];
      const achievementsArray = formData.achievements ? formData.achievements.split(',').map(s => s.trim()) : [];
      
      // Prepare data for Firestore
      const alumniData = {
  // Basic Info - Fixed field names
  fullName: formData.fullName,          // Add this
  name: formData.fullName,              // Keep this for backward compatibility
  displayName: formData.fullName,       // Add this common field
  email: formData.email || auth.currentUser?.email || '',
  photoURL,
  graduationYear: formData.graduationYear,
  branch: formData.branch,
  
  // Professional
  position: formData.currentJobTitle,
  jobTitle: formData.currentJobTitle,   // Add this alternative field
  company: formData.companyName,
  companyName: formData.companyName,    // Add this alternative field
  industry: formData.industry,
  location: formData.location,
  experience: parseInt(formData.yearsOfExperience) || 0,
  
  // Links
  linkedinUrl: formData.linkedinUrl,
  githubUrl: formData.githubUrl,
  portfolioUrl: formData.portfolioUrl,
  
  // Skills & Expertise
  skills: skillsArray,
  expertise: expertiseArray,
  achievements: achievementsArray,
  
  // Bio
  bio: formData.shortBio,
  
  // Mentorship
  isAvailable: formData.isAvailable,
  availableForMentorship: formData.availableForMentorship,
  mentoringAreas: formData.mentoringAreas,
  preferredMeetingTypes: formData.preferredMeetingTypes,
  maxMentees: parseInt(formData.maxMentees) || 5,
  availableSlots: parseInt(formData.availableSlots) || 3,
  responseTime: formData.responseTime,
  
  // Fees
  fees: {
    isFree: formData.isFree,
    sessionFee: parseFloat(formData.sessionFee) || 0,
    monthlyFee: parseFloat(formData.monthlyFee) || 0
  },
  
  // Stats (initial values)
  rating: 0,
  totalMentees: 0,
  activeMentees: 0,
  sessionsCompleted: 0,
  testimonials: [],
  
  // System fields
  userId: auth.currentUser?.uid || 'anonymous',
  resumeURL,
  joinedDate: serverTimestamp(),
  lastActive: serverTimestamp(),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
      
      // Add document to Firestore collection with UID as the doc ID
      const profileRef = doc(db, 'alumni_profiles', userId);
      await setDoc(profileRef, alumniData);
      
      toast({
        title: "Profile Created Successfully!",
        description: "Your alumni profile has been saved to our database.",
      });
      
      navigate('/alumni/dashboard');
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const industries = [
    "Technology", "Finance", "Healthcare", "Education", "Manufacturing",
    "Retail", "Consulting", "Automotive", "Aerospace", "Telecommunications"
  ];

  const mentoringAreaOptions = [
    "Career Development", "Technical Skills", "Interview Preparation",
    "Resume Review", "Job Search Strategy", "Leadership Development",
    "Entrepreneurship", "Industry Insights", "Networking", "Skill Development"
  ];

  const meetingTypeOptions = ["Video Call", "Audio Call", "Chat", "In-Person"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center mb-4">
              <GraduationCap className="h-12 w-12 mr-4" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Alumni Profile Form</h1>
                <p className="mt-2 text-lg opacity-95">
                  Share your professional journey and connect with fellow BVRITians.
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Personal Information Section */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-800 border-b pb-3">
                  <User className="mr-3 h-6 w-6" />
                  Personal Information
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="fullName" className="text-gray-800 font-medium">Full Name</Label>
                    <Input 
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-800 font-medium">Email Address</Label>
                    <Input 
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="graduationYear" className="text-gray-800 font-medium">Graduation Year</Label>
                    <Input 
                      id="graduationYear"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter graduation year"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="branch" className="text-gray-800 font-medium">Branch</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange(value, 'branch')}
                      value={formData.branch}
                    >
                      <SelectTrigger className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <SelectValue placeholder="Select your branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science Engineering</SelectItem>
                        <SelectItem value="Information Technology">Information Technology</SelectItem>
                        <SelectItem value="Electronics & Communication">Electronics & Communication</SelectItem>
                        <SelectItem value="Electrical & Electronics">Electrical & Electronics</SelectItem>
                        <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                        <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Professional Details Section */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-800 border-b pb-3">
                  <Briefcase className="mr-3 h-6 w-6" />
                  Professional Details
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="currentJobTitle" className="text-gray-800 font-medium">Current Job Title</Label>
                    <Input 
                      id="currentJobTitle"
                      name="currentJobTitle"
                      value={formData.currentJobTitle}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter job title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName" className="text-gray-800 font-medium">Company Name</Label>
                    <Input 
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry" className="text-gray-800 font-medium">Industry</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange(value, 'industry')}
                      value={formData.industry}
                    >
                      <SelectTrigger className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="yearsOfExperience" className="text-gray-800 font-medium">Years of Experience</Label>
                    <Input 
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      type="number"
                      value={formData.yearsOfExperience}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter years of experience"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-gray-800 font-medium">Location</Label>
                    <Input 
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter location"
                    />
                  </div>
                </div>
              </div>
              
              {/* Skills & Expertise Section */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-800 border-b pb-3">
                  <Code className="mr-3 h-6 w-6" />
                  Skills & Expertise
                </h2>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="skills" className="text-gray-800 font-medium">Technical Skills</Label>
                    <Textarea 
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Java, Python, React, Machine Learning... (comma separated)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expertise" className="text-gray-800 font-medium">Areas of Expertise</Label>
                    <Textarea 
                      id="expertise"
                      name="expertise"
                      value={formData.expertise}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Web Development, AI, Cloud Computing... (comma separated)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="achievements" className="text-gray-800 font-medium">Achievements & Certifications</Label>
                    <Textarea 
                      id="achievements"
                      name="achievements"
                      value={formData.achievements}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="AWS Certified, Top Performer 2023... (comma separated)"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              {/* Professional Links Section */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-800 border-b pb-3">
                  <Globe className="mr-3 h-6 w-6" />
                  Professional Links
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="linkedinUrl" className="text-gray-800 font-medium">LinkedIn URL</Label>
                    <Input 
                      id="linkedinUrl"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="githubUrl" className="text-gray-800 font-medium">GitHub URL</Label>
                    <Input 
                      id="githubUrl"
                      name="githubUrl"
                      value={formData.githubUrl}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="portfolioUrl" className="text-gray-800 font-medium">Portfolio/Website URL</Label>
                    <Input 
                      id="portfolioUrl"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
              </div>
              
              {/* Mentorship Section */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-800 border-b pb-3">
                  <BookOpen className="mr-3 h-6 w-6" />
                  Mentorship Options
                </h2>
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="availableForMentorship" className="text-gray-800 font-medium">Available for Mentorship?</Label>
                      <p className="text-sm text-gray-500 mt-1">Toggle to indicate mentorship availability</p>
                    </div>
                    <Switch 
                      id="availableForMentorship" 
                      checked={formData.availableForMentorship} 
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'availableForMentorship')} 
                    />
                  </div>
                  
                  {formData.availableForMentorship && (
                    <>
                      <div className="space-y-4">
                        <Label className="text-gray-800 font-medium">Mentoring Areas</Label>
                        <div className="grid md:grid-cols-2 gap-3">
                          {mentoringAreaOptions.map((area) => (
                            <div key={area} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                              <Input 
                                type="checkbox" 
                                id={area.replace(/\s+/g, '').toLowerCase()} 
                                checked={formData.mentoringAreas.includes(area)}
                                onChange={() => handleMultiSelectChange(area, 'mentoringAreas')}
                                className="h-5 w-5"
                              />
                              <Label htmlFor={area.replace(/\s+/g, '').toLowerCase()} className="text-gray-800">{area}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="text-gray-800 font-medium">Preferred Meeting Types</Label>
                        <div className="grid md:grid-cols-2 gap-3">
                          {meetingTypeOptions.map((type) => (
                            <div key={type} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                              <Input 
                                type="checkbox" 
                                id={type.replace(/\s+/g, '').toLowerCase()} 
                                checked={formData.preferredMeetingTypes.includes(type)}
                                onChange={() => handleMultiSelectChange(type, 'preferredMeetingTypes')}
                                className="h-5 w-5"
                              />
                              <Label htmlFor={type.replace(/\s+/g, '').toLowerCase()} className="text-gray-800">{type}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-5">
                        <div>
                          <Label htmlFor="maxMentees" className="text-gray-800 font-medium">Max Mentees</Label>
                          <Select 
                            onValueChange={(value) => handleSelectChange(value, 'maxMentees')}
                            value={formData.maxMentees}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select max mentees" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="availableSlots" className="text-gray-800 font-medium">Available Slots</Label>
                          <Select 
                            onValueChange={(value) => handleSelectChange(value, 'availableSlots')}
                            value={formData.availableSlots}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Available slots" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="responseTime" className="text-gray-800 font-medium">Response Time</Label>
                          <Select 
                            onValueChange={(value) => handleSelectChange(value, 'responseTime')}
                            value={formData.responseTime}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Response time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Within 2 hours">Within 2 hours</SelectItem>
                              <SelectItem value="Within 12 hours">Within 12 hours</SelectItem>
                              <SelectItem value="Within 24 hours">Within 24 hours</SelectItem>
                              <SelectItem value="Within 48 hours">Within 48 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Fees Section */}
              {formData.availableForMentorship && (
                <div className="md:col-span-2">
                  <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-800 border-b pb-3">
                    <DollarSign className="mr-3 h-6 w-6" />
                    Mentorship Fees
                  </h2>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label htmlFor="isFree" className="text-gray-800 font-medium">Free Mentorship</Label>
                        <p className="text-sm text-gray-500 mt-1">Offer mentorship for free</p>
                      </div>
                      <Switch 
                        id="isFree" 
                        checked={formData.isFree} 
                        onCheckedChange={(checked) => handleSwitchChange(checked, 'isFree')} 
                      />
                    </div>
                    
                    {!formData.isFree && (
                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <Label htmlFor="sessionFee" className="text-gray-800 font-medium">Session Fee (₹)</Label>
                          <Input 
                            id="sessionFee"
                            name="sessionFee"
                            type="number"
                            value={formData.sessionFee}
                            onChange={handleInputChange}
                            className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Per session fee"
                          />
                        </div>
                        <div>
                          <Label htmlFor="monthlyFee" className="text-gray-800 font-medium">Monthly Fee (₹)</Label>
                          <Input 
                            id="monthlyFee"
                            name="monthlyFee"
                            type="number"
                            value={formData.monthlyFee}
                            onChange={handleInputChange}
                            className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Monthly fee"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Documents Section */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-800 border-b pb-3">
                  <FileText className="mr-3 h-6 w-6" />
                  Documents & Media
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <Label className="text-gray-800 font-medium block mb-4">Profile Photo</Label>
                    <div className="flex items-center gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="bg-white border-blue-300 hover:bg-blue-100"
                        onClick={() => document.getElementById('profilePicture').click()}
                      >
                        <Upload className="mr-2 h-5 w-5" />
                        {profilePictureFile ? 'Change File' : 'Upload Photo'}
                      </Button>
                      <Input
                        id="profilePicture"
                        type="file"
                        className="hidden"
                        onChange={handleProfilePictureChange}
                        accept="image/*"
                      />
                      {profilePictureFile && (
                        <span className="text-sm text-blue-700 font-medium">
                          {profilePictureFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-3">JPEG or PNG, max 5MB</p>
                  </div>
                  
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <Label className="text-gray-800 font-medium block mb-4">Resume/CV</Label>
                    <div className="flex items-center gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="bg-white border-purple-300 hover:bg-purple-100"
                        onClick={() => document.getElementById('resume').click()}
                      >
                        <Upload className="mr-2 h-5 w-5" />
                        {resumeFile ? 'Change File' : 'Upload Resume'}
                      </Button>
                      <Input
                        id="resume"
                        type="file"
                        className="hidden"
                        onChange={handleResumeChange}
                        accept=".pdf,.doc,.docx"
                      />
                      {resumeFile && (
                        <span className="text-sm text-purple-700 font-medium">
                          {resumeFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-3">PDF, DOC, or DOCX, max 10MB</p>
                  </div>
                </div>
              </div>
              
              {/* Bio Section */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-800 border-b pb-3">
                  <Star className="mr-3 h-6 w-6" />
                  About You
                </h2>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="shortBio" className="text-gray-800 font-medium">Short Bio</Label>
                    <Textarea 
                      id="shortBio"
                      name="shortBio"
                      value={formData.shortBio}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us about yourself, your journey, and what drives you..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="interests" className="text-gray-800 font-medium">Interests & Hobbies</Label>
                    <Textarea 
                      id="interests"
                      name="interests"
                      value={formData.interests}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Photography, Reading, Traveling, Open Source..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              {/* Availability Section */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-800 border-b pb-3">
                  <Clock className="mr-3 h-6 w-6" />
                  Availability Status
                </h2>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <Label htmlFor="isAvailable" className="text-gray-800 font-medium">Currently Available</Label>
                    <p className="text-sm text-gray-500 mt-1">Toggle your overall availability status</p>
                  </div>
                  <Switch 
                    id="isAvailable" 
                    checked={formData.isAvailable} 
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'isAvailable')} 
                  />
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="mt-10 pt-8 border-t">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/alumni')}
                  className="px-8 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition duration-200 hover:scale-105"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating Profile...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <GraduationCap className="mr-2 h-5 w-5" />
                      Create Alumni Profile
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AlumniProfileForm;

