/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Languages, MessageSquareCode, GraduationCap, Heart, Landmark, Sparkles, Home as HomeIcon, Book, Camera, LogOut, LayoutGrid, Settings as SettingsIcon } from 'lucide-react';
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

  // Reset bars on tab change
  useEffect(() => {
    setShowBars(true);
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  }, [activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      const container = mainScrollRef.current;
      if (!container) return;
      
      const currentScrollY = container.scrollTop;
      const velocity = currentScrollY - lastScrollY;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;

      if (velocity > 10 && currentScrollY > 80 && !isAtBottom) {
        setShowBars(false);
        setIsScrollingUp(false);
      } else if (velocity < -20 || isAtBottom || currentScrollY < 20) {
        setShowBars(true);
        setIsScrollingUp(true);
      }
      setLastScrollY(currentScrollY);
    };

    const container = mainScrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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

    // Mock background activity
    const postInterval = setInterval(() => {
      if (Math.random() < 0.05) {
        notify("Archive Update", "New cultural artifacts have been cataloged in the heritage feed.", "success", true);
      }
    }, 60000);

    // Online Status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(reminderInterval);
      clearInterval(postInterval);
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
    <div className="min-h-screen flex flex-col bg-brand-bg selection:bg-brand-primary selection:text-white overflow-hidden">
      {/* App Shell Header */}
      <motion.header 
        animate={{ 
          y: showBars ? 0 : -80,
          opacity: showBars ? 1 : 0
        }}
        transition={{ type: "spring", damping: 30, stiffness: 250 }}
        className="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-stone-100 px-6 h-20 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveTab('home')} className="flex items-center gap-3 active:scale-95 transition-all">
            <div className="p-2.5 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 shadow-inner">
              <Logo size={36} />
            </div>
            <div className="flex flex-col -space-y-0.5 text-left">
              <span className="text-lg font-black text-brand-text tracking-tighter uppercase italic leading-none">Lyec<span className="text-brand-primary">AI</span></span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-400">Acholi Heritage</span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button 
              onClick={() => setActiveTab('settings')}
              className="group flex items-center gap-2 p-1 pr-3 bg-stone-50 border border-stone-100 rounded-2xl active:scale-95 transition-all shadow-sm hover:border-brand-primary/30"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-stone-100 flex items-center justify-center overflow-hidden transition-all group-hover:shadow-md">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-black text-brand-text">{user.email?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest leading-none">Archivist</span>
                <span className="text-[10px] font-bold text-brand-text leading-none mt-1 truncate max-w-[80px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </div>
            </button>
          ) : (
            <button 
              onClick={() => setActiveTab('auth')}
              className="px-4 py-2 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-brand-primary/20 active:scale-95 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </motion.header>

      {/* Viewport Content */}
      <main 
        ref={mainScrollRef as any}
        className="flex-1 relative overflow-y-auto no-scrollbar pt-16 pb-32"
      >
        <AnimatePresence>
          {updateInfo?.available && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-brand-primary text-white px-6 py-4 flex items-center justify-between shadow-lg overflow-hidden"
            >
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/20 rounded-xl">
                   <SparklesIcon className="w-4 h-4" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Update Available: v{updateInfo.version}</span>
                    <span className="text-[8px] font-medium opacity-80 mt-0.5">Enhance your heritage archiving experience.</span>
                 </div>
              </div>
              <button 
                onClick={() => {
                  acknowledgeUpdate(updateInfo.version);
                  window.location.reload(); 
                  setUpdateInfo(null);
                }}
                className="px-4 py-1.5 bg-white text-brand-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-stone-50 active:scale-95 transition-all shadow-sm"
              >
                Update Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Apple-esque Mobile Bottom Navigation with Improved Drawer Handle */}
      <motion.nav 
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (info.offset.y < -30) setShowBars(true);
          if (info.offset.y > 30) setShowBars(false);
        }}
        animate={{ 
          y: showBars ? 0 : 110,
          scale: showBars ? 1 : 0.96,
          opacity: showBars ? 1 : 0.85
        }}
        transition={{ 
          type: "spring", 
          damping: 32, 
          stiffness: 280,
          opacity: { duration: 0.2 }
        }}
        className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-3xl border-t border-stone-100 flex items-end justify-around px-4 pb-safe-bottom h-20 md:h-28 shadow-[0_-12px_44px_rgba(0,0,0,0.06)]"
      >
        {/* Modern Drawer Handle Indicator */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-stone-100 rounded-full md:hidden cursor-grab active:cursor-grabbing hover:bg-stone-200 transition-colors" />
        
        <AnimatePresence>
          {!showBars && (
             <motion.button 
               initial={{ opacity: 0, y: 20, x: "-50%" }}
               animate={{ opacity: 1, y: 0, x: "-50%" }}
               exit={{ opacity: 0, y: 20, x: "-50%" }}
               whileHover={{ scale: 1.1, y: -2 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => setShowBars(true)}
               className="absolute -top-16 left-1/2 w-14 h-14 bg-brand-primary text-white rounded-3xl flex items-center justify-center shadow-[0_12px_48px_rgba(242,125,38,0.4)] border-[6px] border-white active:scale-90 transition-all cursor-pointer z-50"
             >
               <LayoutGrid className="w-6 h-6" />
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: -24 }}
                 transition={{ delay: 0.5 }}
                 className="absolute left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary whitespace-nowrap bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-brand-primary/10"
               >
                 Open Archive
               </motion.div>
               <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white/40 rounded-full animate-bounce" />
             </motion.button>
          )}
        </AnimatePresence>
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.isMore) {
                setShowMoreMenu(true);
              } else {
                setActiveTab(tab.id as Tab);
              }
            }}
            className={`relative flex flex-col items-center justify-center gap-1.5 min-w-[64px] h-full transition-all duration-500 ${
              tab.primary ? 'pb-4' : 'pb-2'
            }`}
          >
            {tab.primary ? (
              <div className="relative group">
                <div className="absolute -inset-4 bg-brand-primary/20 rounded-full blur-2xl group-active:blur-lg transition-all" />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${
                  activeTab === tab.id 
                    ? 'bg-brand-primary text-white scale-110 -translate-y-6 rotate-0 shadow-brand-primary/40' 
                    : 'bg-brand-text text-white -translate-y-4 hover:-translate-y-6'
                }`}>
                  {tab.icon}
                </div>
              </div>
            ) : (
              <>
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id || (tab.isMore && showMoreMenu)
                    ? 'text-brand-primary' 
                    : 'text-stone-400'
                }`}>
                  {tab.icon}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                  activeTab === tab.id || (tab.isMore && showMoreMenu)
                    ? 'text-brand-primary opacity-100 transform scale-110' 
                    : 'text-stone-300 opacity-80'
                }`}>
                  {tab.label}
                </span>
                {(activeTab === tab.id || (tab.isMore && showMoreMenu)) && !tab.primary && (
                  <motion.div 
                    layoutId="navIndicator" 
                    className="absolute bottom-0 w-12 h-1 bg-brand-primary rounded-t-full" 
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </>
            )}
          </button>
        ))}
      </motion.nav>

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
