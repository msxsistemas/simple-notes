import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, Receipt, ArrowUpRight, Loader2 } from 'lucide-react';
import { usePartnerProfile, usePartnerCommissions, usePartnerBalance } from '@/hooks/usePartnerData';

export default function PartnerDashboard() {
  const { data: profile, isLoading: profileLoading } = usePartnerProfile();
  const { data: commissions, isLoading: commissionsLoading } = usePartnerCommissions();
  const balance = usePartnerBalance();

  const isLoading = profileLoading || commissionsLoading;

  if (isLoading) {
    return (
      <PartnerLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  const stats = [
    {
      title: 'Saldo Disponível',
      value: formatCurrency(balance.availableBalance),
      icon: Wallet,
      color: 'text-primary',
      borderColor: 'border-primary',
    },
    {
      title: 'Total Ganho',
      value: formatCurrency(balance.totalEarned),
      icon: TrendingUp,
      color: 'text-success',
      borderColor: 'border-success',
    },
    {
      title: 'Total Sacado',
      value: formatCurrency(balance.totalWithdrawn),
      icon: ArrowUpRight,
      color: 'text-muted-foreground',
      borderColor: 'border-muted',
    },
    {
      title: 'Transações',
      value: commissions?.length.toString() || '0',
      icon: Receipt,
      color: 'text-primary',
      borderColor: 'border-primary',
    },
  ];

  return (
    <PartnerLayout title="Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Olá, {profile?.name || 'Parceiro'}! 👋
        </h2>
        <p className="text-muted-foreground">
          Acompanhe suas comissões e solicite saques.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-bold">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`h-7 w-7 flex items-center justify-center border-2 ${stat.borderColor} rounded-full`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Partner Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Seus Dados</CardTitle>
          <CardDescription>Informações do seu cadastro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Chave PIX</p>
              <p className="font-medium">{profile?.pix_key || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
              <p className="font-medium">{profile?.document || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Split</p>
              <p className="font-medium">
                {profile?.split_type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor do Split</p>
              <p className="font-medium">
                {profile?.split_type === 'percentage' 
                  ? `${profile.split_value}%` 
                  : formatCurrency(profile?.split_value || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card className="border-border/50 mt-6">
        <CardHeader>
          <CardTitle className="text-base">Últimas Comissões</CardTitle>
          <CardDescription>Suas 5 últimas comissões</CardDescription>
        </CardHeader>
        <CardContent>
          {!commissions || commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma comissão ainda
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.slice(0, 5).map((commission) => (
                <div 
                  key={commission.id} 
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{commission.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Venda: {formatCurrency(commission.amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">
                      +{formatCurrency(commission.commission_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PartnerLayout>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
