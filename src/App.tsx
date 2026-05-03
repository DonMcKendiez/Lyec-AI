/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Languages, MessageSquareCode, GraduationCap, Heart, Landmark, Sparkles, Home as HomeIcon, Book, Camera, LogOut, LayoutGrid } from 'lucide-react';
import Home from './components/Home';
import Translator from './components/Translator';
import ChatTutor from './components/ChatTutor';
import Practice from './components/Practice';
import Culture from './components/Culture';
import AcholiAssistant from './components/AcholiAssistant';
import Dictionary from './components/Dictionary';
import AcholiScanner from './components/AcholiScanner';
import Classroom from './components/Classroom';
import Logo from './components/Logo';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AdminPanel from './components/AdminPanel';
import SecureAuth from './components/SecureAuth';
import LiveAssistant from './components/LiveAssistant';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { db } from './lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import { Phone, Sparkles as SparklesIcon } from 'lucide-react';

type Tab = 'home' | 'translator' | 'chat' | 'practice' | 'culture' | 'lab' | 'dictionary' | 'scan' | 'privacy' | 'terms' | 'admin' | 'auth' | 'progress';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const { user, isAdmin, loading, signIn, signOut } = useAuth();

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
  }, []);

  const tabs = [
    { id: 'home', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
    { id: 'scan', label: 'Scan', icon: <Camera className="w-5 h-5" /> },
    { id: 'chat', label: 'AI Tutor', icon: <MessageSquareCode className="w-5 h-5" /> },
    { id: 'dictionary', label: 'Dictionary', icon: <Book className="w-5 h-5" /> },
    { id: 'translator', label: 'Translator', icon: <Languages className="w-5 h-5" /> },
    { id: 'culture', label: 'Culture', icon: <Landmark className="w-5 h-5" /> },
    { id: 'progress', label: 'Classes', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'practice', label: 'Practice', icon: <Heart className="w-5 h-5" /> },
    { id: 'lab', label: 'Lab', icon: <Sparkles className="w-5 h-5" /> },
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
    switch (activeTab) {
      case 'home': return <Home onNavigate={(tab) => setActiveTab(tab)} />;
      case 'translator': return <Translator />;
      case 'chat': return <ChatTutor />;
      case 'practice': return <Practice />;
      case 'culture': return <Culture />;
      case 'lab': return <AcholiAssistant />;
      case 'dictionary': return <Dictionary />;
      case 'progress': return <Classroom />;
      case 'scan': return <AcholiScanner />;
      case 'privacy': return <PrivacyPolicy onBack={() => setActiveTab('home')} />;
      case 'terms': return <TermsOfService onBack={() => setActiveTab('home')} />;
      case 'admin': return <AdminPanel />;
      case 'auth': return <SecureAuth onComplete={() => setActiveTab('home')} />;
      default: return <Home />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg selection:bg-brand-primary selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-brand-border/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <h1 className="text-xl md:text-2xl font-black text-brand-text tracking-tighter uppercase italic shrink-0 cursor-pointer" onClick={() => setActiveTab('home')}>
              Lyec<span className="text-brand-primary">AI</span>
            </h1>
          </div>

          <nav className="hidden lg:flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-amber-100 text-brand-text shadow-sm' 
                    : 'text-stone-400 hover:text-brand-text'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-brand-text text-white shadow-sm' 
                    : 'text-stone-400 hover:text-brand-text bg-stone-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Curator
              </button>
            )}
          </nav>

          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-brand-text font-bold text-[10px] ring-1 ring-brand-border uppercase tracking-widest shrink-0">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                STREAK: 12
              </div>
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center overflow-hidden border border-brand-border">
                    {user.photoURL ? <img src={user.photoURL} alt="" /> : <span className="text-[10px] font-black">{user.email?.charAt(0).toUpperCase()}</span>}
                  </div>
                  <button 
                    onClick={signOut}
                    className="p-2 text-stone-300 hover:text-brand-primary hover:bg-stone-50 rounded-full transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setActiveTab('auth')}
                  className="px-4 py-2 bg-brand-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary-hover transition-all"
                >
                  Login/Signup
                </button>
              )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 pb-32 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile/Tablet Navigation */}
      <nav className="fixed lg:hidden bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] px-2 py-2 flex items-center justify-between gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/40 -translate-y-1' 
                  : 'text-stone-400 hover:text-brand-text active:scale-95'
              }`}
              title={tab.label}
            >
              {React.cloneElement(tab.icon as React.ReactElement<any>, { 
                className: activeTab === tab.id ? 'w-5 h-5' : 'w-4 h-4' 
              })}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="navTabIndicator"
                  className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                />
              )}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                activeTab === 'admin' 
                  ? 'bg-brand-text text-white shadow-xl shadow-brand-text/40 -translate-y-1' 
                  : 'text-stone-400 hover:text-brand-text active:scale-95'
              }`}
              title="Curator"
            >
              <LayoutGrid className={activeTab === 'admin' ? 'w-5 h-5' : 'w-4 h-4'} />
              {activeTab === 'admin' && (
                <motion.div
                  layoutId="navTabIndicator"
                  className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                />
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Footer */}
      <footer className="py-12 border-t border-brand-border/20 text-stone-400 text-center">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-4">
          <p className="text-sm font-bold tracking-wider text-brand-text/60">
            "APWOYO MATEK" — THANK YOU VERY MUCH
          </p>
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => setActiveTab('privacy')} className="text-[10px] font-black uppercase tracking-widest hover:text-brand-primary transition-colors">Privacy Policy</button>
            <div className="w-1 h-1 bg-brand-border rounded-full" />
            <button onClick={() => setActiveTab('terms')} className="text-[10px] font-black uppercase tracking-widest hover:text-brand-primary transition-colors">Terms of Service</button>
          </div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
            <Logo size={20} />
            <span>Lyec AI Heritage</span>
          </div>
        </div>
      </footer>

      {/* Live Assistant Button & Component */}
      <div className="fixed bottom-24 right-6 z-[60] lg:bottom-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAssistantOpen(true)}
          className="w-16 h-16 bg-brand-primary text-brand-text rounded-full shadow-2xl flex items-center justify-center border-4 border-white group relative"
        >
          <div className="absolute inset-0 bg-brand-primary rounded-full animate-ping opacity-20 group-hover:opacity-40" />
          <Phone className="w-8 h-8 relative z-10" />
          <div className="absolute -top-12 right-0 bg-brand-text text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">
            Call Live Tutor
          </div>
        </motion.button>
      </div>

      <LiveAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
        onNavigate={(tab) => {
          setActiveTab(tab as Tab);
          // Auto minimize or stay open? 
          // Let's keep it open but perhaps provide visual feedback if needed
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
