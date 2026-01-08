
import React, { useState } from 'react';
import { Player, Session } from '../types';
import { validateVNPhone, removeAccents } from '../utils/formatters';

interface CheckInModalProps {
  players: Player[];
  activeSessions: Session[];
  onClose: () => void;
  onCheckIn: (player: Player) => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ players, activeSessions, onClose, onCheckIn }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activePlayerIds = new Set(activeSessions.map(s => s.playerId));
  
  const filteredPlayers = players.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const searchNoAccent = removeAccents(searchLower);
    
    const nameLower = p.name.toLowerCase();
    const nameNoAccent = removeAccents(nameLower);

    const matchesName = nameLower.includes(searchLower) || nameNoAccent.includes(searchNoAccent);
    const matchesPhone = p.phone && p.phone.includes(searchTerm);

    return (matchesName || matchesPhone) && !activePlayerIds.has(p.id);
  });

  const handleSaveAndCheckIn = () => {
    const newErrors: Record<string, string> = {};
    if (!newName.trim()) newErrors.name = 'Vui lòng nhập tên người chơi';
    
    if (newPhone && !validateVNPhone(newPhone)) {
      newErrors.phone = 'SĐT VN không hợp lệ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const p: any = {
      clubId: '',
      name: newName,
      phone: newPhone,
      createdAt: new Date().toISOString()
    };
    onCheckIn(p);
  };

  const handleBlur = () => {
    if (newPhone && !validateVNPhone(newPhone)) {
       setErrors(prev => ({...prev, phone: 'Số điện thoại không đúng định dạng'}));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800">Check-in người chơi</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-6">
          {!isAddingNew ? (
            <>
              <div className="relative mb-6">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Tìm theo tên hoặc số điện thoại..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 mb-6 scrollbar-hide">
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onCheckIn(p)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50 transition-colors group text-left border border-transparent hover:border-blue-100"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 flex items-center justify-center font-black shadow-sm">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm tracking-tight">{p.name}</p>
                        <p className="text-xs text-slate-400 font-bold">{p.phone || 'Chưa có SĐT'}</p>
                      </div>
                      <i className="fa-solid fa-chevron-right ml-auto text-slate-300 group-hover:text-blue-500 transition-all"></i>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-slate-400 text-xs font-bold mb-4 uppercase tracking-widest">Không tìm thấy người chơi này</p>
                    <button 
                      onClick={() => { setIsAddingNew(true); setErrors({}); }}
                      className="text-blue-600 font-black hover:underline text-sm"
                    >
                      + Thêm người chơi mới
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Họ và tên *</label>
                <input 
                  autoFocus
                  type="text"
                  className={`w-full px-4 py-3 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-100'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold`}
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (errors.name) setErrors({...errors, name: ''});
                  }}
                />
                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số điện thoại</label>
                <input 
                  type="text"
                  placeholder="09xxx..."
                  className={`w-full px-4 py-3 bg-slate-50 border ${errors.phone ? 'border-red-500' : 'border-slate-100'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold`}
                  value={newPhone}
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
                    if (errors.phone) setErrors({...errors, phone: ''});
                  }}
                />
                {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.phone}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setIsAddingNew(false); setErrors({}); }}
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-100 font-black text-slate-400 hover:bg-slate-50 transition-all text-xs"
                >
                  QUAY LẠI
                </button>
                <button 
                  onClick={handleSaveAndCheckIn}
                  className="flex-[2] px-6 py-3 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 text-xs"
                >
                  LƯU & CHECK-IN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;
