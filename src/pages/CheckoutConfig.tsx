 import { useState } from 'react';
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
 } from 'lucide-react';
 
 export default function CheckoutConfig() {
   const { toast } = useToast();
   const [copied, setCopied] = useState(false);
   
   // URL base do checkout público
   const baseUrl = window.location.origin;
   const checkoutUrl = `${baseUrl}/pay`;
 
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
 
       <div className="grid gap-6 lg:grid-cols-2">
         {/* Link do Checkout */}
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
 
         {/* Recursos */}
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
                 <span>Notificações por e-mail</span>
               </li>
               <li className="flex items-center gap-3 text-sm">
                 <CheckCircle className="h-4 w-4 text-success" />
                 <span>Integração com Woovi/OpenPix</span>
               </li>
             </ul>
           </CardContent>
         </Card>
 
         {/* Como usar */}
         <Card className="border-border/50 lg:col-span-2">
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
       </div>
     </DashboardLayout>
   );
 }