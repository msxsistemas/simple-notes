import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { PartnerSidebar } from './PartnerSidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface PartnerLayoutProps {
  children: ReactNode;
  title?: string;
}

export function PartnerLayout({ children, title }: PartnerLayoutProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();

  const isLoading = authLoading || roleLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If user is admin, redirect to admin dashboard
  if (role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is not a partner, show error
  if (role !== 'partner') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PartnerSidebar />
      <div className="pl-64 transition-all duration-300">
        <Header title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
