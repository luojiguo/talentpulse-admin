import request from '@/utils/request';

export interface Onboarding {
    id: number;
    candidateId: number;
    recruiterId: number;
    jobId: number;
    onboardingDate: string;
    endDate?: string;
    status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Pending';
    onboardingType?: string;
    notes?: string;
    onboardingTime?: string;
    onboardingLocation?: string;
    onboardingContact?: string;
    onboardingContactPhone?: string;
    officialSalary?: string;
    probationSalary?: string;
    probationPeriod?: number;
    // Join fields
    candidateName?: string;
    candidateAvatar?: string;
    jobTitle?: string;
    companyName?: string;
}

export interface CreateOnboardingParams {
    candidateId: number;
    recruiterId: number;
    jobId: number;
    startDate: string;
    endDate?: string;
    status?: string;
    onboardingType?: string;
    notes?: string;
    onboardingTime?: string;
    onboardingLocation?: string;
    onboardingContact?: string;
    onboardingContactPhone?: string;
    officialSalary?: string;
    probationSalary?: string;
    probationPeriod?: number;
}

export const onboardingAPI = {
    // Create
    create: (data: CreateOnboardingParams) => {
        return request.post('/onboardings', data);
    },

    // Get List
    getAllOnboardings: (params?: { candidateId?: number, recruiterId?: number, jobId?: number, status?: string }) => {
        return request.get('/onboardings', { params });
    },

    // Update
    update: (id: number, data: Partial<CreateOnboardingParams>) => {
        return request.put(`/onboardings/${id}`, data);
    },

    // Delete
    delete: (id: number) => {
        return request.delete(`/onboardings/${id}`);
    }
};
