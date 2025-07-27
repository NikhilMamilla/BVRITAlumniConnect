import { alumniService } from "@/services/alumni";
import { Alumni } from "@/types/alumni";

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UserProfile {
  interests?: string[];
  skills?: string[];
  resumeContent?: string;
}

// Sample website information for basic queries
const websiteInfo = {
  about: "Alumni Connect is a platform that helps alumni and students network, find jobs, and stay connected with their alma mater.",
  features: [
    "Connect with alumni in your city",
    "Find your batchmates",
    "Browse job and internship opportunities",
    "View and register for events",
    "Personalized recommendations"
  ],
  registration: "Both alumni and students can register using their email. We have a verification process for alumni whose college emails may have expired.",
  events: "Alumni can post events, while students can view and register for them.",
  jobs: "Alumni can post job opportunities, and students can apply based on their skills and interests."
};

// Function to find matching alumni based on user profile
export const findMatchingAlumni = (profile: UserProfile): Alumni[] => {
  if (!profile.interests?.length && !profile.skills?.length) {
    return [];
  }
  
  const allAlumni = alumniService.getAlumni();
  
  // Score each alumni based on matching skills and interests
  return allAlumni
    .map(alumni => {
      let score = 0;
      
      // Match skills
      if (profile.skills?.length) {
        profile.skills.forEach(skill => {
          if (alumni.skills.some(alumniSkill => 
            alumniSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(alumniSkill.toLowerCase())
          )) {
            score += 2; // Higher weight for skill matches
          }
        });
      }
      
      // For interests, we'd need to add interests to alumni profiles
      // For now, we'll use their bio as a proxy for interests
      if (profile.interests?.length) {
        profile.interests.forEach(interest => {
          if (alumni.bio.toLowerCase().includes(interest.toLowerCase())) {
            score += 1;
          }
        });
      }
      
      return { alumni, score };
    })
    .filter(item => item.score > 0) // Only return alumni with some match
    .sort((a, b) => b.score - a.score) // Sort by highest score first
    .slice(0, 3) // Return top 3 matches
    .map(item => item.alumni);
};

// Extract profile information from chat history
export const extractProfileFromChat = (messages: ChatMessage[]): UserProfile => {
  const userMessages = messages
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.toLowerCase());
    
  const profile: UserProfile = {
    interests: [],
    skills: []
  };
  
  // Common skills in tech and other fields
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'express',
    'html', 'css', 'typescript', 'sql', 'nosql', 'mongodb', 'aws', 'azure',
    'data analysis', 'machine learning', 'ai', 'project management', 'leadership',
    'marketing', 'finance', 'accounting', 'design', 'ux', 'ui', 'research',
    'writing', 'editing', 'communication', 'presentation', 'public speaking'
  ];
  
  // Common interest areas
  const interestKeywords = [
    'technology', 'web development', 'mobile development', 'data science',
    'artificial intelligence', 'blockchain', 'robotics', 'iot', 'cybersecurity',
    'business', 'entrepreneurship', 'consulting', 'marketing', 'finance',
    'healthcare', 'education', 'art', 'design', 'music', 'literature',
    'gaming', 'sports', 'travel', 'photography', 'food', 'fashion'
  ];
  
  userMessages.forEach(message => {
    // Look for explicit mentions of skills/interests
    if (message.includes('skill') || message.includes('good at') || message.includes('experienced in')) {
      skillKeywords.forEach(skill => {
        if (message.includes(skill) && !profile.skills?.includes(skill)) {
          profile.skills?.push(skill);
        }
      });
    }
    
    if (message.includes('interest') || message.includes('passionate about') || message.includes('like') || message.includes('enjoy')) {
      interestKeywords.forEach(interest => {
        if (message.includes(interest) && !profile.interests?.includes(interest)) {
          profile.interests?.push(interest);
        }
      });
    }
    
    // Also do a general scan for skills and interests
    skillKeywords.forEach(skill => {
      if (message.includes(skill) && !profile.skills?.includes(skill)) {
        profile.skills?.push(skill);
      }
    });
    
    interestKeywords.forEach(interest => {
      if (message.includes(interest) && !profile.interests?.includes(interest)) {
        profile.interests?.push(interest);
      }
    });
  });
  
  return profile;
};

