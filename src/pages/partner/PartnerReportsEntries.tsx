import { useState, useMemo } from 'react';
import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, DollarSign, ShoppingCart, ThumbsUp, XCircle, Loader2, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePartnerProfile } from '@/hooks/usePartnerData';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { TablePagination } from '@/components/ui/table-pagination';
import { SearchInput } from '@/components/ui/search-input';
import { exportToPDF } from '@/lib/export-pdf';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-success/10 text-success hover:bg-success/20 text-xs">✓ APROVADO</Badge>;
    case 'pending':
      return <Badge className="bg-warning/10 text-warning hover:bg-warning/20 text-xs">⏳ PENDENTE</Badge>;
    case 'cancelled':
    case 'expired':
      return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs">✕ CANCELADO</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'paid': return 'Aprovado';
    case 'pending': return 'Pendente';
    case 'cancelled':
    case 'expired': return 'Cancelado';
    default: return status;
  }
};

export default function PartnerReportsEntries() {
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: profile } = usePartnerProfile();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['partner_transactions_report', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('partner_transactions')
        .select('*')
        .eq('partner_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  const performanceChartData = useMemo(() => {
    const source = transactions || [];
    const now = new Date();

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString('pt-BR', { month: 'short' });
      return {
        month: label.charAt(0).toUpperCase() + label.slice(1),
        monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        value: 0,
      };
    });

    for (const tx of source) {
      if (tx.status !== 'paid') continue;
      const d = new Date(tx.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const idx = months.findIndex((m) => m.monthKey === key);
      if (idx !== -1) months[idx].value += Number(tx.amount);
    }

    return months.map(({ month, value }) => ({ month, value }));
  }, [transactions]);

  const stats = useMemo(() => {
    if (!transactions) return {
      approved_amount: 0,
      approved_count: 0,
      total_transactions: 0,
      cancelled_amount: 0,
    };
    const approved = transactions.filter(tx => tx.status === 'paid');
    const cancelled = transactions.filter(tx => tx.status === 'cancelled' || tx.status === 'expired');
    return {
      approved_amount: approved.reduce((sum, tx) => sum + Number(tx.amount), 0),
      approved_count: approved.length,
      total_transactions: transactions.length,
      cancelled_amount: cancelled.reduce((sum, tx) => sum + Number(tx.amount), 0),
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((tx) => {
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchesSearch = searchQuery === '' || 
        (tx.customer_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (tx.customer_email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [transactions, statusFilter, searchQuery]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const exportPDF = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;
    
    const headers = ['Cliente', 'Data', 'ID Transação', 'Método', 'Status', 'Valor (R$)', 'Líquido (R$)'];
    const data = filteredTransactions.map((tx) => [
      tx.customer_name || 'Cliente',
      new Date(tx.created_at).toLocaleDateString('pt-BR') + ' ' + new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      tx.id.substring(0, 8).toUpperCase(),
      'PIX',
      getStatusText(tx.status),
      Number(tx.amount).toFixed(2).replace('.', ','),
      Number(tx.net_amount).toFixed(2).replace('.', ','),
    ]);
    
    exportToPDF({
      title: 'Relatório de Entradas',
      headers,
      data,
      filename: 'relatorio-entradas-parceiro',
    });
  };

  const conversionRate = stats.total_transactions 
    ? ((stats.approved_count / stats.total_transactions) * 100).toFixed(2)
    : '0';

  if (isLoading) {
    return (
      <PartnerLayout title="Entradas">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout title="Entradas">
      <div className="space-y-6">
        {/* Performance Chart and Stats */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Desempenho</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceChartData} barCategoryGap="25%">
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                              <p className="text-sm font-medium">{payload[0].payload.month}</p>
                              <p className="text-sm text-muted-foreground">
                                Faturamento: <span className="font-semibold text-foreground">R$ {payload[0].value}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {performanceChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.value > 0 ? '#22c55e' : '#e2e8f0'}
                          opacity={entry.value > 0 ? 0.6 : 0.3}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stats + Filters */}
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 flex items-center justify-center border-2 border-success rounded-full">
                      <DollarSign className="h-4 w-4 text-success" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-bold">Valor Aprovado</p>
                      <p className="text-xl font-bold">
                        R$ {stats.approved_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-success" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-bold">Número de Vendas</p>
                      <p className="text-xl font-bold">{stats.total_transactions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 flex items-center justify-center">
                      <ThumbsUp className="h-6 w-6 text-success" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-bold">Taxa de Conversão</p>
                      <p className="text-xl font-bold">{conversionRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-destructive" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-bold">Valores Estornados</p>
                      <p className="text-xl font-bold">
                        R$ {stats.cancelled_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="rounded-xl border-2 border-dashed border-success/50 bg-success/10 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-auto gap-2 bg-success/20 hover:bg-success/30 border-0 shadow-none rounded-lg px-4 h-9 focus:ring-0 focus:ring-offset-0">
                    <Calendar className="h-4 w-4 text-success" />
                    <SelectValue placeholder="Todo o período" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg">
                    <SelectItem value="all">Todo o período</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mês</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-auto gap-2 bg-success/20 hover:bg-success/30 border-0 shadow-none rounded-lg px-4 h-9 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg">
                    <SelectItem value="all">Status</SelectItem>
                    <SelectItem value="paid">Aprovado</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">Últimas vendas</CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <SearchInput
                  value={searchQuery}
                  onChange={(value) => {
                    setSearchQuery(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar cliente, email ou ID..."
                  className="w-full sm:w-64"
                />
                <Button 
                  onClick={exportPDF} 
                  className="gap-2 bg-success hover:bg-success/90"
                  disabled={!filteredTransactions || filteredTransactions.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="rounded-lg border border-border/50 overflow-hidden hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Cliente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>ID Transação</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tx.customer_name || 'Cliente'}</p>
                              <p className="text-xs text-muted-foreground">{tx.customer_email || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(tx.created_at).toLocaleDateString('pt-BR')} {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{tx.id.substring(0, 8).toUpperCase()}</TableCell>
                          <TableCell>PIX</TableCell>
                          <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {Number(tx.amount).toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {Number(tx.net_amount).toFixed(2).replace('.', ',')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {paginatedTransactions.map((tx) => (
                    <Card key={tx.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{tx.customer_name || 'Cliente'}</p>
                            <p className="text-xs text-muted-foreground">{tx.customer_email || ''}</p>
                          </div>
                          {getStatusBadge(tx.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Data</p>
                            <p>{new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">ID</p>
                            <p className="font-mono text-xs">{tx.id.substring(0, 8).toUpperCase()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Valor</p>
                            <p className="font-semibold">R$ {Number(tx.amount).toFixed(2).replace('.', ',')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Líquido</p>
                            <p>R$ {Number(tx.net_amount).toFixed(2).replace('.', ',')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredTransactions.length}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
