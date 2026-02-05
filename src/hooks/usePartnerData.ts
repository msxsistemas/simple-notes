import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PartnerProfile {
  id: string;
  user_id: string;
  auth_user_id: string | null;
  name: string;
  pix_key: string;
  document: string | null;
  email: string | null;
  split_type: 'percentage' | 'fixed';
  split_value: number;
  status: 'active' | 'inactive';
  woovi_subaccount_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerCommission {
  id: string;
  transaction_id: string;
  amount: number;
  net_amount: number;
  commission_amount: number;
  created_at: string;
  customer_name: string;
  status: string;
}

export interface PartnerWithdrawal {
  id: string;
  amount: number;
  fee: number;
  total: number;
  status: string;
  created_at: string;
  pix_key: string;
  recipient_name: string;
  document: string;
}

// Hook to get the partner profile linked to the current user
export function usePartnerProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['partner_profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await (supabase
        .from('split_partners' as any)
        .select('*')
        .eq('auth_user_id', user.id)
        .single() as any);

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data as PartnerProfile;
    },
    enabled: !!user,
  });
}

// Hook to get partner's commissions (transactions where they participated in split)
export function usePartnerCommissions() {
  const { data: partnerProfile } = usePartnerProfile();

  return useQuery({
    queryKey: ['partner_commissions', partnerProfile?.id, partnerProfile?.user_id],
    queryFn: async () => {
      if (!partnerProfile) return [];

      // Get transactions from the merchant (user_id) who created this partner
      const { data, error } = await (supabase
        .from('transactions' as any)
        .select('*')
        .eq('user_id', partnerProfile.user_id) // Only transactions from the merchant
        .eq('status', 'approved')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;

      // Calculate commission for each transaction based on net_amount (after fees)
      return (data || []).map((tx: any) => {
        const baseAmount = Number(tx.net_amount); // Use net_amount instead of gross amount
        const commissionAmount = partnerProfile.split_type === 'percentage'
          ? (baseAmount * partnerProfile.split_value) / 100
          : partnerProfile.split_value;

        return {
          id: tx.id,
          transaction_id: tx.id,
          amount: Number(tx.amount),
          net_amount: baseAmount,
          commission_amount: commissionAmount,
          created_at: tx.created_at,
          customer_name: tx.customer_name,
          status: tx.status,
        } as PartnerCommission;
      });
    },
    enabled: !!partnerProfile,
  });
}

// Hook to get partner's withdrawals
export function usePartnerWithdrawals() {
  const { data: partnerProfile } = usePartnerProfile();

  return useQuery({
    queryKey: ['partner_withdrawals', partnerProfile?.id],
    queryFn: async () => {
      if (!partnerProfile) return [];

      const { data, error } = await (supabase
        .from('withdrawals' as any)
        .select('*')
        .eq('partner_id', partnerProfile.id)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data as PartnerWithdrawal[];
    },
    enabled: !!partnerProfile,
  });
}

// Hook to update partner's PIX data
export function useUpdatePartnerPixData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      partnerId, 
      pix_key, 
      document 
    }: { 
      partnerId: string; 
      pix_key: string; 
      document?: string;
    }) => {
      const { data, error } = await (supabase
        .from('split_partners' as any)
        .update({ pix_key, document } as any)
        .eq('id', partnerId)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner_profile'] });
    },
  });
}

// Hook to request withdrawal as partner
export function usePartnerWithdrawalRequest() {
  const queryClient = useQueryClient();
  const { data: partnerProfile } = usePartnerProfile();

  return useMutation({
    mutationFn: async ({ amount, fee }: { amount: number; fee: number }) => {
      if (!partnerProfile) throw new Error('Partner profile not found');

      const { data, error } = await (supabase
        .from('withdrawals' as any)
        .insert({
          partner_id: partnerProfile.id,
          user_id: partnerProfile.user_id, // Owner's user_id for RLS
          recipient_name: partnerProfile.name,
          document: partnerProfile.document || '',
          pix_key: partnerProfile.pix_key,
          amount,
          fee,
          total: amount - fee,
          status: 'pending',
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner_withdrawals'] });
    },
  });
}

// Hook to calculate partner's available balance
export function usePartnerBalance() {
  const { data: commissions } = usePartnerCommissions();
  const { data: withdrawals } = usePartnerWithdrawals();

  const totalEarned = commissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;
  const totalWithdrawn = withdrawals
    ?.filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.total, 0) || 0;
  const pendingWithdrawals = withdrawals
    ?.filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.total, 0) || 0;

  return {
    totalEarned,
    totalWithdrawn,
    pendingWithdrawals,
    availableBalance: totalEarned - totalWithdrawn - pendingWithdrawals,
  };
}
