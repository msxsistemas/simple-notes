import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePartnerProfile } from './usePartnerData';
import { toast } from 'sonner';

export interface PartnerProduct {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  price: number;
  status: string;
  sold_count: number;
  created_at: string;
  updated_at: string;
}

export function usePartnerProducts() {
  const { data: partnerProfile } = usePartnerProfile();

  return useQuery({
    queryKey: ['partner_products', partnerProfile?.id],
    queryFn: async () => {
      if (!partnerProfile?.id) return [];

      const { data, error } = await supabase
        .from('partner_products')
        .select('*')
        .eq('partner_id', partnerProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching partner products:', error);
        throw error;
      }

      return data as PartnerProduct[];
    },
    enabled: !!partnerProfile?.id,
  });
}

export function useCreatePartnerProduct() {
  const queryClient = useQueryClient();
  const { data: partnerProfile } = usePartnerProfile();

  return useMutation({
    mutationFn: async (product: { name: string; description?: string; price: number }) => {
      if (!partnerProfile?.id) {
        throw new Error('Perfil de parceiro não encontrado');
      }

      const { data, error } = await supabase
        .from('partner_products')
        .insert({
          partner_id: partnerProfile.id,
          name: product.name,
          description: product.description || null,
          price: product.price,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner_products'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      toast.error('Erro ao criar produto');
    },
  });
}

export function useUpdatePartnerProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; price?: number; status?: string }) => {
      const { data, error } = await supabase
        .from('partner_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner_products'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating product:', error);
      toast.error('Erro ao atualizar produto');
    },
  });
}

export function useDeletePartnerProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('partner_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner_products'] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    },
  });
}

export function usePartnerTransactions() {
  const { data: partnerProfile } = usePartnerProfile();

  return useQuery({
    queryKey: ['partner_transactions', partnerProfile?.id],
    queryFn: async () => {
      if (!partnerProfile?.id) return [];

      const { data, error } = await supabase
        .from('partner_transactions')
        .select('*, partner_products(name)')
        .eq('partner_id', partnerProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching partner transactions:', error);
        throw error;
      }

      return data;
    },
    enabled: !!partnerProfile?.id,
  });
}
