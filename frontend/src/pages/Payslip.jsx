import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2, Award, Mail, Phone, Calendar } from 'lucide-react';
import api from '../utils/api';

const Payslip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        const response = await api.get(`/payslips/salary/${id}`);
        setPayslip(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to retrieve payslip details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayslip();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div className="p-6 text-center text-rose-500 font-semibold bg-rose-50 border border-rose-100 rounded-2xl max-w-md mx-auto mt-10">
        {error || 'Payslip not found.'}
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center justify-center gap-2 mx-auto text-xs font-bold text-indigo-600 hover:text-indigo-850"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Header - Hidden on Print */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-250 bg-white px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-555 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-650/10"
        >
          <Printer className="w-4.5 h-4.5" />
          Print Payslip
        </button>
      </div>

      {/* Payslip Document container */}
      <div className="bg-white p-8 border border-gray-200 rounded-3xl shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl font-black text-xl text-white flex items-center justify-center shadow-lg shadow-indigo-650/15">
              P
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-gray-900">PayPortal Corporate Ltd.</h2>
              <span className="text-xs text-gray-400 font-semibold">Official Payment Remittance Slip</span>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-black text-gray-950 uppercase tracking-tight">Payslip</h1>
            <span className="text-xs text-gray-500 font-bold font-mono">Statement Month: {payslip.payment_month}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm border-b border-gray-100 pb-8">
          {/* Employee Meta */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400">Employee Details</h3>
            <div className="space-y-2">
              <p className="font-bold text-gray-950 text-base">{payslip.employee_name}</p>
              <div className="space-y-1 text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-gray-400" /> {payslip.designation} ({payslip.department_name})</span>
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> {payslip.email}</span>
                {payslip.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> {payslip.phone}</span>}
              </div>
            </div>
          </div>

          {/* Payment Meta */}
          <div className="space-y-4 md:text-right">
            <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400">Payment Details</h3>
            <div className="space-y-2 text-xs font-semibold text-gray-500 inline-block md:block">
              <p className="text-slate-900 font-bold">Transaction Reference: <span className="font-mono text-gray-950 font-black">#PAY-{payslip.id}</span></p>
              <p className="flex md:justify-end items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> Payout Date: {payslip.payment_date || 'N/A'}</p>
              <div className="mt-2 md:float-right">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase bg-emerald-50 border-emerald-250 text-emerald-700">
                  {payslip.payment_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Salary Ledger Breakdown */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400">Salary Breakdown</h3>
          <div className="overflow-hidden border border-gray-100 rounded-2xl">
            <table className="w-full text-left text-sm text-gray-800">
              <thead className="bg-gray-50 font-bold text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3 border-b border-gray-100">Item Description</th>
                  <th className="px-6 py-3 border-b border-gray-100 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-650">
                <tr>
                  <td className="px-6 py-4">Basic Base Salary</td>
                  <td className="px-6 py-4 text-right text-gray-950 font-bold">₹{payslip.base_salary.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Performance Incentives / Bonuses</td>
                  <td className="px-6 py-4 text-right text-emerald-600">₹{payslip.bonuses.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Deductions (Unpaid Leaves / Absences)</td>
                  <td className="px-6 py-4 text-right text-rose-600">-(₹{payslip.deductions.toLocaleString()})</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Remittance Board */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-white flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Net Remitted Pay</h4>
            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Calculated based on calendar logs</span>
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            ₹{payslip.net_salary.toLocaleString()}
          </span>
        </div>

        {/* Corporate Note */}
        <div className="text-center text-[10px] text-gray-400 font-semibold border-t border-gray-100 pt-6">
          <p>This is a computer-generated document and does not require a physical signature.</p>
          <p className="mt-1">For any queries regarding attendance logs or deductions, please contact the HR / Accounts department.</p>
        </div>

      </div>
    </div>
  );
};

export default Payslip;
