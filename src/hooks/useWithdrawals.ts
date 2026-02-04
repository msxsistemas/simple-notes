import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Withdrawal {
  id: string;
  user_id: string;
  recipient_name: string;
  document: string;
  pix_key: string;
  amount: number;
  fee: number;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface CreateWithdrawalData {
  recipient_name: string;
  document: string;
  pix_key: string;
  amount: number;
  fee: number;
}

export function useWithdrawals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['withdrawals', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('withdrawals' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data as Withdrawal[];
    },
    enabled: !!user,
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateWithdrawalData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: withdrawal, error } = await (supabase
        .from('withdrawals' as any)
        .insert({
          ...data,
          user_id: user.id,
          total: data.amount - data.fee,
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      return withdrawal as Withdrawal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
    },
  });
}
