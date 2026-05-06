import React, { useState, useEffect, useRef } from 'react';
import { Utensils, Construction, Tent, ArrowRight, Loader2, X, BookOpen, Coffee, Music, Volume2, Sparkles, Camera } from 'lucide-react';
import { generateCulturalPost, speakLanguage } from '../lib/gemini';
import { getShowcaseItems, ShowcaseItem } from '../services/showcaseService';
import { motion, AnimatePresence } from 'motion/react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { playPCMAudio } from '../lib/audio';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

export default function Home({ onNavigate }: { onNavigate?: (tab: any) => void }) {
  const { profile } = useAuth();
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<ShowcaseItem | null>(null);
  const [postContent, setPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMoreItems = async () => {
    if (loadingItems || !hasMore) return;
    setLoadingItems(true);
    try {
      const result = await getShowcaseItems(6, lastDoc || undefined);
      if (result.items.length < 6) setHasMore(false);
      setItems(prev => [...prev, ...result.items]);
      setLastDoc(result.lastVisible);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadMoreItems();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingItems) {
        loadMoreItems();
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadingItems]);

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
    <div className="w-full max-w-5xl mx-auto p-4 space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-3 py-8 md:py-12 relative overflow-hidden px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(242,125,38,0.1)_0%,transparent_70%)] pointer-events-none" />
        <motion.div
          className="space-y-3 relative z-10"
        >
          <div className="flex justify-center mb-4">
            <Logo size={100} />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm rounded-full border border-stone-100 text-[8px] font-black uppercase tracking-[0.4em] text-brand-primary mb-1">
             <Sparkles className="w-3 h-3" />
             Archival Heritage · v1.0.0
          </div>
          <h1 className="text-4xl md:text-7xl font-display italic font-black text-brand-text tracking-tighter leading-[0.85]">
            Wang <span className="text-brand-primary">Pa</span> <br />
            Ancestral <span className="text-stone-300 underline decoration-brand-accent/30 decoration-8 underline-offset-4">Archive</span>
          </h1>
          <p className="max-w-md mx-auto text-stone-400 font-medium text-[13px] md:text-base leading-relaxed pt-1">
            Wang Pa is high-fidelity portal dedicated to preserving the tonal beauty and cultural depth of the Acholi people. Bridging ancient wisdom with neural technology.
          </p>
        </motion.div>
      </section>

      {/* Heritage Feed / Spotlight */}
      <motion.section 
        className="space-y-6"
      >
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
          {items.length === 0 && loadingItems ? (
             Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-stone-50 rounded-[2.5rem] animate-pulse" />
             ))
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
        
        <div ref={loaderRef} className="py-20 flex flex-col items-center justify-center gap-4">
          {hasMore && (
            <Loader2 className="w-6 h-6 text-stone-100 animate-spin" />
          )}
        </div>
      </motion.section>

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
