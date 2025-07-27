import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth';
import { toast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Calendar, Briefcase } from 'lucide-react';

export const AuthButtons = () => {
  const navigate = useNavigate();
  const isLoggedIn = authService.isLoggedIn();
  const currentUser = authService.getCurrentUser();
  
  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Logged out successfully",
      description: "You've been logged out of your account",
    });
    navigate('/');
  };
  
  if (isLoggedIn && currentUser) {
    // Generate user identifier - either roll number or first 10 chars of email
    const userIdentifier = currentUser.type === 'student' 
      ? (currentUser.rollNumber || currentUser.email.substring(0, 10)) 
      : (currentUser.position || '');
    
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium hidden md:inline-block">
          {currentUser.name}
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {currentUser.name}
              <p className="text-xs text-muted-foreground font-normal">
                {userIdentifier}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            
            {currentUser.type === 'student' && (
              <>
                <DropdownMenuItem onClick={() => navigate('/profile/registered-events')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Registered Events
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile/applied-opportunities')}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  Applied Opportunities
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <Link to="/login">
        <Button variant="ghost">Login</Button>
      </Link>
      <Link to="/register">
        <Button>Register</Button>
      </Link>
    </div>
  );
};
