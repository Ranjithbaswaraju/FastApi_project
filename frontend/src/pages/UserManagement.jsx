import React, { useEffect, useState } from 'react';
import { ShieldAlert, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Toast from '../components/Toast';

const UserManagement = () => {
  const adminUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (id, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'employee' : 'admin';
    if (id === adminUser.id) {
      setToastMessage('You cannot change your own admin privileges!');
      setToastType('error');
      return;
    }

    if (!window.confirm(`Are you sure you want to change this user's role to ${nextRole}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.put(`/users/${id}/role`, null, {
        params: { role: nextRole }
      });
      setToastMessage(response.data.message);
      setToastType('success');
      fetchUsers();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Failed to modify role.');
      setToastType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id, email) => {
    if (id === adminUser.id) {
      setToastMessage('You cannot delete your own admin account!');
      setToastType('error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user account "${email}"? This will permanently delete their linked employee profile, salary history, leave applications, and attendance punches!`)) {
      return;
    }

    try {
      const response = await api.delete(`/users/${id}`);
      setToastMessage(response.data.message);
      setToastType('success');
      fetchUsers();
    } catch (err) {
      setToastMessage(err.response?.data?.detail || 'Failed to delete account.');
      setToastType('error');
    }
  };

  const columns = [
    { header: "Account ID", accessor: "id", render: (row) => <span className="font-semibold text-xs font-mono">#{row.id}</span> },
    { header: "Email Address", accessor: "email", render: (row) => <span className="font-bold text-gray-900">{row.email}</span> },
    { 
      header: "Access Role", 
      accessor: "role",
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase text-[10px] ${
          row.role === 'admin'
            ? 'bg-indigo-50 border-indigo-250 text-indigo-700 font-bold'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          {row.role}
        </span>
      )
    },
    { header: "Registration Date", accessor: "created_at", render: (row) => <span className="font-semibold text-xs text-gray-400 font-mono">{row.created_at || 'N/A'}</span> },
    {
      header: "Modify Access",
      accessor: "id",
      sortable: false,
      render: (row) => {
        const isSelf = row.id === adminUser.id;
        return (
          <div className="flex items-center gap-2">
            {!isSelf ? (
              <>
                <button
                  onClick={() => handleRoleToggle(row.id, row.role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    row.role === 'admin'
                      ? 'border-amber-250 text-amber-600 hover:text-white hover:bg-amber-600'
                      : 'border-indigo-200 text-indigo-600 hover:text-white hover:bg-indigo-600'
                  }`}
                >
                  {row.role === 'admin' ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Demote to Staff
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Promote to Admin
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteUser(row.id, row.email)}
                  className="p-1.5 border border-gray-250 text-gray-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/10 rounded-xl transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-400 font-bold italic">Self (Active Session)</span>
            )}
          </div>
        );
      }
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
      <div>
        <h2 className="text-xl font-bold text-gray-950 tracking-tight font-black">User Access Management</h2>
        <p className="text-xs text-gray-500 font-semibold mt-1">Audit security profiles, promote administrators, and delete account access</p>
      </div>

      {/* Error block */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable columns={columns} data={users} searchPlaceholder="Search accounts by email..." />
    </div>
  );
};

export default UserManagement;
