import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { auth, db, storage } from '@/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Verification = () => {
  const navigate = useNavigate();
  const [user, loading, error] = useAuthState(auth);
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    userId: ''
  });

  // Generate random user ID
  const generateUserId = () => {
    return 'ALU' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  useEffect(() => {
    if (user) {
      // Try to get user data from localStorage first (from registration)
      const storedUserData = localStorage.getItem('pending_alumni_data');
      
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        setUserData({
          name: parsedData.name || user.displayName || 'Unknown User',
          email: parsedData.email || user.email || 'No email provided',
          userId: parsedData.userId || generateUserId()
        });
      } else {
        // Fallback to Firebase user data
        setUserData({
          name: user.displayName || 'Unknown User',
          email: user.email || 'No email provided',
          userId: generateUserId()
        });
      }
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid file (PDF, DOC, DOCX, JPG, PNG)");
        return;
      }
      
      setVerificationDocument(file);
      toast.success("File selected successfully!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationDocument) {
      toast.error("Please upload a verification document.");
      return;
    }

    if (!user) {
      toast.error("Please log in to submit verification.");
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('verificationDocument', verificationDocument);
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('userId', userData.userId);
      formData.append('firebaseUid', user.uid);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('http://localhost:5000/api/verification/submit', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (response.ok && result.success) {
        handleSuccessfulSubmission();
      } else {
        throw new Error(result.message || 'Submission failed');
      }

    } catch (error: any) {
      console.error("Error in submission process:", error);
      toast.error("Submission failed: " + error.message);
      setUploadProgress(0);
      setIsLoading(false);
    }
  };

  const handleSuccessfulSubmission = () => {
    // Store verification status in localStorage
    const verificationData = {
      ...userData,
      firebaseUid: user?.uid,
      verificationStatus: 'pending',
      verificationSubmitted: true,
      verificationDate: new Date().toISOString()
    };

    localStorage.setItem('current_user', JSON.stringify(verificationData));
    
    // Remove pending data as it's now submitted
    localStorage.removeItem('pending_alumni_data');

    toast.success("Verification document submitted successfully! 🎉");
    
    // Show success message with details
    setTimeout(() => {
      toast.info("Your document has been sent to the admin for review. You'll receive an email response within 1-2 business days.");
    }, 1000);

    // Navigate to profile form or dashboard
    setTimeout(() => {
      navigate('/alumni/profile-form');
    }, 2000);

    setIsLoading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">  
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-md mx-auto">
          <Card className="border-t-4 border-t-blue-600 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Alumni Verification
              </CardTitle>
              <CardDescription>
                Please upload a document to verify your alumni status. The document will be sent to our admin team for review.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* User Info Display */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Submission Details:</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Name:</span> {userData.name}</p>
                  <p><span className="font-medium">Email:</span> {userData.email}</p>
                  <p><span className="font-medium">User ID:</span> {userData.userId}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="verificationDocument">Verification Document</Label>
                  <div className="mt-3 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <div className="space-y-2">
                      {!verificationDocument ? (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex justify-center text-sm text-gray-600">
                            <label 
                              htmlFor="verificationDocument" 
                              className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 transition-colors"
                            >
                              <span>Upload a file</span>
                              <Input
                                id="verificationDocument"
                                name="verificationDocument"
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PDF, DOC, DOCX, JPG, PNG up to 10MB
                          </p>
                        </>
                      ) : (
                        <div className="flex items-center justify-center space-y-2 flex-col">
                          <FileText className="h-10 w-10 text-blue-500 mb-2" />
                          <p className="text-sm font-medium">{verificationDocument.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(verificationDocument.size)}</p>
                          <button
                            type="button"
                            onClick={() => document.getElementById('verificationDocument')?.click()}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            Change file
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Please upload any document that proves your alumni status (degree certificate, transcript, etc.)
                  </p>
                </div>

                {/* Progress Bar */}
                {isLoading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 h-11 mt-6 disabled:opacity-50" 
                  disabled={isLoading || !verificationDocument}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Submit for Verification
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 border-t pt-6">
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Review Process:</p>
                  <p>Your document will be reviewed by our admin team. This process typically takes 1-2 business days. You'll receive an email notification once the review is complete.</p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Verification;