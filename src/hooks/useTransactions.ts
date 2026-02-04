import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Transaction {
  id: string;
  user_id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  amount: number;
  fee: number;
  net_amount: number;
  status: 'pending' | 'approved' | 'cancelled' | 'refunded';
  payment_method: 'pix';
  pix_code: string | null;
  pix_qr_code: string | null;
  created_at: string;
  updated_at: string;
}

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('transactions' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
}

export function useTransactionStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transaction_stats', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('transactions' as any)
        .select('status, amount, net_amount') as any);

      if (error) throw error;

      const transactions = data as Pick<Transaction, 'status' | 'amount' | 'net_amount'>[];

      const stats = {
        total_revenue: 0,
        approved_amount: 0,
        pending_amount: 0,
        cancelled_amount: 0,
        total_transactions: transactions.length,
        approved_count: 0,
        pending_count: 0,
      };

      transactions.forEach((t) => {
        if (t.status === 'approved') {
          stats.total_revenue += Number(t.amount);
          stats.approved_amount += Number(t.net_amount);
          stats.approved_count++;
        } else if (t.status === 'pending') {
          stats.pending_amount += Number(t.amount);
          stats.pending_count++;
        } else if (t.status === 'cancelled' || t.status === 'refunded') {
          stats.cancelled_amount += Number(t.amount);
        }
      });

      return stats;
    },
    enabled: !!user,
  });
}
