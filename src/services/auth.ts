interface RegisterStudentData {
  email: string;
  name: string;
  password: string;
  enrollmentYear: string;
  branch: string;
  interests: string[];
}

interface RegisterAlumniData {
  email: string;
  name: string;
  password: string;
  graduationYear: string;
  company: string;
  position: string;
  bio: string;
  collegeId?: string;  // College ID for verification
  department?: string; // Department for cross-verification
}

// Mock student database table - REMOVED SAMPLE DATA
// const studentDatabase = []; // REMOVED

// Mock verification data for CSE department only with added names for alumni
// const verifiedCSEAlumni = []; // REMOVED

// Mock authentication service
// In a real application, this would connect to your backend
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/firebase"; // Import the initialized auth instance

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// REMOVED FIREBASE CONFIG AND INITIALIZATION

export const authService = {
  registerStudent: async (data: RegisterStudentData): Promise<{ success: boolean, message: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: data.name
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
    
      // Email validation for college domain
      if (!data.email.endsWith('.edu') && !data.email.endsWith('.ac.in') && !data.email.endsWith('@bvrit.ac.in')) {
        return { 
          success: false, 
          message: 'Please use a valid college email address (.edu, .ac.in or @bvrit.ac.in domain)' 
        };
      }
    
      // Store in localStorage for demo purposes
      localStorage.setItem('current_user', JSON.stringify({
        ...data,
        type: 'student',
        id: user.uid,
        rollNumber: "TEMP" + Date.now().toString() // Use the temporary roll number
      }));
    
      return { 
        success: true, 
        message: 'Registration successful! Welcome to the Alumni Network.' 
      };
    } catch (error: any) {
      console.error("Firebase registration error:", error.message);
      return { success: false, message: `Registration failed: ${error.message}` };
    }
  },
  
  registerAlumni: async (data: RegisterAlumniData): Promise<{ success: boolean, message: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: data.name
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
    
      // Email validation - allow both college and regular emails for alumni
      const isBvritEmail = data.email.endsWith('@bvrit.ac.in');
      const isCollegeEmail = data.email.endsWith('.edu') || data.email.endsWith('.ac.in') || isBvritEmail;
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    
      if (!isValidEmail) {
        return { 
          success: false, 
          message: 'Please enter a valid email address' 
        };
      }
    
      // All alumni are considered pending verification upon registration now
      const isVerified = false; 
      const verificationMessage = 'Pending verification';
    
      // Store in localStorage for demo purposes
      localStorage.setItem('current_user', JSON.stringify({
        ...data,
        type: 'alumni',
        id: user.uid,
        department: 'Computer Science', // Always CSE for this version
        verified: isVerified,
        verificationMethod: verificationMessage
      }));
    
      return { 
        success: true, 
        message: 'Registration successful! Welcome back to your Alumni Network.' 
      };
    } catch (error: any) {
      console.error("Firebase registration error:", error.message);
      return { success: false, message: `Registration failed: ${error.message}` };
    }
  },
  
  logout: () => {
    localStorage.removeItem('current_user');
  },
  
  getCurrentUser: () => {
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  },
  
  isLoggedIn: () => {
    return localStorage.getItem('current_user') !== null;
  },
  
  // REMOVED: Expose student database for display purposes
  // getStudentDatabase: () => {
  //  return studentDatabase;
  // },
  
  // REMOVED
  // getVerifiedCSEAlumni: () => {
  //  return verifiedCSEAlumni;
  // }
};
