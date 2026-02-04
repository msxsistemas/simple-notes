import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck,
  Landmark,
} from 'lucide-react';

const fees = [
  {
    title: 'PIX Entrada (Cash-in)',
    description: 'Taxa cobrada sobre cada pagamento recebido',
    icon: ArrowUpRight,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    details: [
      { label: 'Taxa percentual', value: '1,40%' },
      { label: 'Taxa mínima', value: 'R$ 0,80' },
      { label: 'Regra', value: 'O maior valor' },
    ],
  },
  {
    title: 'PIX Saída (Cash-out)',
    description: 'Taxa cobrada por cada saque realizado',
    icon: ArrowDownRight,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    details: [
      { label: 'Taxa fixa', value: 'R$ 2,00' },
    ],
  },
  {
    title: 'Reserva Financeira',
    description: 'Percentual retido como garantia',
    icon: ShieldCheck,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
    details: [
      { label: 'Percentual', value: '5%' },
      { label: 'Período de retenção', value: '30 dias' },
    ],
  },
];

const limits = [
  {
    title: 'PIX',
    icon: Landmark,
    maxTransaction: 'R$ 50.000,00',
    dailyLimit: 'R$ 100.000,00',
  },
];

export default function Fees() {
  return (
    <DashboardLayout title="Taxas">
      {/* Fee Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {fees.map((fee) => (
          <Card key={fee.title} className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`${fee.iconBg} p-3 rounded-xl`}>
                  <fee.icon className={`h-5 w-5 ${fee.iconColor}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{fee.title}</CardTitle>
                  <CardDescription className="text-xs">{fee.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fee.details.map((detail) => (
                  <div key={detail.label} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{detail.label}</span>
                    <Badge variant="secondary" className="font-semibold">
                      {detail.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Limits Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Limites por Transação
          </CardTitle>
          <CardDescription>
            Valores máximos permitidos por método de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {limits.map((limit) => (
              <div key={limit.title} className="p-4 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <limit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold">{limit.title}</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Máx. por transação</span>
                    <span className="font-medium">{limit.maxTransaction}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Limite diário</span>
                    <span className="font-medium">{limit.dailyLimit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-border/50 mt-6 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Sobre as taxas</h4>
              <p className="text-sm text-muted-foreground">
                A taxa de PIX entrada é calculada como <strong>1,40% OU R$ 0,80</strong> — o que for <strong>maior</strong>. 
                Exemplo: para R$ 50,00 a taxa seria R$ 0,80 (mínimo), para R$ 100,00 seria R$ 1,40 (percentual). 
                A reserva financeira é liberada após o período de retenção, servindo como proteção contra chargebacks e disputas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
