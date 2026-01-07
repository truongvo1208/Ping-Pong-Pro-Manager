
import React, { useState, useMemo } from 'react';
import { Club } from '../../types';
import { validateEmail, validateVNPhone } from '../../utils/formatters';

interface ClubManagerProps {
  clubs: Club[];
  onAddClub: (club: Partial<Club>) => void;
  onUpdateClub: (id: string, club: Partial<Club>) => void;
  onDeleteClub: (id: string) => void;
}

const ClubManager: React.FC<ClubManagerProps> = ({ clubs, onAddClub, onUpdateClub, onDeleteClub }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [form, setForm] = useState({ 
    name: '', 
    username: '', 
    password: '', 
    email: '', 
    hotline: '', 
    address: '',
    status: 'active' as any 
  });

  const handleOpenAdd = () => {
    setEditingClub(null);
    setForm({ name: '', username: '', password: '', email: '', hotline: '', address: '', status: 'active' });
    setErrors({});
    setShowAdd(true);
  };

  const handleOpenEdit = (club: Club) => {
    setEditingClub(club);
    setForm({ 
      name: club.name, 
      username: club.username, 
      password: '', 
      email: club.email || '', 
      hotline: club.hotline || '', 
      address: club.address || '',
      status: club.status?.toLowerCase() || 'active'
    });
    setErrors({});
    setShowAdd(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Vui lòng nhập tên CLB';
    if (!form.username.trim() && !editingClub) newErrors.username = 'Vui lòng nhập tên đăng nhập';
    if (!editingClub && !form.password.trim()) newErrors.password = 'Vui lòng nhập mật khẩu';
    if (form.email && !validateEmail(form.email)) newErrors.email = 'Email không hợp lệ';
    if (form.hotline && !validateVNPhone(form.hotline)) newErrors.hotline = 'SĐT không hợp lệ';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (editingClub) {
      const updateData: Partial<Club> = { ...form };
      if (!form.password.trim()) delete updateData.password;
      onUpdateClub(editingClub.id, updateData);
    } else {
      onAddClub({ ...form, role: 'CLUB_ADMIN' });
    }
    setErrors({});
    setShowAdd(false);
  };

  const clubAdmins = useMemo(() => {
    return clubs
      .filter(c => c.role === 'CLUB_ADMIN')
      .filter(club => {
        const matchesSearch = 
          club.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (club.hotline && club.hotline.includes(searchTerm)) ||
          (club.address && club.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
          club.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || club.status.toLowerCase() === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clubs, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = clubs.filter(c => c.role === 'CLUB_ADMIN').length;
    const active = clubs.filter(c => c.role === 'CLUB_ADMIN' && c.status === 'active').length;
    return { total, active, inactive: total - active };
  }, [clubs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Quản lý hệ thống cơ sở</h2>
          <div className="flex items-center gap-4 mt-1">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng: {stats.total} CLB</span>
             <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">• {stats.active} hoạt động</span>
             <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">• {stats.inactive} đã khóa</span>
          </div>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95 text-sm"
        >
          <i className="fa-solid fa-plus"></i> KHỞI TẠO CƠ SỞ MỚI
        </button>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="bg-white p-3 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text"
            placeholder="Tìm theo tên, địa chỉ, hotline hoặc tài khoản..."
            className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center bg-slate-50 rounded-2xl p-1 gap-1">
          {(['all', 'active', 'inactive'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setStatusFilter(type)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === type 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {type === 'all' ? 'Tất cả' : type === 'active' ? 'Hoạt động' : 'Đã khóa'}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Table View */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pl-8 pr-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên Cơ sở / CLB</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quản trị viên</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Liên hệ (Hotline/Email)</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                <th className="pl-4 pr-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clubAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <i className="fa-solid fa-folder-open text-4xl mb-2"></i>
                      <p className="font-black text-sm uppercase tracking-widest">Không có dữ liệu</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clubAdmins.map((club, idx) => {
                  const isActive = club.status?.toLowerCase() === 'active';
                  return (
                    <tr key={club.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="pl-8 pr-4 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            {idx + 1}
                          </div>
                          <div className="max-w-[220px]">
                            <p className={`font-black text-sm tracking-tight truncate ${!isActive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                              {club.name}
                            </p>
                            {club.address && (
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate flex items-center gap-1">
                                <i className="fa-solid fa-location-dot text-[8px]"></i> {club.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-user-gear text-[10px] text-slate-300"></i>
                          <span className="text-xs font-bold text-slate-600">{club.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-600">{club.hotline || '---'}</p>
                          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{club.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                           {isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="pl-4 pr-8 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => handleOpenEdit(club)}
                            className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center group/btn"
                            title="Sửa thông tin"
                          >
                            <i className="fa-solid fa-pen-to-square text-xs transition-transform group-hover/btn:scale-110"></i>
                          </button>
                          
                          {isActive ? (
                            <button 
                              onClick={() => { if(window.confirm(`Khóa cơ sở "${club.name}"?`)) onDeleteClub(club.id); }}
                              className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                              title="Khóa hoạt động"
                            >
                              <i className="fa-solid fa-lock text-xs"></i>
                            </button>
                          ) : (
                            <button 
                              onClick={() => onUpdateClub(club.id, { status: 'active' })}
                              className="w-9 h-9 rounded-xl bg-green-50 text-green-500 hover:bg-green-600 hover:text-white transition-all flex items-center justify-center"
                              title="Mở khóa"
                            >
                              <i className="fa-solid fa-unlock text-xs"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {clubAdmins.length > 0 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-50 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hiển thị tối đa các cơ sở trong hệ thống</p>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{editingClub ? 'Cấu hình cơ sở' : 'Khởi tạo cơ sở'}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Quản lý quyền truy cập và thông tin liên lạc</p>
              </div>
              <button type="button" onClick={() => setShowAdd(false)} className="w-12 h-12 rounded-full bg-white text-slate-400 hover:text-slate-800 transition-all flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <div className="p-10 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tên CLB / Cơ sở *</label>
                <input 
                  type="text" 
                  placeholder="VD: CLB Bóng bàn 3T"
                  className={`w-full px-6 py-4 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-100'} rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none font-bold transition-all`} 
                  value={form.name} 
                  onChange={e => {
                    setForm({...form, name: e.target.value});
                    if (errors.name) setErrors({...errors, name: ''});
                  }} 
                />
                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-2">{errors.name}</p>}
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Địa chỉ cơ sở</label>
                <input 
                  type="text" 
                  placeholder="Số nhà, tên đường, Quận/Huyện, Tỉnh/TP..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none font-bold transition-all" 
                  value={form.address} 
                  onChange={e => setForm({...form, address: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tên đăng nhập *</label>
                <input 
                  disabled={!!editingClub} 
                  type="text" 
                  placeholder="admin_3t"
                  className={`w-full px-6 py-4 bg-slate-50 border ${errors.username ? 'border-red-500' : 'border-slate-100'} rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none font-bold transition-all ${editingClub ? 'opacity-50' : ''}`} 
                  value={form.username} 
                  onChange={e => {
                    setForm({...form, username: e.target.value});
                    if (errors.username) setErrors({...errors, username: ''});
                  }} 
                />
                {errors.username && <p className="text-[10px] text-red-500 font-bold mt-1 ml-2">{errors.username}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  {editingClub ? 'Mật khẩu mới (Nếu đổi)' : 'Mật khẩu truy cập *'}
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className={`w-full px-6 py-4 bg-slate-50 border ${errors.password ? 'border-red-500' : 'border-slate-100'} rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none font-bold transition-all`} 
                  value={form.password} 
                  onChange={e => {
                    setForm({...form, password: e.target.value});
                    if (errors.password) setErrors({...errors, password: ''});
                  }} 
                />
                {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1 ml-2">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email liên hệ</label>
                <input 
                  type="text" 
                  placeholder="example@gmail.com"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none font-bold transition-all" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hotline</label>
                <input 
                  type="text" 
                  placeholder="09xxx..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none font-bold transition-all" 
                  value={form.hotline} 
                  onChange={e => setForm({...form, hotline: e.target.value.replace(/\D/g, "").slice(0, 10)})} 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Trạng thái hệ thống</label>
                <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none font-bold appearance-none cursor-pointer" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Khóa cơ sở</option>
                </select>
              </div>
            </div>

            <div className="p-10 bg-slate-50 flex gap-4">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 font-black text-slate-400 text-sm hover:text-slate-800 transition-colors">HUỶ BỎ</button>
              <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl shadow-2xl text-sm hover:bg-black transition-all active:scale-95">
                {editingClub ? 'CẬP NHẬT THÔNG TIN' : 'XÁC NHẬN KHỞI TẠO'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClubManager;
