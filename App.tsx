
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Club, Player, Service, Session, SessionStatus, 
  Expense, ViewType, SessionService, MembershipPayment, ServiceStatus
} from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PlayerManager from './components/PlayerManager';
import ServiceManager from './components/ServiceManager';
import ExpenseManager from './components/ExpenseManager';
import Reports from './components/Reports';
import HistoryView from './components/HistoryView';
import Login from './components/Login';
import ClubManager from './components/SuperAdmin/ClubManager';
import GlobalReports from './components/SuperAdmin/GlobalReports';
import LoadingOverlay from './components/LoadingOverlay';
import { API } from './api/client';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Club | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Đang tải...');
  
  const [clubs, setClubs] = useState<Club[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionServices, setSessionServices] = useState<SessionService[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [membershipPayments, setMembershipPayments] = useState<MembershipPayment[]>([]);

  // RBAC logic - Bảo vệ các View dựa trên role
  useEffect(() => {
    if (currentUser) {
      const isSuper = currentUser.role === 'SUPER_ADMIN';
      const superOnlyViews: ViewType[] = ['admin-clubs', 'admin-reports'];
      const clubOnlyViews: ViewType[] = ['dashboard', 'services', 'expenses', 'reports'];

      if (!isSuper && superOnlyViews.includes(currentView)) {
        setCurrentView('dashboard');
      } 
      else if (isSuper && clubOnlyViews.includes(currentView)) {
        setCurrentView('admin-clubs');
      }
    }
  }, [currentUser, currentView]);

  const withLoading = async (action: () => Promise<any>, message: string = 'Đang xử lý...') => {
    setLoadingMessage(message);
    setIsLoading(true);
    try {
      const res = await action();
      return res;
    } catch (error: any) {
      console.error("[App Error]", error);
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi hệ thống.";
      alert(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    
    const isSuper = currentUser.role === 'SUPER_ADMIN';
    const clubIdParam = isSuper ? undefined : currentUser.id;
    
    try {
      const [allClubs, allPlayers, allServices, allSessions, allExpenses, allMembership] = await Promise.all([
        isSuper ? API.clubs.list() : Promise.resolve([]),
        API.players.list(clubIdParam),
        API.services.list(clubIdParam),
        API.sessions.list(clubIdParam),
        API.expenses.list(clubIdParam),
        API.membership.list(clubIdParam)
      ]);

      setClubs(allClubs);
      setPlayers(allPlayers);
      setServices(allServices);
      setSessions(allSessions);
      setExpenses(allExpenses);
      setMembershipPayments(allMembership);
      
      const flattenedSS = allSessions.flatMap((s: any) => s.sessionServices || []);
      setSessionServices(flattenedSS);
    } catch (e: any) {
      console.error("Fetch data error:", e);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  const handleLogin = (club: Club) => {
    setCurrentUser(club);
    if (club.role === 'SUPER_ADMIN') {
      setCurrentView('admin-clubs');
    } else {
      setCurrentView('dashboard');
    }
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
    setIsSidebarOpen(false);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const isSuper = currentUser.role === 'SUPER_ADMIN';

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden relative font-sans">
      {/* Overlay cho mobile khi sidebar mở */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[45] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <Sidebar 
        currentView={currentView} 
        setView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} 
        clubName={currentUser.name}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={currentUser.role}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0 z-40">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSuper ? 'bg-indigo-600' : 'bg-blue-600'}`}>
              <i className="fa-solid fa-table-tennis-paddle-ball text-white text-sm"></i>
            </div>
            <span className="font-black text-slate-800 tracking-tight text-sm truncate max-w-[150px]">
              {isSuper ? 'Hệ thống Admin' : currentUser.name}
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-gray-50 text-slate-600 flex items-center justify-center hover:bg-gray-100 transition-all active:scale-95"
          >
            <i className="fa-solid fa-bars-staggered text-lg"></i>
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full custom-scrollbar">
          {isLoading && <LoadingOverlay message={loadingMessage} />}

          <div className="w-full max-w-7xl mx-auto">
            {isSuper ? (
              <div className="space-y-6">
                {currentView === 'admin-clubs' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ClubManager 
                      clubs={clubs} 
                      onAddClub={(data) => withLoading(async () => { await API.clubs.create({...data, role: 'CLUB_ADMIN'}); fetchData(); }, 'Đang tạo cơ sở...')} 
                      onUpdateClub={(id, data) => withLoading(async () => { await API.clubs.update(id, data); fetchData(); }, 'Đang cập nhật...')} 
                      onDeleteClub={(id) => withLoading(async () => { await API.clubs.update(id, { status: 'inactive' }); fetchData(); }, 'Đang tạm khóa cơ sở...')} 
                    />
                  </div>
                )}

                {currentView === 'admin-reports' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GlobalReports 
                      clubs={clubs} 
                      sessions={sessions} 
                      expenses={expenses} 
                      membershipPayments={membershipPayments} 
                      services={services} 
                      sessionServices={sessionServices} 
                    />
                  </div>
                )}

                {currentView === 'players' && (
                  <PlayerManager 
                    players={players} 
                    membershipPayments={membershipPayments}
                    sessions={sessions}
                    onAddPlayer={async () => {}} 
                    onUpdatePlayer={async () => {}} 
                    onAddMembershipPayment={() => {}} 
                    readOnly 
                    clubs={clubs}
                  />
                )}
                {currentView === 'history' && (
                  <HistoryView 
                    sessions={sessions.filter(s => s.status === SessionStatus.FINISHED)} 
                    players={players} 
                    services={services} 
                    sessionServices={sessionServices} 
                    clubs={clubs}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {currentView === 'dashboard' && (
                  <Dashboard 
                    players={players} 
                    services={services} 
                    sessions={sessions} 
                    sessionServices={sessionServices}
                    onAddPlayer={(p) => withLoading(async () => { await API.players.create({...p, clubId: currentUser.id}); fetchData(); }, 'Đang thêm...')}
                    onAddSession={(s) => withLoading(async () => { await API.sessions.checkIn(currentUser.id, s.playerId); fetchData(); }, 'Check-in...')}
                    onUpdateSession={(s, total) => withLoading(async () => { await API.sessions.checkOut(s.id, total); fetchData(); }, 'Thanh toán...')}
                    onAddSessionService={(ss) => withLoading(async () => { await API.sessions.addService(ss.sessionId, ss); fetchData(); }, 'Thêm dịch vụ...')} 
                    onRemoveSessionService={(id) => withLoading(async () => { await API.sessions.removeService(id); fetchData(); }, 'Xóa dịch vụ...')}
                  />
                )}

                {currentView === 'players' && (
                  <PlayerManager 
                    players={players} 
                    membershipPayments={membershipPayments}
                    sessions={sessions}
                    onAddPlayer={(p) => withLoading(async () => { await API.players.create({...p, clubId: currentUser.id}); fetchData(); }, 'Thêm người chơi...')} 
                    onUpdatePlayer={(p) => withLoading(async () => { await API.players.update(p.id, p); fetchData(); }, 'Đang lưu...')} 
                    onAddMembershipPayment={(mp) => withLoading(async () => { 
                      await API.membership.create({...mp, clubId: currentUser.id}); 
                      setPlayers(prev => prev.map(p => p.id === mp.playerId ? { ...p, membershipEndDate: mp.endDate } : p));
                      fetchData(); 
                    }, 'Gia hạn hội viên...')} 
                  />
                )}

                {currentView === 'services' && (
                  <ServiceManager 
                    clubId={currentUser.id} 
                    services={services} 
                    onUpdateServices={(updated) => withLoading(async () => { 
                      for(const s of updated) {
                        if(!services.find(os => os.id === s.id)) await API.services.create({...s, clubId: currentUser.id});
                        else await API.services.update(s.id, s);
                      }
                      fetchData();
                    }, 'Đang đồng bộ...')} 
                  />
                )}

                {currentView === 'expenses' && (
                  <ExpenseManager 
                    clubId={currentUser.id} 
                    expenses={expenses} 
                    onAddExpense={(e) => withLoading(async () => { await API.expenses.create({...e, clubId: currentUser.id}); fetchData(); }, 'Ghi chi tiêu...')} 
                    onUpdateExpense={(e) => withLoading(async () => { await API.expenses.update(e.id, e); fetchData(); }, 'Cập nhật chi tiêu...')}
                    onRemoveExpense={(id) => withLoading(async () => { await API.expenses.remove(id); fetchData(); }, 'Xóa chi tiêu...')} 
                  />
                )}

                {currentView === 'reports' && <Reports sessions={sessions} expenses={expenses} membershipPayments={membershipPayments} services={services} sessionServices={sessionServices} />}
                {currentView === 'history' && <HistoryView sessions={sessions.filter(s => s.status === SessionStatus.FINISHED)} players={players} services={services} sessionServices={sessionServices} />}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
