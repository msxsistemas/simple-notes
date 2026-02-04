import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Webhook, 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff,
  Trash2,
  RefreshCw,
  Pencil,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useWebhooks,
  useApiCredentials,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useCreateApiCredential,
  useRevokeApiCredential,
  Webhook as WebhookType,
} from '@/hooks/useIntegrations';

const webhookSchema = z.object({
  url: z.string().url('URL inválida'),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

const webhookEvents = [
  { id: 'payment_pending', label: 'Pagamento Pendente' },
  { id: 'payment_approved', label: 'Pagamento Aprovado' },
  { id: 'payment_cancelled', label: 'Pagamento Cancelado' },
];

export default function Integrations() {
  const [isWebhookOpen, setIsWebhookOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showToken, setShowToken] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: webhooks = [], isLoading: loadingWebhooks } = useWebhooks();
  const { data: credentials = [], isLoading: loadingCredentials } = useApiCredentials();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhookMutation = useDeleteWebhook();
  const createApiCredential = useCreateApiCredential();
  const revokeApiCredential = useRevokeApiCredential();

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: { url: '' },
  });

  // Reset form when dialog opens/closes or when editing
  useEffect(() => {
    if (editingWebhook) {
      form.reset({ url: editingWebhook.url });
      setSelectedEvents(editingWebhook.events || []);
    } else if (!isWebhookOpen) {
      form.reset({ url: '' });
      setSelectedEvents([]);
    }
  }, [editingWebhook, isWebhookOpen, form]);

  const handleOpenCreate = () => {
    setEditingWebhook(null);
    setSelectedEvents([]);
    form.reset({ url: '' });
    setIsWebhookOpen(true);
  };

  const handleOpenEdit = (webhook: WebhookType) => {
    setEditingWebhook(webhook);
    setIsWebhookOpen(true);
  };

  const handleCloseDialog = () => {
    setIsWebhookOpen(false);
    setEditingWebhook(null);
    form.reset({ url: '' });
    setSelectedEvents([]);
  };

  const onSubmitWebhook = async (data: WebhookFormData) => {
    try {
      if (editingWebhook) {
        await updateWebhook.mutateAsync({
          webhookId: editingWebhook.id,
          data: {
            url: data.url,
            events: selectedEvents,
          },
        });
        toast({ title: 'Webhook atualizado!', description: 'As alterações foram salvas.' });
      } else {
        await createWebhook.mutateAsync({
          url: data.url,
          events: selectedEvents,
        });
        toast({ title: 'Webhook criado!', description: 'Seu webhook foi configurado com sucesso.' });
      }
      handleCloseDialog();
    } catch (error) {
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível salvar o webhook.', 
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await deleteWebhookMutation.mutateAsync(id);
      toast({ title: 'Webhook removido' });
    } catch (error) {
      toast({ title: 'Erro ao remover webhook', variant: 'destructive' });
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      await createApiCredential.mutateAsync();
      toast({ title: 'API Key gerada!', description: 'Sua nova chave de API foi criada.' });
    } catch (error) {
      toast({ title: 'Erro ao gerar chave', variant: 'destructive' });
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: 'Copiado!', description: 'Token copiado para a área de transferência.' });
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      await revokeApiCredential.mutateAsync(id);
      toast({ title: 'Chave revogada', description: 'A chave de API foi desativada.' });
    } catch (error) {
      toast({ title: 'Erro ao revogar chave', variant: 'destructive' });
    }
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
              <Dialog open={isWebhookOpen} onOpenChange={(open) => {
                if (!open) handleCloseDialog();
                else handleOpenCreate();
              }}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingWebhook ? 'Editar Webhook' : 'Configurar Webhook'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingWebhook 
                        ? 'Atualize a URL e os eventos do webhook'
                        : 'Configure uma URL para receber eventos de pagamento'
                      }
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
                        <Button type="button" variant="outline" onClick={handleCloseDialog}>
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          className="gradient-primary"
                          disabled={createWebhook.isPending || updateWebhook.isPending}
                        >
                          {editingWebhook ? 'Salvar Alterações' : 'Criar Webhook'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingWebhooks ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
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
                    {webhooks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum webhook configurado
                        </TableCell>
                      </TableRow>
                    ) : (
                      webhooks.map((webhook) => (
                        <TableRow key={webhook.id}>
                          <TableCell className="font-mono text-sm max-w-[200px] truncate">
                            {webhook.url}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {webhook.events?.map((event) => (
                                <Badge key={event} variant="secondary" className="text-xs">
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={webhook.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
                              {webhook.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(webhook.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(webhook)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteWebhook(webhook.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Webhook Payload Example */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Exemplo de Payload</h4>
                <pre className="text-xs overflow-x-auto p-3 rounded bg-zinc-900 text-zinc-100">
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
              <Button 
                onClick={handleGenerateApiKey} 
                className="gradient-primary gap-2"
                disabled={createApiCredential.isPending}
              >
                <RefreshCw className="h-4 w-4" />
                Gerar Nova Chave
              </Button>
            </CardHeader>
            <CardContent>
              {loadingCredentials ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
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
                    {credentials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhuma credencial criada
                        </TableCell>
                      </TableRow>
                    ) : (
                      credentials.map((cred) => (
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
                                  onClick={() => handleRevokeApiKey(cred.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
