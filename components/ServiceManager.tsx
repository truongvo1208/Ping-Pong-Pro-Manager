import React, { useState } from 'react';
import { Service, ServiceStatus } from '../types';

interface ServiceManagerProps {
  clubId: string;
  services: Service[];
  onUpdateServices: (services: Service[]) => void;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({ clubId, services, onUpdateServices }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<Service>>({ name: '', price: 0, unit: '', status: ServiceStatus.ACTIVE });

  const handleAdd = () => {
    if (!form.name || !form.price) return;
    const newService: Service = {
      id: `s-${Date.now()}`,
      clubId,
      name: form.name,
      price: Number(form.price),
      unit: form.unit || 'lần',
      status: form.status || ServiceStatus.ACTIVE
    };
    onUpdateServices([...services, newService]);
    setForm({ name: '', price: 0, unit: '', status: ServiceStatus.ACTIVE });
    setShowAdd(false);
  };

  const toggleStatus = (id: string) => {
    const updated = services.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === ServiceStatus.ACTIVE ? ServiceStatus.INACTIVE : ServiceStatus.ACTIVE };
      }
      return s;
    });
    onUpdateServices(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800">Danh mục dịch vụ</h3>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Quản lý kho hàng & Trạng thái kinh doanh</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus"></i> Thêm dịch vụ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(s => {
          const isInactive = s.status === ServiceStatus.INACTIVE;
          return (
            <div 
              key={s.id} 
              className={`bg-white p-6 rounded-[2rem] shadow-sm border transition-all duration-300 relative overflow-hidden group ${
                isInactive 
                  ? 'opacity-60 grayscale bg-slate-50 border-slate-200 shadow-none' 
                  : 'border-slate-100 hover:shadow-2xl hover:-translate-y-1'
              }`}
            >
              {/* Inactive Banner Overlay */}
              {isInactive && (
                <div className="absolute top-0 right-0 left-0 bg-red-500/10 py-1 text-center">
                   <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Tạm ngưng kinh doanh</span>
                </div>
              )}

              <div className="flex justify-between items-start mb-4 mt-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-colors ${
                  isInactive ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600'
                }`}>
                  <i className={`fa-solid ${s.name.toLowerCase().includes('nước') ? 'fa-bottle-water' : 'fa-tag'}`}></i>
                </div>
                <button 
                  onClick={() => toggleStatus(s.id)}
                  className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-tighter transition-all shadow-sm ${
                    !isInactive 
                      ? 'bg-green-100 text-green-700 hover:bg-green-600 hover:text-white' 
                      : 'bg-slate-200 text-slate-500 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={!isInactive ? 'Đánh dấu hết hàng' : 'Đánh dấu còn hàng'}
                >
                  {!isInactive ? (
                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-check-circle"></i> Đang bán</span>
                  ) : (
                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-ban"></i> Đã ngưng</span>
                  )}
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className={`font-black text-xl leading-tight transition-all ${
                  isInactive ? 'text-slate-400 line-through decoration-slate-400 decoration-2' : 'text-slate-800'
                }`}>
                  {s.name}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                    Đơn vị: {s.unit}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-slate-50 pt-5 mt-auto">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Giá bán niêm yết</p>
                  <p className={`text-2xl font-black transition-all ${
                    isInactive ? 'text-slate-300 line-through decoration-slate-300' : 'text-blue-600'
                  }`}>
                    {s.price.toLocaleString()}<span className="text-sm ml-1 opacity-60">đ</span>
                  </p>
                </div>
                <button 
                  disabled={isInactive}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                    isInactive 
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                      : 'bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:rotate-12'
                  }`}
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Thêm dịch vụ</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mở rộng danh mục kinh doanh</p>
              </div>
              <button 
                onClick={() => setShowAdd(false)} 
                className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-slate-800 transition-all flex items-center justify-center shadow-sm"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tên mặt hàng *</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="VD: Nước suối, Tiền sân..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none font-bold transition-all"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Giá (VNĐ) *</label>
                  <input 
                    type="number"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none font-bold transition-all text-blue-600"
                    value={form.price}
                    onChange={e => setForm({...form, price: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Đơn vị</label>
                  <input 
                    type="text"
                    placeholder="chai/giờ"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none font-bold transition-all"
                    value={form.unit}
                    onChange={e => setForm({...form, unit: e.target.value})}
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-5 rounded-3xl flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <i className="fa-solid fa-circle-info"></i>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed font-semibold uppercase">
                  Dịch vụ mới sẽ được kích hoạt ở trạng thái "Đang bán" ngay sau khi khởi tạo.
                </p>
              </div>
            </div>
            <div className="p-10 pt-0 flex gap-4">
              <button 
                onClick={() => setShowAdd(false)} 
                className="flex-1 py-4 font-black text-slate-400 text-sm hover:text-slate-800 transition-colors"
              >
                HỦY BỎ
              </button>
              <button 
                onClick={handleAdd}
                className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 text-sm active:scale-95 transition-all hover:bg-blue-700"
              >
                LƯU DỊCH VỤ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManager;
