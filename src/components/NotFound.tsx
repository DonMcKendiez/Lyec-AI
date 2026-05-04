import React from 'react';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface NotFoundProps {
  onBack: () => void;
}

export default function NotFound({ onBack }: NotFoundProps) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 bg-stone-100 rounded-[2rem] flex items-center justify-center mb-8 rotate-12"
      >
        <FileQuestion className="w-12 h-12 text-stone-300" />
      </motion.div>
      
      <h1 className="text-6xl font-display italic font-black text-brand-text mb-4">404</h1>
      <h2 className="text-xl font-black uppercase tracking-widest text-stone-400 mb-8">Archive Path Not Found</h2>
      
      <p className="max-w-xs text-stone-500 font-medium leading-relaxed mb-12 italic">
        The scroll you seek has either been lost to time or never existed in the current dynasty.
      </p>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button 
          onClick={onBack}
          className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Return to Hub
        </button>
      </div>
    </div>
  );
}
