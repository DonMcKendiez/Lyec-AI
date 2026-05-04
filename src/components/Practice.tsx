import React, { useState, useRef } from 'react';
import { BookOpen, MapPin, CheckCircle2, ChevronRight, Loader2, Trophy, ArrowRight, User, Volume2, XCircle, Mic, Square, Activity, Sparkles } from 'lucide-react';
import Logo from './Logo';
import { generateLessonContent, speakLanguage, evaluatePronunciation } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { playPCMAudio } from '../lib/audio';
import { useAuth } from '../contexts/AuthContext';

interface LessonData {
  title: string;
  phrases: Array<{ local: string; native: string; acholi?: string; english?: string; pronunciation: string }>;
  culturalTip: string;
  quiz: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

const TOPICS = [
  { id: 'greetings', title: 'Greetings', icon: <BookOpen className="w-4 h-4" />, description: 'Basic hellos and departures' },
  { id: 'family', title: 'Family & People', icon: <User className="w-4 h-4" />, description: 'Family members and relations' },
  { id: 'numbers', title: 'Numbers & Counting', icon: <Trophy className="w-4 h-4" />, description: 'One to twenty and beyond' },
  { id: 'food', title: 'Food & Dining', icon: <MapPin className="w-4 h-4" />, description: 'Traditional meals and eating' },
];

interface Drill {
  id: string;
  type: 'translate' | 'multiple-choice' | 'pronunciation';
  question: string;
  options?: string[];
  correctAnswer: string;
  nativeText?: string;
  localText?: string;
  explanation: string;
}

export default function Practice() {
  const { profile } = useAuth();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastTopic, setLastTopic] = useState('Greetings');
  const [drillAnswers, setDrillAnswers] = useState<{ [id: string]: { selected: any; isCorrect: boolean; showExplanation: boolean } }>({});
  const loaderRef = useRef<HTMLDivElement>(null);

  const generateDrills = async (topic: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await generateLessonContent(
        `Generate 5 short interactive drills for the topic: ${topic}. Each drill should be a small object with type, question, options, correctAnswer, and explanation.`,
        profile?.targetLanguage || 'Acholi',
        profile?.nativeLanguage || 'English'
      );
      
      // Adapt the lesson generator to create random drills
      const newDrills: Drill[] = response.quiz.map((q: any, i: number) => ({
        id: Math.random().toString(36).substr(2, 9),
        type: Math.random() > 0.5 ? 'multiple-choice' : 'translate',
        question: q.question,
        options: q.options,
        correctAnswer: q.options[q.correctIndex],
        explanation: q.explanation
      }));

      setDrills(prev => [...prev, ...newDrills]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateDrills(lastTopic);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) {
        generateDrills(lastTopic);
      }
    }, { threshold: 0.5 });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, lastTopic]);

  const handleAnswerDrill = (drill: Drill, selected: any) => {
    const isCorrect = selected === drill.correctAnswer;
    setDrillAnswers(prev => ({
      ...prev,
      [drill.id]: { selected, isCorrect, showExplanation: true }
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-12 pb-32">
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-brand-primary">
          <Sparkles className="w-3 h-3" />
          Infinite Archive Drills
        </div>
        <h2 className="text-5xl md:text-7xl font-display italic font-black text-brand-text tracking-tighter leading-none">
          Legacy <span className="text-brand-primary">Gym</span>
        </h2>
        <p className="text-stone-400 font-medium max-w-sm mx-auto text-sm leading-relaxed italic">
          The archive will never stop testing you. Keep scrolling to uncover ancestral wisdom.
        </p>
      </div>

      <div className="space-y-8">
        {drills.map((drill, idx) => (
          <motion.div
            key={drill.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="interactive-card overflow-hidden group"
          >
            <div className="p-8 md:p-12 space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">Phase {idx + 1}</span>
                <div className="w-8 h-1 bg-stone-100 rounded-full" />
              </div>
              
              <div className="space-y-6">
                <h3 className="text-3xl font-display italic font-black text-brand-text leading-tight max-w-2xl">
                  {drill.question}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {drill.options?.map((opt, i) => {
                    const ans = drillAnswers[drill.id];
                    const isSelected = ans?.selected === opt;
                    const isCorrect = opt === drill.correctAnswer;
                    
                    return (
                      <button
                        key={i}
                        disabled={!!ans}
                        onClick={() => handleAnswerDrill(drill, opt)}
                        className={`p-6 rounded-[2rem] text-left transition-all border-2 font-display italic text-lg font-bold flex items-center justify-between active:scale-95 ${
                          !ans 
                            ? 'bg-stone-50 border-stone-100 hover:border-brand-primary text-brand-text' 
                            : isCorrect
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                              : isSelected 
                                ? 'bg-red-500 border-red-500 text-white' 
                                : 'bg-stone-50 border-stone-100 opacity-40 grayscale'
                        }`}
                      >
                        <span>{opt}</span>
                        {ans && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                        {ans && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {drillAnswers[drill.id]?.showExplanation && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="bg-brand-primary/5 rounded-[2rem] border border-brand-primary/10 overflow-hidden"
                    >
                      <div className="p-8 flex items-start gap-4">
                        <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-1" />
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Heritage Insight</p>
                           <p className="text-sm font-medium text-brand-text/80 leading-relaxed italic">
                             {drill.explanation}
                           </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div ref={loaderRef} className="py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-stone-200 animate-spin" />
        <p className="text-[9px] font-black text-stone-300 uppercase tracking-[0.4em]">Archiving further tests...</p>
      </div>
    </div>
  );
}
