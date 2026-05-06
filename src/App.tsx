/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Languages, MessageSquareCode, GraduationCap, Heart, Landmark, Sparkles, Home as HomeIcon, Book, Camera, LogOut, LayoutGrid, Settings as SettingsIcon, User, ChevronRight, Menu, ChevronUp } from 'lucide-react';
import Home from './components/Home';
import Translator from './components/Translator';
import ChatTutor from './components/ChatTutor';
import Practice from './components/Practice';
import Culture from './components/Culture';
import HeritageAssistant from './components/HeritageAssistant';
import Dictionary from './components/Dictionary';
import HeritageScanner from './components/HeritageScanner';
import Classroom from './components/Classroom';
import Logo from './components/Logo';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import VaultPreferences from './components/VaultPreferences';
import IdentitySecurity from './components/IdentitySecurity';
import NotFound from './components/NotFound';
import OfflineView from './components/OfflineView';
import SecureAuth from './components/SecureAuth';
import LiveAssistant from './components/LiveAssistant';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { db } from './lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import { Phone, Sparkles as SparklesIcon } from 'lucide-react';

import { requestNotificationPermission, sendLocalNotification, checkForUpdates, APP_VERSION, acknowledgeUpdate } from './services/notificationService';

type Tab = 'home' | 'scan' | 'chat' | 'dictionary' | 'translator' | 'culture' | 'lab' | 'progress' | 'practice' | 'auth' | 'admin' | 'settings' | 'privacy' | 'terms' | 'vault-prefs' | 'identity-security' | '404';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ available: boolean; version: string } | null>(null);
  
  const lastRemindedMinute = useRef("");
  const [showBars, setShowBars] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const { notify } = useNotification();

  // Reset scroll on tab change
  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  }, [activeTab]);

  useEffect(() => {
    // Validate Connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration or internet connection.");
        }
      }
    };
    testConnection();

    // Check for updates
    const checkUpdates = async () => {
      const info = await checkForUpdates();
      if (info.updateAvailable) {
        setUpdateInfo({ available: true, version: info.latestVersion });
      }
    };
    checkUpdates();

    // Notification Permission
    requestNotificationPermission();
    
    // Reminder Interval
    const reminderInterval = setInterval(() => {
      if (profile?.remindersEnabled && profile.learningTime) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (currentTime === profile.learningTime && lastRemindedMinute.current !== currentTime) {
          lastRemindedMinute.current = currentTime;
          sendLocalNotification("Heritage Learning Time!", {
            body: "It's time for your daily Acholi archive session. Keep the legacy alive!",
            tag: 'learning-reminder'
          });
          notify("Learning Alert", "Your scheduled heritage session is now active.", "info", true);
        }
      }
    }, 10000);

    // Online Status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(reminderInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [profile?.remindersEnabled, profile?.learningTime]);

  const mainTabs = [
    { id: 'home', label: 'Feed', icon: <HomeIcon className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'chat', label: 'Tutor', icon: <MessageSquareCode className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'scan', label: 'Scanner', icon: <Camera className="w-6 h-6" />, primary: true },
    { id: 'dictionary', label: 'Lexicon', icon: <Book className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'more', label: 'More', icon: <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />, isMore: true },
  ];

  const secondaryTabs = [
    { id: 'translator', label: 'Translator', icon: <Languages className="w-4 h-4" /> },
    { id: 'culture', label: 'Heritage', icon: <Landmark className="w-4 h-4" /> },
    { id: 'progress', label: 'Classes', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'practice', label: 'Drills', icon: <Heart className="w-4 h-4" /> },
    { id: 'lab', label: 'Archivist Lab', icon: <Sparkles className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-6">
          <Logo size={80} className="animate-pulse" />
          <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em]">Archiving Heritage...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!isOnline && !['settings', 'dictionary', 'progress', 'practice'].includes(activeTab)) {
      return <OfflineView />;
    }

    switch (activeTab) {
      case 'home': return <Home onNavigate={(tab) => setActiveTab(tab as Tab)} />;
      case 'translator': return <Translator />;
      case 'chat': return <ChatTutor />;
      case 'practice': return <Practice />;
      case 'culture': return <Culture />;
      case 'lab': return <HeritageAssistant />;
      case 'dictionary': return <Dictionary />;
      case 'progress': return <Classroom />;
      case 'scan': return <HeritageScanner />;
      case 'privacy': return <PrivacyPolicy onBack={() => setActiveTab('home')} />;
      case 'terms': return <TermsOfService onBack={() => setActiveTab('home')} />;
      case 'admin': return <AdminPanel />;
      case 'settings': return <UserProfile onNavigate={(tab) => setActiveTab(tab as any)} />;
      case 'vault-prefs': return <VaultPreferences onBack={() => setActiveTab('settings')} />;
      case 'identity-security': return <IdentitySecurity onBack={() => setActiveTab('settings')} />;
      case 'auth': return <SecureAuth onComplete={() => setActiveTab('home')} />;
      case '404': return <NotFound onBack={() => setActiveTab('home')} />;
      default: return <NotFound onBack={() => setActiveTab('home')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg selection:bg-brand-primary selection:text-white overflow-hidden relative">
      {/* App Shell Header - Play Store Style Pill */}
      <motion.header 
        animate={{ 
          y: showBars ? 16 : -120,
          opacity: showBars ? 1 : 0,
          scale: showBars ? 1 : 0.95
        }}
        transition={{ 
          type: "spring", 
          damping: 30, 
          stiffness: 220,
          opacity: { duration: 0.2 }
        }}
        className="fixed top-0 inset-x-4 md:inset-x-6 z-40 bg-white/95 backdrop-blur-2xl border border-stone-100 px-6 h-18 md:h-22 flex items-center justify-between shadow-2xl rounded-[2.5rem]"
        onClick={() => setShowBars(false)}
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('home');
              setShowBars(false);
            }} 
            className="flex items-center gap-3.5 active:scale-95 transition-all group"
          >
            <div className="p-2.5 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 shadow-inner group-hover:rotate-12 transition-transform">
              <Logo size={28} />
            </div>
            <div className="flex flex-col -space-y-1 text-left">
              <span className="text-xl font-black text-brand-text uppercase italic tracking-tighter leading-none">Wang<span className="text-brand-primary underline decoration-4 underline-offset-4">Pa</span></span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-brand-primary/60">Legacy Protocol</span>
            </div>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {user ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('settings');
                setShowBars(false);
              }}
              className="group flex items-center gap-2 p-0.5 pr-2.5 bg-stone-50 border border-stone-100 rounded-full active:scale-95 transition-all hover:border-brand-primary/30"
            >
              <div className="w-7 h-7 rounded-full bg-white border border-stone-100 flex items-center justify-center overflow-hidden transition-all group-hover:shadow-sm">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <User size={14} className="text-stone-300" />
                )}
              </div>
              <div className="text-left hidden xs:block">
                <span className="block text-[7px] font-black text-brand-text uppercase tracking-widest leading-none truncate max-w-[60px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                   <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                   <p className="text-[6px] font-bold text-stone-400 uppercase tracking-tighter">LVL {profile?.level || 1}</p>
                </div>
              </div>
            </button>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('settings');
                setShowBars(false);
              }}
              className="px-4 py-1.5 bg-brand-primary text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
            >
              Auth
            </button>
          )}
        </div>
      </motion.header>

      {/* Viewport Content */}
      <main 
        ref={mainScrollRef as any}
        className="flex-1 relative overflow-y-auto custom-scrollbar pt-14 pb-28"
      >
        <div className="max-w-7xl mx-auto w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="w-full h-full"
            >
              {renderContent()}
              
              {/* AI Disclaimer - Gemini Style */}
              <div className="px-6 py-8 text-center">
                 <p className="text-[9px] font-medium text-stone-400 uppercase tracking-widest leading-loose max-w-[280px] mx-auto opacity-40">
                   Wang Pa AI may display inaccurate cultural info. Consult elders for critical heritage data.
                 </p>
                 <div className="mt-2 flex items-center justify-center gap-3 text-stone-300">
                    <span className="w-6 h-[1px] bg-stone-50" />
                    <Logo size={12} className="grayscale opacity-10" />
                    <span className="w-6 h-[1px] bg-stone-50" />
                 </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* App Shell Footer - Play Store Style Pill */}
      <motion.nav 
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (info.offset.y < -30) setShowBars(true);
          if (info.offset.y > 30) setShowBars(false);
        }}
        animate={{ 
          y: showBars ? -16 : 140,
          scale: showBars ? 1 : 0.94,
          opacity: showBars ? 1 : 0
        }}
        transition={{ 
          type: "spring", 
          damping: 40, 
          stiffness: 220,
          opacity: { duration: 0.4 }
        }}
        className="fixed bottom-0 inset-x-4 md:inset-x-6 z-50 bg-white/95 backdrop-blur-3xl border border-stone-100 flex items-center justify-around px-2 h-14 md:h-16 shadow-xl rounded-[2.5rem]"
        onClick={() => setShowBars(false)}
      >
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-stone-100 rounded-full md:hidden" />
        
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={(e) => {
              e.stopPropagation();
              setShowBars(false);
              if (tab.isMore) {
                setShowMoreMenu(true);
              } else {
                setActiveTab(tab.id as Tab);
              }
            }}
            className={`relative flex flex-col items-center justify-center gap-1 min-w-[56px] h-full transition-all duration-500 ${
              tab.primary ? 'pb-3' : 'pb-1'
            }`}
          >
            {tab.primary ? (
              <div className="relative group">
                <div className="absolute -inset-3 bg-brand-primary/10 rounded-full blur-xl group-active:blur-lg transition-all" />
                <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 shadow-lg ${
                  activeTab === tab.id 
                    ? 'bg-brand-primary text-white scale-110 -translate-y-5 shadow-brand-primary/40' 
                    : 'bg-brand-text text-white -translate-y-3 hover:-translate-y-5'
                }`}>
                  {tab.icon}
                </div>
              </div>
            ) : (
              <>
                <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id || (tab.isMore && showMoreMenu)
                    ? 'text-brand-primary' 
                    : 'text-stone-400'
                }`}>
                  {tab.icon}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                  activeTab === tab.id || (tab.isMore && showMoreMenu)
                    ? 'text-brand-primary opacity-100' 
                    : 'text-stone-200 opacity-60'
                }`}>
                  {tab.label}
                </span>
              </>
            )}
          </button>
        ))}
      </motion.nav>


      {/* Global Draw Out Trigger Handle */}
      <AnimatePresence>
        {!showBars && (
          <motion.button 
            initial={{ y: 100, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 100, x: "-50%", opacity: 0 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBars(true)}
            className="fixed bottom-3 left-1/2 z-[60] px-4 py-2 bg-brand-primary/80 backdrop-blur-md text-white rounded-full flex items-center gap-2 shadow-[0_8px_32px_rgba(242,125,38,0.3)] border border-white/20 transition-all font-black uppercase text-[8px] tracking-[0.2em] group"
          >
            <div className="w-4 h-4 bg-white/20 rounded-lg flex items-center justify-center">
              <ChevronUp className="w-2.5 h-2.5 text-white" />
            </div>
            <span>Open Vault</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* "More" Sheet Overlay */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              className="fixed inset-0 bg-brand-text/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[3rem] z-[70] px-6 pt-8 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1 bg-stone-200 rounded-full mx-auto mb-8" />
              
              <div className="grid grid-cols-3 gap-6 mb-12">
                {secondaryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as Tab);
                      setShowMoreMenu(false);
                    }}
                    className="flex flex-col items-center gap-3 active:scale-95 transition-all"
                  >
                    <div className="w-14 h-14 bg-stone-50 rounded-[1.5rem] flex items-center justify-center text-stone-500 border border-stone-100">
                      {tab.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 text-center">{tab.label}</span>
                  </button>
                ))}
                
                {/* Dedicated Settings Button in More Menu */}
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowMoreMenu(false);
                  }}
                  className="flex flex-col items-center gap-3 active:scale-95 transition-all text-brand-primary"
                >
                  <div className="w-14 h-14 bg-brand-primary/10 rounded-[1.5rem] flex items-center justify-center border border-brand-primary/20">
                    <SettingsIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">Settings</span>
                </button>
              </div>

              <div className="space-y-4">
                {isAdmin && (
                  <button
                    onClick={() => {
                      setActiveTab('admin');
                      setShowMoreMenu(false);
                    }}
                    className="w-full h-16 bg-brand-text text-white rounded-2xl flex items-center justify-between px-6 font-black uppercase tracking-[0.2em] text-[10px] active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-4 h-4" />
                      Archive Curator
                    </div>
                    <SparklesIcon className="w-4 h-4" />
                  </button>
                )}
                
                {user && (
                  <button
                    onClick={() => {
                      signOut();
                      setShowMoreMenu(false);
                    }}
                    className="w-full h-16 bg-stone-50 border border-stone-100 text-stone-500 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-[10px] active:scale-[0.98] transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Archive Sign Out
                  </button>
                )}

                <div className="flex items-center justify-center gap-6 pt-4">
                  <button onClick={() => { setActiveTab('privacy'); setShowMoreMenu(false); }} className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Privacy</button>
                  <button onClick={() => { setActiveTab('terms'); setShowMoreMenu(false); }} className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Terms</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Call Assistance */}
      <AnimatePresence>
        {activeTab !== 'chat' && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-6 z-40"
          >
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="w-14 h-14 bg-brand-primary text-brand-text rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white group relative active:scale-95 transition-all"
            >
              <div className="absolute inset-0 bg-brand-primary rounded-2xl animate-ping opacity-20 group-hover:opacity-40" />
              <Phone className="w-6 h-6 relative z-10" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <LiveAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
        onNavigate={(tab) => {
          setActiveTab(tab as Tab);
          setIsAssistantOpen(false);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NotificationProvider>
  );
}
