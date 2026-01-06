
import React, { useState } from 'react';
import { Notification } from '../types';

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
      default: return 'bg-gray-100 text-gray-700';
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
        <h3 className="text-xl font-bold text-gray-800">Thông báo & Tin nhắn</h3>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
        >
          <i className="fa-solid fa-paper-plane"></i>
          Gửi thông báo mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
            <i className="fa-solid fa-envelope-open text-4xl text-gray-200 mb-4"></i>
            <p className="text-gray-400">Chưa có thông báo nào được gửi.</p>
          </div>
        ) : (
          notifications.sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()).map(n => (
            <div key={n.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${getBadgeClass(n.type)}`}>
                <i className={`fa-solid ${n.type === 'promotion' ? 'fa-gift' : n.type === 'reminder' ? 'fa-bell' : 'fa-trophy'}`}></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-gray-800">{n.title}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getBadgeClass(n.type)}`}>
                    {getTypeName(n.type)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{n.content}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 font-medium">
                  <span className="flex items-center gap-1">
                    <i className="fa-regular fa-clock"></i>
                    {new Date(n.sentAt).toLocaleString('vi-VN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fa-solid fa-users"></i>
                    Đã gửi đến {n.targetCount} người chơi
                  </span>
                </div>
              </div>
              <button className="text-gray-300 hover:text-red-500 p-2 ml-auto">
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Soạn thông báo</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Loại thông báo</label>
                <div className="grid grid-cols-3 gap-2">
                  {['promotion', 'reminder', 'tournament'].map(t => (
                    <button
                      key={t}
                      onClick={() => setForm({...form, type: t as any})}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        form.type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-500 border-gray-100'
                      }`}
                    >
                      {getTypeName(t)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Tiêu đề *</label>
                <input 
                  type="text"
                  placeholder="Tiêu đề thông báo..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Nội dung thông báo *</label>
                <textarea 
                  rows={4}
                  placeholder="Nhập nội dung chi tiết..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  value={form.content}
                  onChange={e => setForm({...form, content: e.target.value})}
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
                <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Thông báo này sẽ được gửi tự động qua App người chơi và SMS cho các thành viên đã đăng ký.
                </p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 font-bold text-gray-500">Hủy</button>
              <button 
                onClick={handleSend}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20"
              >
                Gửi ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManager;
