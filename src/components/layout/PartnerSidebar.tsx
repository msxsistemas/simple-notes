import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CreditCard,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnerProfile } from '@/hooks/usePartnerData';
import { useState, useEffect } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const navigation = [
  { name: 'Dashboard', href: '/partner', icon: LayoutDashboard },
  { name: 'Comissões', href: '/partner/commissions', icon: FileText },
  { name: 'Saques', href: '/partner/withdrawals', icon: Wallet },
  { name: 'Dados PIX', href: '/partner/settings', icon: KeyRound },
];

export function PartnerSidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { data: partnerProfile } = usePartnerProfile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Auto-open the correct menu based on current route
  useEffect(() => {
    const currentMenu = navigation.find(item => 
      'subItems' in item && (item as any).subItems?.some((sub: any) => location.pathname.startsWith(sub.href))
    );
    if (currentMenu) {
      setOpenMenu(currentMenu.name);
    }
  }, [location.pathname]);

  const toggleMenu = (menuName: string) => {
    setOpenMenu(prev => prev === menuName ? null : menuName);
  };

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
              <span className="text-lg font-bold text-sidebar-foreground">Msx Pay</span>
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
            if ('subItems' in item && (item as any).subItems) {
              const subItems = (item as any).subItems;
              const isOpen = openMenu === item.name;
              const isActive = subItems.some((sub: any) => location.pathname.startsWith(sub.href));
              
              return (
                <Collapsible key={item.name} open={isOpen && !isCollapsed} onOpenChange={() => toggleMenu(item.name)}>
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.name}</span>
                          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                        </>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  {!isCollapsed && (
                    <CollapsibleContent className="pl-6 mt-1 space-y-1">
                      {subItems.map((subItem: any) => {
                        const isSubActive = location.pathname === subItem.href;
                        return (
                          <NavLink
                            key={subItem.name}
                            to={subItem.href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors relative',
                              isSubActive
                                ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                            )}
                          >
                            <subItem.icon className="h-4 w-4" />
                            <span>{subItem.name}</span>
                          </NavLink>
                        );
                      })}
                    </CollapsibleContent>
                  )}
                </Collapsible>
              );
            }
            
            const isActive = location.pathname === item.href || 
              (item.href !== '/partner' && location.pathname.startsWith(item.href));
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
