import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Loader2, PlayCircle, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Toast from '../components/Toast';

const SalaryManagement = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [salaries, setSalaries] = useState([]);
  const [error, setError] = useState('');
  
  // Month selector
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (targetMonth) params.month = targetMonth;
      
      const response = await api.get('/salaries', { params });
      setSalaries(response.data);
    } catch (err) {
      setError('Failed to fetch salary records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [targetMonth]);

  const handleGenerateSalaries = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/salaries/generate', { payment_month: targetMonth });
      setToastMessage(response.data.message);
      setToastType('success');
      fetchSalaries();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Generation failed.');
      setToastType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessPayout = async (id) => {
    if (!window.confirm("Approve payout for this record? This will mark it as Paid and generate their official downloadable payslip.")) {
      return;
    }
    setActionLoading(true);
    try {
      const response = await api.put(`/salaries/${id}/payout`, null, {
        params: { payment_status: 'Paid' }
      });
      setToastMessage(response.data.message);
      setToastType('success');
      fetchSalaries();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Payout failed.');
      setToastType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    ...(isAdmin ? [{ header: "Employee", accessor: "employee_name", render: (row) => <span className="font-bold text-gray-900">{row.employee_name}</span> }] : []),
    { header: "Month", accessor: "payment_month", render: (row) => <span className="font-semibold text-xs font-mono">{row.payment_month}</span> },
    { header: "Base Pay", accessor: "base_salary", render: (row) => <span className="font-bold text-gray-650">₹{row.base_salary.toLocaleString()}</span> },
    { header: "Deductions", accessor: "deductions", render: (row) => <span className="font-bold text-rose-600">₹{row.deductions.toLocaleString()}</span> },
    { header: "Net Pay", accessor: "net_salary", render: (row) => <span className="font-black text-gray-950">₹{row.net_salary.toLocaleString()}</span> },
    { 
      header: "Status", 
      accessor: "payment_status",
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase text-[10px] ${
          row.status === 'Paid' || row.payment_status === 'Paid'
            ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
            : 'bg-amber-50 border-amber-250 text-amber-700'
        }`}>
          {row.payment_status}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: "id",
      sortable: false,
      render: (row) => {
        const isPaid = row.payment_status === 'Paid';
        return (
          <div className="flex items-center gap-2">
            {isAdmin && !isPaid && (
              <button
                onClick={() => handleProcessPayout(row.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-650 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Approve Pay
              </button>
            )}
            {isPaid ? (
              <button
                onClick={() => navigate(`/payslip/${row.id}`)}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-250 hover:border-indigo-200 hover:bg-indigo-50/10 text-xs font-bold text-gray-700 hover:text-indigo-650 rounded-xl transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Payslip
              </button>
            ) : (
              <span className="text-xs text-gray-400 font-semibold italic">Unreleased</span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950 tracking-tight">Salary Payroll History</h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            {isAdmin ? 'Process and release monthly employee salaries' : 'Track payouts and print official payslips'}
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={handleGenerateSalaries}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-555 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-650/10 disabled:opacity-50 shrink-0"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4.5 h-4.5" />}
            Generate {targetMonth} Payroll
          </button>
        ) : null}
      </div>

      {/* Error block */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Selector Board */}
      <div className="bg-white p-4 border border-gray-150 rounded-2xl shadow-sm flex items-center justify-between gap-4">
        <div className="text-xs font-bold text-gray-500">Select Billing Month:</div>
        <input
          type="month"
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
        />
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={salaries}
          searchPlaceholder={isAdmin ? "Search payroll by employee name..." : "Search payouts..."}
        />
      )}
    </div>
  );
};

export default SalaryManagement;
