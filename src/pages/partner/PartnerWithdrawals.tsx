import { useState } from 'react';
import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Wallet } from 'lucide-react';
import { usePartnerWithdrawals, usePartnerBalance, usePartnerWithdrawalRequest, usePartnerProfile } from '@/hooks/usePartnerData';
import { useToast } from '@/hooks/use-toast';

const WITHDRAWAL_FEE = 2.00; // Fixed fee per withdrawal

export default function PartnerWithdrawals() {
  const { data: withdrawals, isLoading } = usePartnerWithdrawals();
  const { data: profile } = usePartnerProfile();
  const balance = usePartnerBalance();
  const withdrawalMutation = usePartnerWithdrawalRequest();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Erro', description: 'Valor inválido', variant: 'destructive' });
      return;
    }

    if (amount > balance.availableBalance) {
      toast({ title: 'Erro', description: 'Saldo insuficiente', variant: 'destructive' });
      return;
    }

    if (amount < WITHDRAWAL_FEE + 1) {
      toast({ 
        title: 'Erro', 
        description: `Valor mínimo de saque: ${formatCurrency(WITHDRAWAL_FEE + 1)}`, 
        variant: 'destructive' 
      });
      return;
    }

    try {
      await withdrawalMutation.mutateAsync({ amount, fee: WITHDRAWAL_FEE });
      toast({ title: 'Sucesso', description: 'Saque solicitado com sucesso!' });
      setIsDialogOpen(false);
      setWithdrawAmount('');
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao solicitar saque', 
        variant: 'destructive' 
      });
    }
  };

  if (isLoading) {
    return (
      <PartnerLayout title="Saques">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  const netAmount = parseFloat(withdrawAmount) - WITHDRAWAL_FEE;

  return (
    <PartnerLayout title="Saques">
      {/* Balance Card */}
      <Card className="border-border/50 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Disponível para Saque</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(balance.availableBalance)}</p>
              {balance.pendingWithdrawals > 0 && (
                <p className="text-sm text-warning mt-1">
                  Saques pendentes: {formatCurrency(balance.pendingWithdrawals)}
                </p>
              )}
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary" disabled={balance.availableBalance < WITHDRAWAL_FEE + 1}>
                  <Plus className="h-4 w-4 mr-2" />
                  Solicitar Saque
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar Saque</DialogTitle>
                  <DialogDescription>
                    Informe o valor que deseja sacar. Taxa de saque: {formatCurrency(WITHDRAWAL_FEE)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label>Chave PIX de destino</Label>
                    <Input value={profile?.pix_key || ''} disabled className="bg-muted" />
                  </div>

                  <div>
                    <Label>Valor do Saque</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min={WITHDRAWAL_FEE + 1}
                      max={balance.availableBalance}
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Saldo disponível: {formatCurrency(balance.availableBalance)}
                    </p>
                  </div>

                  {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Valor do saque:</span>
                        <span>{formatCurrency(parseFloat(withdrawAmount) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Taxa:</span>
                        <span>- {formatCurrency(WITHDRAWAL_FEE)}</span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between font-semibold">
                        <span>Valor líquido:</span>
                        <span className={netAmount > 0 ? 'text-success' : 'text-destructive'}>
                          {formatCurrency(Math.max(0, netAmount))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className="gradient-primary" 
                    onClick={handleWithdraw}
                    disabled={withdrawalMutation.isPending || netAmount <= 0}
                  >
                    {withdrawalMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Solicitando...
                      </>
                    ) : (
                      'Confirmar Saque'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Histórico de Saques</CardTitle>
          <CardDescription>Todos os seus saques solicitados</CardDescription>
        </CardHeader>
        <CardContent>
          {!withdrawals || withdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum saque solicitado ainda</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Valor Líquido</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      -{formatCurrency(withdrawal.fee)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(withdrawal.total)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          withdrawal.status === 'completed'
                            ? 'bg-success/10 text-success border-success/20'
                            : withdrawal.status === 'pending'
                            ? 'bg-warning/10 text-warning border-warning/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }
                      >
                        {withdrawal.status === 'completed' 
                          ? 'Concluído' 
                          : withdrawal.status === 'pending'
                          ? 'Pendente'
                          : withdrawal.status === 'processing'
                          ? 'Processando'
                          : 'Falhou'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
