import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Volume2, Loader2, Book, ArrowRightLeft, Sparkles, WifiOff, Mic, Square, Trash2, History, Languages } from 'lucide-react';
import { lookupInDictionary, speakLanguage } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { playPCMAudio } from '../lib/audio';
import Logo from './Logo';
import { LOCAL_DICTIONARY, DictionaryEntry } from '../data/dictionaryData';
import { useAuth } from '../contexts/AuthContext';
import Fuse from 'fuse.js';

export default function Dictionary() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isOfflineResult, setIsOfflineResult] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem('lyec_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load recent searches", e);
      }
    }

    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Use EN for input as Acholi support is limited

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsListening(false);
        // Automatically trigger search
        handleSearch(undefined, transcript);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const saveRecentSearch = (word: string) => {
    const updated = [word, ...recentSearches.filter(s => s !== word)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('lyec_recent_searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('lyec_recent_searches');
  };

  // Fuse.js options for phonetic-like fuzzy matching
  const fuseOptions = {
    keys: ['word', 'translation'],
    threshold: 0.4, // Sensitivity to misspellings
    distance: 100,
    includeScore: true
  };

  const fuse = new Fuse(LOCAL_DICTIONARY, fuseOptions);

  const handleSearch = async (e?: React.FormEvent, overrideTerm?: string) => {
    e?.preventDefault();
    const term = overrideTerm || searchTerm;
    if (!term.trim()) return;

    setLoading(true);
    setResult(null);
    setIsOfflineResult(false);
    saveRecentSearch(term.trim());

    // 1. Try Exact/Fuzzy Search in LOCAL_DICTIONARY first for instant feedback/offline capability
    const localResults = fuse.search(term);
    
    // Check for exact matches in the local results first
    const exactMatch = localResults.find(r => 
      r.item.word.toLowerCase() === term.toLowerCase() || 
      r.item.translation.toLowerCase() === term.toLowerCase()
    );

    if (exactMatch) {
      setResult(exactMatch.item);
      setIsOfflineResult(true);
      setLoading(false);
      return;
    }

    // 2. High confidence fuzzy match (e.g. handle misspellings)
    if (localResults.length > 0 && localResults[0].score && localResults[0].score < 0.3) {
      setResult(localResults[0].item);
      setIsOfflineResult(true);
      setLoading(false);
      return;
    }

    // 3. Fallback to Gemini for Online Search (Complex phrases or missing words)
    try {
      const data = await lookupInDictionary(term, profile?.targetLanguage || 'Acholi', profile?.nativeLanguage || 'English');
      if (data) {
        setResult(data as DictionaryEntry);
      } else {
        throw new Error("No data found");
      }
    } catch (error) {
      console.error("Gemini search failed, using local fallback", error);
      if (localResults.length > 0) {
        setResult(localResults[0].item);
        setIsOfflineResult(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition failed", e);
      }
    }
  };

  const playAudio = async (text: string) => {
    if (speaking) return;
    setSpeaking(true);
    try {
      const audioData = await speakLanguage(text, profile?.targetLanguage || 'Acholi');
      if (audioData) {
        await playPCMAudio(audioData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-8 pb-32">
      <div className="text-center space-y-2 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">
          <Book className="w-3 h-3" />
          Lexicon Archive
        </div>
        <h2 className="text-4xl font-display italic font-black text-brand-text">Heritage Dictionary</h2>
        <p className="text-stone-400 font-medium">Bilingual reference for the {profile?.targetLanguage || 'Acholi'} spoken word.</p>
      </div>

      <div className="interactive-card p-6 md:p-8 space-y-6">
        <form onSubmit={handleSearch} className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search the archives..."
            className="w-full pl-12 pr-12 py-6 bg-stone-50 border-2 border-brand-border rounded-[1.5rem] focus:border-brand-primary focus:bg-white outline-none transition-all font-display italic text-lg font-medium text-brand-text"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-brand-primary transition-colors" />
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-all active:scale-90 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg ring-4 ring-red-500/20' : 'text-stone-300 hover:text-brand-primary'}`}
            >
              {isListening ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="px-6 py-3 bg-brand-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary-hover active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-brand-primary/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
                <History className="w-3 h-3" />
                Recent Queries
              </div>
              <button 
                onClick={clearRecentSearches}
                className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSearchTerm(s);
                    handleSearch(undefined, s);
                  }}
                  className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-500 hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 gap-4"
          >
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">Looking up the archives...</p>
          </motion.div>
        ) : result ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-brand-border shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 p-8 text-brand-primary/5 transition-transform group-hover:scale-110 duration-700">
                <ArrowRightLeft className="w-64 h-64 rotate-12" />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isOfflineResult ? 'bg-amber-500 text-white animate-pulse' : 'bg-brand-primary/10 text-brand-primary'}`}>
                        {isOfflineResult ? <WifiOff className="w-3 h-3" /> : <Logo size={12} />}
                        {isOfflineResult ? 'Offline Mode (Local Cache)' : `${result.language} Entry`}
                      </div>
                    </div>
                    <h3 className="text-6xl font-display italic font-black text-brand-text leading-none tracking-tighter">
                      {result.word}
                    </h3>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-300 mb-1 ml-1">Archive Pronunciation</span>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col bg-stone-50 px-4 py-2 rounded-xl border border-stone-100">
                            <span className="font-mono text-xs text-stone-400 font-bold tracking-widest uppercase italic">
                              {result.phonetic}
                            </span>
                            {result.ipa && (
                              <span className="font-mono text-[10px] text-brand-primary font-bold tracking-[0.2em] mt-0.5">
                                {result.ipa}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-primary mb-1 ml-1">{profile?.targetLanguage || 'Acholi'} Audio</span>
                        <button 
                          onClick={() => playAudio(result.word)}
                          className={`p-3 rounded-xl border border-stone-100 bg-white shadow-sm hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95 flex items-center gap-2 group/btn ${speaking ? 'text-brand-primary ring-4 ring-brand-primary/10' : 'text-stone-300'}`}
                        >
                          <Volume2 className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest pr-2 group-hover/btn:text-brand-primary">Play Word</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="md:text-right space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">{profile?.nativeLanguage || 'English'} Equivalent</span>
                    <div className="flex items-center gap-3 md:justify-end">
                      <p className="text-4xl font-display italic font-black text-brand-primary leading-none">{result.translation}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-10 border-t border-brand-border">
                  <div className="flex items-center gap-2">
                    <Book className="w-4 h-4 text-stone-300" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Contextual Usage</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {result.examples.map((ex, i) => (
                      <div key={i} className="bg-stone-50/50 rounded-3xl p-6 border border-brand-border/50 hover:bg-white transition-colors group/ex flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-lg font-display italic font-black text-brand-text transition-colors group-hover/ex:text-brand-primary">{(ex as any).local || ex.acholi}</p>
                          <p className="text-[13px] text-stone-400 font-semibold leading-relaxed">{(ex as any).native || ex.english}</p>
                        </div>
                        <button 
                          onClick={() => playAudio((ex as any).local || ex.acholi)}
                          className="p-3 bg-white border border-stone-100 rounded-full shadow-sm text-stone-300 hover:text-brand-primary hover:border-brand-primary transition-all active:scale-90 shrink-0"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">
               <div className="h-[1px] w-8 bg-stone-100" />
               <span>Verified Archive Entry</span>
               <div className="h-[1px] w-8 bg-stone-100" />
            </div>
          </motion.div>
        ) : !loading && (
          <div className="text-center py-12 px-8 bg-brand-bg/30 rounded-3xl border border-dashed border-brand-border">
            <Book className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400 font-medium text-sm">Translate instantly between English and Acholi.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
