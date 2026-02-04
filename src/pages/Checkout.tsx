import { useState, useEffect } from 'react';
import { Check, Copy, QrCode, Clock, CheckCircle, XCircle, Smartphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type PaymentStatus = 'idle' | 'loading' | 'pending' | 'approved' | 'cancelled' | 'expired';

interface ChargeResponse {
  success: boolean;
  transactionId: string;
  orderId: string;
  correlationId: string;
  amount: number;
  fee: number;
  netAmount: number;
  pixCode: string;
  qrCodeImage: string;
  expiresAt: string;
  paymentLinkUrl?: string;
  error?: string;
}

export default function Checkout() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [copied, setCopied] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [amount, setAmount] = useState('');
  const [orderId, setOrderId] = useState('');
  const [pixCode, setPixCode] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const { toast } = useToast();

  // Subscribe to transaction updates via Supabase Realtime
  useEffect(() => {
    if (!transactionId || status !== 'pending') return;

    console.log('Subscribing to transaction updates:', transactionId);

    const channel = supabase
      .channel(`transaction-${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `id=eq.${transactionId}`,
        },
        (payload) => {
          console.log('Transaction updated:', payload);
          const newStatus = payload.new.status;
          
          if (newStatus === 'approved') {
            setStatus('approved');
            toast({ 
              title: 'Pagamento confirmado!', 
              description: 'O pagamento foi aprovado com sucesso.' 
            });
          } else if (newStatus === 'cancelled' || newStatus === 'expired') {
            setStatus('expired');
            toast({ 
              title: 'Pagamento expirado', 
              description: 'O tempo para pagamento expirou.',
              variant: 'destructive'
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from transaction updates');
      supabase.removeChannel(channel);
    };
  }, [transactionId, status, toast]);

  // Check expiration
  useEffect(() => {
    if (!expiresAt || status !== 'pending') return;

    const checkExpiration = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      
      if (now >= expires) {
        setStatus('expired');
        toast({ 
          title: 'Pagamento expirado', 
          description: 'O tempo para pagamento expirou.',
          variant: 'destructive'
        });
      }
    };

    const interval = setInterval(checkExpiration, 5000);
    return () => clearInterval(interval);
  }, [expiresAt, status, toast]);

  const handleGeneratePix = async () => {
    if (!amount || !customerName || !customerEmail) {
      toast({ 
        title: 'Erro', 
        description: 'Preencha todos os campos obrigatórios', 
        variant: 'destructive' 
      });
      return;
    }

    if (!user) {
      toast({ 
        title: 'Erro', 
        description: 'Você precisa estar logado para gerar cobranças', 
        variant: 'destructive' 
      });
      return;
    }

    setStatus('loading');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await supabase.functions.invoke<ChargeResponse>('create-pix-charge', {
        body: {
          amount: parseFloat(amount),
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
          customerTaxId: customerTaxId || undefined,
          orderId: orderId || undefined,
          description: `Pagamento via PixPay`,
          expiresIn: 3600, // 1 hour
        },
      });

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(response.error.message || 'Erro ao gerar cobrança');
      }

      const data = response.data;

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao gerar cobrança PIX');
      }

      console.log('PIX charge created:', data);

      setTransactionId(data.transactionId);
      setOrderId(data.orderId);
      setPixCode(data.pixCode);
      setQrCodeImage(data.qrCodeImage);
      setExpiresAt(data.expiresAt);
      setStatus('pending');

      toast({ 
        title: 'QR Code gerado!', 
        description: 'Escaneie o código ou copie o código PIX.' 
      });

    } catch (error) {
      console.error('Error generating PIX:', error);
      setStatus('idle');
      toast({ 
        title: 'Erro', 
        description: error instanceof Error ? error.message : 'Erro ao gerar cobrança PIX',
        variant: 'destructive' 
      });
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({ title: 'Código copiado!', description: 'Cole no seu app de banco.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const resetPayment = () => {
    setStatus('idle');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerTaxId('');
    setAmount('');
    setOrderId('');
    setPixCode('');
    setQrCodeImage('');
    setTransactionId('');
    setExpiresAt('');
  };

  const formatTimeRemaining = () => {
    if (!expiresAt) return '';
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'loading':
        return (
          <Badge className="bg-primary/10 text-primary gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Gerando PIX...
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning gap-1">
            <Clock className="h-3 w-3" />
            Aguardando Pagamento
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-success/10 text-success gap-1">
            <CheckCircle className="h-3 w-3" />
            Pagamento Aprovado
          </Badge>
        );
      case 'cancelled':
      case 'expired':
        return (
          <Badge className="bg-destructive/10 text-destructive gap-1">
            <XCircle className="h-3 w-3" />
            {status === 'expired' ? 'Pagamento Expirado' : 'Pagamento Cancelado'}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Checkout PIX</CardTitle>
          <CardDescription>Pagamento instantâneo via PIX - Powered by OpenPix</CardDescription>
          {getStatusBadge()}
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Nome do cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">CPF/CNPJ</Label>
                <Input
                  id="taxId"
                  placeholder="000.000.000-00"
                  value={customerTaxId}
                  onChange={(e) => setCustomerTaxId(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleGeneratePix} 
                className="w-full gradient-primary"
                disabled={!user}
              >
                {user ? 'Gerar QR Code PIX' : 'Faça login para gerar PIX'}
              </Button>
              {!user && (
                <p className="text-xs text-muted-foreground text-center">
                  Você precisa estar logado para gerar cobranças
                </p>
              )}
            </div>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Gerando cobrança PIX...</p>
            </div>
          )}

          {status === 'pending' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Pedido #{orderId}</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {parseFloat(amount).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expira em: {formatTimeRemaining()}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                {qrCodeImage ? (
                  <img 
                    src={qrCodeImage} 
                    alt="QR Code PIX" 
                    className="w-48 h-48 rounded-xl border-2 border-border"
                  />
                ) : (
                  <div className="w-48 h-48 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center">
                      <QrCode className="h-20 w-20 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">QR Code PIX</p>
                    </div>
                  </div>
                )}
              </div>

              {/* PIX Code */}
              <div className="space-y-2">
                <Label>Código PIX (Copia e Cola)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={pixCode ? pixCode.substring(0, 40) + '...' : ''} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyPixCode}
                    className={copied ? 'bg-success/10 text-success' : ''}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                Aguardando confirmação do pagamento...
              </div>

              <Button variant="outline" onClick={resetPayment} className="w-full">
                Cancelar
              </Button>
            </div>
          )}

          {status === 'approved' && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-success mb-2">Pagamento Confirmado!</h3>
                <p className="text-muted-foreground">
                  Obrigado, {customerName}! Seu pagamento de R$ {parseFloat(amount).toFixed(2)} foi aprovado.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-left text-sm">
                <p><strong>Pedido:</strong> {orderId}</p>
                <p><strong>E-mail:</strong> {customerEmail}</p>
                <p><strong>Método:</strong> PIX</p>
              </div>
              <Button onClick={resetPayment} className="w-full gradient-primary">
                Novo Pagamento
              </Button>
            </div>
          )}

          {(status === 'cancelled' || status === 'expired') && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-destructive mb-2">
                  {status === 'expired' ? 'Pagamento Expirado' : 'Pagamento Cancelado'}
                </h3>
                <p className="text-muted-foreground">
                  {status === 'expired' 
                    ? 'O tempo para pagamento expirou. Gere um novo QR Code para tentar novamente.'
                    : 'O pagamento foi cancelado.'}
                </p>
              </div>
              <Button onClick={resetPayment} className="w-full gradient-primary">
                Tentar Novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
