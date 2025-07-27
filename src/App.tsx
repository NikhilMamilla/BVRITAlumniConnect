// src/App.tsx
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Events from "./pages/Events";
import Opportunities from "./pages/Opportunities";
import About from "./pages/About";
import Profile from "./pages/Profile";
import DatabaseDetails from "./pages/DatabaseDetails";
import { authService } from "@/services/auth";
import StudentIntroForm from "./pages/StudentIntroForm";
import AlumniProfileForm from "./pages/AlumniProfileForm";
import Verification from "./pages/Verification";
import StudentDashboard from "./pages/StudentDashboard";
import AlumniDashboard from "./pages/AlumniDashboard";
import PublicLayout from "./components/PublicLayout";

// Community imports
import CommunitiesHub from "./pages/community/CommunitiesHub";
import MyCommunities from "./pages/community/MyCommunities";
import CommunitySearch from "./pages/community/CommunitySearch";
import CreateCommunity from "./pages/community/CreateCommunity";
import CommunityDetails from "./pages/community/CommunityDetails";
import CommunityDiscussions from "./pages/community/CommunityDiscussions";
import CommunityChat from "./pages/community/CommunityChat";
import CommunityMembers from "./pages/community/CommunityMembers";
import CommunityEvents from "./pages/community/CommunityEvents";
import CommunityResources from "./pages/community/CommunityResources";
import CommunitySettings from "./pages/community/CommunitySettings";
import CommunityAnalytics from "./pages/community/CommunityAnalytics";
import { NotificationProvider } from "./pages/community/contexts/NotificationContext";
import { DiscussionThread } from "./pages/community/components/discussions/DiscussionThread";
import { useCommunityContext } from "./pages/community/contexts/CommunityContext";

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = authService.isLoggedIn();
  const currentUser = authService.getCurrentUser();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user type
  if (currentUser?.type === 'student' && location.pathname.startsWith('/alumni')) {
    return <Navigate to="/student/dashboard" replace />;
  } else if (currentUser?.type === 'alumni' && location.pathname.startsWith('/student')) {
    return <Navigate to="/alumni/dashboard" replace />;
  }

  return children;
}

const InnerApp = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return null; // or a spinner
  return (
    <NotificationProvider userId={currentUser?.uid || ""}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes with Layout */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/opportunities" element={<Opportunities />} />
                </Route>

                {/* Standalone Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/register" element={<Register />} />
                <Route path="/StudentIntroForm" element={<StudentIntroForm />} />
                <Route path="/alumni/profile-form" element={<AlumniProfileForm />} />
                <Route path="/verification" element={<Verification />} />

                {/* Dashboard Routes */}
                <Route 
                  path="/student/dashboard" 
                  element={
                    <PrivateRoute>
                      <StudentDashboard />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/alumni/dashboard" 
                  element={
                    <PrivateRoute>
                      <AlumniDashboard />
                    </PrivateRoute>
                  } 
                />
                
                {/* Other Protected Routes */}
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile/:section"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/database-details"
                  element={
                    <PrivateRoute>
                      <DatabaseDetails />
                    </PrivateRoute>
                  }
                />

                {/* Community Routes */}
                <Route
                  path="/communities"
                  element={
                    <PrivateRoute>
                      <CommunitiesHub />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/communities/my"
                  element={
                    <PrivateRoute>
                      <MyCommunities />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/communities/search"
                  element={
                    <PrivateRoute>
                      <CommunitySearch />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/communities/create"
                  element={
                    <PrivateRoute>
                      <CreateCommunity />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/community/:slug"
                  element={
                    <PrivateRoute>
                      <CommunityDetails />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<CommunityDiscussions />} />
                  <Route path="discussions" element={<CommunityDiscussions />} />
                  <Route path="chat" element={<CommunityChat />} />
                  <Route path="members" element={<CommunityMembers />} />
                  <Route path="events" element={<CommunityEvents />} />
                  <Route path="resources" element={<CommunityResources />} />
                  <Route path="settings" element={<CommunitySettings />} />
                  <Route path="analytics" element={<CommunityAnalytics />} />
                  <Route path="discussion/:discussionId" element={<DiscussionThreadWrapper />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </NotificationProvider>
  );
};

// Add a wrapper to extract params and context for DiscussionThread
function DiscussionThreadWrapper() {
  const { slug, discussionId } = useParams();
  const { currentUser } = useAuth();
  const { currentCommunity, currentMember, isAdmin, isModerator, isOwner } = useCommunityContext();
  if (!currentCommunity || !currentUser || !currentMember) return null;
  const canManage = isAdmin || isModerator || isOwner || currentMember.userId === currentUser.uid;
  const userInfo = {
    displayName: currentUser.displayName || currentMember.userDetails?.name || "",
    role: currentMember.role || "student",
    reputation: currentMember.userDetails?.reputation || 0,
    isExpert: currentMember.userDetails?.isExpert || false,
    photoURL: currentUser.photoURL || currentMember.userDetails?.avatar || "",
    badge: currentMember.userDetails?.badge || "",
  };
  return (
    <DiscussionThread
      discussionId={discussionId || ""}
      communityId={slug || ""}
      userId={currentUser.uid}
      canManage={canManage}
      userInfo={userInfo}
    />
  );
}

const App = () => (
  <AuthProvider>
    <InnerApp />
  </AuthProvider>
);

export default App;