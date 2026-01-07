
import React, { useState, useEffect, useMemo } from 'react';
import { Session, Player, Service, SessionService, SessionStatus, ServiceStatus } from '../types';

interface SessionCardProps {
  session: Session;
  player: Player;
  services: Service[];
  sessionServices: SessionService[];
  onUpdateSession: (s: Session, total: number) => void;
  onAddService: (ss: SessionService) => void;
  onRemoveService: (id: string) => void;
  onCheckOutRequest: (session: Session, total: number) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ 
  session, player, services, sessionServices, onUpdateSession, onAddService, onRemoveService, onCheckOutRequest 
}) => {
  const [elapsedDisplay, setElapsedDisplay] = useState('0m 0s');
  const [showServices, setShowServices] = useState(false);
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState<Service | null>(null);
  const [quantityInput, setQuantityInput] = useState<number | string>(1);

  const isMonthlyMember = useMemo(() => {
    if (!player.membershipEndDate) return false;
    const end = new Date(player.membershipEndDate);
    const now = new Date();
    return end >= now;
  }, [player.membershipEndDate]);

  const activeServices = useMemo(() => {
    return services.filter(s => s.status === ServiceStatus.ACTIVE);
  }, [services]);

  useEffect(() => {
    const timer = setInterval(() => {
      const start = new Date(session.checkInTime).getTime();
      const now = new Date().getTime();
      const diffSec = Math.floor((now - start) / 1000);
      
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;
      
      setElapsedDisplay(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [session.checkInTime]);

  const currentTotal = useMemo(() => {
    return sessionServices.reduce((sum, ss) => sum + ss.totalAmount, 0);
  }, [sessionServices]);

  const handleSelectService = (service: Service) => {
    setSelectedServiceToAdd(service);
    setQuantityInput(1);
    setShowServices(false);
  };

  const handleConfirmAdd = () => {
    if (!selectedServiceToAdd) return;

    // Chuyển đổi sang số và validate
    const qty = typeof quantityInput === 'string' ? parseInt(quantityInput) : quantityInput;
    if (isNaN(qty) || qty <= 0) {
      alert("Vui lòng nhập số lượng hợp lệ (tối thiểu là 1)");
      return;
    }

    const isCourtFee = selectedServiceToAdd.name.toLowerCase().includes('tiền sân') || selectedServiceToAdd.name.toLowerCase().includes('phí sân');
    
    if (isCourtFee && isMonthlyMember) {
      if (!window.confirm("Thành viên này đang đóng tiền tháng. Bạn vẫn muốn tính thêm tiền sân?")) {
        setSelectedServiceToAdd(null);
        return;
      }
    }

    const newSS: any = {
      sessionId: session.id,
      serviceId: selectedServiceToAdd.id,
      quantity: qty,
      price: selectedServiceToAdd.price,
      totalAmount: selectedServiceToAdd.price * qty
    };
    onAddService(newSS);
    setSelectedServiceToAdd(null);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-xl transition-all duration-300 relative group">
      <div className="p-5 border-b border-gray-50">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm ${isMonthlyMember ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              {player?.name?.charAt(0) || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-800 text-base leading-tight">{player?.name || 'Ẩn danh'}</h4>
                {isMonthlyMember && (
                  <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase shadow-sm">Member</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{player?.phone || 'Khách vãng lai'}</p>
            </div>
          </div>
          <span className="bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter shadow-sm animate-pulse">
            Playing
          </span>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <i className="fa-regular fa-clock"></i>
            <span>Vào lúc: {new Date(session.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="font-mono font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
            {elapsedDisplay}
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 bg-gray-50/40 relative">
        <div className="flex justify-between items-center mb-4">
          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dịch vụ & Tiền sân</h5>
          
          <div className="relative">
            {!selectedServiceToAdd ? (
              <button 
                onClick={() => setShowServices(!showServices)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  showServices ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50'
                }`}
              >
                <i className={`fa-solid ${showServices ? 'fa-xmark' : 'fa-plus'}`}></i>
                Thêm mới
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-blue-100 shadow-sm animate-in fade-in zoom-in duration-200">
                <div className="px-2">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">Số lượng {selectedServiceToAdd.name}</p>
                  <input 
                    autoFocus
                    type="number" 
                    min="1"
                    className="w-12 text-center text-sm font-black text-blue-600 outline-none"
                    value={quantityInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setQuantityInput('');
                      } else {
                        setQuantityInput(parseInt(val));
                      }
                    }}
                  />
                </div>
                <button 
                  onClick={handleConfirmAdd}
                  className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <i className="fa-solid fa-check"></i>
                </button>
                <button 
                  onClick={() => setSelectedServiceToAdd(null)}
                  className="bg-gray-100 text-gray-400 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}

            {showServices && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in duration-150 origin-top-right py-2 max-h-64 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chọn dịch vụ</p>
                </div>
                {activeServices.length > 0 ? (
                  activeServices.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectService(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex justify-between items-center transition-colors"
                    >
                      <span className="text-sm font-bold text-gray-700">{s.name}</span>
                      <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{s.price.toLocaleString()}đ</span>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-4 text-center text-xs text-gray-400 italic">Dịch vụ đang hết hàng</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
          {sessionServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
               <i className="fa-solid fa-receipt text-gray-200 text-2xl mb-2"></i>
               <p className="text-[10px] text-gray-400 uppercase font-black">Chưa có dịch vụ nào</p>
            </div>
          ) : (
            sessionServices.map(ss => {
              const s = services.find(x => x.id === ss.serviceId);
              return (
                <div key={ss.id} className="flex justify-between items-center text-sm bg-white p-3 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-right-2 duration-200 group/item">
                  <div className="flex flex-col">
                    <span className="text-gray-800 font-bold">{s?.name || 'N/A'}</span>
                    <span className="text-[10px] text-gray-400">
                      {ss.quantity} x {ss.price.toLocaleString()}đ / {s?.unit || 'đv'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">{ss.totalAmount.toLocaleString()}đ</span>
                    <button 
                      onClick={() => onRemoveService(ss.id)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/item:opacity-100 shadow-sm"
                      title="Xóa dịch vụ này"
                    >
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-5 bg-white border-t border-gray-100 rounded-b-3xl">
        <div className="flex justify-between items-center mb-5">
          <span className="text-gray-400 text-xs font-black uppercase tracking-widest">Thanh toán tạm tính</span>
          <span className="text-2xl font-black text-gray-900">{currentTotal.toLocaleString()} <span className="text-sm font-bold text-gray-400">đ</span></span>
        </div>
        <button 
          onClick={() => onCheckOutRequest(session, currentTotal)}
          className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3 group/btn overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 -z-0"></div>
          <i className="fa-solid fa-file-invoice-dollar relative z-10 group-hover/btn:rotate-12 transition-transform"></i>
          <span className="relative z-10">KẾT THÚC & THU TIỀN</span>
        </button>
      </div>
      
      {showServices && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setShowServices(false)}
        ></div>
      )}
    </div>
  );
};

export default SessionCard;
