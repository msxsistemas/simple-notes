import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Webhook, 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const webhookSchema = z.object({
  url: z.string().url('URL inválida'),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

// Mock data
const initialWebhooks = [
  {
    id: 'WH001',
    url: 'https://myapp.com/webhooks/pixpay',
    events: ['payment_pending', 'payment_approved', 'payment_cancelled'] as const,
    status: 'active' as const,
    created_at: '2024-01-10T00:00:00Z',
  },
];

type CredentialStatus = 'active' | 'revoked';

interface Credential {
  id: string;
  token: string;
  status: CredentialStatus;
  created_at: string;
}

const initialCredentials: Credential[] = [
  {
    id: 'API001',
    token: 'pk_live_a1b2c3d4e5f6g7h8i9j0',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
  },
];

const webhookEvents = [
  { id: 'payment_pending', label: 'Pagamento Pendente' },
  { id: 'payment_approved', label: 'Pagamento Aprovado' },
  { id: 'payment_cancelled', label: 'Pagamento Cancelado' },
];

export default function Integrations() {
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [credentials, setCredentials] = useState(initialCredentials);
  const [isWebhookOpen, setIsWebhookOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showToken, setShowToken] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: { url: '' },
  });

  const onSubmitWebhook = (data: WebhookFormData) => {
    const newWebhook = {
      id: `WH${String(webhooks.length + 1).padStart(3, '0')}`,
      url: data.url,
      events: selectedEvents as any,
      status: 'active' as const,
      created_at: new Date().toISOString(),
    };
    setWebhooks([...webhooks, newWebhook]);
    toast({ title: 'Webhook criado!', description: 'Seu webhook foi configurado com sucesso.' });
    setIsWebhookOpen(false);
    form.reset();
    setSelectedEvents([]);
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast({ title: 'Webhook removido' });
  };

  const generateApiKey = () => {
    const newKey = {
      id: `API${String(credentials.length + 1).padStart(3, '0')}`,
      token: `pk_live_${crypto.randomUUID().replace(/-/g, '').substring(0, 24)}`,
      status: 'active' as const,
      created_at: new Date().toISOString(),
    };
    setCredentials([...credentials, newKey]);
    toast({ title: 'API Key gerada!', description: 'Sua nova chave de API foi criada.' });
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: 'Copiado!', description: 'Token copiado para a área de transferência.' });
  };

  const revokeApiKey = (id: string) => {
    setCredentials(credentials.map(c => 
      c.id === id ? { ...c, status: 'revoked' as const } : c
    ));
    toast({ title: 'Chave revogada', description: 'A chave de API foi desativada.' });
  };

  return (
    <DashboardLayout title="Integrações">
      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4" />
            Credenciais API
          </TabsTrigger>
        </TabsList>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>Receba notificações em tempo real sobre pagamentos</CardDescription>
              </div>
              <Dialog open={isWebhookOpen} onOpenChange={setIsWebhookOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configurar Webhook</DialogTitle>
                    <DialogDescription>
                      Configure uma URL para receber eventos de pagamento
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitWebhook)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Webhook</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://seusite.com/webhook" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-2">
                        <FormLabel>Eventos</FormLabel>
                        <div className="space-y-2">
                          {webhookEvents.map((event) => (
                            <div key={event.id} className="flex items-center gap-2">
                              <Checkbox
                                id={event.id}
                                checked={selectedEvents.includes(event.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedEvents([...selectedEvents, event.id]);
                                  } else {
                                    setSelectedEvents(selectedEvents.filter(e => e !== event.id));
                                  }
                                }}
                              />
                              <label htmlFor={event.id} className="text-sm">
                                {event.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsWebhookOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="gradient-primary">
                          Criar Webhook
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>URL</TableHead>
                    <TableHead>Eventos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-mono text-sm max-w-[200px] truncate">
                        {webhook.url}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="secondary" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success">Ativo</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(webhook.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWebhook(webhook.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Webhook Payload Example */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Exemplo de Payload</h4>
                <pre className="text-xs overflow-x-auto p-3 rounded bg-sidebar-background text-sidebar-foreground">
{`{
  "event": "payment_approved",
  "data": {
    "id": "TXN001",
    "order_id": "ORD-12345",
    "amount": 150.00,
    "status": "approved",
    "customer": {
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "created_at": "2024-01-15T10:30:00Z"
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Credentials Tab */}
        <TabsContent value="api">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Credenciais API</CardTitle>
                <CardDescription>Gerencie suas chaves de acesso à API</CardDescription>
              </div>
              <Button onClick={generateApiKey} className="gradient-primary gap-2">
                <RefreshCw className="h-4 w-4" />
                Gerar Nova Chave
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Token</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          {showToken === cred.id ? cred.token : cred.token.substring(0, 12) + '••••••••••••'}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowToken(showToken === cred.id ? null : cred.id)}
                          >
                            {showToken === cred.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cred.status === 'active' ? (
                          <Badge className="bg-success/10 text-success">Ativo</Badge>
                        ) : (
                          <Badge className="bg-destructive/10 text-destructive">Revogado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(cred.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToken(cred.token)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {cred.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => revokeApiKey(cred.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
