import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Code, 
  Webhook, 
  Key,
  CreditCard,
  ArrowRight,
} from 'lucide-react';

// Base URL real do projeto
const BASE_URL = 'https://evxmwxgcfelrwikddlfa.supabase.co/functions/v1';

const endpoints = [
  {
    method: 'POST',
    path: '/create-pix-charge-public',
    description: 'Criar uma nova cobrança PIX (checkout público)',
    request: `{
  "productId": "uuid-do-produto",
  "customerName": "João Silva",
  "customerEmail": "joao@email.com",
  "customerPhone": "11999999999",
  "customerDocument": "12345678900"
}`,
    response: `{
  "success": true,
  "pixCode": "00020126580014br.gov.bcb.pix...",
  "qrCodeBase64": "data:image/png;base64,...",
  "expiresAt": "2024-01-15T12:00:00Z",
  "chargeId": "uuid-da-cobranca"
}`,
  },
  {
    method: 'POST',
    path: '/create-pix-charge',
    description: 'Criar cobrança PIX (requer autenticação)',
    request: `{
  "amount": 150.00,
  "description": "Pagamento do pedido #12345",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "11999999999"
  }
}`,
    response: `{
  "success": true,
  "chargeId": "uuid-da-cobranca",
  "pixCode": "00020126580014br.gov.bcb.pix...",
  "qrCodeBase64": "data:image/png;base64,...",
  "expiresAt": "2024-01-15T12:00:00Z"
}`,
  },
  {
    method: 'POST',
    path: '/woovi-webhook',
    description: 'Endpoint para receber webhooks da Woovi',
    request: `{
  "event": "OPENPIX:CHARGE_COMPLETED",
  "charge": {
    "correlationID": "uuid-correlation",
    "value": 15000,
    "status": "COMPLETED"
  }
}`,
    response: `{
  "success": true
}`,
  },
  {
    method: 'POST',
    path: '/woovi-subaccount',
    description: 'Criar subconta para split de pagamentos',
    request: `{
  "partnerId": "uuid-do-parceiro"
}`,
    response: `{
  "success": true,
  "subaccountId": "woovi-subaccount-id"
}`,
  },
];

const webhookEvents = [
  {
    event: 'payment_pending',
    description: 'Cobrança criada, aguardando pagamento',
  },
  {
    event: 'payment_approved',
    description: 'Pagamento confirmado com sucesso',
  },
  {
    event: 'payment_cancelled',
    description: 'Pagamento cancelado ou expirado',
  },
];

export default function Docs() {
  return (
    <DashboardLayout title="Documentação">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="border-border/50 mb-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary p-3 rounded-xl">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
               <h2 className="text-xl font-bold mb-2">API Msx Pay</h2>
                <p className="text-muted-foreground mb-4">
                  Integre pagamentos PIX à sua aplicação de forma simples e segura.
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Base URL:</span>
                    <code className="ml-2 px-2 py-1 rounded bg-muted font-mono text-xs">
                      {BASE_URL}
                    </code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Checkout Público:</span>
                    <code className="ml-2 px-2 py-1 rounded bg-muted font-mono text-xs">
                      https://id-preview--f6f5871a-d89b-454a-ae1d-79dfaefd329b.lovable.app/pay?product=ID_DO_PRODUTO
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="endpoints" className="space-y-6">
          <TabsList>
            <TabsTrigger value="endpoints" className="gap-2">
              <Code className="h-4 w-4" />
              Endpoints
            </TabsTrigger>
            <TabsTrigger value="auth" className="gap-2">
              <Key className="h-4 w-4" />
              Autenticação
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-6">
            {endpoints.map((endpoint) => (
              <Card key={endpoint.path} className="border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge 
                      className={endpoint.method === 'POST' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-primary/10 text-primary'
                      }
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="font-mono text-sm">{endpoint.path}</code>
                  </div>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {endpoint.request && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" /> Request Body
                      </h4>
                      <pre className="text-xs p-4 rounded-lg bg-zinc-900 text-zinc-100 overflow-x-auto">
                        {endpoint.request}
                      </pre>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" /> Response
                    </h4>
                    <pre className="text-xs p-4 rounded-lg bg-zinc-900 text-zinc-100 overflow-x-auto">
                      {endpoint.response}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Auth Tab */}
          <TabsContent value="auth">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Autenticação via Token
                </CardTitle>
                <CardDescription>
                  Todas as requisições devem incluir seu token de API no header
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Header de autenticação (para endpoints autenticados)</h4>
                  <pre className="text-xs p-4 rounded-lg bg-zinc-900 text-zinc-100">
{`Authorization: Bearer SEU_TOKEN_SUPABASE`}
                  </pre>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Exemplo: Criar cobrança PIX pública</h4>
                  <pre className="text-xs p-4 rounded-lg bg-zinc-900 text-zinc-100 overflow-x-auto">
{`curl -X POST ${BASE_URL}/create-pix-charge-public \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": "uuid-do-produto",
    "customerName": "João Silva",
    "customerEmail": "joao@email.com",
    "customerPhone": "11999999999",
    "customerDocument": "12345678900"
  }'`}
                  </pre>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Exemplo: Checkout via URL (mais simples)</h4>
                  <pre className="text-xs p-4 rounded-lg bg-zinc-900 text-zinc-100 overflow-x-auto">
{`// Redirecione o usuário para:
https://id-preview--f6f5871a-d89b-454a-ae1d-79dfaefd329b.lovable.app/pay?product=UUID_DO_PRODUTO

// Substitua UUID_DO_PRODUTO pelo ID real do produto cadastrado`}
                  </pre>
                </div>
                <p className="text-sm text-muted-foreground">
                  Você pode gerar suas chaves de API na seção{' '}
                  <a href="/integrations" className="text-primary underline">Integrações</a>.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-primary" />
                  Eventos de Webhook
                </CardTitle>
                <CardDescription>
                  Receba notificações em tempo real sobre mudanças no status dos pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Events List */}
                <div className="space-y-3">
                  {webhookEvents.map((event) => (
                    <div key={event.event} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm font-mono">{event.event}</code>
                      </div>
                      <span className="text-sm text-muted-foreground">{event.description}</span>
                    </div>
                  ))}
                </div>

                {/* Payload Example */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Exemplo de Payload</h4>
                  <pre className="text-xs p-4 rounded-lg bg-zinc-900 text-zinc-100 overflow-x-auto">
{`{
  "event": "payment_approved",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "id": "CHG-001",
    "order_id": "ORD-12345",
    "value": 150.00,
    "status": "approved",
    "payment_method": "pix",
    "customer": {
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "11999999999"
    },
    "paid_at": "2024-01-15T10:35:00Z"
  }
}`}
                  </pre>
                </div>

                <p className="text-sm text-muted-foreground">
                  Configure seus webhooks na seção{' '}
                  <a href="/integrations" className="text-primary underline">Integrações</a>.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
