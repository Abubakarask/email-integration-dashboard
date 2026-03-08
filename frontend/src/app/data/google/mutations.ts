import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { 
  ConnectGmailResponseSchema, 
  ConnectGmailResponse,
  DisconnectGmailResponseSchema,
  DisconnectGmailResponse
} from './google.schema';

export const connectGmailFn = async (): Promise<ConnectGmailResponse> => {
  const response = await api.get('/gmail/connect');
  return ConnectGmailResponseSchema.parse(response.data);
};

export const disconnectGmailFn = async (): Promise<DisconnectGmailResponse> => {
  const response = await api.delete('/gmail/disconnect');
  return DisconnectGmailResponseSchema.parse(response.data);
};

export const useConnectGmailMutation = () => {
  return useMutation({
    mutationFn: connectGmailFn,
  });
};

export const useDisconnectGmailMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectGmailFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google', 'status'] });
    },
  });
};
