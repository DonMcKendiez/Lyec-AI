import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Lock, 
  Fingerprint, 
  Smartphone,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth, signInWithGoogle, setupRecaptcha } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, AgeMode } from '../contexts/AuthContext';
import { Baby, User } from 'lucide-react';

type AuthMode = 'selection' | 'email' | 'phone' | 'verify-phone' | 'age-choice' | 'success';
type Action = 'login' | 'signup';

export default function SecureAuth({ onComplete }: { onComplete: () => void }) {
  const { updateProfile } = useAuth();
  const [mode, setMode] = useState<AuthMode>('selection');
  const [action, setAction] = useState<Action>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const handleError = (err: any) => {
    console.error(err);
    if (err.code === 'auth/user-not-found') setError("Vault access denied: Account does not exist.");
    else if (err.code === 'auth/wrong-password') setError("Vault access denied: Invalid credentials.");
    else if (err.code === 'auth/invalid-email') setError("Secure format error: Invalid email address.");
    else if (err.code === 'auth/weak-password') setError("Security risk: Password must be at least 6 characters.");
    else setError("Secure subsystem failure. Please try again.");
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (action === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setMode('success');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setMode('age-choice');
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const verifier = setupRecaptcha('recaptcha-container');
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(confirmation);
      setMode('verify-phone');
      setLoading(false);
    } catch (err) {
      handleError(err);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    setError(null);
    try {
      await confirmationResult.confirm(verificationCode);
      setMode('success');
    } catch (err) {
      handleError(err);
    }
  };

  const handleAgeChoice = async (choice: AgeMode) => {
    setLoading(true);
    try {
      await updateProfile({ ageMode: choice });
      setMode('success');
    } catch (err) {
      handleError(err);
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      setMode('success');
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div id="recaptcha-container"></div>
      
      <motion.div 
        layout
        className="w-full max-w-md bg-white rounded-[2.5rem] border border-stone-100 shadow-2xl shadow-brand-text/5 overflow-hidden"
      >
        <div className="p-8 md:p-12 space-y-8">
          <header className="text-center space-y-3">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto text-brand-primary">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-display italic font-black text-brand-text tracking-tight">
                {mode === 'success' ? 'Authenticated' : 'Secure Gateway'}
              </h2>
              <p className="text-stone-400 font-medium text-sm">
                {mode === 'selection' ? 'Choose your secure access method' : 'Verification required for Lyec protocols'}
              </p>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {mode === 'selection' && (
              <motion.div 
                key="selection"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4 p-1 bg-stone-50 rounded-2xl mb-8">
                  <button 
                    onClick={() => setAction('login')}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${action === 'login' ? 'bg-white text-brand-text shadow-sm' : 'text-stone-400'}`}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setAction('signup')}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${action === 'signup' ? 'bg-white text-brand-text shadow-sm' : 'text-stone-400'}`}
                  >
                    Registry
                  </button>
                </div>

                <AuthButton 
                  icon={<Mail className="w-5 h-5" />} 
                  label="Email Authentication" 
                  onClick={() => setMode('email')} 
                />
                <AuthButton 
                  icon={<Smartphone className="w-5 h-5" />} 
                  label="Phone Verification" 
                  onClick={() => setMode('phone')} 
                />
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em] text-stone-300 bg-white px-2">Luo Trust Network</div>
                </div>
                <AuthButton 
                  icon={<img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale opacity-50" alt="" />} 
                  label="Google SSO" 
                  onClick={handleGoogleAuth}
                  primary
                />
              </motion.div>
            )}

            {mode === 'email' && (
              <motion.form 
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailAuth}
                className="space-y-6"
              >
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Email Hash</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-6 py-4 bg-stone-50 rounded-2xl border border-stone-100 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-bold"
                        placeholder="curator@lyec.heritage"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Master Key</label>
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-6 py-4 bg-stone-50 rounded-2xl border border-stone-100 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-bold"
                        placeholder="••••••••"
                      />
                   </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setMode('selection')}
                    className="p-4 bg-stone-50 text-stone-400 rounded-2xl hover:text-brand-text transition-all"
                  >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-brand-text text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : action === 'login' ? 'Initiate Link' : 'Next Step'}
                    {!loading && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </motion.form>
            )}

            {mode === 'age-choice' && (
              <motion.div 
                key="age-choice"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-brand-text">Content Filtering</h3>
                  <p className="text-xs text-stone-400">Select the intended audience for this heritage archive.</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => handleAgeChoice('adult')}
                    className="flex items-center gap-6 p-6 bg-stone-50 rounded-3xl border-2 border-transparent hover:border-brand-primary group transition-all"
                  >
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-stone-400 group-hover:text-brand-primary transition-colors">
                      <User className="w-8 h-8" />
                    </div>
                    <div className="text-left">
                       <p className="text-sm font-black text-brand-text uppercase tracking-tight">Adult Mode</p>
                       <p className="text-[10px] text-stone-400 font-medium">Full access to historical archives and proverbs.</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleAgeChoice('children')}
                    className="flex items-center gap-6 p-6 bg-amber-50 rounded-3xl border-2 border-transparent hover:border-amber-400 group transition-all"
                  >
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-amber-400 group-hover:scale-110 transition-all">
                      <Baby className="w-8 h-8" />
                    </div>
                    <div className="text-left">
                       <p className="text-sm font-black text-amber-700 uppercase tracking-tight">Children Mode</p>
                       <p className="text-[10px] text-amber-600/60 font-medium">Safe learning, simplified folk tales, and games.</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'phone' && (
              <motion.form 
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handlePhoneAuth}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Terminal Number (Intl. Format)</label>
                  <input 
                    type="tel" 
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-50 rounded-2xl border border-stone-100 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-bold"
                    placeholder="+256 700 000000"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setMode('selection')}
                    className="p-4 bg-stone-50 text-stone-400 rounded-2xl hover:text-brand-text transition-all"
                  >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-brand-text text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-text/20"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request SMS Token'}
                    {!loading && <Smartphone className="w-4 h-4" />}
                  </button>
                </div>
              </motion.form>
            )}

            {mode === 'verify-phone' && (
              <motion.form 
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleVerifyCode}
                className="space-y-6"
              >
                <div className="space-y-1 text-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">SMS Token Issued</label>
                  <div className="flex justify-center gap-2 mt-4">
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full max-w-[200px] text-center px-6 py-6 bg-stone-50 rounded-3xl border-2 border-stone-100 outline-none focus:border-brand-primary transition-all text-3xl font-black tracking-[0.5em]"
                      placeholder="000000"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-primary/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Identity'}
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </motion.form>
            )}

            {mode === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-4"
              >
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white shadow-xl shadow-green-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-brand-text">Access Granted</h3>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Protocol Handshake Complete</p>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-4 text-left">
                  <div className="flex items-center gap-3 text-amber-600">
                    <ShieldCheck className="w-5 h-5" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Security Advisory</h4>
                  </div>
                  <p className="text-[11px] text-amber-900/60 font-medium leading-relaxed">
                    We highy recommend enabling 2-Factor Authentication (2FA) in your account settings to prevent unauthorized access to your heritage archive.
                  </p>
                </div>

                <button 
                  onClick={onComplete}
                  className="w-full py-4 bg-brand-text text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
                >
                  Enter Archive
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
            </motion.div>
          )}
        </div>

        <footer className="p-8 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
           <div className="flex items-center gap-2 opacity-30 grayscale">
             <Fingerprint size={20} />
             <span className="text-[8px] font-black tracking-widest uppercase">Bio-Metric Optional</span>
           </div>
           <div className="flex items-center gap-2 text-stone-300">
             <Lock size={12} />
             <span className="text-[8px] font-black tracking-widest uppercase">AES-256 Encrypted</span>
           </div>
        </footer>
      </motion.div>
    </div>
  );
}

function AuthButton({ icon, label, onClick, primary = false }: { icon: React.ReactNode, label: string, onClick: () => void, primary?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-95 group ${
        primary 
          ? 'bg-white border-stone-100 hover:border-brand-primary' 
          : 'bg-stone-50 border-transparent hover:bg-white hover:border-stone-100'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-xl bg-white shadow-sm border border-stone-100 group-hover:scale-110 transition-transform ${primary ? 'text-brand-primary' : 'text-stone-400'}`}>
          {icon}
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-brand-text">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-brand-primary transition-colors" />
    </button>
  );
}
