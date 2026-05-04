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

import { requestNotificationPermission, sendLocalNotification, checkForUpdates, APP_VERSION } from './services/notificationService';

type Tab = 'home' | 'scan' | 'chat' | 'dictionary' | 'translator' | 'culture' | 'lab' | 'progress' | 'practice' | 'auth' | 'admin' | 'settings' | 'privacy' | 'terms' | 'vault-prefs' | 'identity-security' | '404';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ available: boolean; version: string } | null>(null);
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const { notify } = useNotification();

  const lastRemindedMinute = useRef<string>('');

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
    }, 10000); // Check every 10 seconds for precision

    // Mock background activity (New Posts)
    const postInterval = setInterval(() => {
      // 5% chance of a "new post" every minute
      if (Math.random() < 0.05) {
        notify("Archive Update", "New cultural artifacts have been cataloged in the heritage feed.", "success", true);
      }
    }, 60000);

    // Online Status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-100 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('home')} className="flex items-center gap-2">
            <Logo size={32} />
            <div className="flex flex-col -space-y-1">
              <span className="text-sm font-black text-brand-text tracking-tighter uppercase italic italic">Lyec<span className="text-brand-primary">AI</span></span>
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-stone-400">Acholi Heritage</span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button 
              onClick={() => setActiveTab('settings')}
              className="group flex items-center gap-2 p-1 pr-3 bg-stone-50 border border-stone-100 rounded-2xl active:scale-95 transition-all shadow-sm hover:border-brand-primary/30"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white border border-stone-100 flex items-center justify-center overflow-hidden transition-all group-hover:shadow-md">
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
              Sign In / Register
            </button>
          )}
        </div>
      </header>

      {/* Viewport Content */}
      <main className="flex-1 relative overflow-y-auto no-scrollbar pb-32">
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
                  window.location.reload(); // Simulate an update by reloading
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

      {/* Apple-esque Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/80 backdrop-blur-3xl border-t border-stone-100 flex items-end justify-around px-2 pb-safe-bottom h-[72px] md:h-24">
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
      </nav>

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
