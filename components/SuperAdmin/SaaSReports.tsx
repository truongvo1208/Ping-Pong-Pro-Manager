
import React, { useState, useMemo } from 'react';
import { Club, SubscriptionPayment, SubscriptionTier } from '../../types';
import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatDate } from '../../utils/formatters';

interface SaaSReportsProps {
  clubs: Club[];
  subscriptionPayments: SubscriptionPayment[];
}

const TIER_COLORS = {
  'FREE': '#94a3b8',
  'MONTHLY': '#3b82f6',
  'YEARLY': '#4f46e5'
};

const SaaSReports: React.FC<SaaSReportsProps> = ({ clubs, subscriptionPayments }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const filteredClubs = useMemo(() => clubs.filter(c => c.role === 'CLUB_ADMIN'), [clubs]);

  // Phân bổ gói
  const subscriptionStats = useMemo(() => {
    const data: Record<SubscriptionTier, number> = { 'FREE': 0, 'MONTHLY': 0, 'YEARLY': 0 };
    filteredClubs.forEach(c => {
      const tier = (c.subscriptionTier || 'FREE').toUpperCase() as SubscriptionTier;
      if (data[tier] !== undefined) data[tier]++;
    });
    return [
      { name: 'Gói FREE', value: data['FREE'], color: TIER_COLORS['FREE'] },
      { name: 'Gói MONTHLY', value: data['MONTHLY'], color: TIER_COLORS['MONTHLY'] },
      { name: 'Gói YEARLY', value: data['YEARLY'], color: TIER_COLORS['YEARLY'] },
    ];
  }, [filteredClubs]);

  const stats = useMemo(() => {
    const completedPayments = subscriptionPayments.filter(p => (p.status || '').toUpperCase() === 'COMPLETED');
    const lifetimeRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const availableYears = Array.from(new Set(completedPayments.map(p => new Date(p.paymentDate).getFullYear()))).sort((a: any, b: any) => b - a);
    if (availableYears.length === 0) availableYears.push(new Date().getFullYear());

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const amount = completedPayments
        .filter(p => {
          const d = new Date(p.paymentDate);
          return d.getFullYear() === selectedYear && d.getMonth() === i;
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      return { month: i + 1, name: `Tháng ${i + 1}`, amount };
    });

    const yearlyTotal = monthlyData.reduce((sum, m) => sum + m.amount, 0);

    return { lifetimeRevenue, monthlyData, yearlyTotal, availableYears: availableYears as number[] };
  }, [subscriptionPayments, selectedYear]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <i className="fa-solid fa-sack-dollar text-2xl"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Doanh thu SaaS</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Phí thuê bao phần mềm từ các cơ sở</p>
          </div>
        </div>

        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Năm báo cáo:</span>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-slate-50 border-none font-black text-sm rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-slate-700"
          >
            {stats.availableYears.map(y => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <i className="fa-solid fa-coins text-9xl"></i>
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Tổng thực thu hệ thống</p>
              <h3 className="text-5xl font-black mt-2 tracking-tighter">
                {stats.lifetimeRevenue.toLocaleString()}<span className="text-sm ml-2 opacity-50 font-bold">đ</span>
              </h3>
            </div>
            <div className="mt-10 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Doanh thu năm {selectedYear}</p>
                <p className="text-xl font-black text-emerald-400">+{stats.yearlyTotal.toLocaleString()}đ</p>
              </div>
              <div>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Cơ sở đăng ký</p>
                <p className="text-xl font-black text-slate-200">{filteredClubs.length} CLB</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Phân bổ gói thành viên</h4>
          <div className="h-56 flex flex-col items-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={subscriptionStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                   {subscriptionStats.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Giao dịch gần nhất</h4>
          <div className="space-y-4">
             {subscriptionPayments.slice(0, 4).map((p, idx) => (
               <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{clubs.find(c => c.id === p.clubId)?.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">{formatDate(p.paymentDate)}</p>
                  </div>
                  <p className="text-sm font-black text-indigo-600">+{p.amount.toLocaleString()}đ</p>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Biến động doanh thu phần mềm ({selectedYear})</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.monthlyData}>
              <defs>
                <linearGradient id="colorSaas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} tickFormatter={(val) => `${val / 1000}K`} />
              <Tooltip />
              <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorSaas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SaaSReports;
