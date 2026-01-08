
import React, { useState, useMemo } from 'react';
import { Player, Session, Service, SessionService, SessionStatus } from '../types';
import SessionCard from './SessionCard';
import CheckInModal from './CheckInModal';
import { getSmartInsight } from '../services/geminiService';

interface DashboardProps {
  players: Player[];
  services: Service[];
  sessions: Session[];
  sessionServices: SessionService[];
  role?: string; // Added role prop
  onAddPlayer: (p: Partial<Player>) => void;
  onAddSession: (s: Partial<Session>) => void;
  onUpdateSession: (s: Session, total: number) => void;
  onAddSessionService: (ss: Partial<SessionService>) => void;
  onUpdateSessionService: (ss: SessionService) => void;
  onRemoveSessionService: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  players, services, sessions, sessionServices, role,
  onAddPlayer, onAddSession, onUpdateSession, 
  onAddSessionService, onUpdateSessionService, onRemoveSessionService 
}) => {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // AI Insight State
  const [aiInsight, setAiInsight] = useState<{insight: string; advice: string} | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isSuperAdmin = role === 'SUPER_ADMIN';

  const playingSessions = useMemo(() => sessions.filter(s => s.status === SessionStatus.PLAYING), [sessions]);
  
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const finishedToday = sessions.filter(s => s.status === SessionStatus.FINISHED && new Date(s.checkOutTime || '').toDateString() === today);
    const revenueToday = finishedToday.reduce((sum, s) => sum + s.totalAmount, 0);
    return { revenue: revenueToday, activeCount: playingSessions.length, finishedCount: finishedToday.length };
  }, [sessions, playingSessions]);

  const selectedSession = useMemo(() => 
    playingSessions.find(s => s.id === selectedSessionId), 
  [playingSessions, selectedSessionId]);

  const selectedPlayer = useMemo(() => 
    selectedSession ? players.find(p => p.id === selectedSession.playerId) : null,
  [selectedSession, players]);

  const selectedSS = useMemo(() => 
    selectedSession ? sessionServices.filter(ss => ss.sessionId === selectedSession.id) : [],
  [selectedSession, sessionServices]);

  const handleGetAiInsight = async () => {
    setIsAiLoading(true);
    try {
      const result = await getSmartInsight(stats);
      setAiInsight(result);
    } catch (error) {
      console.error(error);
      alert("Không thể kết nối với trợ lý AI lúc này.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper component for elapsed time in list
  const ElapsedTimer: React.FC<{ startTime: string }> = ({ startTime }) => {
    const [elapsed, setElapsed] = useState('');
    
    React.useEffect(() => {
      const update = () => {
        const diff = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        setElapsed(`${h > 0 ? h + 'h ' : ''}${m}m`);
      };
      update();
      const timer = setInterval(update, 60000);
      return () => clearInterval(timer);
    }, [startTime]);

    return <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{elapsed}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Chỉ số vận hành nhanh */}
      <div className="flex items-center justify-between">
         <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{isSuperAdmin ? 'Tổng quan Hệ thống' : 'Tổng quan hôm nay'}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Số liệu kinh doanh thời gian thực</p>
         </div>
         <button 
           onClick={handleGetAiInsight}
           disabled={isAiLoading}
           className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform flex items-center gap-2"
         >
           {isAiLoading ? (
             <i className="fa-solid fa-spinner animate-spin"></i>
           ) : (
             <i className="fa-solid fa-wand-magic-sparkles"></i>
           )}
           {isAiLoading ? 'ĐANG PHÂN TÍCH...' : 'PHÂN TÍCH AI'}
         </button>
      </div>

      {/* AI Insight Card */}
      {aiInsight && (
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm animate-in slide-in-from-top-4 fade-in duration-500">
           <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl text-indigo-600 shadow-sm shrink-0">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div className="flex-1">
                 <h4 className="font-black text-indigo-900 text-lg mb-1">Trợ lý Quản lý thông minh</h4>
                 <div className="space-y-3 mt-3">
                    <div className="bg-white/60 p-4 rounded-2xl border border-indigo-100/50">
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">NHẬN XÉT</p>
                       <p className="text-indigo-900 font-medium text-sm leading-relaxed">{aiInsight.insight}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">LỜI KHUYÊN</p>
                       <p className="text-slate-800 font-bold text-sm leading-relaxed"><i className="fa-solid fa-check-circle text-emerald-500 mr-2"></i>{aiInsight.advice}</p>
                    </div>
                 </div>
              </div>
              <button onClick={() => setAiInsight(null)} className="text-indigo-300 hover:text-indigo-500"><i className="fa-solid fa-xmark"></i></button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-5">
           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
             <i className="fa-solid fa-sack-dollar"></i>
           </div>
           <div>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{isSuperAdmin ? 'Tổng doanh thu (Realtime)' : 'Doanh thu hôm nay'}</p>
             <h3 className="text-2xl font-black text-gray-800">{stats.revenue.toLocaleString()}đ</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-5">
           <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
             <i className="fa-solid fa-user-clock"></i>
           </div>
           <div>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{isSuperAdmin ? 'Tổng khách đang chơi' : 'Số người đang chơi'}</p>
             <h3 className="text-2xl font-black text-indigo-600">{stats.activeCount} người</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-5">
           <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
             <i className="fa-solid fa-circle-check"></i>
           </div>
           <div>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{isSuperAdmin ? 'Tổng lượt chơi hôm nay' : 'Số lượt người đã chơi hôm nay'}</p>
             <h3 className="text-2xl font-black text-emerald-600">{stats.finishedCount} lượt</h3>
           </div>
        </div>
      </div>

      {/* VẬN HÀNH LƯỢT CHƠI - Ẩn đối với Super Admin */}
      {!isSuperAdmin && (
        <>
          <div className="flex justify-between items-center pt-4">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Vận hành lượt chơi</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Quản lý khách ra vào và dịch vụ</p>
            </div>
            <button 
              onClick={() => setShowCheckIn(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-95 group"
            >
              <i className="fa-solid fa-user-plus group-hover:scale-110 transition-transform"></i>
              THÊM NGƯỜI CHƠI
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vào lúc</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian chơi</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tạm tính</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {playingSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <i className="fa-solid fa-table-tennis-paddle-ball text-4xl text-gray-200"></i>
                          </div>
                          <p className="font-black uppercase tracking-widest text-gray-300">Chưa có khách đang chơi</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    playingSessions.map(session => {
                      const player = players.find(p => p.id === session.playerId);
                      const ss = sessionServices.filter(s => s.sessionId === session.id);
                      const total = ss.reduce((sum, item) => sum + item.totalAmount, 0);
                      
                      return (
                        <tr 
                          key={session.id} 
                          onClick={() => setSelectedSessionId(session.id)}
                          className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                                {player?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm tracking-tight">{player?.name || 'Ẩn danh'}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{player?.phone || 'Vãng lai'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-500">
                              {new Date(session.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <ElapsedTimer startTime={session.checkInTime} />
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-slate-800">
                            {total.toLocaleString()}đ
                          </td>
                          <td className="px-8 py-4 text-right">
                            <button className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-slate-500 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm">
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Chi tiết lượt chơi */}
          {selectedSession && selectedPlayer && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg h-[85vh] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 relative flex flex-col">
                <SessionCard 
                  session={selectedSession}
                  player={selectedPlayer}
                  services={services}
                  sessionServices={selectedSS}
                  onUpdateSession={(s, total) => {
                    onUpdateSession(s, total);
                    setSelectedSessionId(null);
                  }}
                  onAddService={onAddSessionService}
                  onUpdateService={onUpdateSessionService}
                  onRemoveService={onRemoveSessionService}
                  onCheckOutRequest={(s, total) => {
                    onUpdateSession(s, total);
                    setSelectedSessionId(null);
                  }}
                  onClose={() => setSelectedSessionId(null)}
                />
              </div>
            </div>
          )}

          {showCheckIn && (
            <CheckInModal 
              players={players}
              activeSessions={playingSessions}
              onClose={() => setShowCheckIn(false)}
              onCheckIn={(player) => {
                if (!player.id) {
                  onAddPlayer(player);
                } else {
                  onAddSession({ playerId: player.id });
                  setShowCheckIn(false);
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
