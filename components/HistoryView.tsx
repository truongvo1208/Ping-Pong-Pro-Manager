
import React, { useState } from 'react';
import { Session, Player, SessionService, Service } from '../types';

interface HistoryViewProps {
  sessions: Session[];
  players: Player[];
  sessionServices: SessionService[];
  services: Service[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ sessions, players, sessionServices, services }) => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const handleShare = async (session: Session) => {
    const player = players.find(p => p.id === session.playerId);
    const text = `Tôi vừa hoàn thành buổi tập bóng bàn tại PingPong Pro! 🏓\nNgười chơi: ${player?.name}\nTổng tiền: ${session.totalAmount.toLocaleString()}đ\n#PingPongPro #TableTennis`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kết quả tập luyện - PingPong Pro',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Đã sao chép nội dung chia sẻ vào bộ nhớ tạm!');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Phiên chơi</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng cộng</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">Chưa có dữ liệu lịch sử.</td>
                </tr>
              ) : (
                sessions.sort((a,b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()).map(s => {
                  const player = players.find(p => p.id === s.playerId);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedSession(s)}
                          className="flex items-center gap-3 text-left hover:opacity-70 transition-opacity"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {player?.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-gray-800 block">{player?.name}</span>
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">Xem chi tiết</span>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>{new Date(s.checkInTime).toLocaleDateString('vi-VN')}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(s.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} 
                            - {s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-blue-600">{s.totalAmount.toLocaleString()}đ</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleShare(s)}
                            className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Chia sẻ mạng xã hội"
                          >
                            <i className="fa-solid fa-share-nodes"></i>
                          </button>
                          <button className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-all">
                            <i className="fa-solid fa-print"></i>
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

      {/* Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-8 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-4 backdrop-blur-md">
                <i className="fa-solid fa-clock-rotate-left text-2xl"></i>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Chi tiết phiên chơi</h3>
              <p className="text-blue-100 text-sm mt-1">Lịch sử giao dịch ngày {new Date(selectedSession.checkInTime).toLocaleDateString('vi-VN')}</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-50">
                <div>
                  <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest block mb-1">Người chơi</span>
                  <span className="text-gray-800 font-black">{players.find(p => p.id === selectedSession.playerId)?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest block mb-1">Thời gian</span>
                  <span className="text-gray-600 font-bold text-sm">
                    {new Date(selectedSession.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - 
                    {selectedSession.checkOutTime && new Date(selectedSession.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Dịch vụ đã sử dụng</p>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {sessionServices
                    .filter(ss => ss.sessionId === selectedSession.id)
                    .map(ss => {
                      const s = services.find(x => x.id === ss.serviceId);
                      return (
                        <div key={ss.id} className="flex justify-between items-center text-sm bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                          <div>
                            <span className="text-gray-800 font-bold block">{s?.name || 'N/A'}</span>
                            <span className="text-[10px] text-gray-400">Số lượng: {ss.quantity} {s?.unit}</span>
                          </div>
                          <span className="font-black text-gray-900">{ss.totalPrice.toLocaleString()}đ</span>
                        </div>
                      );
                    })}
                  
                  {sessionServices.filter(ss => ss.sessionId === selectedSession.id).length === 0 && (
                    <p className="text-gray-400 text-xs italic py-4 text-center">Không có dịch vụ đi kèm</p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t-2 border-dashed border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-black uppercase text-xs tracking-widest">Tổng thanh toán</span>
                  <span className="text-3xl font-black text-blue-600">{selectedSession.totalAmount.toLocaleString()}đ</span>
                </div>
              </div>
            </div>

            <div className="p-8 pt-0">
              <button 
                onClick={() => setSelectedSession(null)}
                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
              >
                ĐÓNG CỬA SỔ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
