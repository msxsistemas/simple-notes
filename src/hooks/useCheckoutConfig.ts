 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
   custom_title: null,
   custom_description: null,
   success_message: null,
 };
 
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
 
   return {
     config: config ? { ...defaultConfig, ...config } : defaultConfig,
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
 
   return {
     config: config ? { ...defaultConfig, ...config } : defaultConfig,
     isLoading,
   };
 }