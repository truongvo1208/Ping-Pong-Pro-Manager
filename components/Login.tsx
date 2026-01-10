
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
        let { data, error } = await supabase
          .from('clubs')
          .select('email, hotline')
          .eq('username', 'sadmin')
          .maybeSingle();

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex items-center justify-center p-6 relative overflow-hidden font-sans text-slate-800">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] bg-blue-600/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[50vw] h-[50vw] bg-indigo-600/5 rounded-full blur-[120px]"></div>
      </div>

      {isLoading && <LoadingOverlay message="Đang xác thực bảo mật..." />}
      
      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4 ring-4 ring-slate-900/50">
            <i className="fa-solid fa-table-tennis-paddle-ball text-3xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">PingPong Pro</h1>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em] mt-1 opacity-80">Management System</p>
        </div>

        {/* Main Card */}
        <div className="w-full bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in duration-300 ring-1 ring-white/10">
          <div className="p-8 pb-6">
            <form onSubmit={handleLogin} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tài khoản</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                    <i className="fa-solid fa-user text-sm"></i>
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-700 placeholder:text-slate-300 hover:border-slate-300"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mật khẩu</label>
                  <button type="button" onClick={() => setShowContactAdmin(true)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline">
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                    <i className="fa-solid fa-lock text-sm"></i>
                  </div>
                  <input 
                    type="password" 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-700 placeholder:text-slate-300 hover:border-slate-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-start gap-2.5 border border-red-100 animate-in fade-in slide-in-from-top-1">
                  <i className="fa-solid fa-circle-exclamation text-sm mt-0.5 shrink-0"></i>
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] mt-2 group"
                disabled={isLoading}
              >
                <span>Đăng nhập hệ thống</span>
                <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
              </button>
            </form>
          </div>

          {/* Quick Access Area */}
          <div className="bg-slate-50 border-t border-slate-100 p-6 pt-5">
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
              Chưa có tài khoản?
            </p>
            <button
              type="button"
              onClick={() => quickLogin('demopro', 'demopro@123')}
              className="w-full py-3 bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-100 hover:border-indigo-200 flex items-center justify-center gap-2 group/demo shadow-sm hover:shadow-md"
            >
              <i className="fa-solid fa-crown text-amber-500 group-hover/demo:scale-110 transition-transform"></i>
              TRẢI NGHIỆM BẢN DEMO PRO
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-[10px] text-slate-300 font-medium">
                Phiên bản Enterprise 1.0.9 &copy; 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal liên hệ Super Admin */}
      {showContactAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 text-center border border-white/10">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-sm">
              <i className="fa-solid fa-headset text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Hỗ trợ kỹ thuật</h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-6 font-medium">
              Vui lòng liên hệ trực tiếp với bộ phận <strong>Super Admin</strong> để yêu cầu cấp lại mật khẩu hoặc khôi phục tài khoản.
            </p>
            <div className="space-y-3 mb-6">
              <a href={`mailto:${adminContact.email}`} className="bg-slate-50 p-3.5 rounded-xl flex items-center gap-3 text-left border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-500 shadow-sm border border-slate-50">
                   <i className="fa-solid fa-envelope"></i>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-400">Email</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{adminContact.email}</p>
                </div>
              </a>
              <a href={`tel:${adminContact.hotline}`} className="bg-slate-50 p-3.5 rounded-xl flex items-center gap-3 text-left border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-500 shadow-sm border border-slate-50">
                   <i className="fa-solid fa-phone"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-400">Hotline</p>
                  <p className="text-xs font-bold text-slate-700">{adminContact.hotline}</p>
                </div>
              </a>
            </div>
            <button 
              onClick={() => setShowContactAdmin(false)}
              className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 text-xs"
            >
              QUAY LẠI ĐĂNG NHẬP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
