import React, { useState, useEffect } from 'react';
import { Utensils, Construction, Tent, ArrowRight, Loader2, X, BookOpen, Coffee, Music, Volume2, Sparkles, Camera } from 'lucide-react';
import { generateCulturalPost, speakLanguage } from '../lib/gemini';
import { getShowcaseItems, subscribeShowcaseItems, ShowcaseItem } from '../services/showcaseService';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { playPCMAudio } from '../lib/audio';
import { useAuth } from '../contexts/AuthContext';

export default function Home({ onNavigate }: { onNavigate?: (tab: any) => void }) {
  const { profile } = useAuth();
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<ShowcaseItem | null>(null);
  const [postContent, setPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setLoadingItems(true);
    const unsubscribe = subscribeShowcaseItems((newItems) => {
      setItems(newItems);
      setLoadingItems(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = items.filter(item => 
    activeFilter === 'all' || item.category === activeFilter
  );

  const handleItemClick = async (item: ShowcaseItem) => {
    setSelectedItem(item);
    setIsLoading(true);
    setPostContent('');
    try {
      const content = await generateCulturalPost(item.title, profile?.level || 1, profile?.ageMode || 'adult', profile?.targetLanguage || 'Acholi');
      setPostContent(content);
    } catch (error) {
      console.error(error);
      setPostContent("I couldn't retrieve the story of " + item.title + " right now. Please try again later.");
    } finally {
      setIsLoading(false);
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

  const closeModal = () => {
    setSelectedItem(null);
    setPostContent('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-12 md:py-20 relative overflow-hidden px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(242,125,38,0.15)_0%,transparent_70%)] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm rounded-full border border-stone-100 text-[8px] font-black uppercase tracking-[0.4em] text-brand-primary mb-2">
             <Sparkles className="w-3 h-3" />
             Archival Heritage
          </div>
          <h1 className="text-5xl md:text-8xl font-display italic font-black text-brand-text tracking-tighter leading-[0.85]">
            The <span className="text-brand-primary">Luo</span> <br />
            Legacy <span className="text-stone-300 underline decoration-brand-accent/30 decoration-8 underline-offset-4">Vault</span>
          </h1>
          <p className="max-w-xl mx-auto text-stone-400 font-medium text-sm md:text-lg leading-relaxed pt-2">
            Preserving the collective memory of the Acholi people. Discover oral traditions, crafts, and ancestral knowledge.
          </p>
        </motion.div>
      </section>

      {/* Heritage Feed / Spotlight */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-display italic font-black text-brand-text">Heritage Collections</h2>
            <button className="text-[10px] font-black uppercase tracking-widest text-brand-primary underline underline-offset-4">Explore Maps</button>
          </div>
          
          <div className="flex overflow-x-auto no-scrollbar gap-2 px-2 pb-2">
             {['All', 'Food', 'Wares', 'Dances', 'Stories', 'History'].map(tab => (
               <button 
                 key={tab} 
                 onClick={() => setActiveFilter(tab.toLowerCase())}
                 className={`px-6 py-2.5 rounded-2xl border border-stone-100 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap ${
                   activeFilter === tab.toLowerCase() 
                    ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20 scale-105' 
                    : 'bg-white text-stone-400'
                 }`}
               >
                 {tab}
               </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2 pb-12">
          {loadingItems ? (
            <div className="col-span-full h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
              <p className="font-black text-xs uppercase tracking-widest text-brand-text/40">Synchronizing Archive...</p>
            </div>
          ) : items.length === 0 ? (
             <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-300">
                  <BookOpen className="w-8 h-8" />
                </div>
                <p className="text-stone-400 font-medium">The archive is currently quiet. Check back soon for new artifacts.</p>
             </div>
          ) : (
            filteredItems.length === 0 ? (
               <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-300">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <p className="text-stone-400 font-medium">No items found in this category.</p>
               </div>
            ) : (
              filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <ShowcaseCard item={item} onClick={() => handleItemClick(item)} />
                </motion.div>
              ))
            )
          )}
        </div>
      </section>

      {/* Modal / Post Detail */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-stone-900/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full h-full max-w-3xl bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:h-auto md:max-h-[90vh]"
            >
              <div className="relative h-64 md:h-80 w-full shrink-0 bg-stone-100">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.title} 
                  className={`w-full h-full object-cover ${
                    selectedItem.category !== 'food' ? 'grayscale contrast-[1.2] brightness-[1.1] opacity-70 sepia-[0.1]' : ''
                  }`}
                  referrerPolicy="no-referrer"
                />
                {selectedItem.category !== 'food' && (
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-30 pointer-events-none mix-blend-multiply" />
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${selectedItem.category !== 'food' ? 'from-white/40' : 'from-white'} via-transparent to-transparent`} />
                <button 
                  onClick={closeModal}
                  className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full transition-colors group"
                >
                  <X className="w-6 h-6 text-white group-hover:text-brand-text" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 pt-0">
                <div className="flex items-center gap-4 border-b border-stone-100 pb-6">
                  <h2 className="text-4xl font-display italic font-black text-brand-text leading-none uppercase">{selectedItem.title}</h2>
                  <button 
                    onClick={() => playAudio(selectedItem.title)}
                    disabled={speaking}
                    className={`p-3 rounded-full border border-stone-100 bg-white shadow-sm hover:border-brand-primary hover:text-brand-primary transition-all active:scale-90 ${speaking ? 'text-brand-primary ring-4 ring-brand-primary/10 animate-pulse' : 'text-stone-300'}`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                {isLoading ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
                    <p className="font-black text-xs uppercase tracking-widest text-brand-text/40">Gathering oral histories...</p>
                  </div>
                ) : (
                  <div className="markdown-body prose prose-stone max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter prose-p:font-medium prose-p:leading-relaxed prose-li:font-medium">
                    <ReactMarkdown>{postContent}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShowcaseCard({ item, onClick }: { item: ShowcaseItem; onClick: () => void }) {
  const isSketch = item.category !== 'food';
  
  return (
    <button
      onClick={onClick}
      className={`group w-full interactive-card text-left flex flex-col ${isSketch ? 'hover:ring-2 hover:ring-stone-200' : ''}`}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-100">
        <img 
          src={item.image} 
          alt={item.title} 
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
            isSketch ? 'grayscale contrast-[1.2] brightness-[1.1] opacity-70 sepia-[0.1]' : ''
          }`}
          referrerPolicy="no-referrer"
        />
        {isSketch && (
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-30 pointer-events-none mix-blend-multiply" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${isSketch ? 'from-stone-200/40' : 'from-brand-text/60'} to-transparent opacity-60 group-hover:opacity-40 transition-opacity`} />
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="font-black text-brand-text uppercase italic tracking-tight group-hover:text-brand-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            {item.description}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary group-hover:gap-4 transition-all">
          Learn More <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </button>
  );
}
