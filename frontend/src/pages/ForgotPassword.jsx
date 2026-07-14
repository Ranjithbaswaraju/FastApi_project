import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(response.data.message || 'Reset link sent successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit request. Ensure email exists.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl font-black text-2xl text-white shadow-xl shadow-indigo-600/20 mb-3">
            P
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Reset Password</h2>
          <p className="text-sm text-slate-400 mt-1.5 font-medium">
            Recover access to your account
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-2xl flex items-start gap-3 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-2xl flex items-start gap-3 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Enter your email address below. If an account is registered with us under this email, we'll send a password recovery verification link.
              </p>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-650 hover:bg-indigo-600 active:scale-[0.98] text-white text-sm font-bold rounded-2xl shadow-xl shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Send Recovery Link'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center py-3 px-4 w-full bg-slate-950 border border-slate-800 text-slate-350 hover:text-white text-sm font-bold rounded-2xl hover:border-slate-700 transition-all"
              >
                Return to Login
              </Link>
            </div>
          )}
        </div>

        {!success && (
          <p className="text-center text-sm font-semibold text-slate-500 mt-6">
            Remembered password?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Login here
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
