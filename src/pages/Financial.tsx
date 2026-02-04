import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  ShieldAlert, 
  
  Plus,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTransactionStats } from '@/hooks/useTransactions';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { useFeeConfig } from '@/hooks/useFeeConfig';

export default function Financial() {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useTransactionStats();
  const { data: withdrawals, isLoading: withdrawalsLoading } = useWithdrawals();
  const { data: feeConfig } = useFeeConfig();

  const isLoading = statsLoading || withdrawalsLoading;

  const availableBalance = stats?.approved_amount || 0;
  const pendingAmount = stats?.pending_amount || 0;
  const withdrawableBalance = availableBalance;

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Erro', description: 'Valor inválido', variant: 'destructive' });
      return;
    }
    if (amount > withdrawableBalance) {
      toast({ title: 'Erro', description: 'Saldo insuficiente', variant: 'destructive' });
      return;
    }
    if (!pixKey) {
      toast({ title: 'Erro', description: 'Informe a chave PIX', variant: 'destructive' });
      return;
    }
    
    toast({ 
      title: 'Saque solicitado!', 
      description: `Transferência de R$ ${amount.toFixed(2)} em processamento.` 
    });
    setIsWithdrawOpen(false);
    setWithdrawAmount('');
    setPixKey('');
  };

  const financialStats = [
    {
      title: 'Saldo Disponível',
      value: withdrawableBalance,
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      description: 'Disponível para saque',
    },
    {
      title: 'A Receber',
      value: pendingAmount,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      description: 'Pagamentos pendentes',
    },
    {
      title: 'Em Protesto',
      value: 0,
      icon: ShieldAlert,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      description: 'Disputas em aberto',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Financeiro">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Financeiro">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {financialStats.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    R$ {stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Withdraw Action Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-primary" />
              Solicitar Saque
            </CardTitle>
            <CardDescription>Transfira seu saldo via PIX</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Saldo disponível</p>
              <p className="text-3xl font-bold text-primary">
                R$ {withdrawableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gradient-primary gap-2" disabled={withdrawableBalance <= 0}>
                  <Plus className="h-4 w-4" />
                  Novo Saque
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar Saque PIX</DialogTitle>
                  <DialogDescription>
                    O valor será transferido em até 24 horas úteis.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor do saque</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0,00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Taxa de saque: R$ {feeConfig?.pix_out_fixed?.toFixed(2) || '2,00'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pix">Chave PIX</Label>
                    <Input
                      id="pix"
                      placeholder="E-mail, CPF, telefone ou chave aleatória"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsWithdrawOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleWithdraw} className="gradient-primary">
                    Confirmar Saque
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="text-xs text-muted-foreground">
              <p>• Saques realizados em dias úteis até 18h</p>
              <p>• Taxa fixa de R$ {feeConfig?.pix_out_fixed?.toFixed(2) || '2,00'} por saque</p>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle>Histórico de Saques</CardTitle>
            <CardDescription>Últimas transferências realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            {!withdrawals || withdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum saque realizado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-sm">{w.id.substring(0, 8)}</TableCell>
                      <TableCell>
                        {new Date(w.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {w.status === 'completed' ? (
                          <Badge className="bg-success/10 text-success hover:bg-success/20 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Concluído
                          </Badge>
                        ) : (
                          <Badge className="bg-warning/10 text-warning hover:bg-warning/20 gap-1">
                            <Clock className="h-3 w-3" />
                            {w.status === 'processing' ? 'Processando' : 'Pendente'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {Number(w.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        R$ {Number(w.fee).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
