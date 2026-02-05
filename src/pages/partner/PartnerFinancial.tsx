import { useState, useMemo } from 'react';
import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, 
  CreditCard, 
  XCircle,
  Globe,
  Mail,
  Phone,
  Wallet,
  Loader2,
  Info,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePartnerProfile, usePartnerWithdrawals, usePartnerWithdrawalRequest } from '@/hooks/usePartnerData';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const WITHDRAWAL_FEE = 2.00;

export default function PartnerFinancial() {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [pixKey, setPixKey] = useState('');
  const [formErrors, setFormErrors] = useState<{ amount?: string; pixKey?: string }>({});
  const { toast } = useToast();

  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = usePartnerProfile();
  const { data: withdrawals, isLoading: withdrawalsLoading } = usePartnerWithdrawals();
  const withdrawalMutation = usePartnerWithdrawalRequest();

  // Get partner transactions for stats
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['partner_transactions_stats', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('partner_transactions')
        .select('*')
        .eq('partner_id', profile.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  const isLoading = profileLoading || withdrawalsLoading || transactionsLoading;

  const stats = useMemo(() => {
    if (!transactions) return { approved_amount: 0, pending_amount: 0 };
    const approved = transactions.filter(tx => tx.status === 'paid');
    const pending = transactions.filter(tx => tx.status === 'pending');
    return {
      approved_amount: approved.reduce((sum, tx) => sum + Number(tx.net_amount), 0),
      pending_amount: pending.reduce((sum, tx) => sum + Number(tx.amount), 0),
    };
  }, [transactions]);

  const totalWithdrawn = useMemo(() => {
    if (!withdrawals) return 0;
    return withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + Number(w.total), 0);
  }, [withdrawals]);

  const withdrawableBalance = stats.approved_amount - totalWithdrawn;

  // Função para formatar CPF: 000.000.000-00
  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  // Função para formatar CNPJ: 00.000.000/0000-00
  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const handlePixKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (pixKeyType === 'cpf') {
      setPixKey(formatCPF(value));
    } else if (pixKeyType === 'cnpj') {
      setPixKey(formatCNPJ(value));
    } else {
      setPixKey(value);
    }
  };

  const handlePixKeyTypeChange = (value: string) => {
    setPixKeyType(value);
    setPixKey('');
  };

  const handleWithdraw = async () => {
    const errors: { amount?: string; pixKey?: string } = {};
    
    if (!withdrawAmount || withdrawAmount.trim() === '') {
      errors.amount = 'Informe o valor do saque';
    } else {
      const amount = parseFloat(withdrawAmount.replace(',', '.'));
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Valor inválido';
      } else if (amount > withdrawableBalance) {
        errors.amount = 'Saldo insuficiente para o valor solicitado';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    const amount = parseFloat(withdrawAmount.replace(',', '.'));
    
    try {
      await withdrawalMutation.mutateAsync({ amount, fee: WITHDRAWAL_FEE });
      toast({ 
        title: 'Saque solicitado!', 
        description: `Transferência de R$ ${amount.toFixed(2).replace('.', ',')} em processamento.` 
      });
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      setPixKey('');
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
      <PartnerLayout title="Financeiro">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout title="Financeiro">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {profile?.name?.charAt(0).toUpperCase() || 'P'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold uppercase truncate mb-4">
                  {profile?.name || 'Parceiro'}
                </h2>

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
                    <a href={`mailto:${profile?.email}`} className="text-primary hover:underline truncate">
                      {profile?.email || user?.email || '---'}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium text-foreground">Chave PIX :</span>
                    <span>{profile?.pix_key || '---'}</span>
                  </div>
                </div>
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
                      R$ {stats.pending_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Sacado */}
            <Card className="border-border/50">
              <CardContent className="pt-6 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 border-2 border-success rounded-full">
                    <Wallet className="h-5 w-5 text-success" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Total Sacado</p>
                    <p className="text-xl font-bold mt-1">
                      R$ {totalWithdrawn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
            <Button 
              className="w-full h-12 gap-2 bg-success hover:bg-success/90 text-white font-semibold text-base" 
              disabled={withdrawableBalance <= 0}
              onClick={() => setIsWithdrawOpen(true)}
            >
              <Wallet className="h-5 w-5" />
              Sacar
            </Button>
            <DialogContent className="p-0 gap-0 overflow-hidden max-w-md [&>button]:hidden">
              {/* Header Verde */}
              <div className="bg-primary px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary-foreground">Solicitar saque</h2>
                <button 
                  onClick={() => setIsWithdrawOpen(false)}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Info Banner */}
                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <Info className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm text-foreground">
                    O seu saque é processado em apenas alguns minutos!
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-foreground font-medium">Valor</Label>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="Valor"
                      value={withdrawAmount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.,]/g, '');
                        setWithdrawAmount(value);
                        if (formErrors.amount) setFormErrors(prev => ({ ...prev, amount: undefined }));
                      }}
                      className="h-11"
                    />
                    {(() => {
                      const inputAmount = parseFloat(withdrawAmount.replace(',', '.')) || 0;
                      const showInsufficientBalance = inputAmount > withdrawableBalance && withdrawAmount.trim() !== '';
                      if (formErrors.amount) {
                        return <p className="text-sm text-destructive">{formErrors.amount}</p>;
                      }
                      if (showInsufficientBalance) {
                        return <p className="text-sm text-destructive">Saldo insuficiente para o valor solicitado</p>;
                      }
                      return null;
                    })()}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Tipo de Chave</Label>
                    <Select value={pixKeyType} onValueChange={handlePixKeyTypeChange}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pix" className="text-foreground font-medium">Chave PIX:</Label>
                    <Input
                      id="pix"
                      placeholder={pixKeyType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                      value={pixKey || profile?.pix_key || ''}
                      onChange={(e) => {
                        handlePixKeyChange(e);
                        if (formErrors.pixKey) setFormErrors(prev => ({ ...prev, pixKey: undefined }));
                      }}
                      className="h-11"
                      maxLength={pixKeyType === 'cpf' ? 14 : 18}
                    />
                    {formErrors.pixKey && (
                      <p className="text-sm text-destructive">{formErrors.pixKey}</p>
                    )}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Disponível para</p>
                    <p className="text-xs text-muted-foreground">Saque</p>
                    <p className="text-sm font-bold text-success mt-1">
                      R$ {withdrawableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Taxa de</p>
                    <p className="text-xs text-muted-foreground">Saque</p>
                    <p className="text-sm font-bold text-destructive mt-1">
                      R$ {WITHDRAWAL_FEE.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Valor a receber na</p>
                    <p className="text-xs text-muted-foreground">conta</p>
                    <p className={`text-sm font-bold mt-1 ${(() => {
                      const inputAmount = parseFloat(withdrawAmount.replace(',', '.')) || 0;
                      return inputAmount > withdrawableBalance ? 'text-destructive' : 'text-primary';
                    })()}`}>
                      R$ {(() => {
                        const inputAmount = (!withdrawAmount || withdrawAmount.trim() === '') 
                          ? withdrawableBalance 
                          : parseFloat(withdrawAmount.replace(',', '.')) || 0;
                        if (inputAmount <= 0) return '0,00';
                        const cappedAmount = Math.min(inputAmount, withdrawableBalance);
                        return Math.max(0, cappedAmount - WITHDRAWAL_FEE).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                      })()}
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsWithdrawOpen(false)}
                    className="flex-1 h-11"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleWithdraw} 
                    className="flex-1 h-11 bg-success hover:bg-success/90"
                    disabled={withdrawalMutation.isPending}
                  >
                    {withdrawalMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Solicitando...
                      </>
                    ) : (
                      'Solicitar'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PartnerLayout>
  );
}
