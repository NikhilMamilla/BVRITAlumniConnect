import { Opportunity } from '@/types/opportunity';

export const opportunitiesService = {
  getOpportunities: () => {
    return [];
  },

  addOpportunity: (opportunity: Omit<Opportunity, 'id' | 'applicants'>) => {
    return null;
  },

  updateOpportunity: (id: string, data: Partial<Omit<Opportunity, 'id' | 'applicants'>>) => {
    return null;
  },

  applyForOpportunity: (opportunityId: string, userId: string) => {
    return undefined;
  }
};
