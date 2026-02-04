import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FeeConfig {
  id: string;
  user_id: string;
  pix_in_percentage: number;
  pix_in_fixed: number;
  pix_out_fixed: number;
  reserve_percentage: number;
  max_pix_transaction: number;
  updated_at: string;
}

export function useFeeConfig() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['fee_config', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_configs')
        .select('*')
        .single();

      if (error) throw error;
      return data as FeeConfig;
    },
    enabled: !!user,
  });
}
