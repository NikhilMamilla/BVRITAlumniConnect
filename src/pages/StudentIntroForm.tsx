import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Upload, 
  User, 
  BookOpen, 
  Code, 
  Briefcase,
  GraduationCap 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

// Firebase imports
import { db, auth, storage } from '../firebase'; // Import storage
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Use setDoc
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import storage functions

const StudentIntroForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    rollNo: '',
    branch: '',
    year: '',
    interests: '',
    skills: '',
    linkedinUrl: '',
    githubUrl: '',
    intent: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value, name) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResumeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
    }
  };

  const handleProfilePictureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, path: string) => {
      if (!file) return null;
      const fileRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      return await getDownloadURL(fileRef);
  }

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
      const photoURL = await uploadFile(profilePictureFile, `profile-pictures/${userId}`);
      const resumeURL = await uploadFile(resumeFile, `resumes/${userId}`);
      
      const studentData = {
        ...formData,
        userId,
        photoURL,
        resumeURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const studentRef = doc(db, 'students', userId);
      await setDoc(studentRef, studentData);
      
      toast({
        title: "Profile Created Successfully!",
        description: "Your profile has been created and is ready for alumni connections.",
      });
      
      navigate('/student/dashboard');
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to retrieve stored files (for future use)
  const retrieveStoredFile = (storageKey) => {
    return localStorage.getItem(storageKey);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center mb-4">
              <GraduationCap className="h-10 w-10 mr-4" />
              <h1 className="text-3xl font-bold">Student Introduction</h1>
            </div>
            <p className="text-lg opacity-90">
              Tell us about yourself so alumni can connect with you based on your interests and goals.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Information Section */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-800">
                  <User className="mr-2 h-5 w-5" />
                  Personal Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="text-gray-700">Full Name</Label>
                    <Input 
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rollNo" className="text-gray-700">Roll Number</Label>
                    <Input 
                      id="rollNo"
                      name="rollNo"
                      value={formData.rollNo}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your roll number"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Academic Details Section */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-800">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Academic Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="branch" className="text-gray-700">Branch</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange(value, 'branch')}
                      value={formData.branch}
                    >
                      <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                        <SelectValue placeholder="Select your branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSE">Computer Science Engineering</SelectItem>
                        <SelectItem value="IT">Information Technology</SelectItem>
                        <SelectItem value="ECE">Electronics & Communication</SelectItem>
                        <SelectItem value="EEE">Electrical & Electronics</SelectItem>
                        <SelectItem value="CIVIL">Civil Engineering</SelectItem>
                        <SelectItem value="MECH">Mechanical Engineering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="year" className="text-gray-700">Current Year</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange(value, 'year')}
                      value={formData.year}
                    >
                      <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                        <SelectValue placeholder="Select your year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Skills & Interests Section */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-800">
                  <Code className="mr-2 h-5 w-5" />
                  Skills & Interests
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="skills" className="text-gray-700">Technical Skills</Label>
                    <Textarea 
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Java, Python, React, Machine Learning, Data Analysis (separate with commas)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="interests" className="text-gray-700">Areas of Interest</Label>
                    <Textarea 
                      id="interests"
                      name="interests"
                      value={formData.interests}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Web Development, Artificial Intelligence, Cloud Computing (separate with commas)"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              {/* Social & Professional Links */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-800">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Professional Links
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedinUrl" className="text-gray-700">LinkedIn Profile URL</Label>
                    <Input 
                      id="linkedinUrl"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://linkedin.com/in/yourusername"
                    />
                  </div>
                  <div>
                    <Label htmlFor="githubUrl" className="text-gray-700">GitHub Profile URL</Label>
                    <Input 
                      id="githubUrl"
                      name="githubUrl"
                      value={formData.githubUrl}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                </div>
              </div>
              
              {/* File Uploads */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-800">
                  <FileText className="mr-2 h-5 w-5" />
                  Documents & Photo
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <Label htmlFor="profilePicture" className="text-gray-700 mb-2 block">Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="bg-white border-blue-200 hover:bg-blue-50"
                        onClick={() => document.getElementById('profilePicture').click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {profilePictureFile ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                      <Input
                        id="profilePicture"
                        type="file"
                        className="hidden"
                        onChange={handleProfilePictureChange}
                        accept="image/*"
                      />
                      {profilePictureFile && (
                        <span className="text-sm text-blue-700">
                          {profilePictureFile.name}
                        </span>
                      )}
                    </div>
                    {/* Preview for profile picture */}
                    {profilePicturePreview && (
                      <div className="mt-4">
                        <img 
                          src={profilePicturePreview} 
                          alt="Profile Preview" 
                          className="h-20 w-20 object-cover rounded-full border-2 border-blue-300" 
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                    <Label htmlFor="resume" className="text-gray-700 mb-2 block">Resume/CV</Label>
                    <div className="flex items-center gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="bg-white border-purple-200 hover:bg-purple-50"
                        onClick={() => document.getElementById('resume').click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {resumeFile ? 'Change Resume' : 'Upload Resume'}
                      </Button>
                      <Input
                        id="resume"
                        type="file"
                        className="hidden"
                        onChange={handleResumeChange}
                        accept=".pdf,.doc,.docx"
                      />
                      {resumeFile && (
                        <span className="text-sm text-purple-700">
                          {resumeFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Intent Selection */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-blue-800">What are you looking for?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.intent === 'Mentorship' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleSelectChange('Mentorship', 'intent')}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-3 rounded-full mb-2 ${
                        formData.intent === 'Mentorship' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                      }`}>
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <h3 className="font-medium">Mentorship</h3>
                      <p className="text-sm text-gray-500 mt-1">Get guidance from experienced alumni</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.intent === 'Internship' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleSelectChange('Internship', 'intent')}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-3 rounded-full mb-2 ${
                        formData.intent === 'Internship' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                      }`}>
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <h3 className="font-medium">Internship</h3>
                      <p className="text-sm text-gray-500 mt-1">Find internship opportunities</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.intent === 'Career guidance' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleSelectChange('Career guidance', 'intent')}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-3 rounded-full mb-2 ${
                        formData.intent === 'Career guidance' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                      }`}>
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <h3 className="font-medium">Career Guidance</h3>
                      <p className="text-sm text-gray-500 mt-1">Get advice on career paths</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="mt-10">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? "Creating Profile..." : "Create My Profile"}
              </Button>
              <p className="text-center text-gray-500 mt-4 text-sm">
                By submitting, you agree to the platform's terms and conditions.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentIntroForm;