import { useState } from 'react';
import { useStore } from '../store';
import { useAlerts } from '../hooks/useAlerts';
import {
  Wrench, LayoutDashboard, LayoutGrid, CheckCircle,
  Users, MapPin, UserCheck, LogOut,
  ChevronLeft, ChevronRight, Shield, User as UserIcon, Menu, X
} from 'lucide-react';

interface NavItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  collapsed?: boolean;
}

function NavItem({ icon: Icon, label, active, onClick, badge, collapsed }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium relative
        ${active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="flex-1 text-left">{label}</span>}
      {badge && badge > 0 && (
        <span className={`
          ${collapsed ? 'absolute -top-1 -right-1' : ''}
          min-w-[18px] h-[18px] bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold px-1
        `}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const { currentUser, logout, activeView, setActiveView } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const alerts = useAlerts();
  const alertCount = alerts.length;

  const isAdmin = currentUser?.role === 'admin';

  const nav = [
    { id: 'kanban', icon: LayoutGrid, label: 'Quadro Kanban', badge: alertCount },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'completed', icon: CheckCircle, label: 'Concluídos' },
    ...(isAdmin ? [
      { id: 'employees', icon: Users, label: 'Funcionários' },
      { id: 'areas', icon: MapPin, label: 'Setores' },
      { id: 'users', icon: UserCheck, label: 'Usuários' },
    ] : []),
  ];

  const handleNav = (id: string) => {
    setActiveView(id as any);
    setMobileOpen(false);
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-72' : collapsed ? 'w-16' : 'w-64'} transition-all duration-200`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-gray-800 ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Wrench size={16} className="text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm">OficinaPro</p>
            <p className="text-gray-500 text-xs truncate">Gestão de Produção</p>
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-gray-600 hover:text-gray-300 transition-colors shrink-0"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {nav.map(item => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeView === item.id}
            onClick={() => handleNav(item.id)}
            badge={item.badge}
            collapsed={collapsed && !mobile}
          />
        ))}
      </nav>

      {/* User section */}
      <div className={`p-3 border-t border-gray-800 ${collapsed && !mobile ? 'flex flex-col items-center gap-2' : ''}`}>
        {(!collapsed || mobile) ? (
          <div className="bg-gray-800 rounded-xl p-3 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-700 flex items-center justify-center text-xs text-white font-bold shrink-0">
                {currentUser?.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate">{currentUser?.name}</p>
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  {isAdmin ? <Shield size={9} /> : <UserIcon size={9} />}
                  <span>{isAdmin ? 'Administrador' : 'Usuário'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={13} /> Sair
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-gray-900 border-r border-gray-800 shrink-0 transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Wrench size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">OficinaPro</span>
        </div>
        <div className="flex items-center gap-2">
          {alertCount > 0 && (
            <div className="w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
              {alertCount > 9 ? '9+' : alertCount}
            </div>
          )}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="absolute top-3 right-3">
              <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <SidebarContent mobile={true} />
          </div>
        </div>
      )}
    </>
  );
}
