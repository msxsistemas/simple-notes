import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
 import { Check, Copy, QrCode, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
 import { formatPhone, formatCPF, formatCurrency, parseCurrency, isValidCPF } from '@/lib/masks';
 import { usePublicCheckoutConfig } from '@/hooks/useCheckoutConfig';

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

export default function CheckoutPublic() {
  const [searchParams] = useSearchParams();
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
  const [timeRemaining, setTimeRemaining] = useState('');
  const { toast } = useToast();

  // Get product info from URL params
  const productName = searchParams.get('product') || '';
  const productPrice = searchParams.get('price') || '';
  const merchantId = searchParams.get('merchant') || '';

   // Fetch checkout customization
   const { config } = usePublicCheckoutConfig(merchantId);

  // Pre-fill amount from URL
  useEffect(() => {
    if (productPrice) {
      setAmount(productPrice);
    }
  }, [productPrice]);

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

  // Update time remaining
  useEffect(() => {
    if (!expiresAt || status !== 'pending') return;

    const updateTime = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();
      
      if (diff <= 0) {
        setStatus('expired');
        setTimeRemaining('Expirado');
        toast({ 
          title: 'Pagamento expirado', 
          description: 'O tempo para pagamento expirou.',
          variant: 'destructive'
        });
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, status, toast]);

  const handleGeneratePix = async () => {
   if (!amount) {
      toast({ 
        title: 'Erro', 
       description: 'Informe o valor do pagamento', 
        variant: 'destructive' 
      });
      return;
    }

   // Validate CPF if provided or required
   if (customerTaxId) {
     if (!isValidCPF(customerTaxId)) {
       toast({ 
         title: 'Erro', 
         description: 'O CPF informado é inválido', 
         variant: 'destructive' 
       });
       return;
     }
   } else if (config.require_cpf) {
     toast({ 
       title: 'Erro', 
       description: 'CPF é obrigatório', 
       variant: 'destructive' 
     });
     return;
   }
 
    setStatus('loading');

    try {
      // For public checkout, we call the edge function directly without auth
      // The edge function will use a system/merchant context
      const response = await fetch(
        `https://mqsdkrmgsflisswrwkas.supabase.co/functions/v1/create-pix-charge-public`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xc2Rrcm1nc2ZsaXNzd3J3a2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTQ3MDgsImV4cCI6MjA4NTczMDcwOH0.LVIoQJEJx5TVTJF3kUbuvFuVIct9_0tI07z-JGh2cus',
          },
          body: JSON.stringify({
             amount: parseCurrency(amount),
            customerName,
            customerEmail,
            customerPhone: customerPhone || undefined,
            customerTaxId: customerTaxId || undefined,
            orderId: orderId || undefined,
            merchantId: merchantId || undefined,
            productName: productName || undefined,
           description: productName ? `Pagamento: ${productName}` : 'Pagamento via Msx Pay',
            expiresIn: 3600,
          }),
        }
      );

      const data: ChargeResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar cobrança PIX');
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
    if (!productPrice) setAmount('');
    setOrderId('');
    setPixCode('');
    setQrCodeImage('');
    setTransactionId('');
    setExpiresAt('');
    setTimeRemaining('');
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

   // Custom styles based on config
   const customStyles = {
     '--checkout-primary': config.primary_color,
     '--checkout-bg': config.background_color,
     '--checkout-text': config.text_color,
   } as React.CSSProperties;

  return (
     <div 
       className="min-h-screen flex items-center justify-center p-4"
       style={{ 
         ...customStyles,
         background: `linear-gradient(135deg, ${config.background_color} 0%, ${config.background_color}ee 50%, ${config.primary_color}22 100%)`,
       }}
     >
      <Card className="w-full max-w-md border-border/50 shadow-2xl">
        <CardHeader className="text-center">
           {config.logo_url ? (
             <img 
               src={config.logo_url} 
               alt="Logo" 
               className="mx-auto mb-4 h-14 w-auto max-w-[200px] object-contain"
             />
           ) : (
             <div 
               className="mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
               style={{ backgroundColor: config.primary_color }}
             >
               <QrCode className="h-7 w-7 text-white" />
             </div>
           )}
          <CardTitle className="text-2xl font-bold">
             {productName || config.custom_title || 'Checkout PIX'}
          </CardTitle>
          <CardDescription>
             {config.custom_description || 'Pagamento instantâneo e seguro via PIX'}
          </CardDescription>
          {getStatusBadge()}
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                  <Input
                    id="amount"
                     type="text"
                     inputMode="decimal"
                    placeholder="0,00"
                    value={amount}
                     onChange={(e) => setAmount(formatCurrency(e.target.value))}
                    className="pl-10 text-lg font-semibold"
                    readOnly={!!productPrice}
                  />
                </div>
              </div>
              {config.show_name && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              )}
              {config.show_email && (
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              )}
              {(config.show_phone || config.show_cpf) && (
                <div className="grid grid-cols-2 gap-3">
                  {config.show_phone && (
                    <div className={`space-y-2 ${!config.show_cpf ? 'col-span-2' : ''}`}>
                      <Label htmlFor="phone">Telefone{config.require_phone ? ' *' : ''}</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                        maxLength={15}
                      />
                    </div>
                  )}
                  {config.show_cpf && (
                    <div className={`space-y-2 ${!config.show_phone ? 'col-span-2' : ''}`}>
                      <Label htmlFor="taxId">CPF{config.require_cpf ? ' *' : ''}</Label>
                      <Input
                        id="taxId"
                        placeholder="000.000.000-00"
                        value={customerTaxId}
                        onChange={(e) => {
                          const formatted = formatCPF(e.target.value);
                          setCustomerTaxId(formatted);
                        }}
                        maxLength={14}
                      />
                      {customerTaxId && customerTaxId.length === 14 && !isValidCPF(customerTaxId) && (
                        <p className="text-xs text-destructive">CPF inválido</p>
                      )}
                    </div>
                  )}
                </div>
              )}
               {/* Validation messages */}
               {config.require_phone && !customerPhone && (
                 <p className="text-xs text-muted-foreground">* Telefone obrigatório</p>
               )}
               {config.require_cpf && !customerTaxId && (
                 <p className="text-xs text-muted-foreground">* CPF obrigatório</p>
               )}
 
               <Button
                 onClick={handleGeneratePix}
                 disabled={
                   !amount ||
                   (config.require_phone && !customerPhone) ||
                   (config.require_cpf && !customerTaxId) ||
                   (customerTaxId && customerTaxId.length === 14 && !isValidCPF(customerTaxId))
                 }
                 className="w-full text-lg py-6 shadow-lg hover:shadow-xl transition-all"
                 style={{ backgroundColor: config.primary_color }}
              >
                Pagar com PIX
              </Button>
              <div className="flex items-center justify-center gap-2 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg className="h-3.5 w-3.5 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Pagamento seguro e instantâneo</span>
                </div>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <div className="absolute inset-0 h-16 w-16 rounded-full bg-primary/10 animate-ping" />
              </div>
              <p className="text-muted-foreground font-medium">Gerando sua cobrança PIX...</p>
            </div>
          )}

          {status === 'pending' && (
            <div className="space-y-6">
              <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                <p className="text-4xl font-bold text-primary">
                   R$ {amount || '0,00'}
                </p>
                <p className="text-sm text-warning mt-2 font-medium">
                  ⏱️ Expira em: {timeRemaining}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                {qrCodeImage ? (
                  <div className="p-3 bg-white rounded-2xl shadow-lg">
                    <img 
                      src={qrCodeImage} 
                      alt="QR Code PIX" 
                      className="w-52 h-52"
                    />
                  </div>
                ) : (
                  <div className="w-52 h-52 bg-muted rounded-2xl flex items-center justify-center border-2 border-dashed border-border">
                    <QrCode className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* PIX Code */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ou copie o código PIX:</Label>
                <div className="flex gap-2">
                  <Input 
                    value={pixCode ? pixCode.substring(0, 35) + '...' : ''} 
                    readOnly 
                    className="font-mono text-xs bg-muted"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyPixCode}
                    className={copied ? 'bg-success/10 text-success border-success' : ''}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                Aguardando confirmação do pagamento...
              </div>

              <Button variant="ghost" onClick={resetPayment} className="w-full text-muted-foreground">
                Cancelar pagamento
              </Button>
            </div>
          )}

          {status === 'approved' && (
            <div className="space-y-6 text-center py-4">
              <div className="mx-auto w-24 h-24 rounded-full bg-success/10 flex items-center justify-center animate-in zoom-in">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-success mb-2">
                   {config.success_message || 'Pagamento Confirmado!'}
                 </h3>
                <p className="text-muted-foreground">
                  Obrigado, {customerName.split(' ')[0]}! 
                </p>
                <p className="text-lg font-semibold mt-2">
                   R$ {amount || '0,00'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 text-left text-sm space-y-1">
                <p><strong>Pedido:</strong> {orderId}</p>
                <p><strong>E-mail:</strong> {customerEmail}</p>
                <p><strong>Método:</strong> PIX</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Um comprovante foi enviado para seu e-mail.
              </p>
            </div>
          )}

          {(status === 'cancelled' || status === 'expired') && (
            <div className="space-y-6 text-center py-4">
              <div className="mx-auto w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-destructive mb-2">
                  {status === 'expired' ? 'Tempo Expirado' : 'Pagamento Cancelado'}
                </h3>
                <p className="text-muted-foreground">
                  {status === 'expired' 
                    ? 'O tempo para pagamento expirou. Gere um novo QR Code.'
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
