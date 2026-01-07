
import React, { useState, useMemo } from 'react';
import { Player, Service, Session, SessionStatus, SessionService } from '../types';
import CheckInModal from './CheckInModal';
import SessionCard from './SessionCard';

interface DashboardProps {
  players: Player[];
  services: Service[];
  sessions: Session[];
  sessionServices: SessionService[];
  onAddPlayer: (p: Player) => void;
  onAddSession: (s: Session) => void;
  // Updated signature to match (Session, number) as expected by App.tsx handleCheckOut
  onUpdateSession: (s: Session, total: number) => void;
  onAddSessionService: (ss: SessionService) => void;
  onRemoveSessionService: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  players, services, sessions, sessionServices, 
  onAddPlayer, onAddSession, onUpdateSession, onAddSessionService, onRemoveSessionService
}) => {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<{session: Session, total: number} | null>(null);

  const playingSessions = sessions.filter(s => s.status === SessionStatus.PLAYING);
  const todayFinishedSessions = sessions.filter(s => 
    s.status === SessionStatus.FINISHED && 
    new Date(s.checkInTime).toDateString() === new Date().toDateString()
  );

  const stats = useMemo(() => {
    const revenue = sessions
      .filter(s => 
        s.status === SessionStatus.FINISHED && 
        new Date(s.checkInTime).toDateString() === new Date().toDateString()
      )
      .reduce((sum, s) => sum + s.totalAmount, 0);
    return {
      activePlayers: playingSessions.length,
      todayRevenue: revenue,
      totalToday: playingSessions.length + todayFinishedSessions.length
    };
  }, [sessions, playingSessions.length, todayFinishedSessions.length]);

  const handleFinalCheckOut = () => {
    if (!pendingCheckout) return;
    
    // Correctly passing both session and total as required by onUpdateSession
    onUpdateSession(pendingCheckout.session, pendingCheckout.total);
    setPendingCheckout(null);
    setSelectedSessionId(null);
  };

  const selectedSession = playingSessions.find(s => s.id === selectedSessionId);
  const selectedPlayer = selectedSession ? players.find(p => p.id === selectedSession.playerId) : null;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 text-lg md:text-xl">
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Đang chơi</p>
            <p className="text-xl md:text-2xl font-bold">{stats.activePlayers} người</p>
          </div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-lg md:text-xl">
            <i className="fa-solid fa-money-bill-trend-up"></i>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Doanh thu hôm nay</p>
            <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.todayRevenue.toLocaleString()} đ</p>
          </div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 text-lg md:text-xl">
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Lượt chơi hôm nay</p>
            <p className="text-xl md:text-2xl font-bold">{stats.totalToday} lượt</p>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Đang hoạt động</h2>
        <button 
          onClick={() => setShowCheckIn(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all w-full sm:w-auto"
        >
          <i className="fa-solid fa-plus"></i>
          Check-in mới
        </button>
      </div>

      {/* Sessions List (Condensed) */}
      {playingSessions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-8 md:p-12 text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            <i className="fa-solid fa-user-clock text-2xl md:text-3xl"></i>
          </div>
          <h3 className="text-base md:text-lg font-medium text-gray-700 mb-1">Chưa có người chơi nào</h3>
          <p className="text-xs md:text-sm text-gray-400">Bấm "Check-in mới" để bắt đầu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Người chơi</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Thời gian vào</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tạm tính</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {playingSessions.map(session => {
                  const player = players.find(p => p.id === session.playerId);
                  const sServices = sessionServices.filter(ss => ss.sessionId === session.id);
                  const currentTotal = sServices.reduce((sum, ss) => sum + ss.totalAmount, 0);
                  const isMember = player?.membershipEndDate && new Date(player.membershipEndDate) >= new Date();

                  return (
                    <tr key={session.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedSessionId(session.id)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${isMember ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {player?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800">{player?.name}</span>
                              {isMember && (
                                <span className="bg-amber-500 text-white text-[8px] px-1 py-0.5 rounded-md font-black uppercase">Member</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{player?.phone || 'Khách vãng lai'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-600">{new Date(session.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px] text-gray-400 font-mono">Bắt đầu lúc {new Date(session.checkInTime).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-gray-900">{currentTotal.toLocaleString()}đ</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Session Detail Modal - FIXED CLOSE BUTTON AND UX */}
      {selectedSession && selectedPlayer && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedSessionId(null)}
        >
          <div 
            className="w-full max-w-xl animate-in zoom-in duration-200 relative"
            onClick={e => e.stopPropagation()} // Ngăn chặn click bên trong modal làm đóng modal
          >
            {/* Improved Floating Close Button */}
            <button 
              onClick={() => setSelectedSessionId(null)}
              className="absolute -top-2 -right-2 lg:-top-4 lg:-right-4 z-[90] w-10 h-10 bg-white text-gray-800 rounded-full flex items-center justify-center shadow-2xl hover:bg-gray-100 transition-all border border-gray-100 active:scale-90"
              title="Đóng cửa sổ"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            
            <SessionCard 
              session={selectedSession}
              player={selectedPlayer}
              services={services}
              sessionServices={sessionServices.filter(ss => ss.sessionId === selectedSession.id)}
              onUpdateSession={onUpdateSession}
              onAddService={onAddSessionService}
              onRemoveService={onRemoveSessionService}
              onCheckOutRequest={(sess, total) => setPendingCheckout({session: sess, total})}
            />

            {/* Thêm một nút đóng phụ ở dưới cùng trên Mobile để dễ thao tác */}
            <div className="mt-4 lg:hidden">
              <button 
                onClick={() => setSelectedSessionId(null)}
                className="w-full py-3 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-chevron-down"></i>
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {pendingCheckout && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md my-auto rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-slate-900 p-6 md:p-8 text-center text-white relative">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-blue-600/20">
                <i className="fa-solid fa-receipt text-xl md:text-2xl"></i>
              </div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Hóa đơn</h3>
              <p className="text-slate-400 text-xs mt-1">Cám ơn quý khách đã sử dụng dịch vụ</p>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">Khách hàng</span>
                <span className="text-gray-800 font-black truncate max-w-[150px]">{players.find(p => p.id === pendingCheckout.session.playerId)?.name}</span>
              </div>

              <div className="space-y-3">
                <p className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">Chi tiết sử dụng</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {sessionServices
                    .filter(ss => ss.sessionId === pendingCheckout.session.id)
                    .map(ss => {
                      const s = services.find(x => x.id === ss.serviceId);
                      return (
                        <div key={ss.id} className="flex justify-between items-center text-xs md:text-sm">
                          <span className="text-gray-600 truncate mr-2">{s?.name} x{ss.quantity}</span>
                          <span className="font-bold text-gray-800 shrink-0">{ss.totalAmount.toLocaleString()}đ</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="pt-6 border-t-2 border-dashed border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 font-bold">Tổng cộng</span>
                  <span className="text-2xl md:text-3xl font-black text-blue-600">{pendingCheckout.total.toLocaleString()}đ</span>
                </div>
                <p className="text-[9px] md:text-[10px] text-gray-400 text-right italic font-medium">Giá đã bao gồm tất cả phụ phí và tiền sân</p>
              </div>
            </div>

            <div className="p-6 md:p-8 pt-0 flex gap-3">
              <button 
                onClick={() => setPendingCheckout(null)}
                className="flex-1 py-3 md:py-4 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all text-sm"
              >
                HỦY
              </button>
              <button 
                onClick={handleFinalCheckOut}
                className="flex-[2] py-3 md:py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 text-sm"
              >
                THU TIỀN
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckIn && (
        <CheckInModal 
          players={players}
          activeSessions={playingSessions}
          onClose={() => setShowCheckIn(false)}
          onCheckIn={(player) => {
            if (!players.find(p => p.id === player.id)) {
              onAddPlayer(player);
            }
            const newSession: Session = {
              id: `sess-${Date.now()}`,
              clubId: '',
              playerId: player.id,
              checkInTime: new Date().toISOString(),
              status: SessionStatus.PLAYING,
              totalAmount: 0
            };
            onAddSession(newSession);
            setShowCheckIn(false);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
