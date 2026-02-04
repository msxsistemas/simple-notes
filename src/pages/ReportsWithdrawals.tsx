import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { DollarSign, RefreshCw, Loader2, Calendar, FileText } from 'lucide-react';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { TablePagination } from '@/components/ui/table-pagination';
import { SearchInput } from '@/components/ui/search-input';
import { exportToPDF } from '@/lib/export-pdf';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-success/10 text-success hover:bg-success/20 text-xs font-medium">✓ APROVADO</Badge>;
    case 'pending':
      return <Badge className="bg-warning/10 text-warning hover:bg-warning/20 text-xs font-medium">⏳ PENDENTE</Badge>;
    case 'processing':
      return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-xs font-medium">⟳ PROCESSANDO</Badge>;
    case 'failed':
      return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium">✕ CANCELADO</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return 'Aprovado';
    case 'pending': return 'Pendente';
    case 'processing': return 'Processando';
    case 'failed': return 'Cancelado';
    default: return status;
  }
};

export default function ReportsWithdrawals() {
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: withdrawals, isLoading } = useWithdrawals();

  const filteredWithdrawals = useMemo(() => {
    return (withdrawals || []).filter((w) => {
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      const matchesSearch = searchQuery === '' || 
        w.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.document.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.pix_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [withdrawals, statusFilter, searchQuery]);

  const paginatedWithdrawals = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredWithdrawals.slice(startIndex, startIndex + pageSize);
  }, [filteredWithdrawals, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredWithdrawals.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const stats = useMemo(() => ({
    approved_amount: filteredWithdrawals
      .filter(w => w.status === 'completed')
      .reduce((acc, w) => acc + Number(w.amount), 0),
    total_count: filteredWithdrawals.length,
  }), [filteredWithdrawals]);

  const exportPDF = () => {
    if (!filteredWithdrawals || filteredWithdrawals.length === 0) return;
    
    const headers = ['Destinatário', 'Data', 'ID', 'Chave PIX', 'Status', 'Valor (R$)', 'Taxa (R$)', 'Total (R$)'];
    const data = filteredWithdrawals.map((w) => [
      w.recipient_name,
      new Date(w.created_at).toLocaleDateString('pt-BR'),
      w.id.substring(0, 8).toUpperCase(),
      w.pix_key,
      getStatusText(w.status),
      Number(w.amount).toFixed(2).replace('.', ','),
      Number(w.fee).toFixed(2).replace('.', ','),
      Number(w.total).toFixed(2).replace('.', ','),
    ]);
    
    exportToPDF({
      title: 'Relatório de Saídas',
      headers,
      data,
      filename: 'relatorio-saidas',
    });
  };

  return (
    <DashboardLayout title="SAÍDAS">
      <div className="space-y-6">
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
                <SelectItem value="completed">Aprovado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="failed">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 flex items-center justify-center border-2 border-success rounded-full">
                  <DollarSign className="h-4 w-4 text-success" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bold">Cashout Aprovado</p>
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
                  <RefreshCw className="h-6 w-6 text-success" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bold">Número de Saídas</p>
                  <p className="text-xl font-bold">{stats.total_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawals Table */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">Últimos saques</CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <SearchInput
                  value={searchQuery}
                  onChange={(value) => {
                    setSearchQuery(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar destinatário, CPF ou PIX..."
                  className="w-full sm:w-64"
                />
                <Button 
                  onClick={exportPDF} 
                  className="gap-2 bg-success hover:bg-success/90"
                  disabled={!filteredWithdrawals || filteredWithdrawals.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum saque encontrado
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="rounded-lg border border-border/50 overflow-hidden hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Chave PIX</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Taxa</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedWithdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{w.recipient_name}</p>
                              <p className="text-xs text-muted-foreground">{w.document}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(w.created_at).toLocaleDateString('pt-BR')} {new Date(w.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{w.id.substring(0, 8).toUpperCase()}</TableCell>
                          <TableCell className="text-sm">{w.pix_key}</TableCell>
                          <TableCell>{getStatusBadge(w.status)}</TableCell>
                          <TableCell className="text-right">
                            R$ {Number(w.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            R$ {Number(w.fee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {Number(w.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {paginatedWithdrawals.map((w) => (
                    <Card key={w.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{w.recipient_name}</p>
                            <p className="text-xs text-muted-foreground">{w.document}</p>
                          </div>
                          {getStatusBadge(w.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Data</p>
                            <p>{new Date(w.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Chave PIX</p>
                            <p className="truncate text-xs">{w.pix_key}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Valor</p>
                            <p>R$ {Number(w.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Total</p>
                            <p className="font-semibold">R$ {Number(w.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                  totalItems={filteredWithdrawals.length}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
