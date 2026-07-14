import React, { useEffect, useState } from 'react';
import { PlusCircle, Edit2, Trash2, Loader2, Award } from 'lucide-react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add Department');
  const [selectedDeptId, setSelectedDeptId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (err) {
      setError('Failed to fetch departments list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setSelectedDeptId(null);
    setModalTitle('Add New Department');
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setSelectedDeptId(dept.id);
    setModalTitle('Edit Department info');
    setFormData({ name: dept.name, description: dept.description || '' });
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
      if (selectedDeptId) {
        // Edit
        const response = await api.put(`/departments/${selectedDeptId}`, formData);
        setToastMessage(response.data.message);
        setToastType('success');
      } else {
        // Add
        const response = await api.post('/departments', formData);
        setToastMessage(response.data.message);
        setToastType('success');
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Form submission failed.');
      setToastType('error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the department "${name}"?`)) {
      return;
    }
    try {
      const response = await api.delete(`/departments/${id}`);
      setToastMessage(response.data.message);
      setToastType('success');
      fetchDepartments();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Deletion failed.');
      setToastType('error');
    }
  };

  const columns = [
    {
      header: "Department Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center justify-center">
            <Award className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-gray-950">{row.name}</span>
        </div>
      )
    },
    {
      header: "Description",
      accessor: "description",
      render: (row) => (
        <span className="text-gray-500 font-semibold text-xs whitespace-normal max-w-md block">
          {row.description || 'No description provided'}
        </span>
      )
    },
    {
      header: "Created Date",
      accessor: "created_at",
      render: (row) => (
        <span className="text-xs text-gray-400 font-semibold font-mono">
          {row.created_at ? row.created_at.split(' ')[0] : 'N/A'}
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
            onClick={() => handleDeleteDepartment(row.id, row.name)}
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
          <h2 className="text-xl font-bold text-gray-950 tracking-tight">Department Management</h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Configure company divisions and business units</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-555 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-650/10 shrink-0"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Create Department
        </button>
      </div>

      {/* Error block */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable columns={columns} data={departments} searchPlaceholder="Search departments by name or description..." />

      {/* Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Department Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Actions */}
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
              {selectedDeptId ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentManagement;
