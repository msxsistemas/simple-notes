import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'merchant' | 'partner';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_role', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_user_role', {
        _user_id: user.id,
      });

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data as AppRole | null;
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { data: role, isLoading } = useUserRole();
  return { isAdmin: role === 'admin', isLoading };
}

export function useIsPartner() {
  const { data: role, isLoading } = useUserRole();
  return { isPartner: role === 'partner', isLoading };
}

export function useIsMerchant() {
  const { data: role, isLoading } = useUserRole();
  return { isMerchant: role === 'merchant', isLoading };
}
