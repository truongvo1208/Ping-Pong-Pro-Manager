
import React, { useState } from 'react';
import { Booking, Player } from '../types';

interface BookingManagerProps {
  clubId: string;
  players: Player[];
  bookings: Booking[];
  onAddBooking: (b: Booking) => void;
}

const BookingManager: React.FC<BookingManagerProps> = ({ clubId, players, bookings, onAddBooking }) => {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const tables = [1, 2, 3, 4, 5, 6, 7, 8];
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

  const getBookingForTable = (tableId: number) => {
    return bookings.filter(b => b.tableId === tableId && b.status !== 'cancelled');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Sơ đồ bàn & Đặt chỗ</h3>
          <p className="text-sm text-gray-400">Hôm nay, {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <div className="flex gap-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 rounded-sm border border-gray-200"></div>
            <span>Trống</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span>Đã đặt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span>Đang chơi</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {tables.map(tableId => {
          const tableBookings = getBookingForTable(tableId);
          const isOccupied = tableBookings.length > 0;
          
          return (
            <button
              key={tableId}
              onClick={() => setSelectedTable(tableId)}
              className={`relative p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 ${
                isOccupied 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-xl'
              }`}
            >
              <div className={`w-16 h-10 border-4 rounded-md flex items-center justify-center relative ${
                isOccupied ? 'border-blue-400 bg-blue-100' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="absolute w-full h-0.5 bg-current top-1/2 -translate-y-1/2 opacity-20"></div>
                <span className={`font-black text-xl ${isOccupied ? 'text-blue-600' : 'text-gray-300'}`}>
                  {tableId}
                </span>
              </div>
              <span className={`text-sm font-bold ${isOccupied ? 'text-blue-700' : 'text-gray-400'}`}>
                Bàn số {tableId}
              </span>
              {isOccupied && (
                <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>

      {selectedTable && (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-gray-800">Chi tiết đặt sân - Bàn {selectedTable}</h4>
            <button onClick={() => setSelectedTable(null)} className="text-gray-400 hover:text-gray-600">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {timeSlots.map(slot => {
              const isTaken = bookings.some(b => b.tableId === selectedTable && b.startTime.includes(slot));
              return (
                <button
                  key={slot}
                  disabled={isTaken}
                  className={`py-3 rounded-2xl font-bold text-sm transition-all ${
                    isTaken 
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 flex justify-end">
            <button 
              onClick={() => {
                const b: Booking = {
                  id: `bk-${Date.now()}`,
                  clubId,
                  playerId: players[0].id,
                  tableId: selectedTable,
                  startTime: '2025-05-20T18:00:00',
                  endTime: '2025-05-20T19:00:00',
                  status: 'confirmed'
                };
                onAddBooking(b);
                setSelectedTable(null);
              }}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20"
            >
              Xác nhận đặt bàn
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManager;
