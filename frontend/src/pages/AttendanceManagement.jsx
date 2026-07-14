import React, { useEffect, useState } from 'react';
import { CalendarCheck, MapPin, Clock, Edit, CheckCircle, Search, Loader2, PlusCircle } from 'lucide-react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const AttendanceManagement = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  
  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState('date'); // 'date' or 'month'

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    check_in_time: '09:00:00',
    check_out_time: '18:00:00'
  });

  // Employee specific states
  const [todayRecord, setTodayRecord] = useState({ checked_in: false, checked_out: false, record: null });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        // Fetch all attendance for admin
        const params = {};
        if (filterType === 'date') {
          params.date_str = filterDate;
        } else {
          params.month = filterMonth;
        }
        
        const response = await api.get('/attendance/all', { params });
        setAttendanceData(response.data);
        
        // Fetch employees for adjustment select dropdown
        const empResponse = await api.get('/employees');
        setEmployees(empResponse.data);
      } else {
        // Fetch employee specific logs
        const historyRes = await api.get('/attendance/history', {
          params: { month: filterMonth }
        });
        setAttendanceData(historyRes.data);

        // Fetch today's status
        const todayRes = await api.get('/attendance/today');
        setTodayRecord(todayRes.data);
      }
    } catch (err) {
      setError('Failed to fetch attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filterDate, filterMonth, filterType]);

  const handlePunchCheckIn = async () => {
    setFormLoading(true);
    try {
      const response = await api.post('/attendance/check-in');
      setToastMessage(response.data.message);
      setToastType('success');
      fetchAttendance();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Punch-in failed.');
      setToastType('error');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePunchCheckOut = async () => {
    setFormLoading(true);
    try {
      const response = await api.post('/attendance/check-out');
      setToastMessage(response.data.message);
      setToastType('success');
      fetchAttendance();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Punch-out failed.');
      setToastType('error');
    } finally {
      setFormLoading(false);
    }
  };

  const openAdjustmentModal = (record = null) => {
    if (record) {
      // Pre-fill adjustment
      setFormData({
        employee_id: String(record.employee_id),
        date: record.date,
        status: record.status,
        check_in_time: record.check_in_time || '09:00:00',
        check_out_time: record.check_out_time || '18:00:00'
      });
    } else {
      // Default blank
      setFormData({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        check_in_time: '09:00:00',
        check_out_time: '18:00:00'
      });
    }
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        employee_id: parseInt(formData.employee_id),
        date: formData.date,
        status: formData.status,
        check_in_time: formData.status === 'On Leave' || formData.status === 'Absent' ? null : formData.check_in_time,
        check_out_time: formData.status === 'On Leave' || formData.status === 'Absent' ? null : formData.check_out_time
      };

      const response = await api.post('/attendance/mark', payload);
      setToastMessage(response.data.message);
      setToastType('success');
      setIsModalOpen(false);
      fetchAttendance();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Failed to adjust attendance.');
      setToastType('error');
    } finally {
      setFormLoading(false);
    }
  };

  const adminColumns = [
    { header: "Employee", accessor: "employee_name", render: (row) => <span className="font-bold text-gray-900">{row.employee_name}</span> },
    { header: "Date", accessor: "date", render: (row) => <span className="font-semibold text-xs font-mono">{row.date}</span> },
    { 
      header: "Status", 
      accessor: "status",
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase text-[10px] ${
          row.status === 'Present'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : row.status === 'Absent'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: "Check In", accessor: "check_in_time", render: (row) => <span className="font-bold text-gray-500">{row.check_in_time || '-- : --'}</span> },
    { header: "Check Out", accessor: "check_out_time", render: (row) => <span className="font-bold text-gray-500">{row.check_out_time || '-- : --'}</span> },
    {
      header: "Actions",
      accessor: "id",
      sortable: false,
      render: (row) => (
        <button
          onClick={() => openAdjustmentModal(row)}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-250 hover:border-indigo-200 hover:bg-indigo-50/10 text-xs font-bold text-gray-700 hover:text-indigo-650 rounded-xl transition-all cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5" />
          Adjust
        </button>
      )
    }
  ];

  const employeeColumns = [
    { header: "Date", accessor: "date", render: (row) => <span className="font-semibold text-xs font-mono">{row.date}</span> },
    { 
      header: "Status", 
      accessor: "status",
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase text-[10px] ${
          row.status === 'Present'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : row.status === 'Absent'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: "Check In Time", accessor: "check_in_time", render: (row) => <span className="font-bold text-gray-500">{row.check_in_time || '-- : --'}</span> },
    { header: "Check Out Time", accessor: "check_out_time", render: (row) => <span className="font-bold text-gray-500">{row.check_out_time || '-- : --'}</span> }
  ];

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950 tracking-tight">Attendance Timesheets</h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            {isAdmin ? 'Review and override employee attendance records' : 'Punch check-in and view history logs'}
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => openAdjustmentModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-555 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-650/10 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Force Attendance Record
          </button>
        ) : null}
      </div>

      {/* Employee Punch Card */}
      {!isAdmin && (
        <div className="bg-white p-6 border border-gray-150 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Today's Check-In Status</h3>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">Record check-in and check-out punches for today</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-4">
            {!todayRecord.checked_in ? (
              <button
                onClick={handlePunchCheckIn}
                disabled={formLoading}
                className="flex items-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-555 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-650/10"
              >
                {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                Punch Check-In
              </button>
            ) : !todayRecord.checked_out ? (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                  Checked In at: {todayRecord.record?.check_in_time}
                </span>
                <button
                  onClick={handlePunchCheckOut}
                  disabled={formLoading}
                  className="flex items-center gap-1.5 px-5 py-3 bg-amber-600 hover:bg-amber-555 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-amber-650/10"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                  Punch Check-Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-3 rounded-2xl text-xs font-bold text-gray-600">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Shift Complete!</span>
                <span className="text-gray-400 font-semibold">(In: {todayRecord.record?.check_in_time} | Out: {todayRecord.record?.check_out_time})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white p-4 border border-gray-150 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        {isAdmin ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500">Filter By:</span>
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setFilterType('date')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                  filterType === 'date' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Single Date
              </button>
              <button
                onClick={() => setFilterType('month')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                  filterType === 'month' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs font-bold text-gray-500">Filter History Month:</div>
        )}

        <div className="flex items-center gap-3">
          {filterType === 'date' && isAdmin ? (
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          ) : (
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          )}
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={isAdmin ? adminColumns : employeeColumns}
          data={attendanceData}
          searchPlaceholder={isAdmin ? "Search logs by employee name..." : "Search history..."}
        />
      )}

      {/* Adjust Attendance Modal (Admin) */}
      {isAdmin && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Attendance Manual override">
          <form onSubmit={handleAdjustmentSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Select Employee</label>
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
              >
                <option value="">Choose employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Target Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            {formData.status === 'Present' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Check In Time</label>
                  <input
                    type="text"
                    name="check_in_time"
                    value={formData.check_in_time}
                    onChange={handleFormChange}
                    required
                    placeholder="HH:MM:SS"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Check Out Time</label>
                  <input
                    type="text"
                    name="check_out_time"
                    value={formData.check_out_time}
                    onChange={handleFormChange}
                    required
                    placeholder="HH:MM:SS"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

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
                Override Attendance
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AttendanceManagement;
