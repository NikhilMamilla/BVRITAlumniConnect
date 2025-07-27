import React, { useState } from 'react';
import { 
  Bell, 
  Lock, 
  User, 
  Shield, 
  Mail, 
  Smartphone, 
  Trash2, 
  Save, 
  Check, 
  Eye, 
  EyeOff, 
  LifeBuoy, 
  LogOut,
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  Linkedin,
  Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

const AlumniSettings = () => {
  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: 'Beere Adbhutha',
    email: 'adbhutha@gmail.com',
    phone: '+91 9866796510',
    jobTitle: 'Senior Software Engineer',
    company: 'Google',
    graduationYear: '2020',
    branch: 'Computer Science',
    location: 'Hyderabad, India',
    linkedIn: 'linkedin.com/in/adbhutha',
    github: 'github.com/adbhutha10',
    bio: 'Senior Software Engineer at Google with expertise in building scalable web applications. BVRIT CSE graduate (2020). Passionate about mentoring students in web development and cloud computing.'
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: false,
    showPhone: false,
    showLocationToStudents: true,
    profileVisibility: 'all', // all, students, none
    allowStudentRequests: true,
    showCurrentCompany: true,
    showPreviousCompanies: true
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    mentorshipRequests: true,
    messageNotifications: true,
    eventReminders: true,
    communityActivity: true,
    emailNotifications: true,
    pushNotifications: true,
    opportunityApplications: true,
    weeklyDigest: false
  });

  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    twoFactorAuth: false,
    passwordLastChanged: 'March 15, 2025'
  });

  // UI states
  const [activeTab, setActiveTab] = useState('profile');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form inputs
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Handle input changes for profile
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  // Handle privacy settings changes
  const handlePrivacyChange = (name, value) => {
    setPrivacySettings({
      ...privacySettings,
      [name]: value
    });
  };

  // Handle notification settings changes
  const handleNotificationChange = (name, value) => {
    setNotificationSettings({
      ...notificationSettings,
      [name]: value
    });
  };

  // Handle saving settings
  const handleSaveSettings = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    }, 1000);
  };

  // Handle password change
  const handlePasswordChange = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsPasswordDialogOpen(false);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1000);
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      // In a real app, this would redirect to logout
      alert('Account deletion process initiated. You will receive an email with further instructions.');
    }, 1000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and information</p>
      </div>

      {showSuccessAlert && (
        <Alert className="mb-6 bg-green-50 border-green-100">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Your changes have been saved successfully.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                name="fullName" 
                value={profileData.fullName} 
                onChange={handleProfileChange} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={profileData.email} 
                onChange={handleProfileChange} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                name="phone" 
                value={profileData.phone} 
                onChange={handleProfileChange} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="graduationYear">Graduation Year</Label>
              <Input 
                id="graduationYear" 
                name="graduationYear" 
                value={profileData.graduationYear} 
                onChange={handleProfileChange} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="branch">Branch/Department</Label>
              <Input 
                id="branch" 
                name="branch" 
                value={profileData.branch} 
                onChange={handleProfileChange} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="flex items-center mt-1">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                <Input 
                  id="location" 
                  name="location" 
                  value={profileData.location} 
                  onChange={handleProfileChange} 
                />
              </div>
            </div>
            <div>
              <Label htmlFor="jobTitle">Current Job Title</Label>
              <div className="flex items-center mt-1">
                <Briefcase className="h-5 w-5 text-gray-400 mr-2" />
                <Input 
                  id="jobTitle" 
                  name="jobTitle" 
                  value={profileData.jobTitle} 
                  onChange={handleProfileChange} 
                />
              </div>
            </div>
            <div>
              <Label htmlFor="company">Current Company</Label>
              <div className="flex items-center mt-1">
                <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                <Input 
                  id="company" 
                  name="company" 
                  value={profileData.company} 
                  onChange={handleProfileChange} 
                />
              </div>
            </div>
            <div>
              <Label htmlFor="linkedIn">LinkedIn Profile</Label>
              <div className="flex items-center mt-1">
                <Linkedin className="h-5 w-5 text-gray-400 mr-2" />
                <Input 
                  id="linkedIn" 
                  name="linkedIn" 
                  value={profileData.linkedIn} 
                  onChange={handleProfileChange} 
                />
              </div>
            </div>
            <div>
              <Label htmlFor="github">GitHub Profile</Label>
              <div className="flex items-center mt-1">
                <Github className="h-5 w-5 text-gray-400 mr-2" />
                <Input 
                  id="github" 
                  name="github" 
                  value={profileData.github} 
                  onChange={handleProfileChange} 
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea 
              id="bio" 
              name="bio" 
              value={profileData.bio} 
              onChange={handleProfileChange} 
              className="mt-1 h-32"
              placeholder="Tell students about your professional journey and expertise"
            />
          </div>

          <div className="flex justify-end mt-8">
            <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Profile Visibility</h3>
              <RadioGroup value={privacySettings.profileVisibility} onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="all" id="visibility-all" />
                  <Label htmlFor="visibility-all">Visible to all platform users</Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="students" id="visibility-students" />
                  <Label htmlFor="visibility-students">Visible only to BVRIT students</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="visibility-none" />
                  <Label htmlFor="visibility-none">Private (visible only to approved connections)</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show email address to</p>
                    <p className="text-sm text-gray-500">Allow students to see your email address</p>
                  </div>
                  <Switch 
                    checked={privacySettings.showEmail} 
                    onCheckedChange={(checked) => handlePrivacyChange('showEmail', checked)} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show phone number to</p>
                    <p className="text-sm text-gray-500">Allow students to see your phone number</p>
                  </div>
                  <Switch 
                    checked={privacySettings.showPhone} 
                    onCheckedChange={(checked) => handlePrivacyChange('showPhone', checked)} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show location</p>
                    <p className="text-sm text-gray-500">Make your current location visible</p>
                  </div>
                  <Switch 
                    checked={privacySettings.showLocationToStudents} 
                    onCheckedChange={(checked) => handlePrivacyChange('showLocationToStudents', checked)} 
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Work Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show current company</p>
                    <p className="text-sm text-gray-500">Display your current employer</p>
                  </div>
                  <Switch 
                    checked={privacySettings.showCurrentCompany} 
                    onCheckedChange={(checked) => handlePrivacyChange('showCurrentCompany', checked)} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show work history</p>
                    <p className="text-sm text-gray-500">Display your previous companies and roles</p>
                  </div>
                  <Switch 
                    checked={privacySettings.showPreviousCompanies} 
                    onCheckedChange={(checked) => handlePrivacyChange('showPreviousCompanies', checked)} 
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Mentorship Settings</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow mentorship requests</p>
                  <p className="text-sm text-gray-500">Students can send you mentorship requests</p>
                </div>
                <Switch 
                  checked={privacySettings.allowStudentRequests} 
                  onCheckedChange={(checked) => handlePrivacyChange('allowStudentRequests', checked)} 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.emailNotifications} 
                    onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications on your device</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.pushNotifications} 
                    onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-gray-500">Receive a weekly summary of activities</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.weeklyDigest} 
                    onCheckedChange={(checked) => handleNotificationChange('weeklyDigest', checked)} 
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Notification Types</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mentorship Requests</p>
                    <p className="text-sm text-gray-500">When students request your mentorship</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.mentorshipRequests} 
                    onCheckedChange={(checked) => handleNotificationChange('mentorshipRequests', checked)} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Messages</p>
                    <p className="text-sm text-gray-500">When you receive new messages</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.messageNotifications} 
                    onCheckedChange={(checked) => handleNotificationChange('messageNotifications', checked)} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Event Reminders</p>
                    <p className="text-sm text-gray-500">Reminders about events you're hosting or attending</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.eventReminders} 
                    onCheckedChange={(checked) => handleNotificationChange('eventReminders', checked)} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Community Activity</p>
                    <p className="text-sm text-gray-500">Updates on communities you manage or belong to</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.communityActivity} 
                    onCheckedChange={(checked) => handleNotificationChange('communityActivity', checked)} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Opportunity Applications</p>
                    <p className="text-sm text-gray-500">When students apply to opportunities you posted</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.opportunityApplications} 
                    onCheckedChange={(checked) => handleNotificationChange('opportunityApplications', checked)} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Security</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-gray-500">Last changed: {accountSettings.passwordLastChanged}</p>
                    </div>
                    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Change Password</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                              <Input 
                                id="currentPassword" 
                                type={showPassword ? "text" : "password"} 
                                value={currentPassword} 
                                onChange={(e) => setCurrentPassword(e.target.value)} 
                                className="mt-1 pr-10"
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input 
                              id="newPassword" 
                              type="password" 
                              value={newPassword} 
                              onChange={(e) => setNewPassword(e.target.value)} 
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input 
                              id="confirmPassword" 
                              type="password" 
                              value={confirmPassword} 
                              onChange={(e) => setConfirmPassword(e.target.value)} 
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                          <Button 
                            onClick={handlePasswordChange} 
                            disabled={isLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isLoading ? 'Updating...' : 'Update Password'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Switch 
                    checked={accountSettings.twoFactorAuth} 
                    onCheckedChange={(checked) => setAccountSettings({...accountSettings, twoFactorAuth: checked})} 
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Help & Support</h3>
              <div className="space-y-4">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 h-10">
                  <LifeBuoy size={18} />
                  Contact Support
                </Button>
                
                <Button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 h-10">
                  <Mail size={18} />
                  Email Feedback
                </Button>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Account Actions</h3>
              <div className="space-y-4">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 h-10">
                  <LogOut size={18} />
                  Log Out
                </Button>
                
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-red-300 text-red-700 hover:bg-red-50 h-10">
                      <Trash2 size={18} />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-red-600">Delete Your Account</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="mb-4 text-gray-700">This action is permanent and cannot be undone. All your data including profile, mentorship history, and communications will be permanently removed.</p>
                      
                      <div className="mb-4">
                        <Label htmlFor="deleteConfirmation">Please type "DELETE" to confirm</Label>
                        <Input 
                          id="deleteConfirmation" 
                          value={deleteConfirmation} 
                          onChange={(e) => setDeleteConfirmation(e.target.value)} 
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={handleDeleteAccount} 
                        disabled={isLoading || deleteConfirmation !== 'DELETE'}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading ? 'Processing...' : 'Permanently Delete Account'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlumniSettings;