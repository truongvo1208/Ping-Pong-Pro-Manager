
import React, { useState, useMemo } from 'react';
import { Club, Session, Expense, MembershipPayment, Service, SessionService, SubscriptionPayment } from '../../types';
import Reports from '../Reports';

interface GlobalReportsProps {
  clubs: Club[];
  sessions: Session[];
  expenses: Expense[];
  membershipPayments: MembershipPayment[];
  services: Service[];
  sessionServices: SessionService[];
  subscriptionPayments: SubscriptionPayment[];
}

const GlobalReports: React.FC<GlobalReportsProps> = ({ 
  clubs, sessions, expenses, membershipPayments, services, sessionServices
}) => {
  const [selectedClubId, setSelectedClubId] = useState<string>('all');

  const filteredClubs = useMemo(() => clubs.filter(c => c.role === 'CLUB_ADMIN'), [clubs]);

  const clubSessions = useMemo(() => 
    selectedClubId === 'all' ? sessions : sessions.filter(s => s.clubId === selectedClubId), 
  [sessions, selectedClubId]);

  const clubExpenses = useMemo(() => 
    selectedClubId === 'all' ? expenses : expenses.filter(e => e.clubId === selectedClubId), 
  [expenses, selectedClubId]);

  const clubMembershipPayments = useMemo(() => 
    selectedClubId === 'all' ? membershipPayments : membershipPayments.filter(m => m.clubId === selectedClubId), 
  [membershipPayments, selectedClubId]);

  const clubServices = useMemo(() => 
    selectedClubId === 'all' ? services : services.filter(s => s.clubId === selectedClubId), 
  [services, selectedClubId]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-200">
            <i className="fa-solid fa-earth-asia text-2xl"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Báo cáo vận hành</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Theo dõi hiệu quả kinh doanh của các cơ sở trong hệ thống</p>
          </div>
        </div>

        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 max-w-sm w-full">
          <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
            <i className="fa-solid fa-filter text-xs"></i>
          </div>
          <select 
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
            className="flex-1 bg-transparent border-none font-black text-[11px] outline-none focus:ring-0 cursor-pointer text-slate-600 uppercase tracking-widest"
          >
            <option value="all">TẤT CẢ CƠ SỞ (TOÀN HỆ THỐNG)</option>
            {filteredClubs.map(club => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
        <Reports 
          sessions={clubSessions}
          expenses={clubExpenses}
          membershipPayments={clubMembershipPayments}
          services={clubServices}
          sessionServices={sessionServices}
        />
      </div>
    </div>
  );
};

export default GlobalReports;
