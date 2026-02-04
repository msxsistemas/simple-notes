import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  status: 'active' | 'inactive';
  type: 'digital' | 'physical';
  checkout_url: string | null;
  sold_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderBump {
  id: string;
  product_id: string;
  name: string;
  value: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  type: 'digital' | 'physical';
}

export interface CreateOrderBumpData {
  product_id: string;
  name: string;
  value: number;
}

export function useProducts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user,
  });
}

export function useProduct(productId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!user && !!productId,
  });
}

export function useOrderBumps(productId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['order_bumps', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_bumps')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrderBump[];
    },
    enabled: !!user && !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          ...data,
          user_id: user.id,
          checkout_url: `${window.location.origin}/checkout/${crypto.randomUUID()}`,
        })
        .select()
        .single();

      if (error) throw error;
      return product as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: string }) => {
      const { data: product, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return product as Product;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCreateOrderBump() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderBumpData) => {
      const { data: orderBump, error } = await supabase
        .from('order_bumps')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return orderBump as OrderBump;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order_bumps', variables.product_id] });
    },
  });
}

export function useDeleteOrderBump() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, product_id }: { id: string; product_id: string }) => {
      const { error } = await supabase
        .from('order_bumps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return product_id;
    },
    onSuccess: (product_id) => {
      queryClient.invalidateQueries({ queryKey: ['order_bumps', product_id] });
    },
  });
}
