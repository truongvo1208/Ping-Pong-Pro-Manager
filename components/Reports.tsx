
import React, { useState, useMemo } from 'react';
import { Session, Expense, MembershipPayment, Service, SessionService } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface ReportsProps {
  sessions: Session[];
  expenses: Expense[];
  membershipPayments: MembershipPayment[];
  services: Service[];
  sessionServices: SessionService[];
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const Reports: React.FC<ReportsProps> = ({ sessions, expenses, membershipPayments, services, sessionServices }) => {
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');

  // Tính toán dữ liệu biểu đồ
  const chartData = useMemo(() => {
    let periods = [];
    if (timeFilter === 'day') {
      periods = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { label: d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }), date: d };
      });
    } else if (timeFilter === 'week') {
      periods = [...Array(4)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (3 - i) * 7);
        return { label: `Tuần ${4 - (3 - i)}`, date: d };
      });
    } else {
      periods = [...Array(6)].map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return { label: `Tháng ${d.getMonth() + 1}`, date: d };
      });
    }

    return periods.map(p => {
      let sessionRevenue = 0;
      let membershipRevenue = 0;
      let exp = 0;
      let count = 0;

      if (timeFilter === 'day') {
        const dayStr = p.date.toDateString();
        const dailySessions = sessions.filter(s => new Date(s.checkInTime).toDateString() === dayStr);
        sessionRevenue = dailySessions.reduce((sum, s) => sum + s.totalAmount, 0);
        count = dailySessions.length;
        membershipRevenue = membershipPayments.filter(m => new Date(m.paymentDate).toDateString() === dayStr).reduce((sum, m) => sum + m.amount, 0);
        exp = expenses.filter(e => new Date(e.date).toDateString() === dayStr).reduce((sum, e) => sum + e.amount, 0);
      } else if (timeFilter === 'week') {
        const start = new Date(p.date);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const weeklySessions = sessions.filter(s => { const d = new Date(s.checkInTime); return d >= start && d < end; });
        sessionRevenue = weeklySessions.reduce((sum, s) => sum + s.totalAmount, 0);
        count = weeklySessions.length;
        membershipRevenue = membershipPayments.filter(m => { const d = new Date(m.paymentDate); return d >= start && d < end; }).reduce((sum, m) => sum + m.amount, 0);
        exp = expenses.filter(e => { const d = new Date(e.date); return d >= start && d < end; }).reduce((sum, e) => sum + e.amount, 0);
      } else {
        const month = p.date.getMonth();
        const year = p.date.getFullYear();
        const monthlySessions = sessions.filter(s => { const d = new Date(s.checkInTime); return d.getMonth() === month && d.getFullYear() === year; });
        sessionRevenue = monthlySessions.reduce((sum, s) => sum + s.totalAmount, 0);
        count = monthlySessions.length;
        membershipRevenue = membershipPayments.filter(m => { const d = new Date(m.paymentDate); return d.getMonth() === month && d.getFullYear() === year; }).reduce((sum, m) => sum + m.amount, 0);
        exp = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; }).reduce((sum, e) => sum + e.amount, 0);
      }

      const revenue = sessionRevenue + membershipRevenue;
      return { name: p.label, 'Dịch vụ': sessionRevenue, 'Hội viên': membershipRevenue, 'Tổng thu': revenue, 'Chi phí': exp, 'Lợi nhuận': revenue - exp, 'Lượt khách': count };
    });
  }, [sessions, expenses, membershipPayments, timeFilter]);

  const serviceDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    const finishedSessionIds = sessions.filter(s => s.status === 'finished').map(s => s.id);
    const relevantSS = sessionServices.filter(ss => finishedSessionIds.includes(ss.sessionId));
    relevantSS.forEach(ss => {
      const s = services.find(x => x.id === ss.serviceId);
      dist[s?.name || 'Khác'] = (dist[s?.name || 'Khác'] || 0) + ss.totalAmount;
    });
    const totalMembership = membershipPayments.reduce((sum, m) => sum + m.amount, 0);
    if (totalMembership > 0) dist['Phí Hội viên'] = totalMembership;
    return Object.entries(dist).map(([name, value]) => ({ name, value })).filter(item => item.value > 0);
  }, [sessions, sessionServices, services, membershipPayments]);

  const statsSummary = useMemo(() => {
    const sessionRev = sessions.reduce((s, x) => s + x.totalAmount, 0);
    const membershipRev = membershipPayments.reduce((s, x) => s + x.amount, 0);
    const totalRev = sessionRev + membershipRev;
    const totalExp = expenses.reduce((s, x) => s + x.amount, 0);
    return { sessionRevenue: sessionRev, membershipRevenue: membershipRev, totalRevenue: totalRev, totalExpense: totalExp, profit: totalRev - totalExp, sessionCount: sessions.length };
  }, [sessions, expenses, membershipPayments]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black pointer-events-none">{`${(percent * 100).toFixed(0)}%`}</text>;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-1 w-fit">
          {['day', 'week', 'month'].map(id => (
            <button key={id} onClick={() => setTimeFilter(id as any)} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${timeFilter === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
              {id === 'day' ? 'Theo Ngày' : id === 'week' ? 'Theo Tuần' : 'Theo Tháng'}
            </button>
          ))}
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center"><i className="fa-solid fa-users"></i></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase">Tổng lượt khách</p><p className="text-lg font-black text-slate-800">{statsSummary.sessionCount}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-6 flex justify-between items-center"><span>Doanh thu & Chi phí</span><span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase font-black">Tài chính</span></h4>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} /><Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} /><Legend iconType="circle" /><Bar dataKey="Dịch vụ" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={24} /><Bar dataKey="Hội viên" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} /><Bar dataKey="Chi phí" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} /></BarChart></ResponsiveContainer></div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-6 flex justify-between items-center"><span>Lưu lượng khách chơi</span><span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md uppercase font-black">Thống kê lượt</span></h4>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} /><Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} /><Area type="monotone" dataKey="Lượt khách" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" dot={{r: 4, fill: '#6366f1'}} /></AreaChart></ResponsiveContainer></div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-6">Tỉ trọng Đóng góp Doanh thu</h4>
          <div className="h-80 flex flex-col items-center">
            {serviceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%"><PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}><Pie data={serviceDistribution} cx="50%" cy="45%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value" labelLine={false} label={renderCustomizedLabel}>{serviceDistribution.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />))}</Pie><Tooltip formatter={(value: number) => `${value.toLocaleString()}đ`} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} /><Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" /></PieChart></ResponsiveContainer>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><i className="fa-solid fa-chart-pie text-4xl mb-2 opacity-20"></i><p className="text-sm">Chưa có dữ liệu giao dịch</p></div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-6">Biến động Lợi nhuận ròng</h4>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} /><Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} /><Line type="monotone" dataKey="Lợi nhuận" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 8}} /></LineChart></ResponsiveContainer></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl"><i className="fa-solid fa-vault"></i></div><div><p className="text-slate-400 text-xs font-black uppercase tracking-widest">Tổng thu tích lũy</p><h5 className="text-3xl font-black">{statsSummary.totalRevenue.toLocaleString()}<span className="text-sm ml-1 text-slate-500">đ</span></h5></div></div>
          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800"><div><p className="text-slate-500 text-[10px] font-bold uppercase">Dịch vụ</p><p className="font-bold">{statsSummary.sessionRevenue.toLocaleString()}đ</p></div><div><p className="text-slate-500 text-[10px] font-bold uppercase">Hội viên</p><p className="font-bold text-amber-500">{statsSummary.membershipRevenue.toLocaleString()}đ</p></div></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-xl"><i className="fa-solid fa-money-bill-transfer"></i></div><div><p className="text-slate-400 text-xs font-black uppercase tracking-widest">Tổng chi tích lũy</p><h5 className="text-3xl font-black text-red-600">{statsSummary.totalExpense.toLocaleString()}<span className="text-sm ml-1 text-slate-400">đ</span></h5></div></div>
          <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center"><div><p className="text-slate-400 text-[10px] font-bold uppercase">Lợi nhuận ròng</p><p className={`text-xl font-black ${statsSummary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{statsSummary.profit.toLocaleString()}đ</p></div><div className="text-right"><p className="text-slate-400 text-[10px] font-bold uppercase">Tổng lượt chơi</p><p className="text-xl font-black text-slate-800">{statsSummary.sessionCount}</p></div></div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
