import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

interface NotificationContextType {
  notify: (title: string, message: string, type?: 'info' | 'success' | 'warning') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className="pointer-events-auto"
            >
              <div className="bg-brand-text text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-3 min-w-[280px] max-w-[320px]">
                <div className={`p-2 rounded-lg ${
                  n.type === 'success' ? 'bg-green-500/20 text-green-400' :
                  n.type === 'warning' ? 'bg-red-500/20 text-red-400' :
                  'bg-brand-primary/20 text-brand-primary'
                }`}>
                  {n.type === 'success' ? <CheckCircle size={16} /> :
                   n.type === 'warning' ? <AlertCircle size={16} /> :
                   <Bell size={16} />}
                </div>
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest">{n.title}</h4>
                  <p className="text-[11px] text-white/60 font-medium leading-tight">{n.message}</p>
                </div>
                <button 
                  onClick={() => setNotifications(prev => prev.filter(nx => nx.id !== n.id))}
                  className="text-white/20 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
}
