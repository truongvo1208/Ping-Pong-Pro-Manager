
import React, { useState } from 'react';
import { Player, Tournament, Match } from '../types';

interface TournamentManagerProps {
  players: Player[];
  onAddTournament?: (t: Tournament) => void;
}

const TournamentManager: React.FC<TournamentManagerProps> = ({ players }) => {
  const [showAdd, setShowAdd] = useState(false);
  
  // Dữ liệu mẫu giải đấu
  const mockTournaments: Tournament[] = [
    {
      id: 't1',
      clubId: 'c1',
      name: 'Giải bóng bàn Xuân 2024',
      startDate: '2024-03-20',
      status: 'ongoing',
      matches: [
        { id: 'm1', player1Id: players[0]?.id, player2Id: players[1]?.id, score1: 3, score2: 1, winnerId: players[0]?.id, round: 'Bán kết' },
        { id: 'm2', player1Id: players[2]?.id, player2Id: 'p-guest', score1: 0, score2: 0, round: 'Chung kết' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800">Giải đấu nội bộ</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Giao lưu và nâng cao trình độ</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <i className="fa-solid fa-trophy"></i> TẠO GIẢI MỚI
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockTournaments.map(t => (
          <div key={t.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden relative group hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
               <i className="fa-solid fa-trophy text-8xl text-indigo-600"></i>
            </div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${t.status === 'ongoing' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                   {t.status === 'ongoing' ? 'Đang diễn ra' : 'Sắp tới'}
                </span>
                <h4 className="text-2xl font-black text-slate-800 mt-2">{t.name}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Khởi tranh: {new Date(t.startDate).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Lịch thi đấu / Kết quả</p>
              {t.matches.map(m => {
                const p1 = players.find(p => p.id === m.player1Id);
                const p2 = players.find(p => p.id === m.player2Id);
                return (
                  <div key={m.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`font-bold text-sm ${m.winnerId === m.player1Id ? 'text-indigo-600' : 'text-slate-600'}`}>
                        {p1?.name || 'VĐV A'}
                      </span>
                      <div className="bg-white px-3 py-1 rounded-lg shadow-sm font-black text-lg border border-slate-200">
                        {m.score1} : {m.score2}
                      </div>
                      <span className={`font-bold text-sm ${m.winnerId === m.player2Id ? 'text-indigo-600' : 'text-slate-600'}`}>
                        {p2?.name || 'VĐV B'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button className="w-full mt-6 py-3 bg-slate-900 text-white font-black rounded-xl text-xs tracking-widest hover:bg-black transition-all">
               XEM CHI TIẾT BẢNG ĐẤU
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-300 text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl mx-auto flex items-center justify-center mb-6 text-3xl">
              <i className="fa-solid fa-medal"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Tạo giải đấu nội bộ</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">Tính năng tự động bốc thăm và quản lý bảng đấu đang được hoàn thiện. Liên hệ Admin hệ thống để kích hoạt bản dùng thử.</p>
            <button 
              onClick={() => setShowAdd(false)}
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
            >
              ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentManager;
