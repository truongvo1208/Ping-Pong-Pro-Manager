
import React, { useState } from 'react';
import { Expense } from '../types';

interface ExpenseManagerProps {
  clubId: string;
  expenses: Expense[];
  onAddExpense: (e: Expense) => void;
  onRemoveExpense: (id: string) => void;
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ clubId, expenses, onAddExpense, onRemoveExpense }) => {
  const [showAdd, setShowAdd] = useState(false);
  // Sử dụng string cho amount trong form để tránh lỗi số 0 ở đầu khi nhập liệu
  const [form, setForm] = useState({ description: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });

  const handleAdd = () => {
    if (!form.description || !form.amount || Number(form.amount) <= 0) return;
    onAddExpense({
      id: `exp-${Date.now()}`,
      clubId,
      ...form,
      amount: Number(form.amount)
    });
    setForm({ description: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Quản lý chi tiêu câu lạc bộ</h3>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/20"
        >
          <i className="fa-solid fa-minus-circle"></i> Ghi nhận chi tiêu
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Nội dung chi</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Số tiền</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ghi chú</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Chưa có bản ghi chi tiêu nào.</td>
              </tr>
            ) : (
              expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(e => (
                <tr key={e.id} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(e.date).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 font-bold text-gray-700">{e.description}</td>
                  <td className="px-6 py-4 font-black text-red-600">-{e.amount.toLocaleString()}đ</td>
                  <td className="px-6 py-4 text-sm text-gray-500 italic">{e.note || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onRemoveExpense(e.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 text-red-600">Ghi nhận khoản chi</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Ngày chi *</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Nội dung chi *</label>
                <input 
                  type="text"
                  placeholder="VD: Tiền điện, Mua bóng mới..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Số tiền *</label>
                <input 
                  type="number"
                  placeholder="Nhập số tiền chi..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-red-600 font-bold"
                  value={form.amount}
                  onChange={e => setForm({...form, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Ghi chú (tùy chọn)</label>
                <textarea 
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  value={form.note}
                  onChange={e => setForm({...form, note: e.target.value})}
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 font-bold text-gray-500">Hủy</button>
              <button 
                onClick={handleAdd}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20"
              >
                Ghi nhận chi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
