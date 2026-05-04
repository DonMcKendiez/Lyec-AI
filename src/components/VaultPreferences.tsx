import React, { useState } from 'react';
import { Shield, Key, Eye, EyeOff, Lock, ChevronLeft, Save, Trash2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface VaultPreferencesProps {
  onBack: () => void;
}

export default function VaultPreferences({ onBack }: VaultPreferencesProps) {
  const { profile, updateProfile } = useAuth();
  const [showPin, setShowPin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleEncryption = () => {
    if (updateProfile) {
      updateProfile({ encryptionEnabled: !profile?.encryptionEnabled });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-3 bg-stone-100 rounded-2xl hover:bg-stone-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-display italic font-black text-brand-text leading-none uppercase">Vault Preferences</h2>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Encrypted Heritage Storage</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Encryption Toggle */}
        <div className="p-8 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="font-display italic font-black text-brand-text">Heritage Encryption</h3>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">AES-256 Local Storage</p>
              </div>
            </div>
            <button 
              onClick={handleToggleEncryption}
              className={`w-14 h-8 rounded-full transition-all relative ${ profile?.encryptionEnabled ? 'bg-brand-primary' : 'bg-stone-200' }`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${ profile?.encryptionEnabled ? 'left-7' : 'left-1' } shadow-sm`} />
            </button>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed italic">
            When enabled, all local learning logs, scanner history, and personalized archives are encrypted before being stored on your device.
          </p>
        </div>

        {/* PIN Management */}
        <div className="p-8 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center">
              <Key className="w-6 h-6 text-stone-400" />
            </div>
            <div>
              <h3 className="font-display italic font-black text-brand-text">Vault Access PIN</h3>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Secondary Authorization</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <input 
              type={showPin ? "text" : "password"}
              maxLength={4}
              placeholder="----"
              className="flex-1 bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 py-4 font-mono text-2xl tracking-[0.5em] focus:border-brand-primary outline-none transition-all"
            />
            <button 
              onClick={() => setShowPin(!showPin)}
              className="p-4 text-stone-300 hover:text-brand-primary transition-colors"
            >
              {showPin ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </button>
          </div>
          
          <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all">
            Update Archive PIN
          </button>
        </div>

        {/* Data Erasure */}
        <div className="p-8 bg-stone-50 border-2 border-dashed border-stone-200 rounded-[3rem] space-y-4">
          <div className="flex items-center gap-3 text-red-500">
            <Trash2 className="w-5 h-5" />
            <h3 className="font-display italic font-black uppercase">Dangerous Actions</h3>
          </div>
          <p className="text-xs text-stone-400 font-medium">Permanently wipe all encrypted heritage data from this local device. This action is irreversible.</p>
          <button className="w-full py-4 border-2 border-red-100 text-red-500 rounded-2xl font-black uppercase tracking-widest hover:bg-red-50 transition-all">
            Purge Local Vault
          </button>
        </div>
      </div>
    </div>
  );
}
