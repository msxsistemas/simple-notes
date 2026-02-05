 import { QrCode } from 'lucide-react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Button } from '@/components/ui/button';
 
 interface CheckoutPreviewProps {
   logoUrl: string;
   primaryColor: string;
   backgroundColor: string;
   textColor: string;
   customTitle: string;
   customDescription: string;
   showName: boolean;
   showEmail: boolean;
   showPhone: boolean;
   showCpf: boolean;
   requirePhone: boolean;
   requireCpf: boolean;
 }
 
 export function CheckoutPreview({
   logoUrl,
   primaryColor,
   backgroundColor,
   textColor,
   customTitle,
   customDescription,
   showName,
   showEmail,
   showPhone,
   showCpf,
   requirePhone,
   requireCpf,
 }: CheckoutPreviewProps) {
   return (
     <div 
       className="rounded-xl p-4 min-h-[500px] flex items-center justify-center"
       style={{ 
         background: `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}ee 50%, ${primaryColor}22 100%)`,
       }}
     >
       <Card className="w-full max-w-xs border-border/50 shadow-xl scale-90 origin-center">
         <CardHeader className="text-center pb-3">
           {logoUrl ? (
             <img 
               src={logoUrl} 
               alt="Logo" 
               className="mx-auto mb-3 h-10 w-auto max-w-[140px] object-contain"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
               }}
             />
           ) : (
             <div 
               className="mx-auto mb-3 h-10 w-10 rounded-xl flex items-center justify-center shadow-md"
               style={{ backgroundColor: primaryColor }}
             >
               <QrCode className="h-5 w-5 text-white" />
             </div>
           )}
           <CardTitle className="text-lg font-bold" style={{ color: textColor === '#FFFFFF' ? undefined : textColor }}>
             {customTitle || 'Checkout PIX'}
           </CardTitle>
           <CardDescription className="text-xs">
             {customDescription || 'Pagamento instantâneo e seguro via PIX'}
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-3 pt-0">
           {/* Amount - always visible */}
           <div className="space-y-1">
             <Label className="text-xs">Valor *</Label>
             <div className="relative">
               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
               <Input
                 placeholder="0,00"
                 defaultValue="99,90"
                 className="pl-7 h-8 text-sm font-semibold"
                 readOnly
               />
             </div>
           </div>
 
           {showName && (
             <div className="space-y-1">
               <Label className="text-xs">Nome completo *</Label>
               <Input
                 placeholder="Seu nome completo"
                 className="h-8 text-xs"
                 readOnly
               />
             </div>
           )}
 
           {showEmail && (
             <div className="space-y-1">
               <Label className="text-xs">E-mail *</Label>
               <Input
                 placeholder="seu@email.com"
                 className="h-8 text-xs"
                 readOnly
               />
             </div>
           )}
 
           {(showPhone || showCpf) && (
             <div className="grid grid-cols-2 gap-2">
               {showPhone && (
                 <div className={`space-y-1 ${!showCpf ? 'col-span-2' : ''}`}>
                   <Label className="text-xs">Telefone{requirePhone ? ' *' : ''}</Label>
                   <Input
                     placeholder="(11) 99999-9999"
                     className="h-8 text-xs"
                     readOnly
                   />
                 </div>
               )}
               {showCpf && (
                 <div className={`space-y-1 ${!showPhone ? 'col-span-2' : ''}`}>
                   <Label className="text-xs">CPF{requireCpf ? ' *' : ''}</Label>
                   <Input
                     placeholder="000.000.000-00"
                     className="h-8 text-xs"
                     readOnly
                   />
                 </div>
               )}
             </div>
           )}
 
           <Button
             className="w-full h-9 text-sm shadow-md"
             style={{ backgroundColor: primaryColor }}
           >
             Pagar com PIX
           </Button>
 
           <div className="flex items-center justify-center gap-1 pt-2 border-t border-border/50">
             <svg className="h-3 w-3 text-success" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
             </svg>
             <span className="text-[10px] text-muted-foreground">Pagamento seguro</span>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }