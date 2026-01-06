
import React from 'react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  clubName: string;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  role: 'superadmin' | 'club';
}

interface MenuItem {
  id: ViewType;
  icon: string;
  label: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, clubName, onLogout, isOpen, onClose, role }) => {
  const isSuper = role === 'superadmin';

  const clubMenuGroups: MenuGroup[] = [
    {
      title: 'Tổng quan',
      items: [
        { id: 'dashboard', icon: 'fa-chart-line', label: 'Bảng điều khiển' },
      ]
    },
    {
      title: 'Quản lý',
      items: [
        { id: 'players', icon: 'fa-users', label: 'Người chơi' },
        { id: 'services', icon: 'fa-concierge-bell', label: 'Dịch vụ' },
        { id: 'notifications', icon: 'fa-bullhorn', label: 'Thông báo' },
        { id: 'expenses', icon: 'fa-wallet', label: 'Chi tiêu' },
      ]
    },
    {
      title: 'Dữ liệu',
      items: [
        { id: 'history', icon: 'fa-history', label: 'Lịch sử' },
        { id: 'reports', icon: 'fa-file-invoice-dollar', label: 'Báo cáo' },
      ]
    }
  ];

  const adminMenuGroups: MenuGroup[] = [
    {
      title: 'Hệ thống',
      items: [
        { id: 'admin-clubs', icon: 'fa-sitemap', label: 'Quản lý cơ sở' },
        { id: 'admin-reports', icon: 'fa-earth-asia', label: 'Báo cáo hệ thống' },
      ]
    },
    {
      title: 'Tra cứu',
      items: [
        { id: 'players', icon: 'fa-users', label: 'Xem người chơi' },
        { id: 'history', icon: 'fa-history', label: 'Xem lịch sử' },
      ]
    }
  ];

  const groups = isSuper ? adminMenuGroups : clubMenuGroups;

  const sidebarClasses = `
    fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out
    lg:relative lg:translate-x-0 lg:h-screen lg:shrink-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSuper ? 'bg-indigo-600' : 'bg-blue-500'}`}>
            <i className="fa-solid fa-table-tennis-paddle-ball text-white"></i>
          </div>
          <span className="font-bold text-xl tracking-tight">PingPong Pro</span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden text-slate-400 hover:text-white"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>

      <nav className="flex-1 mt-4 px-4 overflow-y-auto scrollbar-hide pb-6">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-6">
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all ${
                      currentView === item.id 
                        ? (isSuper ? 'bg-indigo-600 shadow-indigo-900/20' : 'bg-blue-600 shadow-blue-900/20') + ' text-white shadow-lg' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} w-5 text-center text-sm`}></i>
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-3 mb-3">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{isSuper ? 'Vai trò' : 'Cơ sở'}</p>
          <p className="text-xs font-medium truncate">{clubName}</p>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <i className="fa-solid fa-right-from-bracket w-5"></i>
          <span className="font-medium text-sm">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
