export interface Opportunity {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  type: 'internship' | 'full-time' | 'part-time' | 'contract';
  deadline: string;
  createdBy: string;
  applicants: string[];
  salary?: string;
  duration?: string;
}
