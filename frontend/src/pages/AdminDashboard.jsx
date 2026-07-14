import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  FileClock, 
  DollarSign, 
  TrendingUp, 
  PlusCircle, 
  ClipboardCheck, 
  BarChart3,
  Loader2,
  CalendarCheck
} from 'lucide-react';
import api from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/reports/summary');
        setData(response.data);
      } catch (err) {
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-rose-500 font-semibold bg-rose-50 border border-rose-100 rounded-2xl max-w-md mx-auto mt-10">
        {error || 'Dashboard could not be loaded.'}
      </div>
    );
  }

  const { counters, department_distribution, payroll_trends, leaves_summary } = data;

  const statCards = [
    { title: "Total Employees", val: counters.total_employees, sub: `${counters.active_employees} Active Staff`, icon: <Users className="w-5 h-5" />, color: "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-100" },
    { title: "Departments", val: counters.total_departments, sub: "Operational units", icon: <Briefcase className="w-5 h-5" />, color: "from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-100" },
    { title: "Pending Leaves", val: counters.pending_leaves, sub: "Awaiting approval", icon: <FileClock className="w-5 h-5" />, color: "from-rose-500/10 to-red-500/10 text-rose-600 border-rose-100" },
    { title: "Total Payroll (Month)", val: `₹${counters.current_month_payroll.toLocaleString()}`, sub: `₹${counters.current_month_paid.toLocaleString()} Paid`, icon: <DollarSign className="w-5 h-5" />, color: "from-emerald-500/10 to-green-500/10 text-emerald-600 border-emerald-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.06),transparent)] pointer-events-none" />
        <div>
          <h2 className="text-xl font-bold tracking-tight">Admin Control Hub</h2>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Monitor employees, process monthly payouts, check attendances, and approve leaves.
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => navigate('/employees')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-555 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-650/10"
          >
            <PlusCircle className="w-4 h-4" />
            Add Employee
          </button>
          <button
            onClick={() => navigate('/salaries')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-700"
          >
            <DollarSign className="w-4 h-4" />
            Process Salary
          </button>
          <button
            onClick={() => navigate('/leaves')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-700"
          >
            <ClipboardCheck className="w-4 h-4" />
            Approve Leaves
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className={`p-6 bg-gradient-to-br ${card.color} border rounded-2xl shadow-sm flex items-center justify-between gap-4 bg-white`}>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">{card.title}</span>
              <span className="text-2xl font-black text-gray-900 block">{card.val}</span>
              <span className="text-xs font-semibold text-gray-400 block">{card.sub}</span>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts & Graphs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Payroll Expense Trend Bar Chart (HTML/CSS Based) */}
        <div className="bg-white p-6 border border-gray-150 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-gray-950 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Payroll Expenditures Trend
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-1">Past 6 months cumulative net salary payouts</p>
          </div>
          
          <div className="h-64 flex items-end justify-around gap-2 px-2 border-b border-gray-150 pb-2">
            {payroll_trends.length > 0 ? (
              payroll_trends.map((t, idx) => {
                // Find max payroll value to map height percentage
                const maxVal = Math.max(...payroll_trends.map(x => x.payroll), 1000);
                const heightPercent = Math.min((t.payroll / maxVal) * 80 + 10, 100); // map from 10% to 90%
                
                return (
                  <div key={idx} className="group flex flex-col items-center gap-2 grow max-w-[60px] relative">
                    {/* Hover Info Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-20">
                      Total: ₹{t.payroll.toLocaleString()} <br /> Paid: ₹{t.paid.toLocaleString()}
                    </div>
                    {/* Bar visual */}
                    <div className="w-full bg-slate-100 hover:bg-slate-200/80 rounded-t-lg transition-all relative overflow-hidden" style={{ height: `${heightPercent}%` }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-lg transition-all" style={{ height: t.payroll > 0 ? `${(t.paid / t.payroll) * 100}%` : '0%' }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 truncate max-w-full">{t.month}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-400">
                No payroll data generated yet
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="flex justify-center items-center gap-4 text-xs font-semibold text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-indigo-500 rounded"></div>
              <span>Paid Payouts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-indigo-150 border border-indigo-200 rounded"></div>
              <span>Pending Payouts</span>
            </div>
          </div>
        </div>

        {/* Department Size Distribution */}
        <div className="bg-white p-6 border border-gray-150 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="text-md font-bold text-gray-950 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Staff Distribution by Department
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-1">Staff count per operational business unit</p>
          </div>
          
          <div className="space-y-4">
            {department_distribution.length > 0 ? (
              department_distribution.map((dept, idx) => {
                const totalEmp = counters.total_employees || 1;
                const percentage = Math.round((dept.count / totalEmp) * 100);
                
                // Color array
                const colors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];
                const colorClass = colors[idx % colors.length];
                
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <span>{dept.name}</span>
                      <span>{dept.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400 font-medium">
                No department distributions found
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
