import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette,
  Mail,
  Smartphone,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: 'Configurações salvas!', description: 'Suas preferências foram atualizadas.' });
  };

  return (
    <DashboardLayout title="Configurações">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Notifications */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription>Configure como você deseja receber alertas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Notificações por E-mail</p>
                  <p className="text-sm text-muted-foreground">Receba alertas de pagamentos</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Notificações SMS</p>
                  <p className="text-sm text-muted-foreground">Alertas via mensagem de texto</p>
                </div>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Resumo Diário</p>
                  <p className="text-sm text-muted-foreground">Relatório diário de vendas</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Segurança
            </CardTitle>
            <CardDescription>Configurações de segurança da conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Alterar Senha</Label>
              <Input type="password" placeholder="Senha atual" />
            </div>
            <div className="space-y-2">
              <Input type="password" placeholder="Nova senha" />
            </div>
            <div className="space-y-2">
              <Input type="password" placeholder="Confirmar nova senha" />
            </div>
            <Button variant="outline">Alterar Senha</Button>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Autenticação em 2 Fatores</p>
                <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gradient-primary">
            Salvar Configurações
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
