
import React, { useState } from 'react';
import { Club } from '../../types';

interface ClubManagerProps {
  clubs: Club[];
  onAddClub: (club: Partial<Club>) => void;
  onUpdateClub: (id: string, club: Partial<Club>) => void;
  onDeleteClub: (id: string) => void;
}

const ClubManager: React.FC<ClubManagerProps> = ({ clubs, onAddClub, onUpdateClub, onDeleteClub }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [form, setForm] = useState({ name: '', username: '', password: '', status: 'active' as any });

  const handleOpenAdd = () => {
    setEditingClub(null);
    setForm({ name: '', username: '', password: '', status: 'active' });
    setShowAdd(true);
  };

  const handleOpenEdit = (club: Club) => {
    setEditingClub(club);
    setForm({ name: club.name, username: club.username, password: club.password || '', status: club.status });
    setShowAdd(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClub) {
      onUpdateClub(editingClub.id, form);
    } else {
      onAddClub(form);
    }
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Hệ thống các cơ sở</h2>
        <button 
          onClick={handleOpenAdd}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <i className="fa-solid fa-plus"></i> Thêm cơ sở mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.filter(c => c.role === 'club').map(club => (
          <div key={club.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
                <i className="fa-solid fa-building"></i>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${club.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {club.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-1">{club.name}</h3>
            <p className="text-xs text-gray-400 font-medium mb-4">ID: {club.id}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Username:</span>
                <span className="font-bold text-gray-700">{club.username}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Mật khẩu:</span>
                <span className="font-mono text-gray-500">********</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-50">
              <button 
                onClick={() => handleOpenEdit(club)}
                className="flex-1 py-2.5 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                Chỉnh sửa
              </button>
              <button 
                onClick={() => { if(window.confirm("Xóa cơ sở này?")) onDeleteClub(club.id); }}
                className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-300 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-800">{editingClub ? 'Cập nhật cơ sở' : 'Thêm cơ sở mới'}</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tên cơ sở / Câu lạc bộ</label>
                <input 
                  required
                  type="text"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tên đăng nhập</label>
                  <input 
                    required
                    type="text"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    value={form.username}
                    onChange={e => setForm({...form, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mật khẩu</label>
                  <input 
                    required
                    type="text"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Trạng thái</label>
                <select 
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value as any})}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm ngừng</option>
                </select>
              </div>
            </div>
            <div className="p-8 bg-gray-50 flex gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 font-black text-gray-400 text-sm">HỦY</button>
              <button 
                type="submit"
                className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 text-sm"
              >
                {editingClub ? 'CẬP NHẬT' : 'TẠO CƠ SỞ'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClubManager;
