import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 export interface CheckoutConfig {
   id: string;
   user_id: string;
   logo_url: string | null;
   primary_color: string;
   background_color: string;
   text_color: string;
   require_phone: boolean;
   require_cpf: boolean;
   show_product_name: boolean;
  show_name: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_cpf: boolean;
   custom_title: string | null;
   custom_description: string | null;
   success_message: string | null;
   created_at: string;
   updated_at: string;
 }
 
 const defaultConfig: Omit<CheckoutConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
   logo_url: null,
   primary_color: '#8B5CF6',
   background_color: '#0F0F23',
   text_color: '#FFFFFF',
   require_phone: false,
   require_cpf: false,
   show_product_name: true,
  show_name: true,
  show_email: true,
  show_phone: true,
  show_cpf: true,
   custom_title: null,
   custom_description: null,
   success_message: null,
 };

function mergeWithDefaults(
  config: Partial<CheckoutConfig> | null | undefined,
): Omit<CheckoutConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  return {
    logo_url: config?.logo_url ?? defaultConfig.logo_url,
    primary_color: config?.primary_color ?? defaultConfig.primary_color,
    background_color: config?.background_color ?? defaultConfig.background_color,
    text_color: config?.text_color ?? defaultConfig.text_color,
    require_phone: config?.require_phone ?? defaultConfig.require_phone,
    require_cpf: config?.require_cpf ?? defaultConfig.require_cpf,
    show_product_name: config?.show_product_name ?? defaultConfig.show_product_name,
    show_name: config?.show_name ?? defaultConfig.show_name,
    show_email: config?.show_email ?? defaultConfig.show_email,
    show_phone: config?.show_phone ?? defaultConfig.show_phone,
    show_cpf: config?.show_cpf ?? defaultConfig.show_cpf,
    custom_title: config?.custom_title ?? defaultConfig.custom_title,
    custom_description: config?.custom_description ?? defaultConfig.custom_description,
    success_message: config?.success_message ?? defaultConfig.success_message,
  };
}
 
 export function useCheckoutConfig() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const { data: config, isLoading } = useQuery({
     queryKey: ['checkout-config', user?.id],
     queryFn: async () => {
       if (!user) return null;
       
       const { data, error } = await supabase
         .from('checkout_configs')
         .select('*')
         .eq('user_id', user.id)
         .maybeSingle();
 
       if (error && error.code !== 'PGRST116') throw error;
       return data as CheckoutConfig | null;
     },
     enabled: !!user,
   });
 
   const upsertMutation = useMutation({
     mutationFn: async (updates: Partial<Omit<CheckoutConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
       if (!user) throw new Error('Usuário não autenticado');
 
       const { data, error } = await supabase
         .from('checkout_configs')
         .upsert({
           user_id: user.id,
           ...updates,
         }, { onConflict: 'user_id' })
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['checkout-config'] });
     },
   });

  const mergedConfig = useMemo(() => {
    // IMPORTANT: avoid recreating a new object on every render,
    // otherwise pages syncing local form state from `config` will reset user interactions.
    return mergeWithDefaults(config ?? undefined);
  }, [
    config?.id,
    config?.updated_at,
    config?.logo_url,
    config?.primary_color,
    config?.background_color,
    config?.text_color,
    config?.require_phone,
    config?.require_cpf,
    config?.show_product_name,
    config?.show_name,
    config?.show_email,
    config?.show_phone,
    config?.show_cpf,
    config?.custom_title,
    config?.custom_description,
    config?.success_message,
  ]);
 
   return {
    config: mergedConfig,
     isLoading,
     updateConfig: upsertMutation.mutateAsync,
     isUpdating: upsertMutation.isPending,
   };
 }
 
 // Hook for public checkout - fetches config by merchant ID
 export function usePublicCheckoutConfig(merchantId: string | null) {
   const { data: config, isLoading } = useQuery({
     queryKey: ['public-checkout-config', merchantId],
     queryFn: async () => {
       if (!merchantId) return null;
       
       const { data, error } = await supabase
         .from('checkout_configs')
         .select('*')
         .eq('user_id', merchantId)
         .maybeSingle();
 
       if (error && error.code !== 'PGRST116') throw error;
       return data as CheckoutConfig | null;
     },
     enabled: !!merchantId,
   });

  const mergedConfig = useMemo(() => {
    return mergeWithDefaults(config ?? undefined);
  }, [
    config?.id,
    config?.updated_at,
    config?.logo_url,
    config?.primary_color,
    config?.background_color,
    config?.text_color,
    config?.require_phone,
    config?.require_cpf,
    config?.show_product_name,
    config?.show_name,
    config?.show_email,
    config?.show_phone,
    config?.show_cpf,
    config?.custom_title,
    config?.custom_description,
    config?.success_message,
  ]);
 
   return {
    config: mergedConfig,
     isLoading,
   };
 }