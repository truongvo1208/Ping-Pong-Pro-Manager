
import React, { useState, useMemo } from 'react';
import { Session, Player, SessionService, Service, Club } from '../types';
import { formatDate, removeAccents } from '../utils/formatters';

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
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date Range State
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const isSuperAdmin = clubs.length > 0;

  const hasActiveFilters = useMemo(() => {
    return (selectedClubId !== 'all') || (searchTerm.trim() !== '') || (fromDate !== '') || (toDate !== '');
  }, [selectedClubId, searchTerm, fromDate, toDate]);

  const clearAllFilters = () => {
    setSelectedClubId('all');
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const filteredSessions = useMemo(() => {
    let result = sessions;

    // Filter by Club
    if (selectedClubId !== 'all') {
      result = result.filter(s => s.clubId === selectedClubId);
    }

    // Filter by Date Range
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(s => new Date(s.checkInTime) >= start);
    }

    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(s => new Date(s.checkInTime) <= end);
    }

    // Filter by Search Term (Player Name or Phone)
    if (searchTerm.trim()) {
      const lowerTerm = removeAccents(searchTerm.toLowerCase().trim());
      result = result.filter(s => {
        const player = players.find(p => p.id === s.playerId);
        if (!player) return false;
        
        const name = removeAccents(player.name.toLowerCase());
        const phone = player.phone || '';
        
        return name.includes(lowerTerm) || phone.includes(lowerTerm);
      });
    }

    return result.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
  }, [sessions, selectedClubId, searchTerm, players, fromDate, toDate]);

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSessions.slice(start, start + itemsPerPage);
  }, [filteredSessions, currentPage]);

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
      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4">
        {isSuperAdmin && (
          <div className="w-full md:w-1/3 relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                <i className="fa-solid fa-filter"></i>
             </div>
             <select
              value={selectedClubId}
              onChange={(e) => { setSelectedClubId(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer text-sm"
            >
              <option value="all">Tất cả Cơ sở</option>
              {clubs.filter(c => c.role === 'CLUB_ADMIN').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Date Range Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
               <span className="text-[10px] font-black uppercase">Từ</span>
            </div>
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
              className="w-full md:w-40 pl-9 pr-2 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs placeholder:text-slate-400 cursor-pointer"
            />
          </div>
          <div className="relative flex-1 md:flex-none">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
               <span className="text-[10px] font-black uppercase">Đến</span>
            </div>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
              className="w-full md:w-40 pl-10 pr-2 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs placeholder:text-slate-400 cursor-pointer"
            />
          </div>
        </div>
        
        {/* Clear Filters Button */}
        <button
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          className={`h-[42px] px-4 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 shrink-0 ${
            hasActiveFilters 
            ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-500 hover:text-white hover:shadow-md cursor-pointer' 
            : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
          }`}
          title="Xóa tất cả bộ lọc"
        >
          <i className="fa-solid fa-filter-circle-xmark text-sm"></i>
          <span className="hidden lg:inline">Xóa lọc</span>
        </button>

        <div className="w-full md:flex-1 relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text"
            placeholder="Tìm kiếm lịch sử theo tên hoặc số điện thoại..."
            className="w-full pl-10 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-bold text-sm transition-all"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Người chơi</th>
                {isSuperAdmin && <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cơ sở</th>}
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian giao dịch</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng thanh toán</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Chi tiết</th>
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
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                            {player?.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-black text-slate-800 text-sm block tracking-tight">{player?.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{player?.phone || '...'}</span>
                          </div>
                        </div>
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
                          <span className="text-sm font-bold text-slate-600">{formatDate(s.checkInTime)}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(s.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-blue-600 text-base">{s.totalAmount.toLocaleString()}đ</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={() => setSelectedSession(s)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-slate-500 text-xs font-bold shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                        >
                          <i className="fa-solid fa-circle-info"></i>
                          Xem chi tiết
                        </button>
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
