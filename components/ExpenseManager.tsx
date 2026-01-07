
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { formatCurrencyInput, parseCurrencyString } from '../utils/formatters';

interface ExpenseManagerProps {
  clubId: string;
  expenses: Expense[];
  onAddExpense: (e: Expense) => void;
  onUpdateExpense: (e: Expense) => void;
  onRemoveExpense: (id: string) => void;
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ clubId, expenses, onAddExpense, onUpdateExpense, onRemoveExpense }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setForm({ ...form, amount: formatted });
    if (errors.amount) setErrors({ ...errors, amount: '' });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Vui lòng nhập tên khoản chi';
    
    const rawAmount = parseCurrencyString(form.amount);
    if (!form.amount || rawAmount <= 0) {
      newErrors.amount = 'Số tiền phải lớn hơn 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setForm({ name: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setForm({
      name: exp.name,
      description: exp.description || '',
      amount: exp.amount.toLocaleString(),
      date: exp.date.split('T')[0]
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = () => {
    if (!validate()) return;
    
    const expenseData = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      clubId,
      name: form.name,
      description: form.description,
      amount: parseCurrencyString(form.amount),
      date: form.date
    };

    if (editingExpense) {
      onUpdateExpense(expenseData);
    } else {
      onAddExpense(expenseData);
    }
    
    setShowModal(false);
  };

  // Sorting & Pagination Logic
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses]);

  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedExpenses.slice(start, start + itemsPerPage);
  }, [sortedExpenses, currentPage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Quản lý chi phí chi tiêu</h3>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Theo dõi các khoản chi vận hành cơ sở</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-red-500/20 transition-all active:scale-95 text-sm"
        >
          <i className="fa-solid fa-plus-circle"></i> GHI NHẬN CHI TIÊU
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày chi</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung khoản chi</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <i className="fa-solid fa-receipt text-4xl mb-2"></i>
                      <p className="font-black text-sm uppercase tracking-widest text-slate-500">Chưa có bản ghi chi tiêu nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-red-50/20 transition-colors group">
                    <td className="px-8 py-4">
                       <span className="text-sm font-bold text-slate-500 whitespace-nowrap">
                         {new Date(e.date).toLocaleDateString('vi-VN')}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm group-hover:text-red-600 transition-colors">{e.name}</span>
                        {e.description && <span className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{e.description}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="font-black text-red-600 text-base whitespace-nowrap">-{e.amount.toLocaleString()}đ</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(e)}
                          className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          title="Sửa thông tin"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button 
                          onClick={() => { if(window.confirm('Xóa bản ghi chi tiêu này?')) onRemoveExpense(e.id); }}
                          className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          title="Xóa bản ghi"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedExpenses.length)} của {sortedExpenses.length} khoản chi
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0,0); }}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              
              <div className="flex gap-1 overflow-x-auto max-w-[200px] scrollbar-hide">
                 {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentPage(i + 1); window.scrollTo(0,0); }}
                      className={`min-w-[40px] h-10 px-2 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                    >
                      {i + 1}
                    </button>
                 )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0,0); }}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800">{editingExpense ? 'Cập nhật khoản chi' : 'Ghi nhận khoản chi'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Vui lòng điền thông tin chi phí vận hành</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-slate-800 transition-all flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ngày chi *</label>
                <input 
                  type="date"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:bg-white outline-none font-bold transition-all"
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tên khoản chi *</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="VD: Tiền điện, Mua bóng mới..."
                  className={`w-full px-5 py-4 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-100'} rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:bg-white outline-none font-black transition-all`}
                  value={form.name}
                  onChange={e => {
                    setForm({...form, name: e.target.value});
                    if (errors.name) setErrors({...errors, name: ''});
                  }}
                />
                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-2">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Số tiền (VNĐ) *</label>
                <input 
                  type="text"
                  placeholder="0"
                  className={`w-full px-5 py-4 bg-slate-50 border ${errors.amount ? 'border-red-500' : 'border-slate-100'} rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:bg-white outline-none font-black text-red-600 transition-all`}
                  value={form.amount}
                  onChange={handleAmountChange}
                />
                {errors.amount && <p className="text-[10px] text-red-500 font-bold mt-1 ml-2">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mô tả thêm</label>
                <textarea 
                  placeholder="Thông tin ghi chú cụ thể..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:bg-white outline-none font-medium resize-none"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-slate-400 text-xs hover:text-slate-800 transition-colors uppercase tracking-widest">Hủy bỏ</button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-4 bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-500/30 hover:bg-red-600 active:scale-95 transition-all text-xs uppercase tracking-widest"
              >
                {editingExpense ? 'CẬP NHẬT' : 'GHI NHẬN CHI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
