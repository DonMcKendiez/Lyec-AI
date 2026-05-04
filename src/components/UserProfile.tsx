import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Camera, 
  ShieldCheck, 
  Settings as SettingsIcon, 
  ChevronRight, 
  Bell, 
  Eye, 
  Globe, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Lock,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Logo from './Logo';

import { APP_VERSION } from '../services/notificationService';

export default function UserProfile({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { user, profile, updateProfile, signOut, deleteAccount } = useAuth();
  const { notify } = useNotification();
  const [isAdultVerified, setIsAdultVerified] = useState(profile?.ageMode === 'adult');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.photoURL || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadLoading(true);
      // Simulate upload
      setTimeout(() => {
        const url = URL.createObjectURL(file);
        setProfileImage(url);
        setUploadLoading(false);
        notify("Identity Updated", "Your profile portrait has been preserved.", "success");
      }, 1500);
    }
  };

  const handleAdultVerification = async () => {
    await updateProfile({ ageMode: 'adult' });
    setIsAdultVerified(true);
    setShowVerificationModal(false);
    notify("Status Verified", "Your status as a Mature Elder has been confirmed.", "success");
  };

  const handlePersonaChange = async (newPersona: string) => {
    await updateProfile({ persona: newPersona as any });
    notify("Persona Shifted", `The AI will now interact with you as a ${newPersona}.`, "info");
  };

  const handleNavigate = (tab: string) => {
    if (onNavigate) onNavigate(tab);
  };

  const archiveSettings = [
    { label: 'Auto-Translate Oral News', enabled: true },
    { label: 'Elder Voice Guidance', enabled: true },
    { label: 'Offline Heritage Maps', enabled: false },
    { label: 'Sacred Ritual Filter', enabled: isAdultVerified },
  ];

  const personaOptions = [
    { id: 'friendly', label: 'Friendly', description: 'Warm and encouraging' },
    { id: 'professional', label: 'Scholar', description: 'Technical and precise' },
    { id: 'bestie', label: 'Bestie', description: 'Casual and supportive' },
    { id: 'colleague', label: 'Peer', description: 'Balanced and collaborative' },
  ];

  const languages = [
    'Acholi', 'Luganda', 'Swahili', 'Luo', 'Runyankole', 'Lusoga', 'Lugisu', 'Kinyarwanda', 'English', 'French', 'Amharic', 'Oromo'
  ];

  const handleUpdateLanguage = (type: 'native' | 'target', lang: string) => {
    if (updateProfile) {
      updateProfile({ [type === 'native' ? 'nativeLanguage' : 'targetLanguage']: lang });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-24 md:pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Profile Section */}
      <section className="mt-8 mb-12 flex flex-col md:flex-row items-center gap-8 md:text-left px-4">
        <div className="relative group">
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] bg-stone-50 border-8 border-white shadow-2xl overflow-hidden relative">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-100">
                <User className="w-20 h-20 text-stone-200" />
              </div>
            )}
            
            {uploadLoading && (
              <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-x-0 bottom-0 py-3 bg-brand-text/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white"
            >
              <Camera className="w-5 h-5 mr-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">Update</span>
            </button>
          </div>
          
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-2 -right-2 w-12 h-12 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white ${isAdultVerified ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}
          >
            {isAdultVerified ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </motion.div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <h2 className="text-4xl font-display italic font-black text-brand-text leading-tight tracking-tighter">
              {user?.displayName || (user?.email?.split('@')[0]) || 'Luo Voyager'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">
                {user?.email}
              </span>
              <div className="w-1 h-1 bg-stone-200 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                Member since 2024
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="px-4 py-2 bg-white rounded-2xl border border-stone-100 shadow-sm flex items-center gap-3">
               <div className="w-2 h-2 bg-green-500 rounded-full" />
               <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                 Level {profile?.level || 1} Archivist
               </span>
            </div>
            <div className="px-4 py-2 bg-brand-text text-white rounded-2xl shadow-lg shadow-brand-text/10 flex items-center gap-3">
               <span className="text-xs font-black italic">{profile?.xp || 0}</span>
               <span className="text-[10px] font-black uppercase tracking-widest text-white/60">XP</span>
            </div>
          </div>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
          accept="image/*"
        />
      </section>

      {/* AI Persona Section */}
      <section className="mb-8 p-8 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display italic font-black text-brand-text leading-none uppercase">AI Interaction Persona</h3>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">Customize How the Archive Speaks</p>
          </div>
          <SettingsIcon className="w-5 h-5 text-stone-200" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {personaOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handlePersonaChange(opt.id)}
              className={`p-4 rounded-2xl border-2 transition-all text-left space-y-1 ${
                profile?.persona === opt.id 
                  ? 'border-brand-primary bg-brand-primary/5' 
                  : 'border-stone-50 bg-stone-50/50 hover:border-stone-200'
              }`}
            >
              <div className={`text-[10px] font-black uppercase tracking-widest ${profile?.persona === opt.id ? 'text-brand-primary' : 'text-stone-400'}`}>
                {opt.label}
              </div>
              <div className="text-[8px] font-medium text-stone-400 leading-tight">
                {opt.description}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Language Selection Section */}
      <section className="mb-8 p-8 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display italic font-black text-brand-text leading-none uppercase">Linguistic Settings</h3>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">Select your Native and Target languages</p>
          </div>
          <Globe className="w-5 h-5 text-stone-200" />
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-2">Native Language (Self-Known)</label>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleUpdateLanguage('native', lang)}
                  className={`px-4 py-2 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-widest ${
                    profile?.nativeLanguage === lang 
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' 
                      : 'border-stone-50 bg-stone-50 text-stone-400 hover:border-stone-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary ml-2 italic">Language to Learn / Enrich</label>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleUpdateLanguage('target', lang)}
                  className={`px-4 py-2 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-widest ${
                    profile?.targetLanguage === lang 
                      ? 'border-brand-primary bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                      : 'border-stone-50 bg-stone-50 text-stone-400 hover:border-stone-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <p className="text-[8px] font-medium text-stone-400 leading-tight ml-2">
              Select a language to start learning from scratch or to enrich your current fluency. 
              The Archive will customize its speech output and cultural guidance to your choice.
            </p>
          </div>
        </div>
      </section>

      {/* Schedule & Reminders */}
      <section className="mb-8 p-8 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display italic font-black text-brand-text leading-none uppercase">Learning Schedule</h3>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">Set your daily archiving habits</p>
          </div>
          <Bell className="w-5 h-5 text-stone-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-stone-50/50 rounded-3xl border border-stone-100 flex flex-col gap-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Preferred Daily Time</label>
             <input 
               type="time" 
               value={profile?.learningTime || '09:00'}
               onChange={(e) => updateProfile({ learningTime: e.target.value })}
               className="bg-white border border-stone-100 rounded-xl px-4 py-3 text-sm font-black text-brand-text outline-none focus:border-brand-primary transition-colors"
             />
          </div>

          <div className="p-5 bg-stone-50/50 rounded-3xl border border-stone-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-text leading-tight">Daily Reminders</span>
              <span className="text-[8px] font-bold text-stone-400 italic">Push Notifications</span>
            </div>
            <button 
              onClick={() => updateProfile({ remindersEnabled: !profile?.remindersEnabled })}
              className={`w-12 h-7 rounded-full p-1 transition-all duration-300 flex items-center ${profile?.remindersEnabled ? 'bg-brand-primary justify-end' : 'bg-stone-200 justify-start'}`}
            >
              <div className="w-5 h-5 bg-white rounded-full shadow-lg" />
            </button>
          </div>
        </div>
      </section>

      {/* Adult Verification Card */}
      {!isAdultVerified ? (
        <section 
          onClick={() => setShowVerificationModal(true)}
          className="mb-8 p-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[3rem] text-white shadow-2xl shadow-amber-500/30 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-48 h-48" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-display italic font-black text-2xl tracking-tight">Mature Content Verification</h3>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Required for Oral Ritual Archives</p>
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium leading-relaxed max-w-sm">
              Some archival material contains sacred rituals and advanced oral histories restricted to mature listeners. Verify your status to proceed.
            </p>
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white text-brand-text rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-50 transition-colors">
              Begin Identity Verification <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-8 p-8 bg-white rounded-[3rem] border-4 border-green-500/10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500/10 text-green-600 rounded-3xl flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-display italic font-black text-2xl text-brand-text">Verified Archivist</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Full Access Enabled</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archiveSettings.map((config, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-stone-50/50 rounded-3xl border border-stone-100/50">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-widest text-brand-text leading-tight">{config.label}</span>
                    <span className="text-[9px] font-bold text-stone-400 italic">Archival Control</span>
                  </div>
                  <button className={`w-12 h-7 rounded-full p-1 transition-all duration-300 flex items-center ${config.enabled ? 'bg-green-500 justify-end' : 'bg-stone-200 justify-start'}`}>
                    <div className="w-5 h-5 bg-white rounded-full shadow-lg" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => handleNavigate('vault-prefs')}
          className="p-8 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6 text-left group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-300">Vault Preferences</h3>
            <ChevronRight className="w-4 h-4 text-stone-200 group-hover:text-brand-primary transition-colors" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-brand-text uppercase tracking-widest leading-none">Security Vault</p>
              <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">Encryption & PIN</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleNavigate('identity-security')}
          className="p-8 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-6 text-left group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-300">Identity Security</h3>
            <ChevronRight className="w-4 h-4 text-stone-200 group-hover:text-brand-primary transition-colors" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-brand-text uppercase tracking-widest leading-none">Guard Access</p>
              <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">Biometrics & Audit</p>
            </div>
          </div>
        </button>
      </div>

      {/* Danger Zone */}
      <section className="bg-red-50/50 rounded-[3rem] border border-red-100 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-red-300">Archive Session</h3>
          <LogOut className="w-4 h-4 text-red-200" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <button 
            onClick={signOut}
            className="flex-1 py-5 bg-white border border-red-100 text-red-500 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-sm hover:shadow-red-500/10 active:scale-95 transition-all text-center"
          >
            Purge Current Session
          </button>
          <button 
            onClick={handleDeleteAccount}
            className="flex-1 py-5 bg-red-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Deregister Heritage Profile
          </button>
        </div>
      </section>

      {/* Footer Branding */}
      <div className="mt-20 flex flex-col items-center gap-4 opacity-20 group grayscale hover:grayscale-0 transition-all cursor-default">
        <Logo size={48} />
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-600">Lyec Digital Heritage System</p>
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-400 mt-1">Certified Acholi Archive v{APP_VERSION}</p>
        </div>
      </div>

      {/* Adult Verification Modal */}
      <AnimatePresence>
        {showVerificationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVerificationModal(false)}
              className="absolute inset-0 bg-stone-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] p-8 space-y-8 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 text-white">
                <ShieldCheck className="w-10 h-10" />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-3xl font-display italic font-black text-brand-text leading-tight">Maturity Status</h3>
                <p className="text-sm text-stone-500 font-medium leading-relaxed">
                  The Archive contains sensitive cultural data and mature oral traditions. Confirm you are over 18 to proceed.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleAdultVerification}
                  className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-primary/20 active:scale-[0.98] transition-all"
                >
                  I am a Mature Elder (18+)
                </button>
                <button 
                  onClick={() => setShowVerificationModal(false)}
                  className="w-full py-4 text-stone-400 font-black uppercase tracking-widest text-[10px] hover:text-stone-600 transition-colors"
                >
                  Return to Junior Vault
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
