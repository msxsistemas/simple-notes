import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnerProfile } from '@/hooks/usePartnerData';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/partner', icon: LayoutDashboard },
  { name: 'Comissões', href: '/partner/commissions', icon: Receipt },
  { name: 'Saques', href: '/partner/withdrawals', icon: Wallet },
  { name: 'Dados PIX', href: '/partner/settings', icon: KeyRound },
];

export function PartnerSidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { data: partnerProfile } = usePartnerProfile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">Portal Parceiro</span>
            </div>
          )}
          {isCollapsed && (
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center mx-auto">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          {!isCollapsed && user && (
            <div className="mb-3 px-2">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {partnerProfile?.name || 'Parceiro'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              'w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive',
              isCollapsed ? 'justify-center px-2' : 'justify-start'
            )}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Sair</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
