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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Split, 
  Plus, 
  Trash2, 
  Loader2,
  Percent,
  DollarSign,
  Users,
  ToggleLeft,
  CheckCircle2,
  XCircle,
  Mail,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFeeConfig } from '@/hooks/useFeeConfig';
import { 
  useSplitPartners, 
  useCreateSplitPartner, 
  useUpdateSplitPartner,
  useDeleteSplitPartner,
  useSyncWooviSubaccounts,
} from '@/hooks/useSplitPartners';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export default function SplitConfig() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [splitType, setSplitType] = useState<'percentage' | 'fixed'>('percentage');
  const [splitValue, setSplitValue] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: feeConfig, isLoading: feeLoading } = useFeeConfig();
  const { data: partners, isLoading: partnersLoading } = useSplitPartners();
  const createPartner = useCreateSplitPartner();
  const updatePartner = useUpdateSplitPartner();
  const deletePartner = useDeleteSplitPartner();
  const syncSubaccounts = useSyncWooviSubaccounts();

  const isLoading = feeLoading || partnersLoading;
  const splitEnabled = (feeConfig as { split_enabled?: boolean })?.split_enabled ?? false;

  const handleToggleSplit = async () => {
    if (!user) return;
    
    try {
      const { error } = await (supabase
        .from('fee_configs' as any)
        .update({ split_enabled: !splitEnabled } as any)
        .eq('user_id', user.id) as any);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['fee_config'] });
      toast({
        title: splitEnabled ? 'Split desativado' : 'Split ativado',
        description: splitEnabled 
          ? 'Os pagamentos não serão mais divididos' 
          : 'Os pagamentos serão divididos automaticamente',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a configuração',
        variant: 'destructive',
      });
    }
  };

  const handleAddPartner = async () => {
    if (!name || !pixKey || !splitValue) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const value = parseFloat(splitValue);
    if (isNaN(value) || value <= 0) {
      toast({ title: 'Erro', description: 'Valor inválido', variant: 'destructive' });
      return;
    }

    if (splitType === 'percentage' && value > 100) {
      toast({ title: 'Erro', description: 'Percentual não pode ser maior que 100%', variant: 'destructive' });
      return;
    }

    try {
      const result = await createPartner.mutateAsync({
        name,
        pix_key: pixKey,
        document: document || undefined,
        email: email || undefined,
        split_type: splitType,
        split_value: value,
      });

      if (result.wooviSubaccountCreated) {
        toast({ 
          title: 'Sucesso', 
          description: 'Parceiro adicionado e subconta criada na Woovi' 
        });
      } else {
        toast({ 
          title: 'Parceiro adicionado', 
          description: 'Aviso: Não foi possível criar subconta na Woovi. Verifique se a funcionalidade está ativa no seu plano.',
          variant: 'default'
        });
      }
      setIsAddOpen(false);
      resetForm();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível adicionar o parceiro', variant: 'destructive' });
    }
  };

  const handleTogglePartner = async (id: string, currentStatus: string) => {
    try {
      await updatePartner.mutateAsync({
        id,
        status: currentStatus === 'active' ? 'inactive' : 'active',
      });
      toast({ title: 'Status atualizado' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status', variant: 'destructive' });
    }
  };

  const handleDeletePartner = async (id: string) => {
    try {
      await deletePartner.mutateAsync(id);
      toast({ title: 'Parceiro removido' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível remover o parceiro', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setName('');
    setPixKey('');
    setDocument('');
    setEmail('');
    setSplitType('percentage');
    setSplitValue('');
  };

  const handleSyncSubaccounts = async () => {
    try {
      const result = await syncSubaccounts.mutateAsync();
      toast({
        title: 'Sincronização concluída',
        description: `${result.synced} parceiro(s) sincronizado(s) com a Woovi`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar com a Woovi',
        variant: 'destructive',
      });
    }
  };

  const totalPercentage = partners
    ?.filter(p => p.status === 'active' && p.split_type === 'percentage')
    .reduce((sum, p) => sum + Number(p.split_value), 0) || 0;

  const totalFixed = partners
    ?.filter(p => p.status === 'active' && p.split_type === 'fixed')
    .reduce((sum, p) => sum + Number(p.split_value), 0) || 0;

  if (isLoading) {
    return (
      <DashboardLayout title="PIX Split">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="PIX Split">
      {/* Header Card */}
      <Card className="mb-6 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center border-2 border-primary rounded-full">
                <Split className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle>Configurar PIX Split</CardTitle>
                <CardDescription>
                  Divida automaticamente os pagamentos recebidos entre parceiros
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {splitEnabled ? 'Ativo' : 'Inativo'}
              </span>
              <Switch
                checked={splitEnabled}
                onCheckedChange={handleToggleSplit}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 flex items-center justify-center border-2 border-primary rounded-full">
                <Users className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold">Parceiros Ativos</p>
                <p className="text-2xl font-bold">
                  {partners?.filter(p => p.status === 'active').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 flex items-center justify-center">
                <Percent className="h-6 w-6 text-warning" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold">Total Percentual</p>
                <p className="text-2xl font-bold">{totalPercentage.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 flex items-center justify-center border-2 border-success rounded-full">
                <DollarSign className="h-4 w-4 text-success" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold">Total Fixo/Venda</p>
                <p className="text-2xl font-bold">
                  R$ {totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners Table */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Parceiros de Split</CardTitle>
            <CardDescription>Gerencie quem recebe parte dos seus pagamentos</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncSubaccounts}
              disabled={syncSubaccounts.isPending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncSubaccounts.isPending ? 'animate-spin' : ''}`} />
              Sincronizar Woovi
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Parceiro
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Parceiro de Split</DialogTitle>
                <DialogDescription>
                  Configure um novo destinatário para receber parte dos pagamentos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Parceiro *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: João Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document">CPF/CNPJ</Label>
                    <Input
                      id="document"
                      placeholder="000.000.000-00"
                      value={document}
                      onChange={(e) => setDocument(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="parceiro@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pixKey">Chave PIX *</Label>
                  <Input
                    id="pixKey"
                    placeholder="CPF, E-mail, telefone ou chave aleatória"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    A chave PIX deve estar cadastrada no Banco Central (DICT) para criar a subconta na Woovi
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Split *</Label>
                    <Select value={splitType} onValueChange={(v) => setSplitType(v as 'percentage' | 'fixed')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      {splitType === 'percentage' ? 'Percentual *' : 'Valor (R$) *'}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step={splitType === 'percentage' ? '0.01' : '0.01'}
                      placeholder={splitType === 'percentage' ? '10' : '5.00'}
                      value={splitValue}
                      onChange={(e) => setSplitValue(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleAddPartner} className="gradient-primary" disabled={createPartner.isPending}>
                  {createPartner.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!partners || partners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ToggleLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum parceiro configurado</p>
              <p className="text-sm">Adicione parceiros para dividir seus pagamentos automaticamente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Chave PIX</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Subconta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {partner.document || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {partner.email || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{partner.pix_key}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {partner.split_type === 'percentage' ? (
                          <>
                            <Percent className="h-3 w-3" />
                            Percentual
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-3 w-3" />
                            Fixo
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {partner.split_type === 'percentage' 
                        ? `${Number(partner.split_value).toFixed(2)}%`
                        : `R$ ${Number(partner.split_value).toFixed(2)}`
                      }
                    </TableCell>
                    <TableCell>
                      {partner.woovi_subaccount_id ? (
                        <Badge variant="outline" className="gap-1 text-success border-success">
                          <CheckCircle2 className="h-3 w-3" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <XCircle className="h-3 w-3" />
                          Não criada
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={partner.status === 'active'}
                        onCheckedChange={() => handleTogglePartner(partner.id, partner.status)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeletePartner(partner.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
