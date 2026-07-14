import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, Briefcase, DollarSign, Loader2, Landmark } from 'lucide-react';
import api from '../utils/api';
import Toast from '../components/Toast';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      setProfile(response.data);
    } catch (err) {
      setError('Failed to fetch user profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-center text-rose-500 font-semibold bg-rose-50 border border-rose-100 rounded-2xl max-w-md mx-auto mt-10">
        {error || 'Profile could not be loaded.'}
      </div>
    );
  }

  const { user, employee } = profile;
  const isEmployee = user.role === 'employee';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      {/* Screen Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-950 tracking-tight font-black">My Profile</h2>
        <p className="text-xs text-gray-500 font-semibold mt-1">Review account credentials and corporate deployment logs</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
        
        {/* Profile Card Summary */}
        <div className="p-8 md:w-1/3 flex flex-col items-center justify-center text-center space-y-4 shrink-0 bg-gray-50/50">
          <div className="w-20 h-20 bg-indigo-50 border-2 border-indigo-100 text-indigo-650 rounded-full font-black text-2xl flex items-center justify-center select-none shadow-sm uppercase">
            {employee ? `${employee.first_name.slice(0,1)}${employee.last_name.slice(0,1)}` : 'AD'}
          </div>
          <div>
            <h3 className="font-black text-lg text-gray-950">
              {employee ? `${employee.first_name} ${employee.last_name}` : 'Administrator'}
            </h3>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mt-0.5">
              {user.role}
            </span>
          </div>
        </div>

        {/* Detailed logs */}
        <div className="p-8 grow space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h4 className="text-xs uppercase tracking-wider font-bold text-gray-400">Account Credentials</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-gray-650">
            <div className="space-y-1">
              <span className="text-xs text-gray-400 block font-bold">Email Address</span>
              <div className="flex items-center gap-2 text-gray-900">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{user.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-gray-400 block font-bold">Account Created</span>
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{user.created_at.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {isEmployee && employee && (
            <>
              <div className="border-b border-gray-100 pt-4 pb-4">
                <h4 className="text-xs uppercase tracking-wider font-bold text-gray-400">Professional Assignment</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-gray-650">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block font-bold">Designation</span>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span>{employee.designation || 'Staff'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block font-bold">Department</span>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Landmark className="w-4 h-4 text-gray-400" />
                    <span>{employee.department_name || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block font-bold">Contact Phone</span>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{employee.phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block font-bold">Date of Joining</span>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{employee.join_date}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block font-bold">Basic Remuneration</span>
                  <div className="flex items-center gap-2 text-gray-900">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span>₹{employee.base_salary.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
