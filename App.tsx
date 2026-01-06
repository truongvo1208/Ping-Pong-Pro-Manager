
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Club, Player, Service, Session, SessionStatus, 
  Expense, ViewType, SessionService, Notification, MembershipPayment, ServiceStatus
} from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PlayerManager from './components/PlayerManager';
import ServiceManager from './components/ServiceManager';
import ExpenseManager from './components/ExpenseManager';
import Reports from './components/Reports';
import NotificationManager from './components/NotificationManager';
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [membershipPayments, setMembershipPayments] = useState<MembershipPayment[]>([]);

  // Improved loading wrapper
  const withLoading = async (action: () => Promise<any>, message: string = 'Đang xử lý...') => {
    setLoadingMessage(message);
    setIsLoading(true);
    try {
      return await action();
    } catch (error: any) {
      console.error("Lỗi API:", error);
      alert("Lỗi: " + (error.message || "Không thể thực hiện yêu cầu."));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    await withLoading(async () => {
      try {
        const clubIdParam = currentUser.role === 'superadmin' ? '' : currentUser.id;
        
        if (currentUser.role === 'superadmin') {
          const allClubs = await API.clubs.list();
          setClubs(allClubs);
        }

        const [clubPlayers, clubServices, clubSessions, clubExpenses] = await Promise.all([
          API.players.list(clubIdParam),
          API.services.list(clubIdParam),
          API.sessions.list(clubIdParam),
          API.expenses.list(clubIdParam)
        ]);

        setPlayers(clubPlayers);
        setServices(clubServices);
        setSessions(clubSessions);
        setExpenses(clubExpenses);

        // Extract and flatten all session services for global state
        // Backend returns: Session { sessionServices: SessionService[] }
        const allSS = clubSessions.flatMap((s: any) => s.sessionServices || []);
        setSessionServices(allSS);

      } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ API:", error);
      }
    }, 'Đang cập nhật dữ liệu...');
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- CLUB HANDLERS (SUPER ADMIN) ---
  const handleAddClub = (clubData: Partial<Club>) => {
    withLoading(async () => {
      const created = await API.clubs.create({ ...clubData, role: 'club' });
      setClubs(prev => [created, ...prev]);
    }, 'Đang tạo cơ sở mới...');
  };

  const handleUpdateClub = (id: string, clubData: Partial<Club>) => {
    withLoading(async () => {
      const updated = await API.clubs.update(id, clubData);
      setClubs(prev => prev.map(c => c.id === id ? updated : c));
    }, 'Đang cập nhật thông tin...');
  };

  const handleDeleteClub = (id: string) => {
    withLoading(async () => {
      await API.clubs.remove(id);
      setClubs(prev => prev.filter(c => c.id !== id));
    }, 'Đang xóa cơ sở...');
  };

  // --- PLAYER HANDLERS ---
  const handleAddPlayer = async (p: Partial<Player>) => {
    if (!currentUser) return;
    return withLoading(async () => {
      const created = await API.players.create({
        ...p,
        clubId: currentUser.role === 'superadmin' ? p.clubId : currentUser.id
      });
      setPlayers(prev => [created, ...prev]);
      return created;
    }, 'Đang đăng ký người chơi...');
  };

  const handleUpdatePlayer = (p: Player) => {
    withLoading(async () => {
      const updated = await API.players.update(p.id, p);
      setPlayers(prev => prev.map(x => x.id === p.id ? updated : x));
    }, 'Đang lưu thay đổi...');
  };

  const handleUpdateServices = (updatedServices: Service[]) => {
    withLoading(async () => {
      const oldServices = [...services];
      setServices(updatedServices);
      for (const s of updatedServices) {
        const oldS = oldServices.find(os => os.id === s.id);
        if (!oldS) {
          await API.services.create({...s, clubId: currentUser?.id});
        } else if (JSON.stringify(oldS) !== JSON.stringify(s)) {
          await API.services.update(s.id, s);
        }
      }
    }, 'Đang đồng bộ danh mục dịch vụ...');
  };

  const handleLogin = (club: Club) => {
    setCurrentUser(club);
    setCurrentView(club.role === 'superadmin' ? 'admin-clubs' : 'dashboard');
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
    setClubs([]);
    setPlayers([]);
    setServices([]);
    setSessions([]);
    setSessionServices([]);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const isSuperAdmin = currentUser.role === 'superadmin';

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden relative font-sans">
      <Sidebar 
        currentView={currentView} 
        setView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} 
        clubName={currentUser.name}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={currentUser.role}
      />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        {/* Global Loading Overlay */}
        {isLoading && <LoadingOverlay message={loadingMessage} />}

        <div className="w-full max-w-7xl mx-auto">
          {isSuperAdmin ? (
            <>
              {currentView === 'admin-clubs' && (
                <ClubManager 
                  clubs={clubs} 
                  onAddClub={handleAddClub}
                  onUpdateClub={handleUpdateClub}
                  onDeleteClub={handleDeleteClub}
                />
              )}
              {currentView === 'admin-reports' && <GlobalReports clubs={clubs} sessions={sessions} expenses={expenses} membershipPayments={membershipPayments} services={services} sessionServices={sessionServices} />}
              {currentView === 'players' && <PlayerManager players={players} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onAddMembershipPayment={() => {}} readOnly />}
              {currentView === 'history' && <HistoryView sessions={sessions.filter(s => s.status === SessionStatus.FINISHED)} players={players} services={services} sessionServices={sessionServices} />}
            </>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <Dashboard 
                  players={players} 
                  services={services} 
                  sessions={sessions} 
                  sessionServices={sessionServices}
                  onAddPlayer={handleAddPlayer}
                  onAddSession={(s) => {
                    withLoading(async () => {
                      const created = await API.sessions.checkIn(currentUser.id, s.playerId);
                      setSessions(prev => [created, ...prev]);
                    }, 'Đang thực hiện Check-in...');
                  }}
                  onUpdateSession={(s, total) => {
                    withLoading(async () => {
                      await API.sessions.checkOut(s.id, total);
                      setSessions(prev => prev.map(x => x.id === s.id ? {...s, totalAmount: total, status: SessionStatus.FINISHED, checkOutTime: new Date().toISOString()} : x));
                    }, 'Đang hoàn tất thanh toán...');
                  }}
                  onAddSessionService={(ss) => {
                    withLoading(async () => {
                      const created = await API.sessions.addService(ss.sessionId, ss);
                      setSessionServices(prev => [...prev, created]);
                    }, 'Đang thêm dịch vụ...');
                  }} 
                  onRemoveSessionService={(id) => setSessionServices(prev => prev.filter(x => x.id !== id))}
                />
              )}
              {currentView === 'players' && <PlayerManager players={players} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onAddMembershipPayment={(mp) => { withLoading(async () => { await API.membership.create({...mp, clubId: currentUser.id}); fetchData(); }, 'Đang ghi nhận đóng tiền tháng...'); }} />}
              {currentView === 'expenses' && <ExpenseManager clubId={currentUser.id} expenses={expenses} onAddExpense={(e) => { withLoading(async () => { const created = await API.expenses.create({...e, clubId: currentUser.id}); setExpenses(prev => [created, ...prev]); }, 'Đang lưu khoản chi...'); }} onRemoveExpense={(id) => { withLoading(async () => { await API.expenses.remove(id); setExpenses(prev => prev.filter(x => x.id !== id)); }, 'Đang xóa bản ghi chi tiêu...'); }} />}
              {currentView === 'reports' && <Reports sessions={sessions} expenses={expenses} membershipPayments={membershipPayments} services={services} sessionServices={sessionServices} />}
              {currentView === 'history' && <HistoryView sessions={sessions.filter(s => s.status === 'finished')} players={players} services={services} sessionServices={sessionServices} />}
              {currentView === 'services' && <ServiceManager clubId={currentUser.id} services={services} onUpdateServices={handleUpdateServices} />}
              {currentView === 'notifications' && <NotificationManager clubId={currentUser.id} notifications={notifications} onSend={(n) => setNotifications(prev => [n, ...prev])} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
