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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { GraduationCap, User, Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { auth, googleProvider, db } from '@/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, getDoc } from 'firebase/firestore';

// Form validation schema - only email and password needed for login
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'student' | 'alumni'>('student');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  // Function to redirect user based on their actual role from database
  const redirectToDashboard = async (userId: string) => {
    try {
      // Check for a student profile first
      let profileDoc = await getDoc(doc(db, 'students', userId));
      if (profileDoc.exists()) {
        navigate('/student/dashboard');
        return;
      }
      
      // If not a student, check for an alumni profile
      profileDoc = await getDoc(doc(db, 'alumni_profiles', userId));
      if (profileDoc.exists()) {
        navigate('/alumni/dashboard');
        return;
      }
      
      // If no profile is found in either collection, the user needs to register
      toast.error("Profile not found. Please complete your registration and profile setup.");
      // You might want to log them out here or redirect to a specific page
      navigate('/register');

    } catch (error) {
      console.error("Error fetching user role:", error);
      toast.error("Could not verify user profile. Please contact support.");
      navigate('/');
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Validate student email domain if they selected student tab
      if (userType === 'student' && !data.email.endsWith('@bvrit.ac.in')) {
        toast.error("Students must use their @bvrit.ac.in email address");
        setIsLoading(false);
        return;
      }

      // Sign in with email/password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      toast.success("Login successful!");
      
      // Redirect based on user's actual role from database
      await redirectToDashboard(userCredential.user.uid);
    } catch (error) {
      console.error("Login error:", error);
      
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          toast.error("Invalid email or password");
        } else if (error.code === 'auth/wrong-password') {
          toast.error("Incorrect password");
        } else if (error.code === 'auth/invalid-email') {
          toast.error("Invalid email address");
        } else if (error.code === 'auth/too-many-requests') {
          toast.error("Too many failed attempts. Please try again later");
        } else {
          toast.error("Login failed. Please try again");
        }
      } else {
        toast.error("An unexpected error occurred during login.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Validate student email domain if they selected student tab
      const email = result.user.email;
      if (userType === 'student' && email && !email.endsWith('@bvrit.ac.in')) {
        toast.error("Students must use their @bvrit.ac.in email address");
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      toast.success("Login successful!");
      
      // Redirect based on user's actual role from database
      await redirectToDashboard(result.user.uid);
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google login failed. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome Back!
            </h1>
            <Sparkles className="w-6 h-6 text-indigo-500" />
          </div>
          <p className="text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <Tabs defaultValue="student" onValueChange={(value) => setUserType(value as 'student' | 'alumni')}>
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white border border-gray-200 rounded-lg">
            <TabsTrigger 
              value="student" 
              className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <User className="h-4 w-4" />
              Student
            </TabsTrigger>
            <TabsTrigger 
              value="alumni" 
              className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <GraduationCap className="h-4 w-4" />
              Alumni
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Card className="border-t-4 border-t-blue-600 shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Student Login
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Use your @bvrit.ac.in email address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                placeholder="yourname@bvrit.ac.in" 
                                {...field} 
                                className="pl-10 h-11"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                              <Input 
                                type="password" 
                                placeholder="Enter your password" 
                                {...field} 
                                className="pl-10 h-11" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <Link 
                          to="/forgot-password" 
                          className="text-blue-600 hover:text-blue-500 hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11 mt-2 text-white font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Signing in...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <LogIn className="h-4 w-4" />
                          Sign In
                        </div>
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-3 text-gray-500">Or continue with</span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-11 flex items-center gap-3"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alumni">
            <Card className="border-t-4 border-t-blue-600 shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Alumni Login
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Sign in to your alumni account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                              <Input 
                                type="password" 
                                placeholder="Enter your password" 
                                {...field} 
                                className="pl-10 h-11" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <Link 
                          to="/forgot-password" 
                          className="text-blue-600 hover:text-blue-500 hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11 mt-2 text-white font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Signing in...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <LogIn className="h-4 w-4" />
                          Sign In
                        </div>
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-3 text-gray-500">Or continue with</span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-11 flex items-center gap-3"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer */}
          <Card className="mt-4 border-0 shadow-none bg-transparent">
            <CardFooter className="flex flex-col gap-3 pt-4">
              <div className="text-center text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <Link 
                  to="/register" 
                  className="text-blue-600 font-medium hover:underline"
                >
                  Sign up here
                </Link>
              </div>
            </CardFooter>
          </Card>
        </Tabs>
      </div>
    </div>
  );
};

export default Login; 