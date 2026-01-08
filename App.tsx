
import React, { useState, useEffect, useCallback } from 'react';
import { API } from './api/client';
import { 
  Club, Player, Service, Session, SessionService, 
  ViewType, SessionStatus 
} from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PlayerManager from './components/PlayerManager';
import ServiceManager from './components/ServiceManager';
import ExpenseManager from './components/ExpenseManager';
import HistoryView from './components/HistoryView';
import Reports from './components/Reports';
import Login from './components/Login';
import ClubManager from './components/SuperAdmin/ClubManager';
import SaaSReports from './components/SuperAdmin/SaaSReports';
import GlobalReports from './components/SuperAdmin/GlobalReports';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Club | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionServices, setSessionServices] = useState<SessionService[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [membershipPayments, setMembershipPayments] = useState<any[]>([]);
  const [subscriptionPayments, setSubscriptionPayments] = useState<any[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const withLoading = async (fn: () => Promise<void>, message = 'Đang xử lý...') => {
    setLoadingMessage(message);
    setIsLoading(true);
    try {
      await fn();
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const isSuper = currentUser.role === 'SUPER_ADMIN';
      const clubId = isSuper ? undefined : currentUser.id;

      const [p, s, sess, ex, mem] = await Promise.all([
        API.players.list(clubId),
        API.services.list(clubId),
        API.sessions.list(clubId),
        API.expenses.list(clubId),
        API.membership.list(clubId)
      ]);

      setPlayers(p);
      setServices(s);
      
      // API returns camelCase data via mapToCamel
      // session_services (db) -> sessionServices (camel)
      const flatSessions: Session[] = sess.map(s => {
        const { sessionServices, ...rest } = s; 
        return rest;
      });
      const allSS: SessionService[] = sess.flatMap(s => s.sessionServices || []);
      
      setSessions(flatSessions);
      setSessionServices(allSS);
      setExpenses(ex);
      setMembershipPayments(mem);

      if (isSuper) {
        const [c, sub] = await Promise.all([
          API.clubs.list(),
          API.subscriptions.list()
        ]);
        setClubs(c);
        setSubscriptionPayments(sub);
      }
    } catch (error) {
      console.error("Fetch Data Error:", error);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    // Clear all session data state
    setPlayers([]);
    setServices([]);
    setSessions([]);
    setSessionServices([]);
    setExpenses([]);
    setMembershipPayments([]);
    setSubscriptionPayments([]);
    setClubs([]);
    
    // Reset UI state
    setCurrentView('dashboard');
    setIsSidebarOpen(false);
    
    // Remove user
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLogin={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      
      <Sidebar 
        currentView={currentView}
        setView={setCurrentView}
        clubName={currentUser.name}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={currentUser.role}
        subscriptionTier={currentUser.subscriptionTier}
        subscriptionEndDate={currentUser.subscriptionEndDate}
      />

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen">
        <header className="flex items-center justify-between mb-8 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <i className="fa-solid fa-bars"></i>
            </button>
            <div className="flex items-center gap-2">
                <i className="fa-solid fa-table-tennis-paddle-ball text-blue-600 text-xl"></i>
                <span className="font-black text-lg">PingPong Pro</span>
            </div>
            <div className="w-10"></div>
        </header>

        {currentView === 'dashboard' && (
          <Dashboard 
            role={currentUser.role}
            players={players} 
            services={services} 
            sessions={sessions} 
            sessionServices={sessionServices}
            onAddPlayer={(p) => withLoading(async () => { 
              const newPlayer = await API.players.create({...p, clubId: currentUser.id}); 
              await API.sessions.checkIn(currentUser.id, newPlayer.id);
              fetchData(); 
            }, 'Đang thêm và Check-in...')}
            onAddSession={(s) => withLoading(async () => { await API.sessions.checkIn(currentUser.id, s.playerId!); fetchData(); }, 'Check-in...')}
            onUpdateSession={(s, total) => withLoading(async () => { await API.sessions.checkOut(s.id, total); fetchData(); }, 'Thanh toán...')}
            onAddSessionService={(ss) => withLoading(async () => { await API.sessions.addService(ss.sessionId!, ss); fetchData(); }, 'Thêm dịch vụ...')} 
            onUpdateSessionService={(ss) => withLoading(async () => { await API.sessions.updateService(ss.id, ss.quantity, ss.totalAmount); fetchData(); }, 'Cập nhật số lượng...')}
            onRemoveSessionService={(id) => withLoading(async () => { await API.sessions.removeService(id); fetchData(); }, 'Xóa dịch vụ...')}
          />
        )}

        {currentView === 'players' && (
          <PlayerManager 
            players={players}
            membershipPayments={membershipPayments}
            sessions={sessions}
            onAddPlayer={(p) => withLoading(async () => { await API.players.create({...p, clubId: currentUser.id}); fetchData(); }, 'Thêm người chơi...')}
            onUpdatePlayer={(p) => withLoading(async () => { await API.players.update(p.id, p); fetchData(); }, 'Cập nhật...')}
            onAddMembershipPayment={(m) => withLoading(async () => { await API.membership.create({...m, clubId: currentUser.id}); fetchData(); }, 'Gia hạn...')}
            clubs={clubs}
          />
        )}

        {currentView === 'services' && (
          <ServiceManager 
            clubId={currentUser.id}
            services={services}
            onAddService={(s) => withLoading(async () => { await API.services.create({...s, clubId: currentUser.id}); fetchData(); }, 'Thêm dịch vụ mới...')}
            onUpdateService={(s) => withLoading(async () => { await API.services.update(s.id, s); fetchData(); }, 'Cập nhật dịch vụ...')}
          />
        )}

        {currentView === 'expenses' && (
          <ExpenseManager 
            clubId={currentUser.id}
            expenses={expenses}
            onAddExpense={(e) => withLoading(async () => { await API.expenses.create({...e, clubId: currentUser.id}); fetchData(); })}
            onUpdateExpense={(e) => withLoading(async () => { await API.expenses.update(e.id, e); fetchData(); })}
            onRemoveExpense={(id) => withLoading(async () => { await API.expenses.remove(id); fetchData(); })}
          />
        )}

        {currentView === 'history' && (
          <HistoryView 
            sessions={sessions.filter(s => s.status === 'finished')}
            players={players}
            sessionServices={sessionServices}
            services={services}
            clubs={clubs}
          />
        )}

        {currentView === 'reports' && (
          <Reports 
            sessions={sessions.filter(s => s.status === 'finished')}
            expenses={expenses}
            membershipPayments={membershipPayments}
            services={services}
            sessionServices={sessionServices}
          />
        )}

        {currentView === 'admin-clubs' && (
          <ClubManager 
            clubs={clubs}
            subscriptionPayments={subscriptionPayments}
            onAddClub={(c) => withLoading(async () => { await API.clubs.create(c); fetchData(); })}
            onUpdateClub={(id, c) => withLoading(async () => { await API.clubs.update(id, c); fetchData(); })}
            onDeleteClub={(id) => withLoading(async () => { await API.clubs.remove(id); fetchData(); })}
            onAddSubscriptionPayment={(p) => withLoading(async () => { await API.subscriptions.create(p); fetchData(); })}
          />
        )}

        {currentView === 'admin-saas' && (
          <SaaSReports clubs={clubs} subscriptionPayments={subscriptionPayments} />
        )}

        {currentView === 'admin-reports' && (
          <GlobalReports 
            clubs={clubs}
            sessions={sessions}
            expenses={expenses}
            membershipPayments={membershipPayments}
            services={services}
            sessionServices={sessionServices}
            subscriptionPayments={subscriptionPayments}
          />
        )}
      </main>
    </div>
  );
};

export default App;
