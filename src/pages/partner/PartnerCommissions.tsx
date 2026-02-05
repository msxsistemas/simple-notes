import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { usePartnerCommissions } from '@/hooks/usePartnerData';

export default function PartnerCommissions() {
  const { data: commissions, isLoading } = usePartnerCommissions();

  if (isLoading) {
    return (
      <PartnerLayout title="Comissões">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  const totalCommissions = commissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;

  return (
    <PartnerLayout title="Comissões">
      {/* Summary Card */}
      <Card className="border-border/50 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Comissões</p>
              <p className="text-3xl font-bold text-success">{formatCurrency(totalCommissions)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Transações</p>
              <p className="text-2xl font-bold">{commissions?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Histórico de Comissões</CardTitle>
          <CardDescription>Todas as suas comissões recebidas</CardDescription>
        </CardHeader>
        <CardContent>
          {!commissions || commissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma comissão registrada ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor da Venda</TableHead>
                  <TableHead>Sua Comissão</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium">{commission.customer_name}</TableCell>
                    <TableCell>{formatCurrency(commission.amount)}</TableCell>
                    <TableCell className="text-success font-semibold">
                      +{formatCurrency(commission.commission_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Aprovado
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
