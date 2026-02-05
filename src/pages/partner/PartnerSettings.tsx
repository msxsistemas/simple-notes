import { useState, useEffect } from 'react';
import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, KeyRound } from 'lucide-react';
import { usePartnerProfile, useUpdatePartnerPixData } from '@/hooks/usePartnerData';
import { useToast } from '@/hooks/use-toast';
import { formatCPFOrCNPJ } from '@/lib/masks';

export default function PartnerSettings() {
  const { data: profile, isLoading } = usePartnerProfile();
  const updatePixData = useUpdatePartnerPixData();
  const { toast } = useToast();

  const [pixKey, setPixKey] = useState('');
  const [document, setDocument] = useState('');

  useEffect(() => {
    if (profile) {
      setPixKey(profile.pix_key || '');
      setDocument(profile.document || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;

    if (!pixKey.trim()) {
      toast({ title: 'Erro', description: 'Chave PIX é obrigatória', variant: 'destructive' });
      return;
    }

    try {
      await updatePixData.mutateAsync({
        partnerId: profile.id,
        pix_key: pixKey,
        document,
      });
      toast({ title: 'Sucesso', description: 'Dados atualizados com sucesso!' });
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao atualizar dados', 
        variant: 'destructive' 
      });
    }
  };

  if (isLoading) {
    return (
      <PartnerLayout title="Dados PIX">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout title="Dados PIX">
      <Card className="border-border/50 max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Dados para Recebimento</CardTitle>
              <CardDescription>Configure sua chave PIX para receber saques</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pixKey">Chave PIX *</Label>
            <Input
              id="pixKey"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, CNPJ, E-mail, Telefone ou Chave Aleatória"
            />
            <p className="text-xs text-muted-foreground">
              Esta chave será usada para enviar seus saques
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">CPF/CNPJ</Label>
            <Input
              id="document"
              value={document}
              onChange={(e) => setDocument(formatCPFOrCNPJ(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={18}
            />
            <p className="text-xs text-muted-foreground">
              Documento associado à sua chave PIX
            </p>
          </div>

          <div className="pt-4">
            <Button 
              className="gradient-primary w-full sm:w-auto" 
              onClick={handleSave}
              disabled={updatePixData.isPending}
            >
              {updatePixData.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-border/50 max-w-xl mt-6 bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Informações Importantes</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• A chave PIX deve estar no mesmo CPF/CNPJ cadastrado</li>
            <li>• Alterações na chave PIX podem levar até 24h para serem processadas</li>
            <li>• Saques são processados em dias úteis</li>
            <li>• Taxa de saque: R$ 2,00 por operação</li>
          </ul>
        </CardContent>
      </Card>
    </PartnerLayout>
  );
}
