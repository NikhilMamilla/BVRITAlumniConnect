// CommunityFormValidation.tsx
// Placeholder for CommunityFormValidation component

import * as z from 'zod';
import { CommunityCategory, JoinApprovalType } from '../../types/community.types';
import { VisibilityLevel } from '../../types/common.types';

// This schema defines the validation rules for the community creation form.
// It uses Zod to ensure that all data is in the correct format before submission.
export const communityFormSchema = z.object({
  name: z.string()
    .min(3, { message: "Name must be at least 3 characters." })
    .max(50, { message: "Name cannot be more than 50 characters." }),
  
  description: z.string()
    .min(10, { message: "Description must be at least 10 characters." })
    .max(250, { message: "Description cannot be more than 250 characters." }),
  
  // Uses z.nativeEnum to validate against the TypeScript enums.
  category: z.nativeEnum(CommunityCategory, {
    errorMap: () => ({ message: "Please select a valid category." }),
  }),
  
  avatar: z.string().url({ message: "Please provide a valid image URL." }).optional().or(z.literal('')),
  
  tags: z.array(z.string())
    .min(1, { message: "Please add at least one tag." })
    .max(10, { message: "You can add a maximum of 10 tags." }),
    
  visibility: z.nativeEnum(VisibilityLevel),
  
  joinApproval: z.nativeEnum(JoinApprovalType),
  
  guidelines: z.string()
    .max(5000, { message: "Guidelines cannot be more than 5000 characters." })
    .optional(),
});

export type CommunityFormData = z.infer<typeof communityFormSchema>;

export default function CommunityFormValidation() {
  return <div>CommunityFormValidation</div>;
} 