import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Sun,
  Moon,
  Info,
  Clock,
} from 'lucide-react';

const fees = [
  {
    title: 'PIX Entrada',
    subtitle: 'Cash-in',
    description: 'Taxa cobrada sobre cada pagamento recebido',
    icon: ArrowUpRight,
    iconColor: 'text-success',
    borderColor: 'border-success',
    feeText: '1,40% ou R$ 0,80',
    feeNote: 'o que for maior',
    valueColor: 'text-success',
  },
  {
    title: 'PIX Saída',
    subtitle: 'Cash-out',
    description: 'Taxa cobrada por cada saque realizado',
    icon: ArrowDownRight,
    iconColor: 'text-primary',
    borderColor: 'border-primary',
    feeText: 'R$ 1,50',
    feeNote: 'taxa fixa',
    valueColor: 'text-primary',
  },
];

const limits = [
  {
    title: 'Período Diurno',
    subtitle: '08:00h às 20:00h',
    icon: Sun,
    iconColor: 'text-warning',
    borderColor: 'border-warning',
    maxTransaction: 'R$ 25.000,00',
  },
  {
    title: 'Período Noturno',
    subtitle: '20:00h às 08:00h',
    icon: Moon,
    iconColor: 'text-primary',
    borderColor: 'border-primary',
    maxTransaction: 'R$ 5.000,00',
  },
];

export default function Fees() {
  return (
    <DashboardLayout title="Taxas e Limites">
      {/* Fee Cards */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {fees.map((fee) => (
          <Card key={fee.title} className="border-border/50 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 border-2 ${fee.borderColor} rounded-full`}>
                  <fee.icon className={`h-6 w-6 ${fee.iconColor}`} strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">{fee.title}</CardTitle>
                  <CardDescription className="text-sm">{fee.subtitle}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{fee.description}</p>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${fee.valueColor}`}>{fee.feeText}</p>
                <p className="text-sm text-muted-foreground">{fee.feeNote}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Limits Section */}
      <Card className="border-border/50 mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-muted-foreground/30 rounded-full">
              <Clock className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Limites por Horário</CardTitle>
              <CardDescription>
                Valores máximos por transação conforme período do dia
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {limits.map((limit) => (
              <div key={limit.title} className="p-5 rounded-xl border border-border/50 bg-muted/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 border-2 ${limit.borderColor} rounded-full`}>
                    <limit.icon className={`h-5 w-5 ${limit.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{limit.title}</h4>
                    <p className="text-sm text-muted-foreground">{limit.subtitle}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border/30">
                  <span className="text-sm text-muted-foreground">Limite máximo</span>
                  <span className="font-bold text-lg">{limit.maxTransaction}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 border-2 border-primary rounded-full shrink-0">
              <Info className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-2">Como funcionam as taxas?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A taxa de PIX entrada é calculada como <strong className="text-foreground">1,40% OU R$ 0,80</strong> — sempre será cobrado o <strong className="text-foreground">maior valor</strong> entre os dois. 
              </p>
              <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/30">
                <p className="text-sm font-medium mb-2">Exemplos práticos:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Venda de <strong className="text-foreground">R$ 50,00</strong> → Taxa: R$ 0,80 (mínimo)</li>
                  <li>• Venda de <strong className="text-foreground">R$ 100,00</strong> → Taxa: R$ 1,40 (1,40%)</li>
                  <li>• Venda de <strong className="text-foreground">R$ 500,00</strong> → Taxa: R$ 7,00 (1,40%)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
