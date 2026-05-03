import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Award, BookOpen, Star, Trophy, Users, ShieldCheck, Zap, History, Megaphone, Bell, Loader2 } from 'lucide-react';
import { getAnnouncements, Announcement } from '../services/announcementService';

export default function Classroom() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnns, setLoadingAnns] = useState(false);
  
  const levels = [
    { title: 'Level 1: The Voyager', desc: 'Starting your journey into Luo heritage.', threshold: 0 },
    { title: 'Level 2: The Apprentice', desc: 'Understanding basic tools and phrases.', threshold: 500 },
    { title: 'Level 3: The Artisan', desc: 'Mastering the technical crafting techniques.', threshold: 1500 },
    { title: 'Level 4: The Guardian', desc: 'Keeper of oral traditions and proverbs.', threshold: 4000 },
    { title: 'Level 5: The Elder', desc: 'Advisor on cultural synthesis and history.', threshold: 10000 },
  ];

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoadingAnns(true);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnns(false);
    }
  };

  const currentLevelInfo = levels.reduce((prev, curr) => 
    (profile?.xp || 0) >= curr.threshold ? curr : prev
  , levels[0]);

  const nextLevel = levels.find(l => l.threshold > (profile?.xp || 0));
  const progress = nextLevel 
    ? (((profile?.xp || 0) - currentLevelInfo.threshold) / (nextLevel.threshold - currentLevelInfo.threshold)) * 100
    : 100;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-12 pb-20">
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary">
          <Award className="w-3.5 h-3.5" />
          Academic Achievement
        </div>
        <h2 className="text-5xl font-display italic font-black text-brand-text tracking-tighter">Acholi Classroom</h2>
        <p className="text-stone-400 font-medium max-w-lg mx-auto">Track your evolution from an apprentice to a cultural elder through linguistic mastery.</p>
      </div>

      {/* Official Dispatches */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-brand-text text-white rounded-lg">
              <Megaphone className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-text">Official Dispatches</h3>
          </div>
          <button onClick={loadAnnouncements} className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline">Refresh</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingAnns ? (
             [1,2,3].map(i => <div key={i} className="h-32 bg-stone-50 animate-pulse rounded-3xl" />)
          ) : announcements.length > 0 ? (
            announcements.map((ann) => (
              <motion.div 
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-[2rem] border relative overflow-hidden group ${ann.type === 'warning' ? 'bg-red-50 border-red-100' : 'bg-white border-brand-border'}`}
              >
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${ann.type === 'warning' ? 'text-red-500' : 'text-brand-primary'}`}>{ann.type}</span>
                    <span className="text-[8px] font-bold text-stone-400">{new Date(ann.date).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-lg font-display italic font-black text-brand-text group-hover:text-brand-primary transition-colors">{ann.title}</h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-3">{ann.content}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-stone-50 rounded-[2.5rem] border-2 border-dashed border-stone-100">
               <Bell className="w-8 h-8 text-stone-200 mx-auto mb-3" />
               <p className="text-xs font-bold text-stone-300 uppercase tracking-widest">No active dispatches</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-xl space-y-8">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary border-4 border-white shadow-lg overflow-hidden">
                   {profile?.faceVerified ? (
                     <ShieldCheck className="w-12 h-12" />
                   ) : (
                     <Star className="w-12 h-12" />
                   )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-brand-text text-white w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
                  L{profile?.level || 1}
                </div>
              </div>
              <h3 className="text-xl font-black text-brand-text tracking-tight uppercase italic">{currentLevelInfo.title}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-1">Archival Level</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">XP Progress</span>
                <span className="text-xs font-bold text-brand-text">{profile?.xp || 0} / {nextLevel?.threshold || 'MAX'}</span>
              </div>
              <div className="h-3 bg-stone-100 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-brand-primary rounded-full shadow-sm shadow-brand-primary/40"
                />
              </div>
              <p className="text-[10px] text-stone-400 font-medium">
                {nextLevel ? `${nextLevel.threshold - (profile?.xp || 0)} XP to reach ${nextLevel.title}` : 'Universal Elder status achieved.'}
              </p>
            </div>

            <div className="pt-6 border-t border-stone-50 grid grid-cols-2 gap-4">
              <div className="bg-stone-50 p-3 rounded-2xl text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-1">Items Scanned</p>
                <p className="text-lg font-black text-brand-text italic">12</p>
              </div>
              <div className="bg-stone-50 p-3 rounded-2xl text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-1">Words Learned</p>
                <p className="text-lg font-black text-brand-text italic">84</p>
              </div>
            </div>
          </div>

          <div className="bg-brand-text p-8 rounded-[2.5rem] text-white space-y-4">
             <div className="flex items-center gap-3">
               <Zap className="w-5 h-5 text-amber-400" />
               <h4 className="text-xs font-black uppercase tracking-widest">Active Intelligence</h4>
             </div>
             <p className="text-[11px] text-white/60 leading-relaxed">
               The "Lyec" engine can analyze ambient linguistic markers and feeds to calibrate your accent profile in real-time.
             </p>
             <button 
               onClick={async () => {
                 try {
                   await navigator.mediaDevices.getUserMedia({ audio: true });
                   alert("Background Intelligence Active: Lyec is now listening for linguistic patterns.");
                 } catch (e) {
                   console.error("Mic permission denied", e);
                 }
               }}
               className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
             >
               Activate Core Listening
             </button>
             <div className="flex items-center gap-2">
               <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                   animate={{ x: [-100, 200] }}
                   transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                   className="w-1/3 h-full bg-amber-400/50"
                 />
               </div>
               <span className="text-[8px] font-black uppercase">Syncing...</span>
             </div>
          </div>
        </div>

        {/* Learning Paths */}
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-sm flex flex-col gap-6">
               <div className="flex items-center justify-between">
                 <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <BookOpen className="w-6 h-6" />
                 </div>
                 <span className="px-3 py-1 bg-green-50 text-green-600 text-[8px] font-black uppercase tracking-widest rounded-full">Recommended</span>
               </div>
               <div className="space-y-2">
                 <h4 className="text-lg font-black text-brand-text tracking-tight uppercase">Basic Linguistics</h4>
                 <p className="text-xs text-stone-400 leading-relaxed font-medium">Master the foundational phonetics of the Central Acholi dialect.</p>
               </div>
               <button className="w-full py-4 bg-brand-bg border border-brand-border text-brand-text rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:shadow-lg transition-all">
                 Enter Seminar
               </button>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-sm flex flex-col gap-6">
               <div className="flex items-center justify-between">
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <History className="w-6 h-6" />
                 </div>
                 <span className="px-3 py-1 bg-stone-50 text-stone-300 text-[8px] font-black uppercase tracking-widest rounded-full">Locked L3</span>
               </div>
               <div className="space-y-2">
                 <h4 className="text-lg font-black text-stone-300 tracking-tight uppercase">Migration History</h4>
                 <p className="text-xs text-stone-300 leading-relaxed font-medium">Detailed archives of the Ker Kwaro and the rift valley migrations.</p>
               </div>
               <button className="w-full py-4 bg-stone-50 text-stone-300 cursor-not-allowed rounded-2xl font-black uppercase tracking-widest text-[10px]">
                 Insufficient XP
               </button>
             </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-brand-border shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <Trophy className="w-5 h-5 text-brand-primary" />
                 <h4 className="text-xs font-black uppercase tracking-widest text-brand-text">Classmates Leaderboard</h4>
               </div>
               <Users className="w-4 h-4 text-stone-300" />
             </div>
             
             <div className="space-y-4">
               {[
                 { name: 'Adong J.', level: 14, xp: 7200, isSelf: false },
                 { name: 'Okelo P.', level: 12, xp: 6100, isSelf: false },
                 { name: profile?.uid.slice(0, 5) || 'You', level: profile?.level || 1, xp: profile?.xp || 0, isSelf: true },
                 { name: 'Acan R.', level: 1, xp: 50, isSelf: false },
               ].sort((a,b) => b.xp - a.xp).map((user, i) => (
                 <div key={i} className={`flex items-center justify-between p-4 rounded-2xl ${user.isSelf ? 'bg-brand-primary/5 border border-brand-primary/10' : ''}`}>
                   <div className="flex items-center gap-4">
                     <span className="text-xs font-black text-stone-300 w-4">#{i+1}</span>
                     <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-[10px] font-black uppercase">
                       {user.name.charAt(0)}
                     </div>
                     <div>
                       <p className="text-xs font-bold text-brand-text">{user.name} {user.isSelf && '(You)'}</p>
                       <p className="text-[8px] font-black text-stone-400 uppercase">Lv {user.level}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-xs font-black text-brand-text italic">{user.xp}</p>
                     <p className="text-[8px] font-black text-stone-300 uppercase">Archive XP</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
