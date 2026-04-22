import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center space-y-3 pointer-events-none w-full max-w-[90%] md:max-w-md">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-100',
    error: 'bg-rose-50 border-rose-100',
    info: 'bg-blue-50 border-blue-100',
    warning: 'bg-amber-50 border-amber-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className={`pointer-events-auto flex items-center p-4 rounded-2xl border shadow-xl shadow-pink-500/5 ${bgColors[toast.type]} min-w-[280px] max-w-full`}
    >
      <div className="flex-shrink-0 mr-3">
        {icons[toast.type]}
      </div>
      <p className="text-sm font-bold text-gray-700 flex-1 mr-2">{toast.message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <XCircle className="w-4 h-4 opacity-50" />
      </button>
    </motion.div>
  );
};
