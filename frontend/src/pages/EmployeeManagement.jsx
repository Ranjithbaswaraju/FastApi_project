import React, { useEffect, useState } from 'react';
import { PlusCircle, Edit2, Trash2, Mail, Phone, Calendar, DollarSign, UserCheck, Loader2 } from 'lucide-react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add Employee');
  const [selectedEmpId, setSelectedEmpId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    designation: '',
    join_date: '',
    base_salary: '',
    status: 'Active',
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchEmployeesAndDepts = async () => {
    try {
      const empResponse = await api.get('/employees');
      setEmployees(empResponse.data);
      const deptResponse = await api.get('/departments');
      setDepartments(deptResponse.data);
    } catch (err) {
      setError('Failed to fetch employee profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesAndDepts();
  }, []);

  const openAddModal = () => {
    setSelectedEmpId(null);
    setModalTitle('Add Employee');
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department_id: '',
      designation: '',
      join_date: new Date().toISOString().split('T')[0],
      base_salary: '',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp) => {
    setSelectedEmpId(emp.id);
    setModalTitle('Edit Employee Details');
    setFormData({
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      phone: emp.phone || '',
      department_id: emp.department_id || '',
      designation: emp.designation || '',
      join_date: emp.join_date || '',
      base_salary: emp.base_salary,
      status: emp.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      // Format payloads
      const payload = {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        base_salary: parseFloat(formData.base_salary),
      };

      if (selectedEmpId) {
        // Edit Employee
        const response = await api.put(`/employees/${selectedEmpId}`, payload);
        setToastMessage(response.data.message);
        setToastType('success');
      } else {
        // Add Employee
        const response = await api.post('/employees', payload);
        setToastMessage(`${response.data.message}. Default credentials: email / ${response.data.default_password}`);
        setToastType('success');
      }
      setIsModalOpen(false);
      fetchEmployeesAndDepts();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Form submission failed.');
      setToastType('error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action will permanently remove all associated payroll, attendance, and leave logs.`)) {
      return;
    }
    try {
      const response = await api.delete(`/employees/${id}`);
      setToastMessage(response.data.message);
      setToastType('success');
      fetchEmployeesAndDepts();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Deletion failed.');
      setToastType('error');
    }
  };

  const columns = [
    {
      header: "Employee",
      accessor: "first_name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-650 font-semibold flex items-center justify-center text-xs uppercase select-none">
            {row.first_name.slice(0,1)}{row.last_name.slice(0,1)}
          </div>
          <div>
            <span className="font-bold text-gray-900 block">{row.first_name} {row.last_name}</span>
            <span className="text-xs text-gray-400 font-semibold block">{row.designation || 'Staff'}</span>
          </div>
        </div>
      )
    },
    {
      header: "Contact Info",
      accessor: "email",
      render: (row) => (
        <div className="space-y-0.5 text-xs font-semibold text-gray-500">
          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /> {row.email}</span>
          {row.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /> {row.phone}</span>}
        </div>
      )
    },
    {
      header: "Department",
      accessor: "department_name",
      render: (row) => (
        <span className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-100 text-slate-700 rounded-lg">
          {row.department_name || 'Unassigned'}
        </span>
      )
    },
    {
      header: "Base Salary",
      accessor: "base_salary",
      render: (row) => (
        <span className="font-bold text-gray-950">₹{row.base_salary.toLocaleString()}</span>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase text-[10px] ${
          row.status === 'Active'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: "id",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 border border-gray-250 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/10 rounded-xl transition-all cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteEmployee(row.id, `${row.first_name} ${row.last_name}`)}
            className="p-1.5 border border-gray-250 text-gray-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/10 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      {/* Screen Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950 tracking-tight">Employee Directory</h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Manage corporate staff records and user accounts</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-555 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-650/10 shrink-0"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Add Employee
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Employee Data Grid */}
      <DataTable columns={columns} data={employees} searchPlaceholder="Search employees by name, email, designation..." />

      {/* Add / Edit Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} maxWidth="max-w-2xl">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={selectedEmpId !== null} // Lock email on edit
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Department</label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Base Salary (INR)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  name="base_salary"
                  value={formData.base_salary}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Join Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  name="join_date"
                  value={formData.join_date}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {selectedEmpId && (
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* Form Actions */}
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
              {selectedEmpId ? 'Update Profile' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;
