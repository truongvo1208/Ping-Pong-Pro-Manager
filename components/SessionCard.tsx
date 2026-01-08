
import React, { useState, useEffect, useMemo } from 'react';
import { Session, Player, Service, SessionService, SessionStatus, ServiceStatus } from '../types';

interface SessionCardProps {
  session: Session;
  player: Player;
  services: Service[];
  sessionServices: SessionService[];
  onUpdateSession: (s: Session, total: number) => void;
  onAddService: (ss: SessionService) => void;
  onUpdateService: (ss: SessionService) => void;
  onRemoveService: (id: string) => void;
  onCheckOutRequest: (session: Session, total: number) => void;
  onClose: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ 
  session, player, services = [], sessionServices = [], onUpdateSession, onAddService, onUpdateService, onRemoveService, onCheckOutRequest, onClose 
}) => {
  const [elapsedDisplay, setElapsedDisplay] = useState('0m 0s');
  const [showServices, setShowServices] = useState(false);
  
  // State for batch selection: { serviceId: quantity }
  const [pendingItems, setPendingItems] = useState<Record<string, number>>({});

  const isMonthlyMember = useMemo(() => {
    if (!player.membershipEndDate) return false;
    const end = new Date(player.membershipEndDate);
    const now = new Date();
    return end >= now;
  }, [player.membershipEndDate]);

  const activeServices = useMemo(() => {
    if (!Array.isArray(services)) return [];
    return services.filter(s => {
      const status = (s.status as string || '').toLowerCase();
      return status === 'active' || status === 'đang kinh doanh';
    });
  }, [services]);

  useEffect(() => {
    const update = () => {
      const start = new Date(session.checkInTime).getTime();
      const now = new Date().getTime();
      const diffSec = Math.floor((now - start) / 1000);
      
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;
      
      setElapsedDisplay(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [session.checkInTime]);

  const currentTotal = useMemo(() => {
    return Array.isArray(sessionServices) ? sessionServices.reduce((sum, ss) => sum + ss.totalAmount, 0) : 0;
  }, [sessionServices]);

  // Handle local quantity change in the dropdown
  const handlePendingChange = (serviceId: string, delta: number) => {
    setPendingItems(prev => {
      const currentQty = prev[serviceId] || 0;
      const newQty = currentQty + delta;
      
      if (newQty <= 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: newQty };
    });
  };

  const pendingTotalAmount = useMemo(() => {
    let total = 0;
    Object.entries(pendingItems).forEach(([sId, qty]) => {
      const s = services.find(x => x.id === sId);
      if (s) total += Number(s.price) * Number(qty);
    });
    return total;
  }, [pendingItems, services]);

  const handleBatchAdd = () => {
    const itemsToAdd = Object.entries(pendingItems);
    if (itemsToAdd.length === 0) return;

    // Check for Court Fee warning
    let hasCourtFee = false;
    itemsToAdd.forEach(([sId]) => {
      const s = services.find(x => x.id === sId);
      if (s) {
        const lowerName = s.name.toLowerCase();
        if (lowerName.includes('tiền sân') || lowerName.includes('phí sân') || lowerName.includes('giờ chơi')) {
          hasCourtFee = true;
        }
      }
    });

    if (hasCourtFee && isMonthlyMember) {
      if (!window.confirm("Thành viên này đang đóng tiền tháng. Bạn vẫn muốn tính thêm tiền sân/giờ chơi?")) {
        return;
      }
    }

    // Process all items
    itemsToAdd.forEach(([sId, qty]) => {
      const service = services.find(s => s.id === sId);
      if (service) {
        try {
          const newSS: any = {
            sessionId: session.id,
            serviceId: service.id,
            quantity: qty,
            price: service.price,
            totalAmount: Number(service.price) * Number(qty),
            clubId: session.clubId
          };
          onAddService(newSS);
        } catch (err) {
          console.error("Lỗi thêm dịch vụ:", err);
        }
      }
    });

    // Reset UI
    setPendingItems({});
    setShowServices(false);
  };

  const adjustQuantity = (ss: SessionService, delta: number) => {
    const newQty = ss.quantity + delta;
    if (newQty <= 0) {
      if (window.confirm('Bạn muốn xóa dịch vụ này khỏi lượt chơi?')) {
        onRemoveService(ss.id);
      }
      return;
    }
    const updatedSS = {
      ...ss,
      quantity: newQty,
      totalAmount: ss.price * newQty
    };
    onUpdateService(updatedSS);
  };

  return (
    <div className="bg-white flex flex-col h-full overflow-hidden">
      {/* Header Modal - Condensed */}
      <div className="p-8 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-inner shrink-0 ${isMonthlyMember ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
            {player?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-black text-slate-800 text-xl tracking-tight leading-tight truncate">{player?.name || 'Ẩn danh'}</h4>
              {isMonthlyMember && (
                <span className="bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-md font-black uppercase shadow-sm whitespace-nowrap">Thành viên</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <p className="text-xs text-slate-400 font-bold truncate">{player?.phone || 'Khách vãng lai'}</p>
              <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
                <i className="fa-solid fa-clock opacity-40"></i>
                Vào lúc {new Date(session.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Thời gian chơi</p>
              <div className="font-mono font-black text-blue-600 bg-white border border-blue-100 px-3 py-1.5 rounded-xl shadow-sm inline-block">
                {elapsedDisplay}
              </div>
            </div>
            {/* Top Close Button (Optional/Secondary now) */}
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm border border-slate-100 ml-2"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Body - Dịch vụ & Tính tiền */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dịch vụ đã sử dụng</h5>
            <p className="text-[10px] text-slate-300 font-bold mt-0.5">Quản lý dịch vụ tiêu dùng</p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowServices(!showServices)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                showServices ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 shadow-sm'
              }`}
            >
              <i className={`fa-solid ${showServices ? 'fa-xmark' : 'fa-plus'}`}></i>
              {showServices ? 'ĐÓNG' : 'THÊM DỊCH VỤ'}
            </button>

            {showServices && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowServices(false)}></div>
                <div className="absolute right-0 top-full mt-3 w-96 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 animate-in fade-in zoom-in duration-200 origin-top-right flex flex-col max-h-[400px]">
                  <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chọn dịch vụ cần thêm</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {activeServices.length > 0 ? (
                      activeServices.map(s => {
                        const count = pendingItems[s.id] || 0;
                        return (
                          <div
                            key={s.id}
                            className={`flex justify-between items-center p-3 rounded-2xl transition-all mb-1 ${
                              count > 0 ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="flex-1">
                               <p className="text-sm font-bold text-slate-700">{s.name}</p>
                               <p className="text-[10px] font-black text-slate-400">{s.price.toLocaleString()}đ</p>
                            </div>
                            
                            <div className="flex items-center bg-white rounded-xl border border-slate-100 shadow-sm h-9">
                               <button 
                                 onClick={() => handlePendingChange(s.id, -1)}
                                 className={`w-8 h-full flex items-center justify-center transition-colors rounded-l-xl ${count > 0 ? 'text-red-500 hover:bg-red-50' : 'text-slate-300'}`}
                                 disabled={count === 0}
                               >
                                 <i className="fa-solid fa-minus text-[10px]"></i>
                               </button>
                               <div className={`w-8 text-center text-sm font-black ${count > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                                 {count}
                               </div>
                               <button 
                                 onClick={() => handlePendingChange(s.id, 1)}
                                 className="w-8 h-full flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors rounded-r-xl"
                               >
                                 <i className="fa-solid fa-plus text-[10px]"></i>
                               </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-6 py-8 text-center text-xs text-slate-400 italic">
                        <i className="fa-solid fa-box-open text-2xl mb-2 opacity-20 block"></i>
                        Kho trống
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                     <div className="flex justify-between items-center mb-3 px-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Tạm tính</span>
                        <span className="font-black text-slate-800">{pendingTotalAmount.toLocaleString()}đ</span>
                     </div>
                     <button 
                        onClick={handleBatchAdd}
                        disabled={Object.keys(pendingItems).length === 0}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none hover:bg-blue-700 active:scale-95 transition-all"
                     >
                        XÁC NHẬN THÊM ({Object.keys(pendingItems).length})
                     </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {sessionServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
               <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                 <i className="fa-solid fa-receipt text-slate-200 text-xl"></i>
               </div>
               <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Chưa có dịch vụ nào</p>
            </div>
          ) : (
            sessionServices.map(ss => {
              const s = services.find(x => x.id === ss.serviceId);
              return (
                <div key={ss.id} className="flex justify-between items-center text-sm bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group/item">
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-slate-800 font-black truncate text-base leading-tight">{s?.name || 'Mặt hàng'}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                       {ss.price.toLocaleString()}đ / {s?.unit || 'đơn vị'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                      <button 
                        onClick={() => adjustQuantity(ss, -1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                      >
                        <i className="fa-solid fa-minus text-[10px]"></i>
                      </button>
                      <span className="w-8 text-center font-black text-slate-800 text-sm">
                        {ss.quantity}
                      </span>
                      <button 
                        onClick={() => adjustQuantity(ss, 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                      >
                        <i className="fa-solid fa-plus text-[10px]"></i>
                      </button>
                    </div>
                    
                    <div className="w-24 text-right">
                       <span className="font-black text-slate-900 text-base">{ss.totalAmount.toLocaleString()}đ</span>
                    </div>

                    <button 
                      onClick={() => onRemoveService(ss.id)}
                      className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/item:opacity-100 shadow-sm shrink-0"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer - Thanh toán */}
      <div className="p-8 border-t border-slate-100 bg-slate-50/50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block mb-1">Tổng cộng tạm tính</span>
            <span className="text-4xl font-black text-slate-900 tracking-tighter">{currentTotal.toLocaleString()} <span className="text-sm font-bold text-slate-400 tracking-normal uppercase ml-1">đ</span></span>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => onCheckOutRequest(session, currentTotal)}
            className="flex-[3] bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-black transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
          >
            <i className="fa-solid fa-file-invoice-dollar text-xl"></i>
            THANH TOÁN & KẾT THÚC
          </button>

          <button 
            onClick={onClose}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 py-5 rounded-[1.5rem] font-black transition-all shadow-none active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
