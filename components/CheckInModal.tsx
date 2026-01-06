
import React, { useState } from 'react';
import { Player, Session } from '../types';

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

  const activePlayerIds = new Set(activeSessions.map(s => s.playerId));
  
  const filteredPlayers = players.filter(p => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (p.phone && p.phone.includes(searchTerm))) &&
    !activePlayerIds.has(p.id)
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Check-in người chơi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-6">
          {!isAddingNew ? (
            <>
              <div className="relative mb-6">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Tìm theo tên hoặc số điện thoại..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 text-gray-500 group-hover:text-blue-600 flex items-center justify-center font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-700">{p.name}</p>
                        <p className="text-sm text-gray-400">{p.phone || 'Chưa có SĐT'}</p>
                      </div>
                      <i className="fa-solid fa-chevron-right ml-auto text-gray-300 group-hover:text-blue-500 transition-all"></i>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm mb-4">Không tìm thấy người chơi này</p>
                    <button 
                      onClick={() => setIsAddingNew(true)}
                      className="text-blue-600 font-bold hover:underline"
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
                <label className="block text-sm font-semibold text-gray-600 mb-1">Họ và tên *</label>
                <input 
                  autoFocus
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Số điện thoại</label>
                <input 
                  type="tel"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <button 
                  disabled={!newName}
                  onClick={() => {
                    // Fix: Added missing clubId property to satisfy Player type requirement.
                    // App.tsx logic will ensure the correct ID is persisted.
                    const p: Player = {
                      id: `p-${Date.now()}`,
                      clubId: '',
                      name: newName,
                      phone: newPhone,
                      createdAt: new Date().toISOString()
                    };
                    // Simplified: adding player isn't propagated to global state in this mini-component, 
                    // should be handled by parent or a global state.
                    onCheckIn(p);
                  }}
                  className="flex-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  Lưu & Check-in
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