
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
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState<Service | null>(null);
  const [quantityInput, setQuantityInput] = useState<number | string>(1);

  const isMonthlyMember = useMemo(() => {
    if (!player.membershipEndDate) return false;
    const end = new Date(player.membershipEndDate);
    const now = new Date();
    return end >= now;
  }, [player.membershipEndDate]);

  // Bộ lọc thông minh hơn, đảm bảo khớp kể cả khi data trả về khác case (hoa/thường)
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

  const handleSelectService = (service: Service) => {
    setSelectedServiceToAdd(service);
    setQuantityInput(1);
    setShowServices(false);
  };

  const handleConfirmAdd = () => {
    if (!selectedServiceToAdd) return;

    const qty = typeof quantityInput === 'string' ? parseInt(quantityInput) : quantityInput;
    if (isNaN(qty) || qty <= 0) {
      alert("Vui lòng nhập số lượng hợp lệ (tối thiểu là 1)");
      return;
    }

    const lowerName = selectedServiceToAdd.name.toLowerCase();
    const isCourtFee = lowerName.includes('tiền sân') || lowerName.includes('phí sân') || lowerName.includes('giờ chơi');
    
    if (isCourtFee && isMonthlyMember) {
      if (!window.confirm("Thành viên này đang đóng tiền tháng. Bạn vẫn muốn tính thêm tiền sân/giờ chơi?")) {
        setSelectedServiceToAdd(null);
        return;
      }
    }

    try {
      const newSS: any = {
        sessionId: session.id,
        serviceId: selectedServiceToAdd.id,
        quantity: qty,
        price: selectedServiceToAdd.price, // unit price
        totalAmount: selectedServiceToAdd.price * qty,
        clubId: session.clubId // Included clubId for RLS requirements
      };
      onAddService(newSS);
      setSelectedServiceToAdd(null);
      setQuantityInput(1);
    } catch (err) {
      console.error("Lỗi khi thêm dịch vụ:", err);
      alert("Không thể thêm dịch vụ. Vui lòng kiểm tra lại kết nối.");
    }
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
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm border border-slate-100 ml-2"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Body - Dịch vụ & Tính tiền */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar max-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dịch vụ đã sử dụng</h5>
            <p className="text-[10px] text-slate-300 font-bold mt-0.5">Thêm các dịch vụ cho người chơi</p>
          </div>
          
          <div className="relative">
            {!selectedServiceToAdd ? (
              <button 
                onClick={() => setShowServices(!showServices)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  showServices ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 shadow-sm'
                }`}
              >
                <i className={`fa-solid ${showServices ? 'fa-xmark' : 'fa-plus'}`}></i>
                CHỌN DỊCH VỤ
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-blue-200 shadow-xl animate-in zoom-in duration-200">
                <div className="px-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Số lượng {selectedServiceToAdd.name}</p>
                  <input 
                    autoFocus
                    type="number" 
                    min="1"
                    className="w-16 bg-transparent text-center text-sm font-black text-blue-600 outline-none"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                  />
                </div>
                <div className="flex gap-1">
                  <button onClick={handleConfirmAdd} className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-90">
                    <i className="fa-solid fa-check"></i>
                  </button>
                  <button onClick={() => setSelectedServiceToAdd(null)} className="bg-white text-slate-400 w-9 h-9 rounded-xl flex items-center justify-center hover:text-slate-800 border border-slate-200 transition-all">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            )}

            {showServices && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowServices(false)}></div>
                <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 animate-in fade-in zoom-in duration-200 origin-top-right py-4 max-h-72 overflow-y-auto custom-scrollbar">
                  <div className="px-6 py-2 border-b border-slate-50 mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục dịch vụ</p>
                  </div>
                  {activeServices.length > 0 ? (
                    activeServices.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectService(s)}
                        className="w-full text-left px-6 py-3.5 hover:bg-blue-50 flex justify-between items-center transition-colors group"
                      >
                        <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600">{s.name}</span>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{s.price.toLocaleString()}đ</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center text-xs text-slate-400 italic">
                      <i className="fa-solid fa-box-open text-2xl mb-2 opacity-20 block"></i>
                      Không có dịch vụ khả dụng
                      <p className="mt-1 text-[10px]">Vui lòng kiểm tra lại 'Dịch vụ & Kho'</p>
                    </div>
                  )}
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
      <div className="p-10 border-t border-slate-100 bg-slate-50/50">
        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block mb-1">Tổng cộng tạm tính</span>
            <span className="text-4xl font-black text-slate-900 tracking-tighter">{currentTotal.toLocaleString()} <span className="text-sm font-bold text-slate-400 tracking-normal uppercase ml-1">đ</span></span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => onCheckOutRequest(session, currentTotal)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-black transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
          >
            <i className="fa-solid fa-file-invoice-dollar text-xl"></i>
            THANH TOÁN & KẾT THÚC
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
