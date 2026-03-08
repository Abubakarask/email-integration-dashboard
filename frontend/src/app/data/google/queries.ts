import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { GmailStatusResponseSchema, GmailStatusResponse } from './google.schema';

const GOOGLE_KEYS = {
  status: ['google', 'status'] as const,
};

export const fetchGmailStatus = async (): Promise<GmailStatusResponse> => {
  const response = await api.get('/gmail/status');
  // Validate the response data against the zod schema
  return GmailStatusResponseSchema.parse(response.data);
};

export const useGmailStatusQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: GOOGLE_KEYS.status,
    queryFn: fetchGmailStatus,
    enabled: options?.enabled,
    retry: 1,
  });
};
