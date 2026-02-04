import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SplitPartner {
  id: string;
  user_id: string;
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

export interface CreateSplitPartnerData {
  name: string;
  pix_key: string;
  document?: string;
  email?: string;
  split_type: 'percentage' | 'fixed';
  split_value: number;
}

export interface UpdateSplitPartnerData {
  id: string;
  name?: string;
  pix_key?: string;
  document?: string;
  email?: string;
  split_type?: 'percentage' | 'fixed';
  split_value?: number;
  status?: 'active' | 'inactive';
}

// Hook to manage Woovi subaccounts
export function useWooviSubaccount() {
  return useMutation({
    mutationFn: async (params: {
      action: 'create' | 'list' | 'get' | 'delete' | 'withdraw' | 'debit' | 'transfer';
      name?: string;
      pixKey?: string;
      subaccountId?: string;
      value?: number;
      fromSubaccountId?: string;
      toSubaccountId?: string;
      skip?: number;
      limit?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('woovi-subaccount', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Unknown error');
      
      return data;
    },
  });
}

// Hook to sync Woovi subaccounts with local database
export function useSyncWooviSubaccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get all subaccounts from Woovi
      const { data: wooviResult, error: wooviError } = await supabase.functions.invoke('woovi-subaccount', {
        body: { action: 'list' },
      });

      if (wooviError) throw wooviError;
      if (!wooviResult?.success) throw new Error(wooviResult?.error || 'Failed to list subaccounts');

      const wooviSubaccounts = wooviResult.data || [];
      console.log('Woovi subaccounts found:', wooviSubaccounts.length, wooviSubaccounts);

      // Get all local partners
      const { data: partners, error: partnersError } = await (supabase
        .from('split_partners' as any)
        .select('id, pix_key, woovi_subaccount_id') as any);

      if (partnersError) throw partnersError;

      let updatedCount = 0;

      // Match by pixKey and update woovi_subaccount_id
      for (const partner of partners || []) {
        const matchingSubaccount = wooviSubaccounts.find(
          (sub: { pixKey?: string; subaccountId?: string }) => sub.pixKey === partner.pix_key
        );

        if (matchingSubaccount && !partner.woovi_subaccount_id) {
          const subaccountId = matchingSubaccount.subaccountId || matchingSubaccount.pixKey;
          
          const { error: updateError } = await (supabase
            .from('split_partners' as any)
            .update({ woovi_subaccount_id: subaccountId } as any)
            .eq('id', partner.id) as any);

          if (!updateError) {
            updatedCount++;
            console.log('Updated partner', partner.id, 'with subaccount', subaccountId);
          }
        }
      }

      return { 
        synced: updatedCount, 
        total: partners?.length || 0,
        wooviSubaccounts: wooviSubaccounts.length 
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['split_partners'] });
      queryClient.invalidateQueries({ queryKey: ['split_partners_active'] });
    },
  });
}

export function useSplitPartners() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['split_partners', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('split_partners' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data as SplitPartner[];
    },
    enabled: !!user,
  });
}

export function useActiveSplitPartners() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['split_partners_active', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('split_partners' as any)
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data as SplitPartner[];
    },
    enabled: !!user,
  });
}

export function useCreateSplitPartner() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateSplitPartnerData) => {
      if (!user) throw new Error('User not authenticated');

      // First, create the subaccount on Woovi
      let wooviSubaccountId: string | null = null;
      
      try {
        const { data: subaccountResult, error: subaccountError } = await supabase.functions.invoke('woovi-subaccount', {
          body: {
            action: 'create',
            name: data.name,
            pixKey: data.pix_key,
          },
        });

        if (subaccountError) {
          console.error('Error creating Woovi subaccount:', subaccountError);
        } else if (subaccountResult?.success && subaccountResult?.data) {
          // Woovi returns subAccount with the pixKey as identifier
          const subAccount = subaccountResult.data.subAccount || subaccountResult.data;
          wooviSubaccountId = subAccount?.subaccountId || subAccount?.id || subAccount?.pixKey || null;
          console.log('Woovi subaccount created:', wooviSubaccountId, subaccountResult.data);
        } else if (subaccountResult?.error) {
          console.warn('Woovi subaccount creation warning:', subaccountResult.error);
        }
      } catch (err) {
        console.error('Failed to create Woovi subaccount:', err);
        // Continue without subaccount - will create partner locally anyway
      }

      // Create the partner in the database
      const { data: partner, error } = await (supabase
        .from('split_partners' as any)
        .insert({
          ...data,
          user_id: user.id,
          woovi_subaccount_id: wooviSubaccountId,
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      return { 
        partner: partner as SplitPartner, 
        wooviSubaccountCreated: !!wooviSubaccountId 
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['split_partners'] });
      queryClient.invalidateQueries({ queryKey: ['split_partners_active'] });
    },
  });
}

export function useUpdateSplitPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateSplitPartnerData) => {
      const { data: partner, error } = await (supabase
        .from('split_partners' as any)
        .update(data as any)
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return partner as SplitPartner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['split_partners'] });
      queryClient.invalidateQueries({ queryKey: ['split_partners_active'] });
    },
  });
}

export function useDeleteSplitPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, get the partner to check for woovi_subaccount_id
      const { data: partner, error: fetchError } = await (supabase
        .from('split_partners' as any)
        .select('woovi_subaccount_id')
        .eq('id', id)
        .single() as any);

      if (fetchError) throw fetchError;

      // If there's a Woovi subaccount, try to delete it
      if (partner?.woovi_subaccount_id) {
        try {
          await supabase.functions.invoke('woovi-subaccount', {
            body: {
              action: 'delete',
              subaccountId: partner.woovi_subaccount_id,
            },
          });
          console.log('Woovi subaccount deleted:', partner.woovi_subaccount_id);
        } catch (err) {
          console.error('Failed to delete Woovi subaccount:', err);
          // Continue with local deletion even if Woovi fails
        }
      }

      // Delete from database
      const { error } = await (supabase
        .from('split_partners' as any)
        .delete()
        .eq('id', id) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['split_partners'] });
      queryClient.invalidateQueries({ queryKey: ['split_partners_active'] });
    },
  });
}
