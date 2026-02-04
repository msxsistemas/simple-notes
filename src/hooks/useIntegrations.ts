import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Webhook {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ApiCredential {
  id: string;
  user_id: string;
  token: string;
  status: 'active' | 'revoked';
  created_at: string;
}

export interface CreateWebhookData {
  url: string;
  events: string[];
}

export function useWebhooks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['webhooks', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('webhooks' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data as Webhook[];
    },
    enabled: !!user,
  });
}

export function useApiCredentials() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['api_credentials', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('api_credentials' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data as ApiCredential[];
    },
    enabled: !!user,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateWebhookData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: webhook, error } = await (supabase
        .from('webhooks' as any)
        .insert({
          ...data,
          user_id: user.id,
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      return webhook as Webhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      const { error } = await (supabase
        .from('webhooks' as any)
        .delete()
        .eq('id', webhookId) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });
}

export function useCreateApiCredential() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const token = `pk_live_${crypto.randomUUID().replace(/-/g, '')}`;

      const { data: credential, error } = await (supabase
        .from('api_credentials' as any)
        .insert({
          user_id: user.id,
          token,
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      return credential as ApiCredential;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_credentials'] });
    },
  });
}

export function useRevokeApiCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentialId: string) => {
      const { error } = await (supabase
        .from('api_credentials' as any)
        .update({ status: 'revoked' } as any)
        .eq('id', credentialId) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_credentials'] });
    },
  });
}
