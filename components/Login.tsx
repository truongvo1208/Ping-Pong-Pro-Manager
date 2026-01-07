
import React, { useState, useEffect, useCallback } from 'react';
import { Club } from '../types';
import { API } from '../api/client';
import LoadingOverlay from './LoadingOverlay';

interface LoginProps {
  onLogin: (club: Club) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [dbInfo, setDbInfo] = useState({ message: '', latency: 0 });

  const checkConnection = useCallback(async () => {
    setDbStatus('checking');
    const result = await API.system.testConnection();
    if (result.success) {
      setDbStatus('online');
      setDbInfo({ message: result.message, latency: result.latency || 0 });
    } else {
      setDbStatus('offline');
      setDbInfo({ message: result.message, latency: 0 });
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dbStatus === 'offline') {
      setError(`Không thể đăng nhập: Database đang ngoại tuyến. (${dbInfo.message})`);
      return;
    }
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const clubData = await API.auth.login(username, password);
      setIsLoading(false);
      onLogin(clubData);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Lỗi đăng nhập.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {isLoading && <LoadingOverlay message="Đang xác thực tài khoản..." />}
      
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-600/30 mb-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <i className="fa-solid fa-table-tennis-paddle-ball text-4xl text-white relative z-10"></i>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">PingPong Pro</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${
              dbStatus === 'online' ? 'bg-green-500 animate-pulse' : 
              dbStatus === 'offline' ? 'bg-red-500' : 'bg-gray-400'
            }`}></div>
            <p className="text-slate-400 italic text-sm">Giao diện quản lý Cloud (SPA)</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Tài khoản</label>
              <input 
                type="text" 
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-gray-300"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Mật khẩu</label>
              <input 
                type="password" 
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-gray-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 border border-red-100 animate-in fade-in slide-in-from-top-1">
                <i className="fa-solid fa-triangle-exclamation text-base mt-0.5"></i>
                <span className="flex-1">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={dbStatus === 'checking' || dbStatus === 'offline'}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3 active:scale-95 group text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dbStatus === 'checking' ? 'ĐANG KIỂM TRA...' : dbStatus === 'offline' ? 'DATABASE OFFLINE' : 'ĐĂNG NHẬP NGAY'}
              <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-50">
             <div className="flex flex-col items-center gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    dbStatus === 'online' ? 'text-green-600' : 
                    dbStatus === 'offline' ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {dbStatus === 'online' ? `Online (${dbInfo.latency}ms)` : 
                     dbStatus === 'offline' ? 'Kết nối thất bại' : 'Đang đồng bộ...'}
                  </span>
                  {dbStatus === 'offline' && (
                    <button 
                      onClick={checkConnection}
                      className="text-[10px] bg-gray-100 px-2 py-1 rounded-md font-bold text-gray-500 hover:bg-gray-200"
                    >
                      THỬ LẠI
                    </button>
                  )}
                </div>
                {dbStatus === 'offline' && (
                  <p className="text-[9px] text-red-400 text-center px-4 leading-tight">{dbInfo.message}</p>
                )}
             </div>
             
             <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest text-center mb-4">Lối tắt dùng thử</p>
             <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => {setUsername('admin_supper'); setPassword('M@i250563533');}}
                  className="text-[9px] bg-slate-900 text-white px-3 py-2 rounded-xl font-bold hover:bg-black transition-all"
                >
                  SUPER ADMIN
                </button>
                <button 
                  type="button"
                  onClick={() => {setUsername('admin_sg'); setPassword('admin');}}
                  className="text-[9px] bg-blue-50 text-blue-600 px-3 py-2 rounded-xl font-bold hover:bg-blue-100 transition-all"
                >
                  CLB 3T ADMIN
                </button>
             </div>
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-[10px] mt-8 uppercase font-bold tracking-widest opacity-50">
          Supabase Cloud Engine v2.0
        </p>
      </div>
    </div>
  );
};

export default Login;
