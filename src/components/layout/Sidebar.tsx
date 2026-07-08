import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, Flag, Globe, Calendar, Settings, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Técnicos', path: '/coaches' },
  { icon: Flag, label: 'Clubes', path: '/teams' },
  { icon: Globe, label: 'Seleções', path: '/national-teams' },
  { icon: Trophy, label: 'Competições', path: '/competitions' },
  { icon: Calendar, label: 'Temporadas', path: '/seasons' },
  { icon: Users, label: 'Ranking', path: '/ranking' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { isAdmin } = useAuth();
  
  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 border-r bg-card flex-col transition-transform duration-300 md:relative md:flex md:translate-x-0",
      isOpen ? "translate-x-0 flex" : "-translate-x-full flex"
    )}>
      <div className="h-16 flex items-center justify-between px-6 border-b">
        <h1 className="font-bold text-xl tracking-tight text-primary">Brasfoot Pro</h1>
        <button onClick={onClose} className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-md">
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.path === '/settings' && !isAdmin) return null;
          return (
            <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        )})}
      </nav>
    </aside>
  );
}
