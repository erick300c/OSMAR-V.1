import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Package, ShoppingCart, FileText, LogOut, Beer } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const Sidebar = () => {
  const { t } = useTranslation();

  const navItems = [
    { icon: LayoutDashboard, label: t('common.dashboard'), path: '/' },
    { icon: Package, label: t('common.inventory'), path: '/inventory' },
    { icon: ShoppingCart, label: t('common.sales'), path: '/sales' },
    { icon: FileText, label: t('common.reports'), path: '/reports' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Beer className="w-10 h-10 text-amber-500" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold leading-tight text-gray-800 bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              BOTECO51
            </h1>
            <span className="text-xs text-gray-500 font-medium">O seu bar digital</span>
            <span className="text-xs text-gray-500 font-medium">Dono: OSMAR</span>
          </div>
        </div>
      </div>
      <nav className="mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
                isActive ? 'bg-gray-100 border-l-4 border-blue-500' : ''
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-0 w-64 p-6 space-y-4">
        <LanguageSelector />
        <button className="flex items-center text-gray-700 hover:text-red-500">
          <LogOut className="w-5 h-5 mr-3" />
          {t('common.logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
