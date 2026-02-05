 import { useState, useEffect } from 'react';
 import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { useToast } from '@/hooks/use-toast';
 import { 
   CreditCard,
   Copy,
   ExternalLink,
   Eye,
   Link2,
   QrCode,
   CheckCircle,
   Settings2,
   Palette,
   Image,
   ToggleLeft,
   Save,
   Loader2,
 } from 'lucide-react';
 import { Switch } from '@/components/ui/switch';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { useCheckoutConfig } from '@/hooks/useCheckoutConfig';
 import { useAuth } from '@/contexts/AuthContext';
 
 export default function CheckoutConfig() {
   const { toast } = useToast();
   const { user } = useAuth();
   const { config, isLoading, updateConfig, isUpdating } = useCheckoutConfig();
   const [copied, setCopied] = useState(false);
   
   // Form state
   const [logoUrl, setLogoUrl] = useState('');
   const [primaryColor, setPrimaryColor] = useState('#8B5CF6');
   const [backgroundColor, setBackgroundColor] = useState('#0F0F23');
   const [textColor, setTextColor] = useState('#FFFFFF');
   const [requirePhone, setRequirePhone] = useState(false);
   const [requireCpf, setRequireCpf] = useState(false);
   const [customTitle, setCustomTitle] = useState('');
   const [customDescription, setCustomDescription] = useState('');
   const [successMessage, setSuccessMessage] = useState('');
   
   // Sync form state with config
   useEffect(() => {
     if (config) {
       setLogoUrl(config.logo_url || '');
       setPrimaryColor(config.primary_color);
       setBackgroundColor(config.background_color);
       setTextColor(config.text_color);
       setRequirePhone(config.require_phone);
       setRequireCpf(config.require_cpf);
       setCustomTitle(config.custom_title || '');
       setCustomDescription(config.custom_description || '');
       setSuccessMessage(config.success_message || '');
     }
   }, [config]);
   
   // URL base do checkout público
   const baseUrl = window.location.origin;
   const checkoutUrl = user ? `${baseUrl}/pay?merchant=${user.id}` : `${baseUrl}/pay`;
 
   const copyLink = () => {
     navigator.clipboard.writeText(checkoutUrl);
     setCopied(true);
     toast({ title: 'Link copiado!', description: 'URL do checkout copiada para a área de transferência.' });
     setTimeout(() => setCopied(false), 2000);
   };
 
   const openCheckout = () => {
     window.open(checkoutUrl, '_blank');
   };
 
   const openDemo = () => {
     window.open(`${baseUrl}/checkout/demo`, '_blank');
   };
 
   const handleSave = async () => {
     try {
       await updateConfig({
         logo_url: logoUrl || null,
         primary_color: primaryColor,
         background_color: backgroundColor,
         text_color: textColor,
         require_phone: requirePhone,
         require_cpf: requireCpf,
         custom_title: customTitle || null,
         custom_description: customDescription || null,
         success_message: successMessage || null,
       });
       toast({ title: 'Salvo!', description: 'Configurações do checkout atualizadas.' });
     } catch (error) {
       toast({ 
         title: 'Erro', 
         description: 'Não foi possível salvar as configurações.', 
         variant: 'destructive' 
       });
     }
   };

   return (
     <DashboardLayout title="Checkout">
       {/* Header */}
       <Card className="mb-6 border-border/50">
         <CardHeader>
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 flex items-center justify-center border-2 border-primary rounded-full">
                 <CreditCard className="h-5 w-5 text-primary" strokeWidth={1.5} />
               </div>
               <div>
                 <CardTitle>Checkout PIX</CardTitle>
                 <CardDescription>
                   Configure e gerencie seu checkout de pagamentos
                 </CardDescription>
               </div>
             </div>
             <Badge className="bg-success/10 text-success">
               <CheckCircle className="h-3 w-3 mr-1" />
               Ativo
             </Badge>
           </div>
         </CardHeader>
       </Card>
 
       <Tabs defaultValue="link" className="space-y-6">
         <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
           <TabsTrigger value="link" className="gap-2">
             <Link2 className="h-4 w-4" />
             Link
           </TabsTrigger>
           <TabsTrigger value="customize" className="gap-2">
             <Palette className="h-4 w-4" />
             Personalizar
           </TabsTrigger>
           <TabsTrigger value="fields" className="gap-2">
             <ToggleLeft className="h-4 w-4" />
             Campos
           </TabsTrigger>
         </TabsList>
 
         {/* Tab: Link */}
         <TabsContent value="link" className="space-y-6">
           <div className="grid gap-6 lg:grid-cols-2">
             <Card className="border-border/50">
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Link2 className="h-5 w-5 text-primary" />
                   Link do Checkout
                 </CardTitle>
                 <CardDescription>
                   Compartilhe este link para receber pagamentos via PIX
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label>URL do Checkout Público</Label>
                   <div className="flex gap-2">
                     <Input 
                       value={checkoutUrl} 
                       readOnly 
                       className="font-mono text-sm bg-muted"
                     />
                     <Button 
                       variant="outline" 
                       size="icon"
                       onClick={copyLink}
                       className={copied ? 'bg-success/10 text-success border-success' : ''}
                     >
                       {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                     </Button>
                   </div>
                 </div>
                 
                 <div className="flex gap-2">
                   <Button variant="outline" onClick={openCheckout} className="flex-1 gap-2">
                     <ExternalLink className="h-4 w-4" />
                     Abrir Checkout
                   </Button>
                   <Button variant="outline" onClick={openDemo} className="flex-1 gap-2">
                     <Eye className="h-4 w-4" />
                     Modo Demo
                   </Button>
                 </div>
               </CardContent>
             </Card>
 
             <Card className="border-border/50">
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <QrCode className="h-5 w-5 text-primary" />
                   Recursos do Checkout
                 </CardTitle>
                 <CardDescription>
                   Funcionalidades incluídas no seu checkout
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <ul className="space-y-3">
                   <li className="flex items-center gap-3 text-sm">
                     <CheckCircle className="h-4 w-4 text-success" />
                     <span>Pagamento instantâneo via PIX</span>
                   </li>
                   <li className="flex items-center gap-3 text-sm">
                     <CheckCircle className="h-4 w-4 text-success" />
                     <span>QR Code gerado automaticamente</span>
                   </li>
                   <li className="flex items-center gap-3 text-sm">
                     <CheckCircle className="h-4 w-4 text-success" />
                     <span>Confirmação em tempo real</span>
                   </li>
                   <li className="flex items-center gap-3 text-sm">
                     <CheckCircle className="h-4 w-4 text-success" />
                     <span>Cores e logo personalizáveis</span>
                   </li>
                   <li className="flex items-center gap-3 text-sm">
                     <CheckCircle className="h-4 w-4 text-success" />
                     <span>Campos obrigatórios configuráveis</span>
                   </li>
                 </ul>
               </CardContent>
             </Card>
           </div>
 
           <Card className="border-border/50">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 <Settings2 className="h-5 w-5 text-primary" />
                 Como Usar
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid gap-4 md:grid-cols-3">
                 <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                   <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                     1
                   </div>
                   <h4 className="font-medium mb-1">Copie o Link</h4>
                   <p className="text-sm text-muted-foreground">
                     Copie a URL do checkout público acima
                   </p>
                 </div>
                 <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                   <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                     2
                   </div>
                   <h4 className="font-medium mb-1">Compartilhe</h4>
                   <p className="text-sm text-muted-foreground">
                     Envie para seus clientes via WhatsApp, e-mail ou redes sociais
                   </p>
                 </div>
                 <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                   <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                     3
                   </div>
                   <h4 className="font-medium mb-1">Receba Pagamentos</h4>
                   <p className="text-sm text-muted-foreground">
                     Os pagamentos aparecem automaticamente no seu dashboard
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* Tab: Personalizar */}
         <TabsContent value="customize" className="space-y-6">
           <div className="grid gap-6 lg:grid-cols-2">
             <Card className="border-border/50">
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Image className="h-5 w-5 text-primary" strokeWidth={1.5} />
                   Logo e Marca
                 </CardTitle>
                 <CardDescription>
                   Personalize a aparência do seu checkout
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="logoUrl">URL do Logo</Label>
                   <Input
                     id="logoUrl"
                     placeholder="https://exemplo.com/logo.png"
                     value={logoUrl}
                     onChange={(e) => setLogoUrl(e.target.value)}
                   />
                   <p className="text-xs text-muted-foreground">
                     Recomendado: imagem PNG ou SVG com fundo transparente
                   </p>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="customTitle">Título Personalizado</Label>
                   <Input
                     id="customTitle"
                     placeholder="Ex: Pagamento Seguro"
                     value={customTitle}
                     onChange={(e) => setCustomTitle(e.target.value)}
                   />
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="customDescription">Descrição</Label>
                   <Input
                     id="customDescription"
                     placeholder="Ex: Pagamento instantâneo via PIX"
                     value={customDescription}
                     onChange={(e) => setCustomDescription(e.target.value)}
                   />
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="successMessage">Mensagem de Sucesso</Label>
                   <Input
                     id="successMessage"
                     placeholder="Ex: Obrigado pela compra!"
                     value={successMessage}
                     onChange={(e) => setSuccessMessage(e.target.value)}
                   />
                 </div>
               </CardContent>
             </Card>
 
             <Card className="border-border/50">
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Palette className="h-5 w-5 text-primary" strokeWidth={1.5} />
                   Cores
                 </CardTitle>
                 <CardDescription>
                   Defina as cores do checkout
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="primaryColor">Cor Principal</Label>
                   <div className="flex gap-2">
                     <Input
                       id="primaryColor"
                       type="color"
                       value={primaryColor}
                       onChange={(e) => setPrimaryColor(e.target.value)}
                       className="w-14 h-10 p-1 cursor-pointer"
                     />
                     <Input
                       value={primaryColor}
                       onChange={(e) => setPrimaryColor(e.target.value)}
                       placeholder="#8B5CF6"
                       className="flex-1 font-mono"
                     />
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                   <div className="flex gap-2">
                     <Input
                       id="backgroundColor"
                       type="color"
                       value={backgroundColor}
                       onChange={(e) => setBackgroundColor(e.target.value)}
                       className="w-14 h-10 p-1 cursor-pointer"
                     />
                     <Input
                       value={backgroundColor}
                       onChange={(e) => setBackgroundColor(e.target.value)}
                       placeholder="#0F0F23"
                       className="flex-1 font-mono"
                     />
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="textColor">Cor do Texto</Label>
                   <div className="flex gap-2">
                     <Input
                       id="textColor"
                       type="color"
                       value={textColor}
                       onChange={(e) => setTextColor(e.target.value)}
                       className="w-14 h-10 p-1 cursor-pointer"
                     />
                     <Input
                       value={textColor}
                       onChange={(e) => setTextColor(e.target.value)}
                       placeholder="#FFFFFF"
                       className="flex-1 font-mono"
                     />
                   </div>
                 </div>
 
                 {/* Preview */}
                 <div className="mt-4 p-4 rounded-lg border border-border/50" style={{ backgroundColor }}>
                   <p className="text-sm font-medium mb-2" style={{ color: textColor }}>Preview</p>
                   <div 
                     className="px-4 py-2 rounded-lg text-center font-medium text-white"
                     style={{ backgroundColor: primaryColor }}
                   >
                     Pagar com PIX
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
 
           <div className="flex justify-end">
             <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
               {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               Salvar Configurações
             </Button>
           </div>
         </TabsContent>
 
         {/* Tab: Campos */}
         <TabsContent value="fields" className="space-y-6">
           <Card className="border-border/50">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 <ToggleLeft className="h-5 w-5 text-primary" strokeWidth={1.5} />
                 Campos Obrigatórios
               </CardTitle>
               <CardDescription>
                 Configure quais campos são obrigatórios no checkout
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                 <div>
                   <Label className="text-base">Nome e E-mail</Label>
                   <p className="text-sm text-muted-foreground">Sempre obrigatórios</p>
                 </div>
                 <Switch checked disabled />
               </div>
 
               <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                 <div>
                   <Label htmlFor="requirePhone" className="text-base">Telefone</Label>
                   <p className="text-sm text-muted-foreground">Exigir telefone para prosseguir</p>
                 </div>
                 <Switch
                   id="requirePhone"
                   checked={requirePhone}
                   onCheckedChange={setRequirePhone}
                 />
               </div>
 
               <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                 <div>
                   <Label htmlFor="requireCpf" className="text-base">CPF</Label>
                   <p className="text-sm text-muted-foreground">Exigir CPF para prosseguir</p>
                 </div>
                 <Switch
                   id="requireCpf"
                   checked={requireCpf}
                   onCheckedChange={setRequireCpf}
                 />
               </div>
             </CardContent>
           </Card>
 
           <div className="flex justify-end">
             <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
               {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               Salvar Configurações
             </Button>
           </div>
         </TabsContent>
       </Tabs>
     </DashboardLayout>
   );
 }