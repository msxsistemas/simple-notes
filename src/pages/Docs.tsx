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

const endpoints = [
  {
    method: 'POST',
    path: '/v1/charges',
    description: 'Criar uma nova cobrança PIX',
    request: `{
  "value": 150.00,
  "order_id": "ORD-12345",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "11999999999"
  },
  "expires_in": 3600
}`,
    response: `{
  "id": "CHG-001",
  "status": "pending",
  "value": 150.00,
  "pix_code": "00020126...",
  "qr_code_url": "https://api.pixpay.com/qr/CHG-001",
  "expires_at": "2024-01-15T12:00:00Z"
}`,
  },
  {
    method: 'GET',
    path: '/v1/charges/:id',
    description: 'Consultar status de uma cobrança',
    request: null,
    response: `{
  "id": "CHG-001",
  "status": "approved",
  "value": 150.00,
  "paid_at": "2024-01-15T10:35:00Z",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com"
  }
}`,
  },
  {
    method: 'GET',
    path: '/v1/balance',
    description: 'Consultar saldo disponível',
    request: null,
    response: `{
  "available": 12450.00,
  "pending": 3250.00,
  "reserved": 500.00
}`,
  },
  {
    method: 'POST',
    path: '/v1/withdrawals',
    description: 'Solicitar saque via PIX',
    request: `{
  "amount": 1000.00,
  "pix_key": "joao@email.com"
}`,
    response: `{
  "id": "WDL-001",
  "status": "processing",
  "amount": 1000.00,
  "fee": 2.00,
  "net_amount": 998.00,
  "estimated_at": "2024-01-16T18:00:00Z"
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
                <h2 className="text-xl font-bold mb-2">API PixPay</h2>
                <p className="text-muted-foreground mb-4">
                  Integre pagamentos PIX à sua aplicação de forma simples e segura.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Base URL:</span>
                    <code className="ml-2 px-2 py-1 rounded bg-muted font-mono">
                      https://api.pixpay.com
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
                      <pre className="text-xs p-4 rounded-lg bg-sidebar-background text-sidebar-foreground overflow-x-auto">
                        {endpoint.request}
                      </pre>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" /> Response
                    </h4>
                    <pre className="text-xs p-4 rounded-lg bg-sidebar-background text-sidebar-foreground overflow-x-auto">
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
                  <h4 className="text-sm font-medium mb-2">Header de autenticação</h4>
                  <pre className="text-xs p-4 rounded-lg bg-sidebar-background text-sidebar-foreground">
{`Authorization: Bearer pk_live_sua_chave_aqui`}
                  </pre>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Exemplo com cURL</h4>
                  <pre className="text-xs p-4 rounded-lg bg-sidebar-background text-sidebar-foreground overflow-x-auto">
{`curl -X POST https://api.pixpay.com/v1/charges \\
  -H "Authorization: Bearer pk_live_sua_chave_aqui" \\
  -H "Content-Type: application/json" \\
  -d '{"value": 150.00, "order_id": "ORD-123"}'`}
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
                  <pre className="text-xs p-4 rounded-lg bg-sidebar-background text-sidebar-foreground overflow-x-auto">
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
