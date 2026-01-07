
import React, { useState, useMemo } from 'react';
import { Session, Player, SessionService, Service, Club } from '../types';

interface HistoryViewProps {
  sessions: Session[];
  players: Player[];
  sessionServices: SessionService[];
  services: Service[];
  clubs?: Club[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ sessions, players, sessionServices, services, clubs = [] }) => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedClubId, setSelectedClubId] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const isSuperAdmin = clubs.length > 0;

  const filteredSessions = useMemo(() => {
    return sessions
      .filter(s => selectedClubId === 'all' || s.clubId === selectedClubId)
      .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
  }, [sessions, selectedClubId]);

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSessions.slice(start, start + itemsPerPage);
  }, [filteredSessions, currentPage]);

  const handleShare = async (session: Session) => {
    const player = players.find(p => p.id === session.playerId);
    const text = `Tôi vừa hoàn thành buổi tập bóng bàn tại PingPong Pro! 🏓\nNgười chơi: ${player?.name}\nTổng tiền: ${session.totalAmount.toLocaleString()}đ`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Kết quả tập luyện', text: text, url: window.location.href }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(text);
      alert('Đã sao chép nội dung chia sẻ!');
    }
  };

  // Logic hiển thị danh sách các số trang
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => { setCurrentPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
            currentPage === i 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
              : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar for Super Admin */}
      {isSuperAdmin && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-filter text-xs"></i>
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Lọc lịch sử hệ thống</h3>
          </div>
          <div className="relative w-full max-w-xs">
            <select
              value={selectedClubId}
              onChange={(e) => { setSelectedClubId(e.target.value); setCurrentPage(1); }}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer text-sm"
            >
              <option value="all">Tất cả Cơ sở</option>
              {clubs.filter(c => c.role === 'CLUB_ADMIN').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Người chơi</th>
                {isSuperAdmin && <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cơ sở</th>}
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian giao dịch</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng thanh toán</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 5 : 4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <i className="fa-solid fa-clock-rotate-left text-4xl mb-3"></i>
                      <p className="font-black text-sm uppercase tracking-widest">Không tìm thấy lịch sử phù hợp</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSessions.map(s => {
                  const player = players.find(p => p.id === s.playerId);
                  const clubName = clubs.find(c => c.id === s.clubId)?.name || 'N/A';
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-8 py-4">
                        <button onClick={() => setSelectedSession(s)} className="flex items-center gap-4 text-left hover:opacity-80 transition-opacity">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">{player?.name.charAt(0)}</div>
                          <div>
                            <span className="font-black text-slate-800 text-sm block tracking-tight">{player?.name}</span>
                            <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Xem chi tiết hóa đơn</span>
                          </div>
                        </button>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-tighter">
                            {clubName}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-600">{new Date(s.checkInTime).toLocaleDateString('vi-VN')}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(s.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-blue-600 text-base">{s.totalAmount.toLocaleString()}đ</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleShare(s)} 
                            className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                            title="Chia sẻ kết quả"
                          >
                            <i className="fa-solid fa-share-nodes text-xs"></i>
                          </button>
                          <button 
                            className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center shadow-sm"
                            title="In hóa đơn"
                          >
                            <i className="fa-solid fa-print text-xs"></i>
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

        {/* Improved Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredSessions.length)} của {filteredSessions.length} phiên chơi
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1} 
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              
              <div className="flex gap-1">
                {renderPageNumbers()}
              </div>

              <button 
                disabled={currentPage === totalPages} 
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-slate-900 p-8 text-center text-white relative">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-blue-600/20">
                <i className="fa-solid fa-file-invoice text-2xl"></i>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Chi tiết phiên chơi</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Lịch sử giao dịch chi tiết</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Khách hàng</span>
                <span className="font-black text-slate-800">{players.find(p => p.id === selectedSession.playerId)?.name}</span>
              </div>
              
              <div className="space-y-3">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Dịch vụ đã sử dụng</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {sessionServices.filter(ss => ss.sessionId === selectedSession.id).length > 0 ? (
                    sessionServices.filter(ss => ss.sessionId === selectedSession.id).map(ss => (
                      <div key={ss.id} className="flex justify-between text-sm bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{services.find(x => x.id === ss.serviceId)?.name}</span>
                          <span className="text-[10px] text-slate-400">Số lượng: {ss.quantity}</span>
                        </div>
                        <span className="font-black text-slate-800 self-center">{ss.totalAmount.toLocaleString()}đ</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-xs text-slate-400 italic">Không có dịch vụ đi kèm</p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t-2 border-dashed border-slate-100 flex justify-between items-center">
                <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Tổng tiền</span>
                <span className="text-3xl font-black text-blue-600">{selectedSession.totalAmount.toLocaleString()}đ</span>
              </div>
            </div>
            
            <div className="px-8 pb-8">
              <button 
                onClick={() => setSelectedSession(null)} 
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 text-xs tracking-widest"
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
