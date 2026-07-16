'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Home, 
  Search, 
  History, 
  Users, 
  LogOut, 
  Sprout
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { 
      label: t('dashboard'), 
      href: '/dashboard', 
      icon: <Home size={20} /> 
    },
    { 
      label: t('analizar_hoja'), 
      href: '/analyze', 
      icon: <Search size={20} /> 
    },
    { 
      label: t('historial'), 
      href: '/history', 
      icon: <History size={20} /> 
    },
  ];

  if (user?.is_admin) {
    navItems.push({ 
      label: t('usuarios'), 
      href: '/users', 
      icon: <Users size={20} /> 
    });
  }

  const handleLinkClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <div className="w-64 bg-gradient-to-b from-green-800 to-green-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-green-700">
        <div className="flex items-center gap-3">
          <Sprout size={32} className="text-green-300" />
          <div>
            <h1 className="text-xl font-bold">{t('maiz_saludable')}</h1>
            <p className="text-xs text-green-300">{t('detector_enfermedades')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={handleLinkClick}>
            <div className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all
              ${pathname === item.href 
                ? 'bg-green-700 text-white shadow-lg' 
                : 'text-green-200 hover:bg-green-700/50 hover:text-white'}
            `}>
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-green-700">
        <div className="mb-4 px-4 py-2">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-green-300">{user?.email}</p>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">{t('cerrar_sesion')}</span>
        </button>
      </div>
    </div>
  );
}
