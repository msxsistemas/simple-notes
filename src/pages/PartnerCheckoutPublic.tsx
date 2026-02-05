import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Copy, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface PartnerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  partner_id: string;
}

interface Partner {
  id: string;
  name: string;
  pix_key: string;
  woovi_subaccount_id: string | null;
  user_id: string;
}

export default function PartnerCheckoutPublic() {
  const { partnerId, productId } = useParams();
  
  const [product, setProduct] = useState<PartnerProduct | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    qrCode: string;
    pixCode: string;
    chargeId: string;
  } | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
  });

  useEffect(() => {
    async function loadData() {
      if (!partnerId || !productId) {
        setLoading(false);
        return;
      }

      try {
        // Load partner
        const { data: partnerData, error: partnerError } = await supabase
          .from('split_partners')
          .select('id, name, pix_key, woovi_subaccount_id, user_id')
          .eq('id', partnerId)
          .eq('status', 'active')
          .single();

        if (partnerError || !partnerData) {
          console.error('Partner not found:', partnerError);
          setLoading(false);
          return;
        }

        setPartner(partnerData);

        // Load product
        const { data: productData, error: productError } = await supabase
          .from('partner_products')
          .select('*')
          .eq('id', productId)
          .eq('partner_id', partnerId)
          .eq('status', 'active')
          .single();

        if (productError || !productData) {
          console.error('Product not found:', productError);
          setLoading(false);
          return;
        }

        setProduct(productData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [partnerId, productId]);

  // Poll for payment status
  useEffect(() => {
    if (!paymentData?.chargeId) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('partner_transactions')
          .select('status')
          .eq('woovi_charge_id', paymentData.chargeId)
          .single();

        if (!error && data?.status === 'completed') {
          setIsPaid(true);
          clearInterval(interval);
        }
      } catch (e) {
        console.error('Error checking payment status:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentData?.chargeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !partner) return;

    setSubmitting(true);

    try {
      const response = await supabase.functions.invoke('create-partner-pix-charge', {
        body: {
          partnerId: partner.id,
          productId: product.id,
          amount: product.price,
          customer: {
            name: formData.name || undefined,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            document: formData.document || undefined,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar cobrança');
      }

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar cobrança');
      }

      setPaymentData({
        qrCode: data.qrCodeBase64,
        pixCode: data.pixCode,
        chargeId: data.chargeId,
      });
    } catch (error: any) {
      console.error('Error creating charge:', error);
      toast.error(error.message || 'Erro ao criar cobrança');
    } finally {
      setSubmitting(false);
    }
  };

  const copyPixCode = () => {
    if (paymentData?.pixCode) {
      navigator.clipboard.writeText(paymentData.pixCode);
      toast.success('Código PIX copiado!');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Produto não encontrado ou indisponível</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Pagamento Confirmado!</h2>
            <p className="text-muted-foreground">
              Seu pagamento foi processado com sucesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Pague com PIX</CardTitle>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(product.price)}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <img
                src={`data:image/png;base64,${paymentData.qrCode}`}
                alt="QR Code PIX"
                className="w-64 h-64"
              />
            </div>

            <div className="space-y-2">
              <Label>Código PIX (copia e cola)</Label>
              <div className="flex gap-2">
                <Input
                  value={paymentData.pixCode}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button onClick={copyPixCode} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Aguardando pagamento...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{product.name}</CardTitle>
          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}
          <p className="text-3xl font-bold text-primary mt-2">
            {formatCurrency(product.price)}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">CPF/CNPJ (opcional)</Label>
              <Input
                id="document"
                placeholder="000.000.000-00"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                'Pagar com PIX'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
