
import React, { useState } from 'react';
import { Player, MembershipPayment } from '../types';

interface PlayerManagerProps {
  players: Player[];
  onAddPlayer: (p: Player) => void;
  onUpdatePlayer: (p: Player) => void;
  onAddMembershipPayment: (p: MembershipPayment) => void;
  // Added readOnly property to match usage in App.tsx line 143
  readOnly?: boolean;
}

const PlayerManager: React.FC<PlayerManagerProps> = ({ 
  players, onAddPlayer, onUpdatePlayer, onAddMembershipPayment,
  // Added readOnly to destructuring with default false
  readOnly = false 
}) => {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showMembershipModal, setShowMembershipModal] = useState<Player | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', note: '' });

  // Membership Form state
  const [mForm, setMForm] = useState({
    amount: 500000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  const filtered = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.phone?.includes(search)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setForm({ name: '', phone: '', note: '' });
    setShowAdd(true);
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setForm({ 
      name: player.name, 
      phone: player.phone || '', 
      note: player.note || '' 
    });
    setShowAdd(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    if (editingPlayer) {
      onUpdatePlayer({
        ...editingPlayer,
        name: form.name,
        phone: form.phone,
        note: form.note
      });
    } else {
      onAddPlayer({
        id: `p-${Date.now()}`,
        clubId: '', // Handled by App.tsx
        ...form,
        createdAt: new Date().toISOString()
      });
    }
    
    setForm({ name: '', phone: '', note: '' });
    setShowAdd(false);
    setEditingPlayer(null);
  };

  const handleMembershipSubmit = () => {
    if (!showMembershipModal) return;
    const payment: MembershipPayment = {
      id: `mp-${Date.now()}`,
      clubId: '', // Set in App.tsx
      playerId: showMembershipModal.id,
      amount: mForm.amount,
      paymentDate: new Date().toISOString(),
      startDate: mForm.startDate,
      endDate: mForm.endDate
    };
    onAddMembershipPayment(payment);
    setShowMembershipModal(null);
  };

  const getMembershipStatus = (p: Player) => {
    if (!p.membershipEndDate) return { label: 'Vãng lai', class: 'bg-gray-100 text-gray-500' };
    const end = new Date(p.membershipEndDate);
    const now = new Date();
    if (end < now) return { label: 'Hết hạn', class: 'bg-red-100 text-red-600' };
    return { label: 'Hội viên', class: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text"
            placeholder="Tìm kiếm người chơi..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Only show Add button if not in readOnly mode */}
        {!readOnly && (
          <button 
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 w-full md:w-auto transition-all shadow-lg shadow-blue-600/20"
          >
            <i className="fa-solid fa-user-plus"></i>
            Thêm thành viên mới
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Thành viên</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Hội viên</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">SĐT</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày hết hạn</th>
                {/* Conditionally render Action column header */}
                {!readOnly && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => {
                const status = getMembershipStatus(p);
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
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{p.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {p.membershipEndDate ? new Date(p.membershipEndDate).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    {/* Conditionally render Action column cells */}
                    {!readOnly && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Sửa thông tin"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onClick={() => setShowMembershipModal(p)}
                            className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-bold transition-colors"
                          >
                            Gia hạn tháng
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Membership Payment Modal */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Đăng ký hội viên tháng</h3>
                <p className="text-xs text-gray-400">Người chơi: {showMembershipModal.name}</p>
              </div>
              <button onClick={() => setShowMembershipModal(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Số tiền đóng *</label>
                <input 
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-amber-600"
                  value={mForm.amount}
                  onChange={e => setMForm({...mForm, amount: Number(e.target.value)})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Từ ngày</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    value={mForm.startDate}
                    onChange={e => setMForm({...mForm, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Đến ngày</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    value={mForm.endDate}
                    onChange={e => setMForm({...mForm, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowMembershipModal(null)} className="flex-1 py-3 font-bold text-gray-500">Hủy</button>
              <button 
                onClick={handleMembershipSubmit}
                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20"
              >
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingPlayer ? 'Cập nhật thành viên' : 'Thành viên mới'}
              </h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Tên người chơi *</label>
                <input 
                  autoFocus
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Số điện thoại</label>
                <input 
                  type="tel"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Ghi chú</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={form.note}
                  onChange={e => setForm({...form, note: e.target.value})}
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-white"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                {editingPlayer ? 'Lưu thay đổi' : 'Tạo thành viên'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PlayerManager;
