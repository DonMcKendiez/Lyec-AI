import React, { useState } from 'react';
import { ShieldCheck, Fingerprint, UserCheck, ShieldAlert, ChevronLeft, Smartphone, History, LogOut, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface IdentitySecurityProps {
  onBack: () => void;
}

export default function IdentitySecurity({ onBack }: IdentitySecurityProps) {
  const { profile, updateProfile, signOut, deleteAccount } = useAuth();

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure? This will PERMANENTLY delete your heritage archive, XP, and identity from the system. This cannot be undone.")) {
      try {
        await deleteAccount();
      } catch (error) {
        console.error(error);
        alert("Authentication required. Please log out and log back in to perform this sensitive action.");
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-3 bg-stone-100 rounded-2xl hover:bg-stone-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-display italic font-black text-brand-text leading-none uppercase">Identity Security</h2>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Biometric & Account Guard</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Biometrics */}
        <div className="p-8 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-display italic font-black text-brand-text">Biometric Login</h3>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">FaceID / TouchID / Passkey</p>
              </div>
            </div>
            <button 
              onClick={() => updateProfile && updateProfile({ biometricsEnabled: !profile?.biometricsEnabled })}
              className={`w-14 h-8 rounded-full transition-all relative ${ profile?.biometricsEnabled ? 'bg-green-500' : 'bg-stone-200' }`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${ profile?.biometricsEnabled ? 'left-7' : 'left-1' } shadow-sm`} />
            </button>
          </div>
        </div>

        {/* Device Sessions */}
        <div className="p-8 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-stone-400" />
            </div>
            <div>
              <h3 className="font-display italic font-black text-brand-text">Active Archivist Sessions</h3>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Real-time Device Monitor</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <p className="text-xs font-black uppercase text-brand-text">Current Browser</p>
                  <p className="text-[10px] text-stone-400 font-bold uppercase">Last sync: Just now</p>
                </div>
              </div>
              <span className="text-[8px] font-black text-brand-primary uppercase bg-brand-primary/10 px-2 py-1 rounded-full">Primary</span>
            </div>
          </div>
        </div>

        {/* Session Log */}
        <div className="p-8 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center">
              <History className="w-6 h-6 text-stone-400" />
            </div>
            <div>
              <h3 className="font-display italic font-black text-brand-text">Heritage Access Log</h3>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Security Audit Trail</p>
            </div>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed italic">
            Monitor all login attempts and archive access requests for your profile. 
          </p>
          <button className="w-full py-4 border-2 border-stone-50 text-stone-400 rounded-2xl font-black uppercase tracking-widest hover:border-brand-primary hover:text-brand-primary transition-all">
            View Audit History
          </button>
        </div>

        {/* Global Signout & Deregister */}
        <div className="space-y-4">
          <button 
            onClick={signOut}
            className="w-full py-6 bg-stone-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-stone-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out of Archive
          </button>
          
          <button 
            onClick={handleDeleteAccount}
            className="w-full py-6 bg-red-50 text-red-500 rounded-[2.5rem] font-black uppercase tracking-[0.2em] hover:bg-red-100 transition-all flex items-center justify-center gap-3 border-2 border-red-100 shadow-sm"
          >
            <Trash2 className="w-5 h-5" />
            Deregister Identity
          </button>
        </div>
      </div>
    </div>
  );
}
