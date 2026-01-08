
import React, { useState, useEffect } from 'react';
import { Club } from '../types';
import { API, supabase } from '../api/client';
import LoadingOverlay from './LoadingOverlay';

interface LoginProps {
  onLogin: (club: Club) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [adminContact, setAdminContact] = useState<{ email: string; hotline: string }>({
    email: 'quangtruongspkt@gmail.com',
    hotline: '0904548458'
  });

  useEffect(() => {
    const fetchAdminContact = async () => {
      try {
        // Tìm theo username 'sadmin' (Tên đăng nhập mặc định của S-Admin)
        let { data, error } = await supabase
          .from('clubs')
          .select('email, hotline')
          .eq('username', 'sadmin')
          .maybeSingle();

        // Nếu không thấy, thử tìm theo role superadmin chung
        if (error || !data) {
          const { data: roleData } = await supabase
            .from('clubs')
            .select('email, hotline')
            .eq('role', 'SUPER_ADMIN')
            .limit(1)
            .maybeSingle();
          data = roleData;
        }

        if (data && (data.email || data.hotline)) {
          setAdminContact({
            email: data.email || 'quangtruongspkt@gmail.com',
            hotline: data.hotline || '0904548458'
          });
        }
      } catch (err) {
        console.error("Failed to fetch admin contact:", err);
      }
    };
    fetchAdminContact();
  }, []);

  const executeLogin = async (user: string, pass: string) => {
    setError('');
    setIsLoading(true);
    try {
      const clubData = await API.auth.login(user, pass);
      onLogin(clubData);
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      setError(err.message || 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    await executeLogin(username, password);
  };

  const quickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    await executeLogin(user, pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Hiệu ứng nền Blur nghệ thuật */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>

      {isLoading && <LoadingOverlay message="Đang xác thực tài khoản..." />}
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6 group hover:scale-105 transition-transform duration-500">
            <i className="fa-solid fa-table-tennis-paddle-ball text-5xl text-white"></i>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">PingPong Pro</h1>
          <p className="text-slate-400 font-medium text-sm uppercase tracking-[0.2em] opacity-80">Management System</p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/5 animate-in zoom-in duration-500">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Tài khoản thành viên
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                  <i className="fa-solid fa-circle-user text-lg"></i>
                </div>
                <input 
                  type="text" 
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Mật khẩu bảo mật
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                  <i className="fa-solid fa-shield-halved text-lg"></i>
                </div>
                <input 
                  type="password" 
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 border border-red-100 animate-in fade-in slide-in-from-top-1">
                <i className="fa-solid fa-circle-exclamation text-base mt-0.5"></i>
                <span className="flex-1 leading-relaxed">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-2xl shadow-slate-900/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group overflow-hidden relative"
              disabled={isLoading}
            >
              <span className="relative z-10">TIẾP TỤC ĐĂNG NHẬP</span>
              <i className="fa-solid fa-arrow-right-to-bracket text-sm relative z-10 group-hover:translate-x-1 transition-transform"></i>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {/* Quick Access Section for Demo */}
            <div className="pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">
                — TRUY CẬP NHANH (DEMO) —
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => quickLogin('demofree', 'demofree@123')}
                  className="flex-1 py-4 px-2 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black hover:bg-slate-600 hover:text-white transition-all shadow-sm border border-slate-100 flex flex-col items-center gap-1 group/demo"
                >
                  <i className="fa-solid fa-user text-xl mb-1 group-hover/demo:scale-110 transition-transform"></i>
                  ACCOUNT DEMO FREE
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('demopro', 'demopro@123')}
                  className="flex-1 py-4 px-2 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 flex flex-col items-center gap-1 group/demo"
                >
                  <i className="fa-solid fa-crown text-xl mb-1 group-hover/demo:scale-110 transition-transform"></i>
                  ACCOUNT DEMO PRO
                </button>
              </div>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50">
            <div className="flex flex-col items-center gap-6">
              <button 
                type="button" 
                onClick={() => setShowContactAdmin(true)}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                <i className="fa-solid fa-question-circle text-sm opacity-50"></i>
                Quên thông tin truy cập?
              </button>
              
              <div className="flex items-center gap-2 opacity-30">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                  Pro Enterprise
                </p>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal liên hệ Super Admin */}
      {showContactAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 text-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl mx-auto flex items-center justify-center mb-6">
              <i className="fa-solid fa-headset text-3xl"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Liên hệ Quản trị viên</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">
              Vui lòng liên hệ trực tiếp với bộ phận <strong>Super Admin</strong> để yêu cầu cấp lại mật khẩu hoặc khôi phục tài khoản cơ sở.
            </p>
            <div className="space-y-3 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 text-left border border-slate-100">
                <i className="fa-solid fa-envelope text-blue-500"></i>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email hỗ trợ</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{adminContact.email}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 text-left border border-slate-100">
                <i className="fa-solid fa-phone text-indigo-500"></i>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hotline</p>
                  <p className="text-sm font-bold text-slate-700">{adminContact.hotline}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowContactAdmin(false)}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl"
            >
              ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
