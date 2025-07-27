export interface Alumni {
  id: string;
  name: string;
  email: string;
  graduationYear: string;
  company: string;
  position: string;
  bio: string;
  profilePicture?: string;
  skills: string[];
  location: string;
  verified?: boolean;
  verificationMethod?: string;
  collegeId?: string;
  department?: string;
  pinnedCommunityIds?: string[];
}
