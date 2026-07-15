import React, { useEffect, useState } from 'react';
import { PlusCircle, Calendar, Check, X, FileText, Loader2 } from 'lucide-react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const LeaveManagement = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState('');
  
  // Filter
  const [statusFilter, setStatusFilter] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Confirmations
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isApprovalConfirmOpen, setIsApprovalConfirmOpen] = useState(false);
  const [pendingApproval, setPendingApproval] = useState({ id: null, status: '' });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    leave_type: 'Sick',
    reason: ''
  });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;
      
      const response = await api.get('/leaves', { params });
      setLeaves(response.data);
    } catch (err) {
      setError('Failed to fetch leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const openApplyModal = () => {
    setFormData({
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      leave_type: 'Sick',
      reason: ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsSubmitConfirmOpen(true);
  };

  const executeFormSubmit = async () => {
    setIsSubmitConfirmOpen(false);
    setFormLoading(true);
    try {
      const response = await api.post('/leaves', formData);
      setToastMessage(response.data.message);
      setToastType('success');
      setIsModalOpen(false);
      fetchLeaves();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Application failed.');
      setToastType('error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprovalAction = (id, status) => {
    setPendingApproval({ id, status });
    setIsApprovalConfirmOpen(true);
  };

  const executeApprovalAction = async () => {
    const { id, status } = pendingApproval;
    setIsApprovalConfirmOpen(false);
    try {
      const response = await api.put(`/leaves/${id}`, { status });
      setToastMessage(response.data.message);
      setToastType('success');
      fetchLeaves();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Failed to update request.');
      setToastType('error');
    }
  };

  const columns = [
    ...(isAdmin ? [{ header: "Employee", accessor: "employee_name", render: (row) => <span className="font-bold text-gray-900">{row.employee_name}</span> }] : []),
    { header: "Leave Type", accessor: "leave_type", render: (row) => <span className="font-bold text-gray-900">{row.leave_type}</span> },
    { 
      header: "Duration", 
      accessor: "start_date",
      render: (row) => (
        <div className="space-y-0.5 text-xs font-semibold text-gray-500 font-mono">
          <span>From: {row.start_date}</span> <br />
          <span>To: {row.end_date}</span>
        </div>
      )
    },
    { 
      header: "Reason", 
      accessor: "reason",
      render: (row) => (
        <span className="text-gray-500 text-xs font-semibold max-w-sm block whitespace-normal">
          {row.reason}
        </span>
      )
    },
    { 
      header: "Status", 
      accessor: "status",
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase text-[10px] ${
          row.status === 'Approved'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : row.status === 'Rejected'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: "id",
      sortable: false,
      render: (row) => {
        if (isAdmin && row.status === 'Pending') {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApprovalAction(row.id, 'Approved')}
                className="p-1.5 border border-emerald-250 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleApprovalAction(row.id, 'Rejected')}
                className="p-1.5 border border-rose-250 text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        }
        return <span className="text-xs text-gray-400 font-semibold">{row.status !== 'Pending' ? `Processed` : 'Pending'}</span>;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      {/* Screen Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950 tracking-tight">Leave Approvals & Applications</h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            {isAdmin ? 'Approve or reject employee leave applications' : 'Submit leave requests and monitor status'}
          </p>
        </div>

        {!isAdmin ? (
          <button
            onClick={openApplyModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-555 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-650/10 shrink-0"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            Apply For Leave
          </button>
        ) : null}
      </div>

      {/* Error info */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold animate-shake">
          {error}
        </div>
      )}

      {/* Filters section */}
      <div className="bg-white p-4 border border-gray-150 rounded-2xl shadow-sm flex items-center justify-between gap-4">
        <div className="text-xs font-bold text-gray-500">Filter Status:</div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-bold"
        >
          <option value="">All Requests</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table Data */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={leaves} searchPlaceholder={isAdmin ? "Search by employee..." : "Search request..."} />
      )}

      {/* Apply Leave Modal */}
      {!isAdmin && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Leave Application">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Leave Type</label>
              <select
                name="leave_type"
                value={formData.leave_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="Annual">Annual Leave</option>
                <option value="Maternity">Maternity Leave</option>
                <option value="Paternity">Paternity Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Reason for Absence</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                rows="4"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 border border-gray-250 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-555 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-650/10 disabled:opacity-50"
              >
                {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit Request
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Custom Submit Confirmation Modal */}
      {isSubmitConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full mx-4 border border-gray-150 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Confirm Leave Application</h3>
            <p className="text-xs font-semibold text-gray-500">
              Are you sure you want to submit this leave request? Your department manager will review the request.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSubmitConfirmOpen(false)}
                className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeFormSubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-555 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-650/10"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Approval/Rejection Confirmation Modal */}
      {isApprovalConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full mx-4 border border-gray-150 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Confirm Leave Action</h3>
            <p className="text-xs font-semibold text-gray-500">
              Are you sure you want to mark this request as <span className="font-bold text-gray-900">{pendingApproval.status}</span>? This action will generate/adjust attendance logs accordingly.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsApprovalConfirmOpen(false)}
                className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeApprovalAction}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                  pendingApproval.status === 'Approved'
                    ? 'bg-emerald-650 hover:bg-emerald-600 shadow-emerald-600/10'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/10'
                }`}
              >
                Confirm {pendingApproval.status}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
