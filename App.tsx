
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

  const withLoading = async (action: () => Promise<any>, message: string = 'Đang xử lý...') => {
    setLoadingMessage(message);
    setIsLoading(true);
    try {
      const res = await action();
      return res;
    } catch (error: any) {
      console.error(error);
      alert("Lỗi: " + (error.message || "Đã xảy ra lỗi không xác định."));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    
    const clubIdParam = currentUser.role === 'superadmin' ? undefined : currentUser.id;
    
    try {
      const [allClubs, allPlayers, allServices, allSessions, allExpenses, allMembership] = await Promise.all([
        currentUser.role === 'superadmin' ? API.clubs.list() : Promise.resolve([]),
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
    } catch (e) {
      console.error("Fetch data error:", e);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  const handleAddClub = async (clubData: Partial<Club>) => {
    await withLoading(async () => {
      await API.clubs.create({ ...clubData, role: 'club', status: 'active' });
      await fetchData();
    }, 'Đang tạo cơ sở...');
  };

  const handleUpdateClub = async (id: string, clubData: Partial<Club>) => {
    await withLoading(async () => {
      await API.clubs.update(id, clubData);
      await fetchData();
    }, 'Đang cập nhật...');
  };

  const handleDeleteClub = async (id: string) => {
    await withLoading(async () => {
      await API.clubs.remove(id);
      await fetchData();
    }, 'Đang xóa...');
  };

  const handleAddPlayer = async (p: Partial<Player>) => {
    if (!currentUser) return;
    return await withLoading(async () => {
      const created = await API.players.create({
        ...p,
        clubId: currentUser.role === 'superadmin' ? (p.clubId || currentUser.id) : currentUser.id
      });
      await fetchData();
      return created;
    }, 'Đang đăng ký...');
  };

  const handleUpdatePlayer = async (p: Player) => {
    await withLoading(async () => {
      await API.players.update(p.id, p);
      await fetchData();
    }, 'Đang lưu...');
  };

  const handleUpdateServices = async (updatedServices: Service[]) => {
    await withLoading(async () => {
      for (const s of updatedServices) {
        const exists = services.find(os => os.id === s.id);
        if (!exists) {
          await API.services.create({...s, clubId: currentUser?.id});
        } else {
          await API.services.update(s.id, s);
        }
      }
      await fetchData();
    }, 'Đang đồng bộ dịch vụ...');
  };

  const handleLogin = (club: Club) => {
    setCurrentUser(club);
    setCurrentView(club.role === 'superadmin' ? 'admin-clubs' : 'dashboard');
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

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
        {isLoading && <LoadingOverlay message={loadingMessage} />}

        <div className="w-full max-w-7xl mx-auto">
          {currentUser.role === 'superadmin' ? (
            <>
              {currentView === 'admin-clubs' && <ClubManager clubs={clubs} onAddClub={handleAddClub} onUpdateClub={handleUpdateClub} onDeleteClub={handleDeleteClub} />}
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
                  onAddSession={async (s) => {
                    await withLoading(async () => {
                      await API.sessions.checkIn(currentUser.id, s.playerId);
                      await fetchData();
                    }, 'Check-in...');
                  }}
                  onUpdateSession={async (s, total) => {
                    await withLoading(async () => {
                      await API.sessions.checkOut(s.id, total);
                      await fetchData();
                    }, 'Thanh toán...');
                  }}
                  onAddSessionService={async (ss) => {
                    await withLoading(async () => {
                      await API.sessions.addService(ss.sessionId, ss);
                      await fetchData();
                    }, 'Thêm dịch vụ...');
                  }} 
                  onRemoveSessionService={async (id) => {
                    await withLoading(async () => {
                      await API.sessions.removeService(id);
                      await fetchData();
                    }, 'Đang xóa...');
                  }}
                />
              )}
              {currentView === 'players' && <PlayerManager players={players} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onAddMembershipPayment={async (mp) => { await withLoading(async () => { await API.membership.create({...mp, clubId: currentUser.id}); await fetchData(); }, 'Đóng tiền tháng...'); }} />}
              {currentView === 'expenses' && <ExpenseManager clubId={currentUser.id} expenses={expenses} onAddExpense={async (e) => { await withLoading(async () => { await API.expenses.create({...e, clubId: currentUser.id}); await fetchData(); }, 'Ghi chi tiêu...'); }} onRemoveExpense={async (id) => { await withLoading(async () => { await API.expenses.remove(id); await fetchData(); }, 'Xóa...'); }} />}
              {currentView === 'reports' && <Reports sessions={sessions} expenses={expenses} membershipPayments={membershipPayments} services={services} sessionServices={sessionServices} />}
              {currentView === 'history' && <HistoryView sessions={sessions.filter(s => s.status === SessionStatus.FINISHED)} players={players} services={services} sessionServices={sessionServices} />}
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
