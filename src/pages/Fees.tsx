import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Sun,
  Moon,
  Rocket,
  Shield,
  QrCode,
} from 'lucide-react';
import { useFeeConfig } from '@/hooks/useFeeConfig';

export default function Fees() {
  const { data: feeConfig } = useFeeConfig();

  return (
    <DashboardLayout title="Taxas e Limites">
      {/* Main Pix Card */}
      <Card className="border-border/50 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rotate-45" />
                <span className="font-bold text-lg">Pix</span>
              </div>

              {/* Entrada */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowUpRight className="h-4 w-4 text-success" />
                  <span>Entrada (Cash-in)</span>
                </div>
                <p className="text-2xl font-bold">
                  <span className="text-success">1,40%</span>
                  <span className="text-muted-foreground mx-2">ou</span>
                  <span className="text-success">R$ 0,80</span>
                  <span className="text-sm font-normal text-muted-foreground ml-2">o que for maior</span>
                </p>
              </div>

              {/* Saída */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowDownRight className="h-4 w-4 text-primary" />
                  <span>Saída (Cash-out)</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  R$ 2,00
                  <span className="text-sm font-normal text-muted-foreground ml-2">taxa fixa</span>
                </p>
              </div>

              {/* Note */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Rocket className="h-4 w-4 text-destructive" />
                <span>Tarifas por transação</span>
              </div>
            </div>

            {/* QR Code Icon */}
            <div className="hidden md:flex items-center justify-center p-4 bg-muted/30 rounded-lg">
              <QrCode className="h-16 w-16 text-success" strokeWidth={1} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="border-border/50 bg-muted/30 mb-6">
        <CardContent className="py-4">
          <p className="text-center text-sm">
            <span className="text-success font-medium">◆</span>
            <span className="ml-2">Pix é o meio de pagamento instantâneo da plataforma.</span>
            <br />
            <strong>Rápido, seguro e sem burocracia!</strong>
            <span className="ml-1">🚀</span>
          </p>
        </CardContent>
      </Card>

      {/* Reserve */}
      <Card className="border-border/50 mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5 text-warning" />
            <span className="font-medium">Reserva financeira:</span>
            <span className="font-bold text-lg">
              {feeConfig?.reserve_percentage !== undefined 
                ? `${feeConfig.reserve_percentage.toFixed(2).replace('.', ',')}%` 
                : '0,00%'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Limits Section */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rotate-45" />
            Limites por Horário
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Diurno */}
            <div className="p-5 rounded-xl border border-warning/30 bg-warning/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-warning/20 rounded-full">
                  <Sun className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h4 className="font-bold">Período Diurno</h4>
                  <p className="text-sm text-muted-foreground">08:00h às 20:00h</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-warning">R$ 25.000,00</p>
              <p className="text-sm text-muted-foreground">limite por transação</p>
            </div>

            {/* Noturno */}
            <div className="p-5 rounded-xl border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Moon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold">Período Noturno</h4>
                  <p className="text-sm text-muted-foreground">20:00h às 08:00h</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-primary">R$ 5.000,00</p>
              <p className="text-sm text-muted-foreground">limite por transação</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
