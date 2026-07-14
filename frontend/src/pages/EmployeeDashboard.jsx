import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarCheck, 
  FileText, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import api from '../utils/api';
import Toast from '../components/Toast';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [todayStatus, setTodayStatus] = useState({ checked_in: false, checked_out: false, record: null });
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, onLeave: 0, rate: 100 });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [latestSalary, setLatestSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch today's check-in status
      const todayRes = await api.get('/attendance/today');
      setTodayStatus(todayRes.data);

      // 2. Fetch attendance history
      const historyRes = await api.get('/attendance/history');
      const history = historyRes.data;
      setRecentAttendance(history.slice(0, 5));

      // Calculate stats based on history
      if (history.length > 0) {
        const present = history.filter(h => h.status === 'Present').length;
        const absent = history.filter(h => h.status === 'Absent').length;
        const onLeave = history.filter(h => h.status === 'On Leave').length;
        const rate = Math.round((present / (present + absent || 1)) * 100);
        setAttendanceStats({ present, absent, onLeave, rate });
      }

      // 3. Fetch latest salary payout
      const salariesRes = await api.get('/salaries');
      if (salariesRes.data.length > 0) {
        // Find latest paid salary
        const paid = salariesRes.data.find(s => s.payment_status === 'Paid');
        setLatestSalary(paid || salariesRes.data[0]);
      }
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/attendance/check-in');
      setToastMessage(response.data.message);
      setToastType('success');
      fetchDashboardData();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Check-in failed');
      setToastType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/attendance/check-out');
      setToastMessage(response.data.message);
      setToastType('success');
      fetchDashboardData();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Check-out failed');
      setToastType('error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast feedback */}
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      {/* Hero Welcome banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.06),transparent)] pointer-events-none" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Hello, {user.name}!</h2>
          <p className="text-sm text-slate-400 font-medium">
            Welcome to your employee portal. Log check-in times and track monthly salaries.
          </p>
        </div>
        
        {/* Check-In/Out Actions Card */}
        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0 bg-slate-950/40 p-3 border border-slate-800/80 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Today's attendance log:</span>
          </div>

          {!todayStatus.checked_in ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-555 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              Punch Check-In
            </button>
          ) : !todayStatus.checked_out ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded-lg">
                In: {todayStatus.record?.check_in_time}
              </span>
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-555 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                Punch Check-Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded-lg">
                In: {todayStatus.record?.check_in_time}
              </span>
              <span className="text-xs font-bold text-slate-400 bg-slate-800/50 px-2.5 py-1 border border-slate-700/40 rounded-lg">
                Out: {todayStatus.record?.check_out_time}
              </span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 ml-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Completed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Attendance Rate */}
        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Attendance Rate</span>
          <div className="flex items-center justify-between gap-4">
            <span className="text-3xl font-black text-gray-900">{attendanceStats.rate}%</span>
            <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
            <span className="text-emerald-600">{attendanceStats.present} Present</span>
            <span>•</span>
            <span className="text-rose-600">{attendanceStats.absent} Absent</span>
            <span>•</span>
            <span className="text-amber-600">{attendanceStats.onLeave} Approved Leaves</span>
          </div>
        </div>

        {/* Latest Salary */}
        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Latest Net Payout</span>
          <div className="flex items-center justify-between gap-4">
            <span className="text-3xl font-black text-gray-900">
              {latestSalary ? `₹${latestSalary.net_salary.toLocaleString()}` : '₹0'}
            </span>
            <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            {latestSalary ? (
              <>
                <span className="text-gray-500">For {latestSalary.payment_month}</span>
                <span className={`px-2 py-0.5 rounded-lg border uppercase text-[10px] ${
                  latestSalary.payment_status === 'Paid'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  {latestSalary.payment_status}
                </span>
              </>
            ) : (
              <span className="text-gray-400">No payouts processed yet</span>
            )}
          </div>
        </div>

        {/* Quick Menu */}
        <div className="p-6 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Quick Links</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/leaves')}
              className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 hover:border-indigo-400 text-xs font-bold text-gray-700 hover:text-indigo-650 bg-white rounded-xl hover:bg-indigo-50/20 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Apply Leave
            </button>
            <button
              onClick={() => navigate('/salaries')}
              className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 hover:border-indigo-400 text-xs font-bold text-gray-700 hover:text-indigo-650 bg-white rounded-xl hover:bg-indigo-50/20 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              My Payslips
            </button>
          </div>
        </div>

      </div>

      {/* Recent Attendance Logs */}
      <div className="bg-white p-6 border border-gray-150 rounded-2xl shadow-sm space-y-6">
        <div>
          <h3 className="text-md font-bold text-gray-950">Recent Attendance History</h3>
          <p className="text-xs text-gray-500 font-semibold mt-1">Logs of your check-in and check-out punches</p>
        </div>

        <div className="overflow-hidden border border-gray-100 rounded-xl">
          <table className="w-full text-left text-sm text-gray-800">
            <thead className="bg-gray-50 text-gray-700 font-bold text-xs uppercase">
              <tr>
                <th className="px-6 py-3 border-b border-gray-100">Date</th>
                <th className="px-6 py-3 border-b border-gray-100">Status</th>
                <th className="px-6 py-3 border-b border-gray-100">Check-In</th>
                <th className="px-6 py-3 border-b border-gray-100">Check-Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {recentAttendance.length > 0 ? (
                recentAttendance.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">{log.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase text-[10px] ${
                        log.status === 'Present'
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-600'
                          : log.status === 'Absent'
                          ? 'bg-rose-50 border-rose-250 text-rose-600'
                          : 'bg-amber-50 border-amber-250 text-amber-600'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-bold">{log.check_in_time || '-- : --'}</td>
                    <td className="px-6 py-4 text-slate-500 font-bold">{log.check_out_time || '-- : --'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-400 font-medium">
                    No attendance records logged yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
