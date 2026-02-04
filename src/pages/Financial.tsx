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
  DollarSign, 
  CreditCard, 
  XCircle,
  MessageCircle,
  Globe,
  Mail,
  Phone,
  Eye,
  Wallet,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTransactionStats } from '@/hooks/useTransactions';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { useFeeConfig } from '@/hooks/useFeeConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Financial() {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const { toast } = useToast();

  const { user, profile } = useAuth();
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold uppercase truncate">
                  {profile?.full_name || 'Nome do Usuário'}
                </h2>
                <p className="text-sm text-muted-foreground mb-3">Seller</p>

                {/* Suporte Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-primary text-primary hover:bg-primary/10 mb-4"
                >
                  <MessageCircle className="h-4 w-4" />
                  Suporte
                </Button>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium text-foreground">Documento :</span>
                    <span>{profile?.document || '---'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium text-foreground">Email :</span>
                    <a href={`mailto:${user?.email}`} className="text-primary hover:underline truncate">
                      {user?.email || '---'}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium text-foreground">Phone :</span>
                    <span>{profile?.phone || '---'}</span>
                  </div>
                </div>

                {/* Minhas Taxas Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-primary text-primary hover:bg-primary/10 mt-4"
                  asChild
                >
                  <Link to="/fees">
                    <Eye className="h-4 w-4" />
                    Minhas Taxas
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats + Withdraw Section */}
        <div className="space-y-4">
          {/* Stats Grid 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            {/* Disponível para saque */}
            <Card className="border-border/50">
              <CardContent className="pt-6 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-primary rounded-full">
                    <DollarSign className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Disponível para saque</p>
                    <p className="text-xl font-bold mt-1">
                      R$ {withdrawableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* A Receber */}
            <Card className="border-border/50">
              <CardContent className="pt-6 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-muted-foreground/30 rounded-full">
                    <CreditCard className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">A Receber</p>
                    <p className="text-xl font-bold mt-1">
                      R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Sacado (substituindo Reserva Financeira) */}
            <Card className="border-border/50">
              <CardContent className="pt-6 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-success rounded-full">
                    <Wallet className="h-5 w-5 text-success" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Total Sacado</p>
                    <p className="text-xl font-bold mt-1">
                      R$ {(withdrawals?.reduce((acc, w) => w.status === 'completed' ? acc + Number(w.total) : acc, 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Saldo Em Protesto */}
            <Card className="border-border/50">
              <CardContent className="pt-6 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-destructive rounded-full">
                    <XCircle className="h-5 w-5 text-destructive" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Saldo Em Protesto</p>
                    <p className="text-xl font-bold mt-1">R$ 0,00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sacar Button */}
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full h-12 gap-2 bg-success hover:bg-success/90 text-white font-semibold text-base" 
                disabled={withdrawableBalance <= 0}
              >
                <Wallet className="h-5 w-5" />
                Sacar
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
        </div>
      </div>

      {/* Withdrawal History */}
      <Card className="border-border/50 mt-6">
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
    </DashboardLayout>
  );
}
