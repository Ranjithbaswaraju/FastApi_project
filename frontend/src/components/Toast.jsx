import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgColors = {
    success: 'bg-emerald-550 border-emerald-600 text-emerald-900 bg-emerald-50',
    error: 'bg-rose-50 border-rose-200 text-rose-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce">
      <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl shadow-lg ${bgColors[type]}`}>
        {icons[type]}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
