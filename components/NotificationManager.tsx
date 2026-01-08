
import React, { useState } from 'react';
import { Notification } from '../types';
import { formatDateTime } from '../utils/formatters';

interface NotificationManagerProps {
  clubId: string;
  notifications: Notification[];
  onSend: (n: Notification) => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ clubId, notifications, onSend }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'promotion' as any });

  const handleSend = () => {
    if (!form.title || !form.content) return;
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      clubId,
      title: form.title,
      content: form.content,
      type: form.type,
      sentAt: new Date().toISOString(),
      targetCount: Math.floor(Math.random() * 50) + 10 // Mock player count
    };
    onSend(newNotif);
    setShowAdd(false);
    setForm({ title: '', content: '', type: 'promotion' });
  };

  const getBadgeClass = (type: string) => {
    switch(type) {
      case 'promotion': return 'bg-purple-100 text-purple-700';
      case 'reminder': return 'bg-amber-100 text-amber-700';
      case 'tournament': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeName = (type: string) => {
    switch(type) {
      case 'promotion': return 'Khuyến mãi';
      case 'reminder': return 'Nhắc hẹn/Phí';
      case 'tournament': return 'Giải đấu';
      default: return 'Khác';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800">Thông báo & Tin nhắn</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gửi tin nhắn đến hội viên</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <i className="fa-solid fa-paper-plane"></i>
          GỬI THÔNG BÁO MỚI
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
            <i className="fa-solid fa-envelope-open text-4xl text-slate-200 mb-4"></i>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Chưa có thông báo nào được gửi.</p>
          </div>
        ) : (
          notifications.sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()).map(n => (
            <div key={n.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${getBadgeClass(n.type)}`}>
                <i className={`fa-solid ${n.type === 'promotion' ? 'fa-gift' : n.type === 'reminder' ? 'fa-bell' : 'fa-trophy'}`}></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-black text-slate-800">{n.title}</h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${getBadgeClass(n.type)}`}>
                    {getTypeName(n.type)}
                  </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 font-medium">{n.content}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 font-bold">
                  <span className="flex items-center gap-1">
                    <i className="fa-regular fa-clock"></i>
                    {formatDateTime(n.sentAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fa-solid fa-users"></i>
                    Đã gửi đến {n.targetCount} người chơi
                  </span>
                </div>
              </div>
              <button className="text-slate-300 hover:text-red-500 p-2 ml-auto transition-colors">
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">Soạn thông báo</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Loại thông báo</label>
                <div className="grid grid-cols-3 gap-2">
                  {['promotion', 'reminder', 'tournament'].map(t => (
                    <button
                      key={t}
                      onClick={() => setForm({...form, type: t as any})}
                      className={`py-3 px-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        form.type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-white'
                      }`}
                    >
                      {getTypeName(t)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tiêu đề *</label>
                <input 
                  type="text"
                  placeholder="Tiêu đề thông báo..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none font-bold transition-all"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nội dung thông báo *</label>
                <textarea 
                  rows={4}
                  placeholder="Nhập nội dung chi tiết..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none resize-none font-medium transition-all"
                  value={form.content}
                  onChange={e => setForm({...form, content: e.target.value})}
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100">
                <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                <p className="text-xs font-bold text-blue-600 leading-relaxed">
                  Thông báo này sẽ được gửi tự động qua App người chơi và SMS cho các thành viên đã đăng ký.
                </p>
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-4 font-black text-slate-400 text-xs tracking-widest hover:text-slate-600">HUỶ BỎ</button>
              <button 
                onClick={handleSend}
                className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-xs tracking-widest"
              >
                GỬI NGAY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManager;
