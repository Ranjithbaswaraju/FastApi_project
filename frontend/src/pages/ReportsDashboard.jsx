import React, { useEffect, useState } from 'react';
import { PieChart, TrendingUp, DollarSign, Calendar, Landmark, Users, Loader2 } from 'lucide-react';
import api from '../utils/api';
import Toast from '../components/Toast';

const ReportsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/reports/summary');
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch analytics metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-rose-500 font-semibold bg-rose-50 border border-rose-100 rounded-2xl max-w-md mx-auto mt-10 animate-shake">
        {error || 'Analytics not found.'}
      </div>
    );
  }

  const { counters, department_distribution, payroll_trends, leaves_summary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-950 tracking-tight font-black">Financial Reports</h2>
        <p className="text-xs text-gray-500 font-semibold mt-1">Review operational costs and department-wise payroll allocation</p>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Monthly Budget</span>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-black text-gray-900">₹{counters.current_month_payroll.toLocaleString()}</span>
            <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs text-gray-400 font-semibold block">For the current calendar billing month</span>
        </div>

        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Released (Paid) Salary</span>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-black text-emerald-600">₹{counters.current_month_paid.toLocaleString()}</span>
            <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs text-emerald-600/80 font-bold block">
            {counters.current_month_payroll > 0
              ? `${Math.round((counters.current_month_paid / counters.current_month_payroll) * 100)}% of total processed`
              : '0% processed'}
          </span>
        </div>

        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Outstanding (Pending) Salary</span>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-black text-amber-600">₹{counters.current_month_pending.toLocaleString()}</span>
            <div className="p-2 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs text-amber-600/80 font-bold block">Awaiting admin payout authorization</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Trend list */}
        <div className="bg-white p-6 border border-gray-150 rounded-2xl shadow-sm xl:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Payroll Expenditure Statements
            </h3>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Historical ledger sheets by month</p>
          </div>

          <div className="overflow-hidden border border-gray-100 rounded-xl">
            <table className="w-full text-left text-sm text-gray-800">
              <thead className="bg-gray-50 font-bold text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3 border-b border-gray-100">Month</th>
                  <th className="px-6 py-3 border-b border-gray-100 text-right">Total Net Payroll</th>
                  <th className="px-6 py-3 border-b border-gray-100 text-right">Paid Out</th>
                  <th className="px-6 py-3 border-b border-gray-100 text-right">Pending Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-650">
                {payroll_trends.length > 0 ? (
                  payroll_trends.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-xs font-bold font-mono">{t.month}</td>
                      <td className="px-6 py-4 text-right text-gray-950 font-bold">₹{t.payroll.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-emerald-600">₹{t.paid.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-amber-600">₹{(t.payroll - t.paid).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400 font-medium">
                      No statements processed yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department budget stats */}
        <div className="bg-white p-6 border border-gray-150 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-500" />
              Staff Volume Breakdown
            </h3>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Staff headcount ratio per department</p>
          </div>

          <div className="space-y-5">
            {department_distribution.length > 0 ? (
              department_distribution.map((dept, idx) => {
                const totalEmp = counters.total_employees || 1;
                const percentage = Math.round((dept.count / totalEmp) * 100);
                
                // Color array
                const colors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];
                const colorClass = colors[idx % colors.length];

                return (
                  <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 ${colorClass} rounded-full`}></div>
                      <span className="text-xs font-bold text-gray-700">{dept.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{dept.count} members ({percentage}%)</span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400 font-medium">
                No department members found
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportsDashboard;
