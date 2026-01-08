
import React, { useState, useMemo } from 'react';
import { Club, SubscriptionTier, SubscriptionPayment } from '../../types';
import { validateEmail, validateVNPhone, formatCurrencyInput, parseCurrencyString, formatDate } from '../../utils/formatters';
import SubscriptionHistoryModal from './SubscriptionHistoryModal';

interface ClubManagerProps {
  clubs: Club[];
  onAddClub: (club: Partial<Club> & { paymentAmount?: number }) => void;
  onUpdateClub: (id: string, club: Partial<Club> & { paymentAmount?: number }) => void;
  onDeleteClub: (id: string) => void;
  subscriptionPayments: SubscriptionPayment[];
  onAddSubscriptionPayment: (payment: Partial<SubscriptionPayment>) => void;
}

const ClubManager: React.FC<ClubManagerProps> = ({ 
  clubs, onAddClub, onUpdateClub, onDeleteClub, 
  subscriptionPayments, onAddSubscriptionPayment 
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [historyClub, setHistoryClub] = useState<Club | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [form, setForm] = useState({ 
    name: '', 
    username: '', 
    password: '', 
    email: '', 
    hotline: '', 
    address: '',
    status: 'active' as any,
    subscriptionTier: 'FREE' as SubscriptionTier,
    subscriptionStartDate: new Date().toISOString().split('T')[0],
    subscriptionEndDate: '',
    paymentAmount: '0' // Field mới để nhập số tiền khi tạo/sửa
  });

  const handleOpenAdd = () => {
    setEditingClub(null);
    setForm({ 
      name: '', username: '', password: '', email: '', hotline: '', address: '', 
      status: 'active', subscriptionTier: 'FREE',
      subscriptionStartDate: new Date().toISOString().split('T')[0],
      subscriptionEndDate: '',
      paymentAmount: '0'
    });
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
      status: club.status?.toLowerCase() || 'active',
      subscriptionTier: club.subscriptionTier || 'FREE',
      subscriptionStartDate: club.subscriptionStartDate ? club.subscriptionStartDate.split('T')[0] : new Date().toISOString().split('T')[0],
      subscriptionEndDate: club.subscriptionEndDate ? club.subscriptionEndDate.split('T')[0] : '',
      paymentAmount: '0' // Mặc định về 0 khi edit, chỉ nhập nếu có gia hạn/thanh toán mới
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
  
  const handleBlur = (field: string) => {
    if (field === 'hotline' && form.hotline && !validateVNPhone(form.hotline)) {
        setErrors(prev => ({...prev, hotline: 'Hotline không đúng định dạng'}));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const amount = parseCurrencyString(form.paymentAmount);
    const data = { ...form, paymentAmount: amount };

    if (editingClub) {
      const updateData: any = { ...data };
      if (!form.password.trim()) delete updateData.password;
      onUpdateClub(editingClub.id, updateData);
    } else {
      onAddClub({ ...data, role: 'CLUB_ADMIN' as any });
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
          club.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || club.status.toLowerCase() === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clubs, searchTerm, statusFilter]);

  const getTierBadge = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'YEARLY': return <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm">YEARLY</span>;
      case 'MONTHLY': return <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm">MONTHLY</span>;
      default: return <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">FREE</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Quản lý hệ thống cơ sở</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Quản trị các gói thành viên và quyền truy cập</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95 text-sm"
        >
          <i className="fa-solid fa-plus"></i> KHỞI TẠO CƠ SỞ MỚI
        </button>
      </div>

      <div className="bg-white p-3 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text"
            placeholder="Tìm theo tên, tài khoản..."
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

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pl-8 pr-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cơ sở / Gói phí</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài khoản</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời hạn</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                <th className="pl-4 pr-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clubAdmins.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400">Không tìm thấy dữ liệu</td></tr>
              ) : (
                clubAdmins.map((club) => {
                  const isActive = club.status?.toLowerCase() === 'active';
                  return (
                    <tr key={club.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="pl-8 pr-4 py-4">
                        <div className="flex flex-col">
                          <p className={`font-black text-sm tracking-tight ${!isActive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{club.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getTierBadge(club.subscriptionTier)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-600">{club.username}</td>
                      <td className="px-4 py-4">
                        <p className="text-[11px] font-bold text-slate-500">
                          {club.subscriptionEndDate ? formatDate(club.subscriptionEndDate) : 'Vĩnh viễn'}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                           {isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="pl-4 pr-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                             onClick={() => setHistoryClub(club)}
                             className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                             title="Lịch sử gói"
                          >
                             <i className="fa-solid fa-clock-rotate-left text-xs"></i>
                          </button>
                          <button onClick={() => handleOpenEdit(club)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                            <i className="fa-solid fa-pen-to-square text-xs"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-800">{editingClub ? 'Cập nhật cơ sở' : 'Khởi tạo cơ sở'}</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-slate-800 transition-all flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên cơ sở *</label>
                <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.name}</p>}
              </div>
              
              <div className="col-span-2 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-4">
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Gói thành viên & Thời hạn</p>
                    {form.subscriptionTier !== 'FREE' && (
                      <div className="flex items-center gap-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Số tiền thu (VNĐ)</label>
                        <input 
                          type="text" 
                          className="w-32 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-black text-indigo-600 text-right"
                          value={form.paymentAmount}
                          onChange={e => setForm({...form, paymentAmount: formatCurrencyInput(e.target.value)})}
                        />
                      </div>
                    )}
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                    {['FREE', 'MONTHLY', 'YEARLY'].map(t => (
                      <button 
                        key={t}
                        type="button"
                        onClick={() => setForm({...form, subscriptionTier: t as SubscriptionTier, paymentAmount: t === 'FREE' ? '0' : (t === 'MONTHLY' ? '500,000' : '5,000,000')})}
                        className={`py-3 rounded-xl text-xs font-black transition-all border ${form.subscriptionTier === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-indigo-100'}`}
                      >
                        {t === 'FREE' ? 'Dùng thử' : t === 'MONTHLY' ? 'Tháng' : 'Năm'}
                      </button>
                    ))}
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Ngày bắt đầu</label>
                      <input type="date" className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-xs font-bold" value={form.subscriptionStartDate} onChange={e => setForm({...form, subscriptionStartDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Ngày hết hạn</label>
                      <input type="date" className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-xs font-bold" value={form.subscriptionEndDate} onChange={e => setForm({...form, subscriptionEndDate: e.target.value})} />
                    </div>
                 </div>
                 {editingClub && form.subscriptionTier !== editingClub.subscriptionTier && (
                   <p className="text-[9px] text-amber-600 font-bold italic bg-amber-50 p-2 rounded-lg">* Thay đổi gói sẽ tự động ghi nhận một giao dịch thanh toán mới vào lịch sử.</p>
                 )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên đăng nhập *</label>
                <input disabled={!!editingClub} type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold disabled:opacity-50" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                {errors.username && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.username}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mật khẩu mới</label>
                <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.password}</p>}
              </div>
              <div className="col-span-2">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                      <input type="text" className={`w-full px-5 py-4 bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-100'} rounded-2xl font-bold`} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                      {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hotline</label>
                      <input 
                        type="text" 
                        className={`w-full px-5 py-4 bg-slate-50 border ${errors.hotline ? 'border-red-500' : 'border-slate-100'} rounded-2xl font-bold`} 
                        value={form.hotline} 
                        onBlur={() => handleBlur('hotline')}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setForm({...form, hotline: val});
                          if (errors.hotline) setErrors({...errors, hotline: ''});
                        }} 
                      />
                      {errors.hotline && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.hotline}</p>}
                    </div>
                 </div>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Trạng thái hệ thống</label>
                <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã khóa</option>
                </select>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 font-black text-slate-400 text-sm">HUỶ BỎ</button>
              <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all">
                {editingClub ? 'CẬP NHẬT' : 'XÁC NHẬN TẠO'}
              </button>
            </div>
          </form>
        </div>
      )}

      {historyClub && (
        <SubscriptionHistoryModal 
          club={historyClub}
          history={subscriptionPayments.filter(p => p.clubId === historyClub.id)}
          onClose={() => setHistoryClub(null)}
          onUpgrade={onAddSubscriptionPayment}
        />
      )}
    </div>
  );
};

export default ClubManager;
