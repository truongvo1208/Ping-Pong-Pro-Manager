
import React from 'react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  clubName: string;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  role: 'SUPER_ADMIN' | 'CLUB_ADMIN';
}

interface MenuItem {
  id: ViewType;
  icon: string;
  label: string;
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, clubName, onLogout, isOpen, onClose, role }) => {
  const isSuper = role === 'SUPER_ADMIN';

  const clubMenuGroups: MenuGroup[] = [
    {
      title: 'Vận hành cơ sở',
      items: [
        { id: 'dashboard', icon: 'fa-chart-line', label: 'Bảng điều khiển' },
      ]
    },
    {
      title: 'Quản trị nghiệp vụ',
      items: [
        { id: 'players', icon: 'fa-users', label: 'Người chơi' },
        { id: 'services', icon: 'fa-concierge-bell', label: 'Dịch vụ & Kho' },
        { id: 'expenses', icon: 'fa-wallet', label: 'Chi phí chi tiêu' },
      ]
    },
    {
      title: 'Dữ liệu báo cáo',
      items: [
        { id: 'history', icon: 'fa-history', label: 'Lịch sử lượt chơi' },
        { id: 'reports', icon: 'fa-file-invoice-dollar', label: 'Báo cáo tài chính' },
      ]
    }
  ];

  const adminMenuGroups: MenuGroup[] = [
    {
      title: 'Quản trị hệ thống',
      items: [
        { id: 'admin-clubs', icon: 'fa-sitemap', label: 'Quản lý các cơ sở' },
        { id: 'admin-reports', icon: 'fa-earth-asia', label: 'Báo cáo hệ thống' },
      ]
    },
    {
      title: 'Tra cứu toàn cục',
      items: [
        { id: 'players', icon: 'fa-users', label: 'Tất cả người chơi' },
        { id: 'history', icon: 'fa-history', label: 'Toàn bộ lịch sử' },
      ]
    }
  ];

  const groups = isSuper ? adminMenuGroups : clubMenuGroups;

  const sidebarClasses = `
    fixed inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out shadow-2xl
    lg:relative lg:translate-x-0 lg:h-screen lg:shrink-0 lg:shadow-none
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${isSuper ? 'bg-indigo-600' : 'bg-blue-600'}`}>
            <i className="fa-solid fa-table-tennis-paddle-ball text-white text-lg"></i>
          </div>
          <span className="font-black text-xl tracking-tight">PingPong Pro</span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
      </div>

      <nav className="flex-1 mt-6 px-4 overflow-y-auto scrollbar-hide pb-6">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-6 last:mb-0">
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
              {group.title}
            </p>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group/nav ${
                      currentView === item.id 
                        ? (isSuper ? 'bg-indigo-600' : 'bg-blue-600') + ' text-white shadow-lg shadow-black/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} w-5 text-center text-base`}></i>
                    <span className="font-bold text-sm flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${currentView === item.id ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800 bg-slate-900/50">
        <div className="bg-slate-800/40 rounded-2xl p-4 mb-4 border border-slate-800/50">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5">
            {isSuper ? 'QUYỀN HẠN' : 'ĐANG QUẢN LÝ'}
          </p>
          <p className="text-sm font-black truncate text-slate-200">
            {isSuper ? 'Super Administrator' : clubName}
          </p>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3.5 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-bold text-sm"
        >
          <i className="fa-solid fa-power-off w-5"></i>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
