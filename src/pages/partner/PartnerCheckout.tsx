import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Palette, Eye } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function PartnerCheckout() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [config, setConfig] = useState({
    primaryColor: '#8B5CF6',
    backgroundColor: '#0F0F23',
    textColor: '#FFFFFF',
    showName: true,
    showEmail: true,
    showPhone: true,
    showCpf: true,
    requireName: false,
    requireEmail: false,
    requirePhone: false,
    requireCpf: false,
    successMessage: 'Pagamento realizado com sucesso!',
  });

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: 'Configurações salvas',
      description: 'As configurações do checkout foram atualizadas.',
    });
    setIsLoading(false);
  };

  return (
    <PartnerLayout title="Checkout">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Personalização
            </CardTitle>
            <CardDescription>
              Configure as cores e campos do seu checkout
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Colors */}
            <div className="space-y-4">
              <h3 className="font-medium">Cores</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cor Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.textColor}
                      onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.textColor}
                      onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <h3 className="font-medium">Campos do Formulário</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Nome</Label>
                    <p className="text-xs text-muted-foreground">Exibir campo de nome</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.showName}
                        onCheckedChange={(checked) => setConfig({ ...config, showName: checked })}
                      />
                      <span className="text-xs">Exibir</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.requireName}
                        onCheckedChange={(checked) => setConfig({ ...config, requireName: checked })}
                        disabled={!config.showName}
                      />
                      <span className="text-xs">Obrigatório</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email</Label>
                    <p className="text-xs text-muted-foreground">Exibir campo de email</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.showEmail}
                        onCheckedChange={(checked) => setConfig({ ...config, showEmail: checked })}
                      />
                      <span className="text-xs">Exibir</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.requireEmail}
                        onCheckedChange={(checked) => setConfig({ ...config, requireEmail: checked })}
                        disabled={!config.showEmail}
                      />
                      <span className="text-xs">Obrigatório</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Telefone</Label>
                    <p className="text-xs text-muted-foreground">Exibir campo de telefone</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.showPhone}
                        onCheckedChange={(checked) => setConfig({ ...config, showPhone: checked })}
                      />
                      <span className="text-xs">Exibir</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.requirePhone}
                        onCheckedChange={(checked) => setConfig({ ...config, requirePhone: checked })}
                        disabled={!config.showPhone}
                      />
                      <span className="text-xs">Obrigatório</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>CPF</Label>
                    <p className="text-xs text-muted-foreground">Exibir campo de CPF</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.showCpf}
                        onCheckedChange={(checked) => setConfig({ ...config, showCpf: checked })}
                      />
                      <span className="text-xs">Exibir</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.requireCpf}
                        onCheckedChange={(checked) => setConfig({ ...config, requireCpf: checked })}
                        disabled={!config.showCpf}
                      />
                      <span className="text-xs">Obrigatório</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <Label>Mensagem de Sucesso</Label>
              <Input
                value={config.successMessage}
                onChange={(e) => setConfig({ ...config, successMessage: e.target.value })}
                placeholder="Pagamento realizado com sucesso!"
              />
            </div>

            <Button onClick={handleSave} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Pré-visualização
            </CardTitle>
            <CardDescription>
              Veja como seu checkout ficará
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="rounded-lg p-6 min-h-[400px]"
              style={{ backgroundColor: config.backgroundColor }}
            >
              <div className="max-w-sm mx-auto space-y-4">
                <h2 
                  className="text-xl font-bold text-center"
                  style={{ color: config.textColor }}
                >
                  Finalizar Compra
                </h2>
                
                <div className="space-y-3">
                  {config.showName && (
                    <div className="space-y-1">
                      <label 
                        className="text-sm"
                        style={{ color: config.textColor }}
                      >
                        Nome {config.requireName && '*'}
                      </label>
                      <input
                        type="text"
                        placeholder="Seu nome"
                        className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20"
                        style={{ color: config.textColor }}
                        disabled
                      />
                    </div>
                  )}
                  
                  {config.showEmail && (
                    <div className="space-y-1">
                      <label 
                        className="text-sm"
                        style={{ color: config.textColor }}
                      >
                        Email {config.requireEmail && '*'}
                      </label>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20"
                        style={{ color: config.textColor }}
                        disabled
                      />
                    </div>
                  )}
                  
                  {config.showPhone && (
                    <div className="space-y-1">
                      <label 
                        className="text-sm"
                        style={{ color: config.textColor }}
                      >
                        Telefone {config.requirePhone && '*'}
                      </label>
                      <input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20"
                        style={{ color: config.textColor }}
                        disabled
                      />
                    </div>
                  )}
                  
                  {config.showCpf && (
                    <div className="space-y-1">
                      <label 
                        className="text-sm"
                        style={{ color: config.textColor }}
                      >
                        CPF {config.requireCpf && '*'}
                      </label>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20"
                        style={{ color: config.textColor }}
                        disabled
                      />
                    </div>
                  )}
                </div>

                <button
                  className="w-full py-3 rounded-md font-medium text-white"
                  style={{ backgroundColor: config.primaryColor }}
                  disabled
                >
                  Pagar com PIX
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
