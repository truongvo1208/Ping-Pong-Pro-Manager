
import React, { useState, useMemo } from 'react';
import { Player, MembershipPayment, Club, Session } from '../types';
import { validateVNPhone, formatCurrencyInput, parseCurrencyString, removeAccents, formatDate } from '../utils/formatters';

interface PlayerManagerProps {
  players: Player[];
  membershipPayments: MembershipPayment[];
  sessions: Session[];
  onAddPlayer: (p: Player) => void;
  onUpdatePlayer: (p: Player) => void;
  onAddMembershipPayment: (p: MembershipPayment) => void;
  readOnly?: boolean;
  clubs?: Club[];
}

type MembershipFilterType = 'all' | 'member' | 'guest' | 'expired';

const SKILL_LEVELS = [
  'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-',
  'E+', 'E', 'E-', 'F+', 'F', 'F-', 'G+', 'G', 'G-', 'H+', 'H', 'H-'
];

const PlayerManager: React.FC<PlayerManagerProps> = ({ 
  players, membershipPayments, sessions, onAddPlayer, onUpdatePlayer, onAddMembershipPayment,
  readOnly = false, clubs = []
}) => {
  const [search, setSearch] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState<MembershipFilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [showAdd, setShowAdd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showMembershipModal, setShowMembershipModal] = useState<Player | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', note: '', points: 0, skillLevel: 'D' });

  const [mForm, setMForm] = useState({
    amount: '500,000',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  const isSuperAdmin = clubs.length > 0;

  const playerLatestMembershipDates = useMemo(() => {
    const map: Record<string, string> = {};
    membershipPayments.forEach(m => {
      if (!map[m.playerId] || new Date(m.endDate) > new Date(map[m.playerId])) {
        map[m.playerId] = m.endDate;
      }
    });
    return map;
  }, [membershipPayments]);

  const visitCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach(s => {
      map[s.playerId] = (map[s.playerId] || 0) + 1;
    });
    return map;
  }, [sessions]);

  const getMembershipStatus = (p: Player) => {
    const endDateStr = playerLatestMembershipDates[p.id] || p.membershipEndDate;
    if (!endDateStr) return { type: 'guest' as const, label: 'Vãng lai', class: 'bg-gray-100 text-gray-500', date: null };
    const end = new Date(endDateStr);
    const now = new Date();
    return end < now 
      ? { type: 'expired' as const, label: 'Hết hạn', class: 'bg-red-100 text-red-600', date: endDateStr }
      : { type: 'member' as const, label: 'Hội viên', class: 'bg-green-100 text-green-700', date: endDateStr };
  };

  const getSkillBadgeClass = (skill?: string) => {
    if (!skill) return 'bg-gray-50 text-gray-400';
    const firstChar = skill.charAt(0);
    switch (firstChar) {
      case 'A': return 'bg-red-100 text-red-700 border-red-200';
      case 'B': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'C': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'D': return 'bg-green-100 text-green-700 border-green-200';
      case 'E': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'F': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredAndSorted = useMemo(() => {
    const searchLower = search.toLowerCase();
    const searchNoAccent = removeAccents(searchLower);

    return players.filter(p => {
      const nameLower = p.name.toLowerCase();
      const nameNoAccent = removeAccents(nameLower);

      const matchesSearch = nameLower.includes(searchLower) || 
                           nameNoAccent.includes(searchNoAccent) || 
                           (p.phone && p.phone.includes(search));
                           
      const matchesClub = selectedClubId === 'all' || p.clubId === selectedClubId;
      
      const status = getMembershipStatus(p);
      const matchesMembership = membershipFilter === 'all' || status.type === membershipFilter;

      return matchesSearch && matchesClub && matchesMembership;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [players, search, selectedClubId, membershipFilter, playerLatestMembershipDates]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage]);

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setForm({ name: '', phone: '', note: '', points: 0, skillLevel: 'D' });
    setErrors({});
    setShowAdd(true);
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setForm({ 
      name: player.name, 
      phone: player.phone || '', 
      note: player.note || '',
      points: player.points || 0,
      skillLevel: player.skillLevel || 'D'
    });
    setErrors({});
    setShowAdd(true);
  };

  const validatePlayer = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Vui lòng nhập họ tên';
    if (form.phone && !validateVNPhone(form.phone)) {
      newErrors.phone = 'Số điện thoại VN không hợp lệ';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePlayer()) return;
    if (editingPlayer) {
      onUpdatePlayer({ ...editingPlayer, ...form });
    } else {
      onAddPlayer({ clubId: '', ...form, createdAt: new Date().toISOString() } as any);
    }
    setShowAdd(false);
  };
  
  const handleBlur = (field: string) => {
    if (field === 'phone' && form.phone && !validateVNPhone(form.phone)) {
       setErrors(prev => ({...prev, phone: 'Số điện thoại không đúng định dạng'}));
    }
  };

  const handleMembershipSubmit = () => {
    if (!showMembershipModal) return;
    const rawAmount = parseCurrencyString(mForm.amount);
    if (rawAmount <= 0) return alert("Số tiền phải lớn hơn 0");
    onAddMembershipPayment({
      id: '',
      clubId: '', 
      playerId: showMembershipModal.id,
      amount: rawAmount,
      paymentDate: new Date().toISOString(),
      startDate: mForm.startDate,
      endDate: mForm.endDate
    });
    setShowMembershipModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800">Quản lý người chơi</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Danh sách hội viên và khách vãng lai</p>
        </div>
        {!readOnly && (
          <button 
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <i className="fa-solid fa-plus-circle"></i> THÊM NGƯỜI CHƠI
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        {isSuperAdmin && (
          <div className="w-full md:w-1/3 relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                <i className="fa-solid fa-filter"></i>
             </div>
             <select
              value={selectedClubId}
              onChange={(e) => { setSelectedClubId(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm text-slate-600"
            >
              <option value="all">Tất cả Cơ sở</option>
              {clubs.filter(c => c.role === 'CLUB_ADMIN').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="relative flex-1 w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text"
            placeholder="Tìm theo tên hoặc số điện thoại..."
            className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex bg-slate-50 rounded-2xl p-1 gap-1 w-full md:w-auto overflow-x-auto scrollbar-hide">
          {(['all', 'member', 'guest', 'expired'] as const).map(type => (
            <button
              key={type}
              onClick={() => setMembershipFilter(type)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                membershipFilter === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
              }`}
            >
              {type === 'all' ? 'Tất cả' : type === 'member' ? 'Hội viên' : type === 'guest' ? 'Khách' : 'Hết hạn'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người chơi</th>
                {isSuperAdmin && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cơ sở đăng ký</th>}
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trình độ</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lượt ghé</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedPlayers.map(p => {
                const status = getMembershipStatus(p);
                const clubName = isSuperAdmin ? (clubs.find(c => c.id === p.clubId)?.name || 'N/A') : null;
                
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black shadow-sm shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm tracking-tight">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{p.phone || 'Chưa có SĐT'}</p>
                        </div>
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-tighter truncate max-w-[150px] block">
                          {clubName}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                       <span className={`inline-block px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter ${getSkillBadgeClass(p.skillLevel)}`}>
                         {p.skillLevel || 'N/A'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter w-fit ${status.class}`}>
                          {status.label}
                        </span>
                        {status.date && (
                          <span className="text-[9px] text-slate-400 mt-1 font-bold italic">Hết hạn: {formatDate(status.date)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="font-black text-slate-400 text-sm">{(visitCountMap[p.id] || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowMembershipModal(p)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Gia hạn hội viên">
                          <i className="fa-solid fa-calendar-check text-xs"></i>
                        </button>
                        <button onClick={() => handleOpenEdit(p)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Sửa thông tin">
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-50 flex items-center justify-between">
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Trang {currentPage} / {totalPages}</p>
             <div className="flex gap-1">
               <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 disabled:opacity-30"><i className="fa-solid fa-chevron-left"></i></button>
               <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 disabled:opacity-30"><i className="fa-solid fa-chevron-right"></i></button>
             </div>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-xl font-black text-slate-800">{editingPlayer ? 'Cập nhật thông tin' : 'Thêm người chơi mới'}</h3>
               <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-800 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="p-8 space-y-5">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Họ tên *</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.name}</p>}
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Số điện thoại</label>
                    <input 
                      type="text" 
                      className={`w-full px-5 py-4 bg-slate-50 border ${errors.phone ? 'border-red-500' : 'border-slate-100'} rounded-2xl font-bold`} 
                      value={form.phone} 
                      onBlur={() => handleBlur('phone')}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setForm({...form, phone: val});
                        if (errors.phone) setErrors({...errors, phone: ''});
                      }} 
                    />
                    {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Trình độ</label>
                    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={form.skillLevel} onChange={e => setForm({...form, skillLevel: e.target.value})}>
                       {SKILL_LEVELS.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                    </select>
                  </div>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ghi chú</label>
                  <textarea className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium" rows={2} value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
               </div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-3">
               <button onClick={() => setShowAdd(false)} className="flex-1 font-black text-slate-400 text-sm">HỦY BỎ</button>
               <button onClick={handleSubmit} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">LƯU THÔNG TIN</button>
            </div>
          </div>
        </div>
      )}

      {showMembershipModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-emerald-50/50">
                <h3 className="text-xl font-black text-emerald-800">Gia hạn Hội viên</h3>
                <button onClick={() => setShowMembershipModal(null)} className="text-emerald-400 hover:text-emerald-800"><i className="fa-solid fa-xmark text-xl"></i></button>
             </div>
             <div className="p-8 space-y-5">
                <p className="text-sm font-bold text-slate-600 text-center mb-4">Gia hạn cho người chơi: <span className="text-emerald-600">{showMembershipModal.name}</span></p>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Số tiền thanh toán</label>
                   <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-emerald-600 text-right" value={mForm.amount} onChange={e => setMForm({...mForm, amount: formatCurrencyInput(e.target.value)})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ngày bắt đầu</label>
                      <input type="date" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" value={mForm.startDate} onChange={e => setMForm({...mForm, startDate: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ngày kết thúc</label>
                      <input type="date" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" value={mForm.endDate} onChange={e => setMForm({...mForm, endDate: e.target.value})} />
                   </div>
                </div>
             </div>
             <div className="p-8 bg-slate-50 flex gap-3">
                <button onClick={() => setShowMembershipModal(null)} className="flex-1 font-black text-slate-400 text-sm">BỎ QUA</button>
                <button onClick={handleMembershipSubmit} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">XÁC NHẬN GIA HẠN</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerManager;
