import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useRealtimeTransactions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime transaction update:', payload);

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['transaction_stats'] });

          // Show toast notification based on event type
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as { customer_name?: string; amount?: number };
            toast.info('Nova transação', {
              description: `${newRecord.customer_name || 'Cliente'} - R$ ${Number(newRecord.amount || 0).toFixed(2)}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as { status?: string; customer_name?: string };
            const oldRecord = payload.old as { status?: string };
            
            if (updatedRecord.status !== oldRecord.status) {
              const statusMessages: Record<string, { title: string; type: 'success' | 'info' | 'warning' }> = {
                approved: { title: 'Pagamento aprovado! 🎉', type: 'success' },
                cancelled: { title: 'Transação cancelada', type: 'warning' },
                refunded: { title: 'Transação reembolsada', type: 'info' },
              };

              const statusInfo = statusMessages[updatedRecord.status || ''];
              if (statusInfo) {
                toast[statusInfo.type](statusInfo.title, {
                  description: updatedRecord.customer_name || 'Cliente',
                });
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}

export function useRealtimePixCharges() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('pix-charges-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pix_charges',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime pix charge update:', payload);
          
          const updatedRecord = payload.new as { status?: string };
          const oldRecord = payload.old as { status?: string };

          // Refresh data when pix charge status changes
          if (updatedRecord.status !== oldRecord.status) {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['transaction_stats'] });
            queryClient.invalidateQueries({ queryKey: ['pix_charges'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
