import React, { useState } from 'react';
import { History, Users, Landmark, Heart, Loader2, Sparkles, Quote, Volume2 } from 'lucide-react';
import Logo from './Logo';
import { fetchCulturalInsight, speakLanguage } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { playPCMAudio } from '../lib/audio';
import { useAuth } from '../contexts/AuthContext';
import CultureMap from './CultureMap';

const CATEGORIES = [
  { id: 'traditions', title: 'Traditions', icon: <Landmark className="w-4 h-4" />, query: 'Marriage and traditional ceremonies' },
  { id: 'norms', title: 'Social Norms', icon: <Users className="w-4 h-4" />, query: 'Respect, hierarchy and communal living' },
  { id: 'history', title: 'History', icon: <History className="w-4 h-4" />, query: 'Origin of the Luo people and Acholi history' },
  { id: 'values', title: 'Core Values', icon: <Heart className="w-4 h-4" />, query: 'The concept of Mato Oput and reconciliation' },
];

export default function Culture() {
  const { profile } = useAuth();
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const loadInsight = async (topic: string) => {
    setLoading(true);
    setInsight(null);
    try {
      const data = await fetchCulturalInsight(topic, profile?.level || 1, profile?.ageMode || 'adult', profile?.targetLanguage || 'Acholi');
      setInsight(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (text: string) => {
    if (speaking) return;
    setSpeaking(true);
    try {
      const base64 = await speakLanguage(text, profile?.targetLanguage || 'Acholi');
      if (base64) {
        await playPCMAudio(base64);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="space-y-4">
        <header className="text-center space-y-2">
          <h2 className="text-3xl font-display font-black text-brand-text uppercase italic tracking-tighter">
            Territories of <span className="text-brand-primary">Acholi</span>
          </h2>
          <p className="text-xs text-stone-400 font-medium">The ancestral lands where our stories and traditions were born.</p>
        </header>
        <CultureMap />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => loadInsight(cat.query)}
            className="p-4 bg-white rounded-2xl border border-brand-border shadow-sm hover:border-brand-primary transition-all flex flex-col items-center gap-2 group"
          >
            <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
              {cat.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-text/60">{cat.title}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/40">Consulting the elders...</p>
          </motion.div>
        ) : insight ? (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-3xl border border-brand-border shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Logo size={120} />
               </div>
               
               <header className="relative z-10 space-y-2 mb-8">
                 <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                   {insight.category}
                 </span>
                 <h2 className="text-3xl font-black text-brand-text uppercase tracking-tighter italic">{insight.title}</h2>
               </header>

               <div className="prose prose-stone max-w-none mb-8">
                 <p className="text-brand-text/80 leading-relaxed font-medium">
                   {insight.content}
                 </p>
               </div>

               <div className="grid md:grid-cols-2 gap-6 mb-8">
                 <div className="bg-brand-bg rounded-2xl p-6 border border-brand-border">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-4">Key Traditions</h4>
                   <ul className="space-y-2">
                     {insight.traditions.map((t: string, i: number) => (
                       <li key={i} className="text-sm font-bold text-brand-text flex gap-2">
                         <span className="text-brand-primary">•</span> {t}
                       </li>
                     ))}
                   </ul>
                 </div>
                 <div className="bg-brand-bg rounded-2xl p-6 border border-brand-border">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-4">Social Norms</h4>
                   <ul className="space-y-2">
                     {insight.socialNorms.map((n: string, i: number) => (
                       <li key={i} className="text-sm font-bold text-brand-text flex gap-2">
                         <span className="text-brand-primary">•</span> {n}
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>

               <div className="bg-brand-text text-white p-8 rounded-2xl relative overflow-hidden shadow-lg shadow-brand-text/20">
                 <Quote className="absolute top-4 left-4 w-12 h-12 text-white/5" />
                 <div className="absolute top-4 right-4">
                   <button 
                     onClick={() => playAudio(insight.proverb.local || insight.proverb.acholi)}
                     disabled={speaking}
                     className={`p-2 rounded-full border border-white/10 hover:border-brand-primary hover:text-brand-primary transition-all active:scale-[0.8] ${speaking ? 'text-brand-primary ring-4 ring-brand-primary/10 animate-pulse' : 'text-white/40'}`}
                   >
                     <Volume2 className="w-5 h-5" />
                   </button>
                 </div>
                 <div className="relative z-10 text-center space-y-4">
                   <p className="text-xl font-black uppercase italic tracking-tight text-white/90">
                     "{insight.proverb.local || insight.proverb.acholi}"
                   </p>
                   <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary italic">
                     {insight.proverb.english}
                   </p>
                 </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 px-8 bg-white rounded-3xl border border-dashed border-brand-border"
          >
            <Landmark className="w-12 h-12 text-amber-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-brand-text uppercase tracking-tight mb-2">Explore Heritage</h3>
            <p className="text-stone-400 font-medium text-sm">Select a category above to delve into the heart of {profile?.targetLanguage || 'Acholi'} culture.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
