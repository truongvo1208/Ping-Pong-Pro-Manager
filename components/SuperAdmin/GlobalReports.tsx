
import React, { useState, useMemo } from 'react';
import { Club, Session, Expense, MembershipPayment, Service, SessionService } from '../../types';
import Reports from '../Reports';

interface GlobalReportsProps {
  clubs: Club[];
  sessions: Session[];
  expenses: Expense[];
  membershipPayments: MembershipPayment[];
  services: Service[];
  sessionServices: SessionService[];
}

const GlobalReports: React.FC<GlobalReportsProps> = ({ 
  clubs, sessions, expenses, membershipPayments, services, sessionServices 
}) => {
  const [selectedClubId, setSelectedClubId] = useState<string>('all');

  const filteredClubs = clubs.filter(c => c.role === 'club');

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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800">Thống kê toàn hệ thống</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">
            {selectedClubId === 'all' ? 'Tất cả cơ sở' : clubs.find(c => c.id === selectedClubId)?.name}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-black text-gray-400 uppercase whitespace-nowrap">Chọn cơ sở:</label>
          <select 
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
            className="flex-1 md:w-64 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
          >
            <option value="all">Tổng hợp toàn hệ thống</option>
            {filteredClubs.map(club => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </select>
        </div>
      </div>

      <Reports 
        sessions={clubSessions}
        expenses={clubExpenses}
        membershipPayments={clubMembershipPayments}
        services={clubServices}
        sessionServices={sessionServices}
      />
    </div>
  );
};

export default GlobalReports;
