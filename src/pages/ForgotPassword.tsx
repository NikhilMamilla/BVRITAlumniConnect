import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from 'sonner';
import { Mail, ArrowLeft, Loader } from 'lucide-react';
import { auth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" })
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState("");

  // Initialize form
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      // Ensure Firebase is initialized properly
      if (!auth.app.options.projectId) {
        throw new Error("Firebase project ID is missing. Check your firebase configuration.");
      }

      // Action code settings for Firebase
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      };

      console.log("Sending reset email to:", data.email);
      console.log("Using Firebase project:", auth.app.options.projectId);
      console.log("Redirect URL:", actionCodeSettings.url);
      console.log("API Key:", auth.app.options.apiKey);

      await sendPasswordResetEmail(auth, data.email, actionCodeSettings);
      
      setEmailSent(true);
      setLastSentEmail(data.email);
      
      toast.success("Password reset email sent!", {
        description: "Check your inbox (including spam folder)",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      
      let errorMessage = "Failed to send reset email. Please try again";
      let description = "An unexpected error occurred";
      
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = "No account found with this email address";
            description = "Please check your email and try again";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Too many requests";
            description = "Please try again later";
            break;
          case 'auth/invalid-email':
            errorMessage = "Invalid email address format";
            description = "Please enter a valid email address";
            break;
          case 'auth/missing-project-id':
            errorMessage = "Firebase configuration error";
            description = "Contact support with your Firebase project ID";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network connection failed";
            description = "Check your internet connection and try again";
            break;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { description });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend
  const handleResend = () => {
    if (lastSentEmail) {
      onSubmit({ email: lastSentEmail });
    } else {
      setEmailSent(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-t-4 border-t-blue-600 shadow-lg">
          <CardHeader className="text-center">
            <Button 
              variant="link" 
              className="absolute top-4 left-4 text-blue-600 hover:text-blue-800"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-sm mt-2">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!emailSent ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input 
                              placeholder="your.email@example.com" 
                              {...field} 
                              className="pl-10 h-11"
                              autoComplete="email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11 text-white font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        Sending...
                      </div>
                    ) : "Send Reset Link"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="text-center py-4">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Check your email</h3>
                <p className="text-gray-600 text-sm">
                  We've sent password reset instructions to:
                </p>
                <p className="font-medium text-gray-800 my-2">{lastSentEmail}</p>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 text-left">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Can't find the email?</strong> Check your spam folder or wait a few minutes.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="flex items-center justify-center"
                  >
                    {isLoading ? (
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Resend Email
                  </Button>
                  
                  <Button 
                    variant="link" 
                    onClick={() => setEmailSent(false)}
                    className="text-blue-600"
                  >
                    Use different email
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center border-t border-gray-100 pt-4">
            <p className="text-gray-600 text-sm">
              Remember your password?{" "}
              <Link 
                to="/login" 
                className="text-blue-600 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need additional help? Contact support@bvritconnect.com</p>
          <div className="mt-2 text-xs opacity-75">
            <p>Firebase Project: {auth.app.options.projectId}</p>
            <p>API Key: {auth.app.options.apiKey?.substring(0, 10)}...{auth.app.options.apiKey?.substring(auth.app.options.apiKey.length - 4)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;