// Extract skills and interests from resume content
export const extractProfileFromResume = (resumeContent: string): Partial<UserProfile> => {
  if (!resumeContent) {
    return {};
  }
  
  const normalizedContent = resumeContent.toLowerCase();
  const profile: Partial<UserProfile> = {
    interests: [],
    skills: []
  };
  
  // Common skills in tech and other fields
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'express',
    'html', 'css', 'typescript', 'sql', 'nosql', 'mongodb', 'aws', 'azure',
    'data analysis', 'machine learning', 'ai', 'project management', 'leadership',
    'marketing', 'finance', 'accounting', 'design', 'ux', 'ui', 'research',
    'writing', 'editing', 'communication', 'presentation', 'public speaking'
  ];
  
  // Common interest areas
  const interestKeywords = [
    'technology', 'web development', 'mobile development', 'data science',
    'artificial intelligence', 'blockchain', 'robotics', 'iot', 'cybersecurity',
    'business', 'entrepreneurship', 'consulting', 'marketing', 'finance',
    'healthcare', 'education', 'art', 'design', 'music', 'literature',
    'gaming', 'sports', 'travel', 'photography', 'food', 'fashion'
  ];
  
  // Extract skills from resume content
  skillKeywords.forEach(skill => {
    if (normalizedContent.includes(skill) && !profile.skills?.includes(skill)) {
      profile.skills?.push(skill);
    }
  });
  
  // Extract interests from resume content
  interestKeywords.forEach(interest => {
    if (normalizedContent.includes(interest) && !profile.interests?.includes(interest)) {
      profile.interests?.push(interest);
    }
  });
  
  // Look for skill sections in resume
  const skillSectionMatches = normalizedContent.match(/skills[:\s]+(.*?)(?=\n\n|\n[a-z]+:|\n[a-z]+\s+:|$)/s);
  if (skillSectionMatches && skillSectionMatches[1]) {
    const skillSection = skillSectionMatches[1].trim();
    const additionalSkills = skillSection
      .split(/[,\n•\-\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && !profile.skills?.includes(s));
    
    profile.skills?.push(...additionalSkills);
  }
  
  // Look for interest sections in resume
  const interestSectionMatches = normalizedContent.match(/interests[:\s]+(.*?)(?=\n\n|\n[a-z]+:|\n[a-z]+\s+:|$)/s);
  if (interestSectionMatches && interestSectionMatches[1]) {
    const interestSection = interestSectionMatches[1].trim();
    const additionalInterests = interestSection
      .split(/[,\n•\-\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && !profile.interests?.includes(s));
    
    profile.interests?.push(...additionalInterests);
  }
  
  return profile;
};

// Function to enhance profile with resume data
export const enhanceProfileWithResume = (profile: UserProfile, resumeContent?: string): UserProfile => {
  if (!resumeContent) {
    return profile;
  }
  
  const resumeData = extractProfileFromResume(resumeContent);
  
  return {
    interests: [...new Set([...(profile.interests || []), ...(resumeData.interests || [])])],
    skills: [...new Set([...(profile.skills || []), ...(resumeData.skills || [])])],
    resumeContent
  };
};

// Function to get alumni recommendations for the current user
export const getAlumniRecommendationsForCurrentUser = async (includeResumeAnalysis = false) => {
  // Get the current user from local storage
  const currentUserJson = localStorage.getItem('current_user');
  if (!currentUserJson) {
    return { success: false, message: "You need to be logged in to get personalized recommendations." };
  }

  const currentUser = JSON.parse(currentUserJson);
  
  // Only provide recommendations for students
  if (currentUser.type !== 'student') {
    return { 
      success: false, 
      message: "This feature is only available for students. If you're an alumni, you can use other features like posting job opportunities or events."
    };
  }

  // Prepare user profile from the current user data
  let userProfile: UserProfile = {
    interests: Array.isArray(currentUser.interests) 
      ? currentUser.interests 
      : (currentUser.interests || '').split(',').map(item => item.trim()).filter(item => item),
    skills: Array.isArray(currentUser.skills) 
      ? currentUser.skills 
      : (currentUser.skills || '').split(',').map(item => item.trim()).filter(item => item)
  };

  // If resume analysis is requested and resume URL exists
  if (includeResumeAnalysis && currentUser.resumeUrl) {
    // For demo purposes, we'll simulate having the resume content
    // In a real app, you would fetch the content from the URL
    
    // Use the resume URL as a simulated content (since we can't actually fetch files in this demo)
    // This is just to show the concept; in a real app, you'd parse the actual resume content
    const simulatedResumeContent = 
      `Resume for ${currentUser.name}
      
      Skills: JavaScript, React, Node.js, Python, Project Management
      
      Interests: Web Development, Data Science, AI, Cloud Computing
      
      Experience:
      - Developed web applications using React
      - Created backend APIs with Node.js
      - Analyzed data using Python`;
    
    // Enhance the profile with resume data
    userProfile = enhanceProfileWithResume(userProfile, simulatedResumeContent);
  }

  // If no interests or skills are defined
  if ((!userProfile.interests || userProfile.interests.length === 0) && 
      (!userProfile.skills || userProfile.skills.length === 0)) {
    return { 
      success: false, 
      message: "I couldn't find any interests or skills in your profile or resume. Please update your profile with some interests or skills to get personalized recommendations." 
    };
  }

  // Find matching alumni
  const matchingAlumni = findMatchingAlumni(userProfile);

  if (matchingAlumni.length === 0) {
    return { 
      success: false, 
      message: "Based on your interests and skills, I couldn't find alumni that closely match your profile. Try updating your profile with more specific interests or skills."
    };
  }

  return { 
    success: true, 
    alumni: matchingAlumni,
    profile: userProfile,
    usedResume: includeResumeAnalysis && currentUser.resumeUrl ? true : false
  };
};

// Mock function for processing user messages
export const processChatMessage = async (
  message: string, 
  chatHistory: ChatMessage[],
  resumeContent?: string | null
): Promise<string> => {
  // Simple delay to simulate processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const normalizedMessage = message.toLowerCase();
  
  // Handle alumni recommendation requests based on user profile
  if (
    normalizedMessage.includes('analyze my profile') || 
    normalizedMessage.includes('suggest alumni') || 
    normalizedMessage.includes('alumni suggestion') ||
    normalizedMessage.includes('recommend alumni') ||
    normalizedMessage.includes('connect with alumni') ||
    normalizedMessage.includes('alumni to connect') ||
    normalizedMessage.includes('match me') ||
    normalizedMessage.includes('who should i connect with')
  ) {
    // Check if the request is explicitly for profile AND resume-based recommendations
    const isResumeBasedRequest = 
      normalizedMessage.includes('resume') || 
      normalizedMessage.includes('cv') ||
      normalizedMessage.includes('analyze my resume') ||
      normalizedMessage.includes('from my resume');
    
    // Check if the request is explicitly for profile-based recommendations
    const isProfileBasedRequest = 
      normalizedMessage.includes('based on my profile') || 
      normalizedMessage.includes('analyze my profile') ||
      normalizedMessage.includes('from my profile');

    // By default, include resume analysis if it's a resume-based request
    const includeResumeAnalysis = isResumeBasedRequest;

    // Use the profile from the user account plus any resume content passed
    let result;
    
    if (resumeContent && isResumeBasedRequest) {
      // If we have resume content passed from the chatbot, use it directly
      const currentUserJson = localStorage.getItem('current_user');
      if (!currentUserJson) {
        return "You need to be logged in to get personalized recommendations.";
      }
      
      const currentUser = JSON.parse(currentUserJson);
      
      // Only provide recommendations for students
      if (currentUser.type !== 'student') {
        return "This feature is only available for students. If you're an alumni, you can use other features like posting job opportunities or events.";
      }
      
      // Prepare user profile from the current user data
      let userProfile: UserProfile = {
        interests: Array.isArray(currentUser.interests) 
          ? currentUser.interests 
          : (currentUser.interests || '').split(',').map(item => item.trim()).filter(item => item),
        skills: Array.isArray(currentUser.skills) 
          ? currentUser.skills 
          : (currentUser.skills || '').split(',').map(item => item.trim()).filter(item => item)
      };
      
      // Enhance the profile with the actual resume content
      userProfile = enhanceProfileWithResume(userProfile, resumeContent);
      
      // If no interests or skills are defined
      if ((!userProfile.interests || userProfile.interests.length === 0) && 
          (!userProfile.skills || userProfile.skills.length === 0)) {
        return "I couldn't find any interests or skills in your profile or resume. Please update your profile with some interests or skills to get personalized recommendations.";
      }
      
      // Find matching alumni
      const matchingAlumni = findMatchingAlumni(userProfile);
      
      if (matchingAlumni.length === 0) {
        return "Based on your interests and skills, I couldn't find alumni that closely match your profile. Try updating your profile with more specific interests or skills.";
      }
      
      result = { 
        success: true, 
        alumni: matchingAlumni,
        profile: userProfile,
        usedResume: true
      };
    } else {
      // Use the normal function if no resume content passed
      result = await getAlumniRecommendationsForCurrentUser(includeResumeAnalysis);
    }
    
    if (!result.success) {
      return result.message;
    }
    
    // Build response with alumni recommendations
    let response = "";
    
    if (result.usedResume) {
      response = "Based on your profile and resume, I found these alumni you might want to connect with:\n\n";
    } else {
      response = "Based on your profile information, I found these alumni you might want to connect with:\n\n";
    }
    
    result.alumni.forEach((alumni, index) => {
      response += `${index + 1}. **${alumni.name}** - ${alumni.position} at ${alumni.company}\n`;
      response += `   ${alumni.bio}\n`;
      response += `   Skills: ${alumni.skills.join(', ')}\n\n`;
    });
    
    if (result.usedResume) {
      response += "Looking at both your profile and resume, I identified these skills and interests:\n";
      response += `Skills: ${result.profile.skills?.join(', ') || 'None identified'}\n`;
      response += `Interests: ${result.profile.interests?.join(', ') || 'None identified'}\n\n`;
    }
    
    response += "You can find these alumni in the Alumni Directory to connect or visit your Profile page to see recommendations in the Recommended Alumni tab!";
    return response;
  } else if (
    normalizedMessage.includes('analyze my resume') || 
    normalizedMessage.includes('look at my resume') || 
    normalizedMessage.includes('check my resume') ||
    normalizedMessage.includes('resume analysis')
  ) {
    // Get the current user from local storage
    const currentUserJson = localStorage.getItem('current_user');
    if (!currentUserJson) {
      return "You need to be logged in to analyze your resume.";
    }

    const currentUser = JSON.parse(currentUserJson);
    
    if (!currentUser.resumeUrl) {
      return "I couldn't find a resume in your profile. Please upload a resume in your profile section first.";
    }
    
    // If we have resume content passed from the chatbot component, use it
    let resumeData;
    if (resumeContent) {
      resumeData = extractProfileFromResume(resumeContent);
    } else {
      // For demo purposes when we don't have actual resume content
      // (This would normally be fetched from the server)
      const simulatedResumeContent = 
        `Resume for ${currentUser.name}
        
        Skills: JavaScript, React, Node.js, Python, Project Management
        
        Interests: Web Development, Data Science, AI, Cloud Computing
        
        Experience:
        - Developed web applications using React
        - Created backend APIs with Node.js
        - Analyzed data using Python`;
      
      resumeData = extractProfileFromResume(simulatedResumeContent);
    }
    
    let response = "I analyzed your resume and found these skills and interests:\n\n";
    response += `**Skills**: ${resumeData.skills?.join(', ') || 'None identified'}\n`;
    response += `**Interests**: ${resumeData.interests?.join(', ') || 'None identified'}\n\n`;
    response += "Would you like me to suggest alumni based on this information? Just ask me to 'suggest alumni based on my resume'.";
    
    return response;
  }

  // Handle basic queries about the website
  if (normalizedMessage.includes('about') || normalizedMessage.includes('what is') || normalizedMessage.includes('what does')) {
    return websiteInfo.about;
  }
  
  if (normalizedMessage.includes('feature') || normalizedMessage.includes('what can') || normalizedMessage.includes('do with')) {
    return `Here are the main features of Alumni Connect:\n• ${websiteInfo.features.join('\n• ')}`;
  }
  
  if (normalizedMessage.includes('register') || normalizedMessage.includes('sign up') || normalizedMessage.includes('account')) {
    return websiteInfo.registration;
  }
  
  if (normalizedMessage.includes('event')) {
    return websiteInfo.events;
  }
  
  if (normalizedMessage.includes('job') || normalizedMessage.includes('internship') || normalizedMessage.includes('opportunity')) {
    return websiteInfo.jobs;
  }
  
  if (normalizedMessage.includes('hello') || normalizedMessage.includes('hi') || normalizedMessage.includes('hey')) {
    return "Hello! How can I assist you with Alumni Connect today?";
  }

  // Personalized recommendations (mock responses - would use real user data in production)
  if (normalizedMessage.includes('recommend') || normalizedMessage.includes('suggestion')) {
    if (normalizedMessage.includes('student')) {
      return "Based on typical student profiles, I recommend exploring the job board for internship opportunities in your field of study, and connecting with alumni who work in industries aligned with your interests.";
    }
    
    if (normalizedMessage.includes('alumni') || normalizedMessage.includes('candidate')) {
      return "For finding candidates, I recommend posting detailed job descriptions that highlight specific skills you're looking for. You can also browse student profiles with matching interests and skills for your open positions.";
    }
    
    return "I can provide personalized recommendations once you create a profile with your interests and skills. Would you like to know more about how to set up your profile?";
  }
  
  // Default response
  return "I'm not sure I understand. Can you try rephrasing your question? You can ask about features, registration, events, job opportunities, or request personalized recommendations. I can also suggest alumni to connect with based on your interests and skills!";
};
