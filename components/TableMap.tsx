
import React from 'react';
import { Session, Player, SessionStatus } from '../types';
import { formatDate } from '../utils/formatters';

interface TableMapProps {
  sessions: Session[];
  players: Player[];
  onTableClick: (tableNumber: number) => void;
}

const TableMap: React.FC<TableMapProps> = ({ sessions, players, onTableClick }) => {
  const tableCount = 12; // Giả sử CLB có 12 bàn
  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  const getTableStatus = (num: number) => {
    const session = sessions.find(s => s.tableNumber === num && s.status === SessionStatus.PLAYING);
    if (!session) return null;
    const player = players.find(p => p.id === session.playerId);
    return { session, player };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap gap-6 items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-800">Sơ đồ bàn thời gian thực</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Trạng thái vận hành {formatDate(new Date())}</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase">Trống</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase">Đang chơi</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {tables.map(num => {
          const status = getTableStatus(num);
          const isOccupied = !!status;

          return (
            <button
              key={num}
              onClick={() => onTableClick(num)}
              className={`relative p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center gap-4 aspect-square group ${
                isOccupied 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              <div className={`text-3xl font-black ${isOccupied ? 'text-white' : 'text-slate-200 group-hover:text-blue-200'}`}>
                {num}
              </div>
              
              <div className="h-4 flex flex-col items-center">
                {isOccupied ? (
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-tighter truncate w-24">
                      {status.player?.name}
                    </p>
                    <p className="text-[8px] opacity-70 font-bold">
                      {new Date(status.session.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Trống</p>
                )}
              </div>

              {isOccupied && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center text-[10px] shadow-lg">
                  <i className="fa-solid fa-check"></i>
                </div>
              )}
              
              {/* Table Legs visual decoration */}
              <div className="absolute bottom-4 left-4 w-1 h-2 bg-black/10 rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-1 h-2 bg-black/10 rounded-full"></div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TableMap;
