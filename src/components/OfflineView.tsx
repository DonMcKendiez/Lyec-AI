import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function OfflineView() {
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = () => {
    setIsChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      }
      setIsChecking(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="w-20 h-20 bg-stone-200 rounded-full flex items-center justify-center mb-8"
      >
        <WifiOff className="w-10 h-10 text-stone-400" />
      </motion.div>
      
      <div className="space-y-2 mb-12">
        <h2 className="text-2xl font-display italic font-black text-brand-text uppercase">Signal Lost</h2>
        <p className="text-stone-400 font-medium tracking-tight">The archives are partially inaccessible without a network connection.</p>
      </div>

      <div className="p-6 bg-white rounded-3xl border border-stone-100 shadow-sm max-w-xs w-full space-y-4">
        <div className="flex items-start gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-stone-500 leading-relaxed">
            Some cached data (local dictionary, basic lessons) may still be available, but AI-powered analysis requires an active link.
          </p>
        </div>
        
        <button 
          onClick={checkConnection}
          disabled={isChecking}
          className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Syncing...' : 'Retry Connection'}
        </button>
      </div>
    </div>
  );
}
