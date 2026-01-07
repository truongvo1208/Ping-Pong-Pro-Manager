
import React, { useState, useMemo } from 'react';
import { Player, MembershipPayment, Club, Session } from '../types';
import { validateVNPhone, formatCurrencyInput, parseCurrencyString } from '../utils/formatters';

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

const PlayerManager: React.FC<PlayerManagerProps> = ({ 
  players, membershipPayments, sessions, onAddPlayer, onUpdatePlayer, onAddMembershipPayment,
  readOnly = false, clubs = []
}) => {
  const [search, setSearch] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [showAdd, setShowAdd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showMembershipModal, setShowMembershipModal] = useState<Player | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', note: '' });

  const [mForm, setMForm] = useState({
    amount: '500,000',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  const playerLatestMembershipDates = useMemo(() => {
    const map: Record<string, string> = {};
    membershipPayments.forEach(m => {
      if (!map[m.playerId] || new Date(m.endDate) > new Date(map[m.playerId])) {
        map[m.playerId] = m.endDate;
      }
    });
    return map;
  }, [membershipPayments]);

  // Tính toán tổng số lần đến chơi của mỗi người chơi
  const visitCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach(s => {
      map[s.playerId] = (map[s.playerId] || 0) + 1;
    });
    return map;
  }, [sessions]);

  const filteredAndSorted = useMemo(() => {
    return players.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search);
      const matchesClub = selectedClubId === 'all' || p.clubId === selectedClubId;
      return matchesSearch && matchesClub;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [players, search, selectedClubId]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage]);

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setForm({ name: '', phone: '', note: '' });
    setErrors({});
    setShowAdd(true);
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setForm({ name: player.name, phone: player.phone || '', note: player.note || '' });
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
      onUpdatePlayer({ ...editingPlayer, name: form.name, phone: form.phone, note: form.note });
    } else {
      onAddPlayer({ id: `p-${Date.now()}`, clubId: '', ...form, createdAt: new Date().toISOString() });
    }
    setShowAdd(false);
  };

  const handleMembershipSubmit = () => {
    if (!showMembershipModal) return;
    const rawAmount = parseCurrencyString(mForm.amount);
    if (rawAmount <= 0) return alert("Số tiền phải lớn hơn 0");
    onAddMembershipPayment({
      id: `mp-${Date.now()}`,
      clubId: '', 
      playerId: showMembershipModal.id,
      amount: rawAmount,
      paymentDate: new Date().toISOString(),
      startDate: mForm.startDate,
      endDate: mForm.endDate
    });
    setShowMembershipModal(null);
  };

  const getMembershipStatus = (p: Player) => {
    const endDateStr = playerLatestMembershipDates[p.id] || p.membershipEndDate;
    if (!endDateStr) return { label: 'Vãng lai', class: 'bg-gray-100 text-gray-500', date: null };
    const end = new Date(endDateStr);
    return end < new Date() 
      ? { label: 'Hết hạn', class: 'bg-red-100 text-red-600', date: endDateStr }
      : { label: 'Hội viên', class: 'bg-green-100 text-green-700', date: endDateStr };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-[2] w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text"
            placeholder="Tìm kiếm người chơi..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        
        {readOnly && clubs.length > 0 && (
          <div className="relative flex-1 w-full">
            <select
              value={selectedClubId}
              onChange={(e) => { setSelectedClubId(e.target.value); setCurrentPage(1); }}
              className="w-full pl-4 pr-10 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả Cơ sở</option>
              {clubs.filter(c => c.role === 'CLUB_ADMIN').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none"></i>
          </div>
        )}

        {!readOnly && (
          <button 
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 w-full md:w-auto transition-all shadow-lg shadow-blue-600/20 active:scale-95 whitespace-nowrap"
          >
            <i className="fa-solid fa-user-plus"></i>
            Thêm thành viên
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Thành viên</th>
                {readOnly && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Cơ sở</th>}
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Hội viên</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Tổng lượt chơi</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">SĐT</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày hết hạn</th>
                {!readOnly && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPlayers.length === 0 ? (
                <tr><td colSpan={readOnly ? 7 : 6} className="py-10 text-center text-gray-400">Không tìm thấy dữ liệu</td></tr>
              ) : (
                paginatedPlayers.map(p => {
                  const status = getMembershipStatus(p);
                  const club = clubs.find(c => c.id === p.clubId);
                  const totalVisits = visitCountMap[p.id] || 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-800">{p.name}</span>
                        </div>
                      </td>
                      {readOnly && (
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 uppercase">
                            {club?.name || 'N/A'}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-600 font-black text-xs border border-slate-100">
                          {totalVisits}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{p.phone || '-'}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {status.date ? new Date(status.date).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      {!readOnly && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleOpenEdit(p)} className="p-2 text-gray-400 hover:text-blue-600"><i className="fa-solid fa-pen-to-square"></i></button>
                            {status.label !== 'Hội viên' && <button onClick={() => setShowMembershipModal(p)} className="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg font-bold">Gia hạn</button>}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 bg-slate-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} của {filteredAndSorted.length} thành viên
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-slate-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-gray-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {i + 1}
                </button>
              )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-slate-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {showMembershipModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Gia hạn hội viên</h3>
                <p className="text-xs text-gray-400">{showMembershipModal.name}</p>
              </div>
              <button onClick={() => setShowMembershipModal(null)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-semibold text-gray-600 mb-1">Số tiền đóng</label><input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-amber-600" value={mForm.amount} onChange={e => setMForm({...mForm, amount: formatCurrencyInput(e.target.value)})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Từ ngày</label><input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={mForm.startDate} onChange={e => setMForm({...mForm, startDate: e.target.value})} /></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Đến ngày</label><input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={mForm.endDate} onChange={e => setMForm({...mForm, endDate: e.target.value})} /></div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowMembershipModal(null)} className="flex-1 py-3 font-bold text-gray-500">Hủy</button>
              <button onClick={handleMembershipSubmit} className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl active:scale-95 transition-all">Thanh toán</button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">{editingPlayer ? 'Cập nhật thành viên' : 'Thành viên mới'}</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-semibold text-gray-600 mb-1">Tên người chơi *</label><input autoFocus type="text" className={`w-full px-4 py-3 bg-gray-50 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none`} value={form.name} onChange={e => { setForm({...form, name: e.target.value}); setErrors({...errors, name: ''}); }} /></div>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1">Số điện thoại</label><input type="text" placeholder="09xxx..." className={`w-full px-4 py-3 bg-gray-50 border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none`} value={form.phone} onChange={e => { setForm({...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10)}); setErrors({...errors, phone: ''}); }} /></div>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1">Ghi chú</label><textarea rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none" value={form.note} onChange={e => setForm({...form, note: e.target.value})} /></div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-500">Hủy</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95">{editingPlayer ? 'Lưu thay đổi' : 'Tạo thành viên'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PlayerManager;
