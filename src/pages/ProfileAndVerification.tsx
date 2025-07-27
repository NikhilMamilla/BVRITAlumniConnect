import React, { useState } from 'react';
import { 
  User, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Save, 
  Upload, 
  Building2, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Github, 
  Linkedin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const ProfileAndVerification = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: 'Beere Adbhutha',
    graduationYear: '2018',
    branch: 'Computer Science Engineering',
    jobTitle: 'Senior Software Engineer',
    company: 'Google',
    industry: 'Technology',
    location: 'Hyderabad, India',
    about: 'Experienced software engineer specializing in web development and cloud computing. Passionate about mentoring students and helping them navigate their career paths in tech.',
    skills: ['React', 'Node.js', 'Firebase', 'Cloud Computing', 'JavaScript', 'TypeScript', 'AWS'],
    education: [
      { degree: 'B.Tech in Computer Science', institution: 'BVRIT Narsapur', year: '2018' },
      { degree: 'M.S. in Computer Science', institution: 'Georgia Tech', year: '2021' }
    ],
    experience: [
      { role: 'Senior Software Engineer', company: 'Google', duration: '2021 - Present', description: 'Working on cloud infrastructure and web applications.' },
      { role: 'Software Engineer', company: 'Amazon', duration: '2018 - 2021', description: 'Full-stack development for e-commerce platforms.' }
    ],
    willingToMentor: true,
    linkedinUrl: 'https://linkedin.com/in/adbhutha',
    githubUrl: 'https://github.com/adbhutha10',
    verificationStatus: 'verified' // 'pending', 'verified', 'rejected'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handleSkillChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim());
    setProfileData({
      ...profileData,
      skills
    });
  };

  const handleSaveProfile = () => {
    // Here you would typically save to Firebase
    setIsEditing(false);
    // Show success message
  };

  const renderVerificationStatus = () => {
    switch(profileData.verificationStatus) {
      case 'verified':
        return (
          <Alert className="bg-green-50 border-green-200 mb-6">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 ml-2">Verified Alumni</AlertTitle>
            <AlertDescription className="text-green-700 ml-7">
              Your alumni status has been verified. You have full access to all platform features.
            </AlertDescription>
          </Alert>
        );
      case 'pending':
        return (
          <Alert className="bg-yellow-50 border-yellow-200 mb-6">
            <Calendar className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="text-yellow-800 ml-2">Verification Pending</AlertTitle>
            <AlertDescription className="text-yellow-700 ml-7">
              Your verification is being processed. This usually takes 1-2 business days.
            </AlertDescription>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert className="bg-red-50 border-red-200 mb-6">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800 ml-2">Verification Failed</AlertTitle>
            <AlertDescription className="text-red-700 ml-7">
              We couldn't verify your alumni status. Please resubmit with valid BVRIT graduation documents.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Profile & Verification</h2>
        <p className="text-gray-600">Manage your profile information and verification status</p>
      </div>

      {renderVerificationStatus()}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white relative">
          <div className="flex items-start justify-between mb-6">
            <div className="flex">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-2xl">
                {profileData.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="ml-6">
                <h3 className="text-2xl font-bold">{profileData.fullName}</h3>
                <p className="text-blue-100">{profileData.jobTitle} at {profileData.company}</p>
                <p className="flex items-center text-blue-100 mt-1">
                  <GraduationCap className="h-4 w-4 mr-1" />
                  {profileData.branch}, Class of {profileData.graduationYear}
                </p>
                <p className="flex items-center text-blue-100 mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {profileData.location}
                </p>
              </div>
            </div>
            {!isEditing && (
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            {isEditing && (
              <Button 
                onClick={handleSaveProfile}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
          
          <div className="flex gap-4">
            {profileData.linkedinUrl && (
              <a 
                href={profileData.linkedinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white bg-opacity-20 rounded-lg px-4 py-2 flex items-center hover:bg-opacity-30"
              >
                <Linkedin className="h-5 w-5 mr-2" />
                LinkedIn
              </a>
            )}
            {profileData.githubUrl && (
              <a 
                href={profileData.githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white bg-opacity-20 rounded-lg px-4 py-2 flex items-center hover:bg-opacity-30"
              >
                <Github className="h-5 w-5 mr-2" />
                GitHub
              </a>
            )}
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2 flex items-center">
              {profileData.willingToMentor ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2 text-green-300" />
                  <span>Available for Mentoring</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 mr-2 text-red-300" />
                  <span>Not Available for Mentoring</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="p-8">
          {/* About Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">About</h4>
            {isEditing ? (
              <textarea
                name="about"
                value={profileData.about}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-md h-32"
              />
            ) : (
              <p className="text-gray-700">{profileData.about}</p>
            )}
          </div>
          
          {/* Skills Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Skills</h4>
            {isEditing ? (
              <input
                type="text"
                name="skills"
                value={profileData.skills.join(', ')}
                onChange={handleSkillChange}
                className="w-full p-3 border rounded-md"
                placeholder="Enter skills separated by commas"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Experience Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Experience</h4>
            {isEditing ? (
              <div className="space-y-4">
                {profileData.experience.map((exp, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => {
                          const updatedExp = [...profileData.experience];
                          updatedExp[index].role = e.target.value;
                          setProfileData({...profileData, experience: updatedExp});
                        }}
                        className="p-2 border rounded"
                        placeholder="Job Title"
                      />
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const updatedExp = [...profileData.experience];
                          updatedExp[index].company = e.target.value;
                          setProfileData({...profileData, experience: updatedExp});
                        }}
                        className="p-2 border rounded"
                        placeholder="Company"
                      />
                    </div>
                    <div className="mb-2">
                      <input
                        type="text"
                        value={exp.duration}
                        onChange={(e) => {
                          const updatedExp = [...profileData.experience];
                          updatedExp[index].duration = e.target.value;
                          setProfileData({...profileData, experience: updatedExp});
                        }}
                        className="p-2 border rounded w-full"
                        placeholder="Duration"
                      />
                    </div>
                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                        const updatedExp = [...profileData.experience];
                        updatedExp[index].description = e.target.value;
                        setProfileData({...profileData, experience: updatedExp});
                      }}
                      className="p-2 border rounded w-full"
                      placeholder="Description"
                      rows="3"
                    />
                  </div>
                ))}
                <Button 
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                  onClick={() => {
                    const updatedExp = [...profileData.experience];
                    updatedExp.push({ role: '', company: '', duration: '', description: '' });
                    setProfileData({...profileData, experience: updatedExp});
                  }}
                >
                  Add Experience
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {profileData.experience.map((exp, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between mb-1">
                      <h5 className="font-medium text-gray-900">{exp.role}</h5>
                      <span className="text-gray-500 text-sm">{exp.duration}</span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2 flex items-center">
                      <Building2 className="h-4 w-4 mr-1 text-gray-500" />
                      {exp.company}
                    </p>
                    <p className="text-gray-600 text-sm">{exp.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Education Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Education</h4>
            {isEditing ? (
              <div className="space-y-4">
                {profileData.education.map((edu, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const updatedEdu = [...profileData.education];
                          updatedEdu[index].degree = e.target.value;
                          setProfileData({...profileData, education: updatedEdu});
                        }}
                        className="p-2 border rounded"
                        placeholder="Degree"
                      />
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => {
                          const updatedEdu = [...profileData.education];
                          updatedEdu[index].year = e.target.value;
                          setProfileData({...profileData, education: updatedEdu});
                        }}
                        className="p-2 border rounded"
                        placeholder="Year"
                      />
                    </div>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const updatedEdu = [...profileData.education];
                        updatedEdu[index].institution = e.target.value;
                        setProfileData({...profileData, education: updatedEdu});
                      }}
                      className="p-2 border rounded w-full"
                      placeholder="Institution"
                    />
                  </div>
                ))}
                <Button 
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                  onClick={() => {
                    const updatedEdu = [...profileData.education];
                    updatedEdu.push({ degree: '', institution: '', year: '' });
                    setProfileData({...profileData, education: updatedEdu});
                  }}
                >
                  Add Education
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {profileData.education.map((edu, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-gray-900">{edu.degree}</h5>
                      <p className="text-gray-700 text-sm flex items-center">
                        <GraduationCap className="h-4 w-4 mr-1 text-gray-500" />
                        {edu.institution}
                      </p>
                    </div>
                    <span className="text-gray-500 text-sm">{edu.year}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Verification Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Verification Documents</h4>
            
            {profileData.verificationStatus === 'verified' ? (
              <div className="p-4 bg-green-50 rounded-md border border-green-200 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-800">Your alumni status has been successfully verified.</p>
              </div>
            ) : profileData.verificationStatus === 'rejected' ? (
              <div>
                <div className="p-4 mb-4 bg-red-50 rounded-md border border-red-200">
                  <div className="flex items-center mb-2">
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-800 font-medium">Verification failed</p>
                  </div>
                  <p className="text-red-700 ml-7 mb-4">
                    We were unable to verify your alumni status based on the documents provided. Please upload valid graduation certificate or ID card.
                  </p>
                  <div className="ml-7">
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Re-Upload Documents
                    </Button>
                  </div>
                </div>
                <div className="border rounded-md p-4">
                  <h5 className="font-medium mb-2">Acceptable Documents:</h5>
                  <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                    <li>BVRIT Graduation Certificate</li>
                    <li>BVRIT Student ID Card</li>
                    <li>Degree Certificate with BVRIT name</li>
                    <li>Official Transcript from BVRIT</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 font-medium">Verification in progress</p>
                </div>
                <p className="text-yellow-700 ml-7">
                  Your verification is being processed. We'll notify you once it's complete, typically within 1-2 business days.
                </p>
              </div>
            )}
          </div>
          
          {/* Mentorship Preferences */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Mentorship Preferences</h4>
            
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="willingToMentor"
                    checked={profileData.willingToMentor}
                    onChange={() => setProfileData({...profileData, willingToMentor: !profileData.willingToMentor})}
                    className="h-4 w-4 mr-2"
                  />
                  <label htmlFor="willingToMentor">Available for Mentoring</label>
                </div>
                
                {profileData.willingToMentor && (
                  <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                    <h5 className="font-medium mb-3">Mentor Preferences</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm mb-1">Preferred Departments</label>
                        <select className="w-full p-2 border rounded-md">
                          <option value="any">Any Department</option>
                          <option value="cse">Computer Science</option>
                          <option value="it">Information Technology</option>
                          <option value="ece">Electronics & Communication</option>
                          <option value="eee">Electrical Engineering</option>
                          <option value="mech">Mechanical Engineering</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Maximum Students</label>
                        <select className="w-full p-2 border rounded-md">
                          <option value="1">1 Student</option>
                          <option value="2">2 Students</option>
                          <option value="3">3 Students</option>
                          <option value="5">5 Students</option>
                          <option value="10">10 Students</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Mentorship Topics</label>
                        <textarea
                          className="w-full p-2 border rounded-md"
                          placeholder="e.g., Career Guidance, Technical Skills, Interview Preparation"
                          rows="3"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              profileData.willingToMentor ? (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <p className="flex items-center mb-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">You are available as a mentor</span>
                  </p>
                  <p className="text-blue-700 text-sm mb-4">
                    Students can send you mentorship requests based on your expertise and profile information.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    View Current Mentees
                  </Button>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <p className="flex items-center">
                    <XCircle className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700">You are not currently available for mentoring</span>
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileAndVerification;