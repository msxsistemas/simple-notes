import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  TrendingUp, 
  DollarSign,
  ShoppingCart,
  Users,
  Loader2,
  Radio,
} from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  type ChartConfig,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePartnerProfile } from '@/hooks/usePartnerData';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const chartConfig: ChartConfig = {
  sales: {
    label: 'Vendas',
    color: 'hsl(var(--chart-1))',
  },
  conversions: {
    label: 'Transações',
    color: 'hsl(var(--chart-2))',
  },
};

// Hook to get partner transactions and stats
function usePartnerTransactions() {
  const { data: partnerProfile } = usePartnerProfile();

  return useQuery({
    queryKey: ['partner_transactions', partnerProfile?.id],
    queryFn: async () => {
      if (!partnerProfile) return [];

      const { data, error } = await supabase
        .from('partner_transactions')
        .select('*')
        .eq('partner_id', partnerProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerProfile,
  });
}

function usePartnerTransactionStats() {
  const { data: transactions } = usePartnerTransactions();

  return useMemo(() => {
    if (!transactions) return {
      approved_amount: 0,
      total_revenue: 0,
      approved_count: 0,
      total_transactions: 0,
    };

    const approved = transactions.filter(tx => tx.status === 'paid');
    const approvedAmount = approved.reduce((sum, tx) => sum + Number(tx.net_amount), 0);
    const totalRevenue = approved.reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      approved_amount: approvedAmount,
      total_revenue: totalRevenue,
      approved_count: approved.length,
      total_transactions: transactions.length,
    };
  }, [transactions]);
}

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = usePartnerProfile();
  const { data: transactions, isLoading: transactionsLoading } = usePartnerTransactions();
  const stats = usePartnerTransactionStats();

  const isLoading = profileLoading || transactionsLoading;

  // Calculate monthly sales data for chart
  const salesData = useMemo(() => {
    if (!transactions) return [];
    
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM', { locale: ptBR }),
        monthStart: startOfMonth(date),
        sales: 0,
        conversions: 0,
      };
    });

    transactions.forEach((tx) => {
      const txDate = new Date(tx.created_at);
      const monthIndex = last6Months.findIndex(
        (m) => txDate >= m.monthStart && txDate < subMonths(m.monthStart, -1)
      );
      if (monthIndex !== -1) {
        if (tx.status === 'paid') {
          // Faturamento deve contar apenas pagas
          last6Months[monthIndex].sales += Number(tx.amount);
          last6Months[monthIndex].conversions += 1;
        }
      }
    });

    return last6Months.map(({ month, sales, conversions }) => ({
      month: month.charAt(0).toUpperCase() + month.slice(1),
      sales,
      conversions,
    }));
  }, [transactions]);

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.slice(0, 5).map((tx) => ({
      id: tx.id,
      customer: tx.customer_name || 'Cliente',
      amount: Number(tx.amount),
      status: tx.status,
      time: getTimeAgo(new Date(tx.created_at)),
    }));
  }, [transactions]);

  const availableBalance = stats.approved_amount;
  const totalRevenue = stats.total_revenue;
  const approvedCount = stats.approved_count;
  const conversionRate = stats.total_transactions 
    ? Math.round((stats.approved_count / stats.total_transactions) * 100) 
    : 0;

  const dashboardStats = [
    {
      title: 'Saldo Disponível',
      value: formatCurrency(availableBalance),
      icon: Wallet,
      hasBorder: true,
      color: 'text-primary',
      borderColor: 'border-primary',
    },
    {
      title: 'Faturamento Total',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      hasBorder: true,
      color: 'text-success',
      borderColor: 'border-success',
    },
    {
      title: 'Vendas Aprovadas',
      value: approvedCount.toString(),
      icon: ShoppingCart,
      hasBorder: false,
      color: 'text-success',
    },
    {
      title: 'Taxa de Conversão',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      hasBorder: false,
      color: 'text-success',
    },
  ];

  if (isLoading) {
    return (
      <PartnerLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout title="Dashboard">
      {/* Realtime Indicator */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Radio className="h-4 w-4 text-success animate-pulse" />
        <span>Atualização em tempo real ativa</span>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-bold">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                {stat.hasBorder ? (
                  <div className={`h-7 w-7 flex items-center justify-center border-2 ${stat.borderColor} rounded-full`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} strokeWidth={1.5} />
                  </div>
                ) : (
                  <div className="h-7 w-7 flex items-center justify-center">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} strokeWidth={1.5} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Sales Chart - Takes 2 columns */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-white dark:bg-card">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold text-foreground">Vendas</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart data={salesData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="#4ade80" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                  dy={8}
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(value) => `R$${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  width={80}
                />
                <ChartTooltip 
                  cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-md shadow-md px-3 py-2 min-w-[140px]">
                          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded mb-2 inline-block">
                            {label}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-[#22c55e] flex-shrink-0" />
                            <span className="text-xs text-gray-600 dark:text-muted-foreground">Faturamento:</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                              R${Number(payload[0].value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Conversion Donut Chart - Takes 1 column */}
        <Card className="border-0 shadow-sm bg-white dark:bg-card">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold text-foreground">Conversão</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col items-center justify-center h-[260px]">
              <ChartContainer config={chartConfig} className="h-[140px] w-[140px]">
                <PieChart>
                  <Pie
                    data={[{ name: 'PIX', value: 100 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={0}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill="#22c55e" />
                  </Pie>
                </PieChart>
              </ChartContainer>
              
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                  <span className="text-xs text-gray-600 dark:text-muted-foreground">PIX</span>
                </div>
              </div>
              
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 text-center">
                Desempenho do método de pagamento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-0 shadow-sm bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Transações Recentes</CardTitle>
            <CardDescription>Últimas 5 transações</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/partner/commissions')}>
            Ver todas
          </Button>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação ainda
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.customer}</p>
                      <p className="text-xs text-muted-foreground">{tx.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">R$ {tx.amount.toFixed(2)}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        tx.status === 'paid'
                          ? 'bg-success/10 text-success'
                          : tx.status === 'pending'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {tx.status === 'paid' ? 'Aprovado' : tx.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PartnerLayout>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  return `há ${diffDays}d`;
}
