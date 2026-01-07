
import React, { useState } from 'react';
import { Service, ServiceStatus } from '../types';
import { formatCurrencyInput, parseCurrencyString } from '../utils/formatters';

interface ServiceManagerProps {
  clubId: string;
  services: Service[];
  onUpdateServices: (services: Service[]) => void;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({ clubId, services, onUpdateServices }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: '', price: '', unit: '', status: ServiceStatus.ACTIVE });

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setForm({ ...form, price: formatted });
    if (errors.price) setErrors({ ...errors, price: '' });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Vui lòng nhập tên dịch vụ';
    
    const rawPrice = parseCurrencyString(form.price);
    if (!form.price || rawPrice <= 0) {
      newErrors.price = 'Giá bán phải lớn hơn 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingService(null);
    setForm({ name: '', price: '', unit: '', status: ServiceStatus.ACTIVE });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setForm({ 
      name: service.name, 
      price: service.price.toLocaleString(), 
      unit: service.unit, 
      status: service.status 
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = () => {
    if (!validate()) return;
    
    if (editingService) {
      const updatedList = services.map(s => 
        s.id === editingService.id 
          ? { ...s, name: form.name, price: parseCurrencyString(form.price), unit: form.unit }
          : s
      );
      onUpdateServices(updatedList);
    } else {
      const newService: Service = {
        id: `s-${Date.now()}`,
        clubId,
        name: form.name,
        price: parseCurrencyString(form.price),
        unit: form.unit || 'lần',
        status: form.status || ServiceStatus.ACTIVE
      };
      onUpdateServices([...services, newService]);
    }
    
    setShowModal(false);
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
          <h3 className="text-xl font-black text-slate-800">Danh mục dịch vụ & Kho</h3>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Quản lý các mặt hàng và dịch vụ kinh doanh</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus-circle"></i> THÊM DỊCH VỤ
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dịch vụ / Mặt hàng</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn vị tính</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn giá (VNĐ)</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <i className="fa-solid fa-box-open text-4xl mb-3"></i>
                      <p className="font-black text-sm uppercase tracking-widest text-slate-500">Chưa có dịch vụ nào trong kho</p>
                    </div>
                  </td>
                </tr>
              ) : (
                services.sort((a,b) => a.name.localeCompare(b.name)).map(s => {
                  const isInactive = s.status === ServiceStatus.INACTIVE;
                  return (
                    <tr key={s.id} className={`hover:bg-blue-50/20 transition-colors group ${isInactive ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm shrink-0 transition-colors ${
                            isInactive ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600'
                          }`}>
                            <i className={`fa-solid ${s.name.toLowerCase().includes('nước') ? 'fa-bottle-water' : (s.name.toLowerCase().includes('sân') ? 'fa-table-tennis-paddle-ball' : 'fa-tag')}`}></i>
                          </div>
                          <div>
                            <span className={`font-black text-sm tracking-tight block ${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                              {s.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">ID: {s.id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                          isInactive ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {s.unit || 'Đơn vị'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-black text-base ${isInactive ? 'text-slate-300' : 'text-slate-900'}`}>
                          {s.price.toLocaleString()}
                        </span>
                        <span className="text-xs ml-1 font-bold text-slate-400">đ</span>
                      </td>
                      <td className="px-6 py-4">
                         <button 
                            onClick={() => toggleStatus(s.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${
                              !isInactive 
                                ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white' 
                                : 'bg-slate-200 text-slate-500 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${!isInactive ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            {!isInactive ? 'Đang kinh doanh' : 'Tạm ngưng'}
                          </button>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(s)}
                            className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                            title="Chỉnh sửa"
                          >
                            <i className="fa-solid fa-pen-to-square text-xs"></i>
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
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{editingService ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ'}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{editingService ? 'Chỉnh sửa thông tin mặt hàng' : 'Mở rộng danh mục kinh doanh'}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
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
                  className={`w-full px-6 py-4 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-100'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none font-bold transition-all`}
                  value={form.name}
                  onChange={e => {
                    setForm({...form, name: e.target.value});
                    if (errors.name) setErrors({...errors, name: ''});
                  }}
                />
                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-2">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Giá (VNĐ) *</label>
                  <input 
                    type="text"
                    className={`w-full px-6 py-4 bg-slate-50 border ${errors.price ? 'border-red-500' : 'border-slate-100'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none font-bold transition-all text-blue-600`}
                    value={form.price}
                    onChange={handlePriceChange}
                  />
                  {errors.price && <p className="text-[10px] text-red-500 font-bold mt-1 ml-2">{errors.price}</p>}
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
            </div>
            <div className="p-10 pt-0 flex gap-4">
              <button 
                onClick={() => setShowModal(false)} 
                className="flex-1 py-4 font-black text-slate-400 text-sm hover:text-slate-800 transition-colors"
              >
                HỦY BỎ
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 text-sm active:scale-95 transition-all hover:bg-blue-700"
              >
                {editingService ? 'CẬP NHẬT' : 'LƯU DỊCH VỤ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManager;
