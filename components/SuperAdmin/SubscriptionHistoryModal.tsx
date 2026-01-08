
import React, { useState } from 'react';
import { Club, SubscriptionPayment, SubscriptionTier } from '../../types';
import { formatCurrencyInput, parseCurrencyString, formatDate } from '../../utils/formatters';

interface SubscriptionHistoryModalProps {
  club: Club;
  history: SubscriptionPayment[];
  onClose: () => void;
  onUpgrade: (payment: Partial<SubscriptionPayment>) => void;
}

const SubscriptionHistoryModal: React.FC<SubscriptionHistoryModalProps> = ({ club, history, onClose, onUpgrade }) => {
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [form, setForm] = useState({
    tier: 'MONTHLY' as SubscriptionTier,
    amount: '500,000',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    note: ''
  });

  const handleUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseCurrencyString(form.amount);
    onUpgrade({
      clubId: club.id,
      tier: form.tier,
      amount: amountNum,
      startDate: form.startDate,
      endDate: form.endDate,
      note: form.note,
      paymentDate: new Date().toISOString(),
      status: 'COMPLETED'
    });
    setShowUpgradeForm(false);
  };

  const getTierBadge = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'YEARLY': return <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm">YEARLY</span>;
      case 'MONTHLY': return <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm">MONTHLY</span>;
      default: return <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">FREE</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-800">Lịch sử Gói phí</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{club.name}</p>
          </div>
          <div className="flex gap-2">
            {!showUpgradeForm && (
              <button 
                onClick={() => setShowUpgradeForm(true)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
              >
                + GIA HẠN / NÂNG CẤP
              </button>
            )}
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-slate-800 transition-all flex items-center justify-center shadow-sm border border-slate-100">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {showUpgradeForm ? (
            <form onSubmit={handleUpgrade} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Chọn gói nâng cấp</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['MONTHLY', 'YEARLY'].map(t => (
                      <button 
                        key={t}
                        type="button"
                        onClick={() => setForm({...form, tier: t as SubscriptionTier, amount: t === 'MONTHLY' ? '500,000' : '5,000,000'})}
                        className={`py-4 rounded-2xl text-xs font-black transition-all border ${form.tier === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-indigo-100'}`}
                      >
                        {t === 'MONTHLY' ? 'Gói Tháng (500k)' : 'Gói Năm (5M)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Số tiền thanh toán (VNĐ)</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-white border border-indigo-100 rounded-2xl font-black text-indigo-600" value={form.amount} onChange={e => setForm({...form, amount: formatCurrencyInput(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Ghi chú giao dịch</label>
                  <input type="text" placeholder="Chuyển khoản VCB..." className="w-full px-5 py-3.5 bg-white border border-indigo-100 rounded-2xl font-bold text-sm" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Ngày bắt đầu</label>
                  <input type="date" className="w-full px-5 py-3.5 bg-white border border-indigo-100 rounded-2xl font-bold" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Ngày hết hạn</label>
                  <input type="date" className="w-full px-5 py-3.5 bg-white border border-indigo-100 rounded-2xl font-bold" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowUpgradeForm(false)} className="flex-1 font-black text-slate-400 text-sm">HUỶ BỎ</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all">XÁC NHẬN GIA HẠN</button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center opacity-20">
                  <i className="fa-solid fa-clock-rotate-left text-5xl mb-4"></i>
                  <p className="font-black uppercase tracking-[0.2em] text-sm">Chưa có lịch sử giao dịch</p>
                </div>
              ) : (
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Danh sách các lần đăng ký</p>
                   {history.map((payment, idx) => (
                      <div key={payment.id || idx} className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center gap-6 group hover:bg-white hover:shadow-xl transition-all duration-300">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0 ${payment.tier === 'YEARLY' ? 'bg-indigo-600 text-white' : (payment.tier === 'MONTHLY' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500')}`}>
                          <i className="fa-solid fa-award"></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getTierBadge(payment.tier)}
                            <span className="text-[10px] font-black text-slate-300">•</span>
                            <span className="text-[11px] font-bold text-slate-400">{formatDate(payment.paymentDate)}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                               <p className="text-lg font-black text-slate-800">{payment.amount.toLocaleString()}<span className="text-xs ml-1 text-slate-400">đ</span></p>
                               <p className="text-[10px] font-medium text-slate-400">Thời hạn: {formatDate(payment.startDate)} - {formatDate(payment.endDate)}</p>
                            </div>
                            {payment.note && <span className="text-[10px] bg-white px-3 py-1 rounded-full border border-slate-100 font-bold text-slate-400 italic">"{payment.note}"</span>}
                          </div>
                        </div>
                      </div>
                   ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionHistoryModal;
