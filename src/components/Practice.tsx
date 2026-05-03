import React, { useState } from 'react';
import { BookOpen, MapPin, CheckCircle2, ChevronRight, Loader2, Trophy, ArrowRight, User, Volume2, XCircle } from 'lucide-react';
import Logo from './Logo';
import { generateLessonContent, speakAcholi } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { playPCMAudio } from '../lib/audio';

interface LessonData {
  title: string;
  phrases: Array<{ acholi: string; english: string; pronunciation: string }>;
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

export default function Practice() {
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);

  const startLesson = async (topic: string) => {
    setLoading(true);
    setLesson(null);
    setFinished(false);
    setScore(0);
    setQuizIndex(0);
    try {
      const data = await generateLessonContent(topic);
      setLesson(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhrasePlay = async (text: string, index: number) => {
    if (isSpeaking !== null) return;
    setIsSpeaking(index);
    try {
      const base64 = await speakAcholi(text);
      if (base64) {
        await playPCMAudio(base64);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSpeaking(null);
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;
    const isCorrect = index === lesson?.quiz[quizIndex].correctIndex;
    setSelectedOption(index);
    if (isCorrect) {
      setScore(s => s + 1);
    }
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (quizIndex < (lesson?.quiz.length || 0) - 1) {
      setQuizIndex(q => q + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-8">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">
          <Logo size={12} />
          Heritage Training
        </div>
        <h2 className="text-4xl font-display italic font-black text-brand-text">Knowledge Path</h2>
        <p className="text-stone-400 font-medium">Interactive oral traditions and language modules.</p>
      </div>

      {!lesson && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => startLesson(topic.title)}
              className="p-8 bg-white rounded-[2rem] border border-brand-border shadow-sm hover:shadow-xl hover:border-brand-primary transition-all text-left flex items-start gap-6 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 text-stone-50/50 group-hover:text-brand-primary/5 transition-colors">
                {topic.icon}
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner relative z-10">
                {React.cloneElement(topic.icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
              </div>
              <div className="flex-1 relative z-10">
                <h3 className="font-display italic font-black text-xl text-brand-text uppercase tracking-tight">{topic.title}</h3>
                <p className="text-[13px] text-stone-400 font-medium mt-1 leading-relaxed">{topic.description}</p>
              </div>
              <ChevronRight className="w-6 h-6 text-stone-200 self-center group-hover:text-brand-primary group-hover:translate-x-2 transition-all relative z-10" />
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
          <p className="font-bold uppercase tracking-widest text-brand-text/40 text-xs">Preparing your personalized Lyec AI lesson...</p>
        </div>
      )}

      {lesson && !finished && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-10"
        >
          {/* Phrases Section */}
          <div className="interactive-card p-8 md:p-12 bg-white space-y-10">
            <div className="flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary w-fit">
              <BookOpen className="w-3 h-3" />
              Bilingual Oral Archive
            </div>
            
            <h2 className="text-5xl font-display italic font-black text-brand-text tracking-tighter">{lesson.title}</h2>
            
            <div className="grid gap-6">
              {lesson.phrases.map((p, i) => (
                <div key={i} className="group border-b border-stone-100 last:border-0 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                       <h3 className="text-2xl font-display italic font-black text-brand-primary leading-none uppercase">{p.acholi}</h3>
                       <p className="text-lg font-medium text-stone-400 italic">“{p.english}”</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden md:block font-mono text-[10px] font-bold text-stone-200 tracking-[0.2em] uppercase">[{p.pronunciation}]</span>
                      <button
                        onClick={() => handlePhrasePlay(p.acholi, i)}
                        className={`p-4 bg-white border border-stone-100 rounded-full shadow-sm hover:shadow-lg hover:border-brand-primary hover:text-brand-primary transition-all active:scale-90 ${
                          isSpeaking === i ? 'text-brand-primary ring-4 ring-brand-primary/10' : 'text-stone-300'
                        }`}
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-stone-50 p-8 rounded-[2rem] border border-brand-border relative overflow-hidden group">
              <MapPin className="absolute -top-6 -right-6 w-32 h-32 text-brand-primary/5 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 space-y-2">
                <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mb-4">Historical Insight</h4>
                <p className="text-xl font-display italic font-black text-brand-text leading-snug">{lesson.culturalTip}</p>
              </div>
            </div>
          </div>

          {/* Quiz Section */}
          <div className="bg-brand-text p-8 md:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110" />
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="space-y-1">
                <h3 className="text-2xl font-display italic font-black uppercase tracking-tight">Vetting Session</h3>
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Verify your knowledge</p>
              </div>
              <div className="px-5 py-2 bg-white/10 rounded-full text-[11px] font-black uppercase tracking-widest border border-white/10">
                Phase {quizIndex + 1} of {lesson.quiz.length}
              </div>
            </div>

            <div className="relative z-10 mb-10">
              <p className="text-3xl font-display italic font-black leading-tight border-l-4 border-brand-primary pl-6 py-2">{lesson.quiz[quizIndex].question}</p>
            </div>

            <div className="grid gap-4 relative z-10">
              {lesson.quiz[quizIndex].options.map((opt, i) => {
                const isCorrect = i === lesson.quiz[quizIndex].correctIndex;
                const isSelected = selectedOption === i;
                
                return (
                  <button
                    key={i}
                    disabled={selectedOption !== null}
                    onClick={() => handleAnswer(i)}
                    className={`p-6 rounded-[1.5rem] text-left transition-all border-2 font-display italic text-xl font-bold flex items-center justify-between ${
                      selectedOption === null 
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-brand-primary' 
                        : isCorrect
                          ? 'bg-emerald-500 border-emerald-500 shadow-xl shadow-emerald-500/20' 
                          : isSelected 
                            ? 'bg-red-500 border-red-500 shadow-xl shadow-red-500/20' 
                            : 'bg-white/5 border-white/10 opacity-30'
                    }`}
                  >
                    <span>{opt}</span>
                    <AnimatePresence>
                      {selectedOption !== null && isCorrect && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </motion.div>
                      )}
                      {selectedOption !== null && isSelected && !isCorrect && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <XCircle className="w-6 h-6 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-10 p-2 bg-white/5 rounded-3xl border border-white/5 overflow-hidden"
                >
                  <div className="p-8 space-y-8">
                    <p className="text-xl font-medium italic opacity-60 leading-relaxed text-center">“{lesson.quiz[quizIndex].explanation}”</p>
                    <button
                      onClick={nextQuestion}
                      className="w-full py-5 bg-white text-brand-text rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-stone-100 hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 group/btn"
                    >
                      Advance Forward <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {finished && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-3xl border border-brand-border shadow-2xl text-center space-y-6"
        >
          <div className="inline-flex p-8 bg-brand-primary/10 rounded-full text-brand-primary shadow-inner">
            <Trophy className="w-16 h-16" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-brand-text uppercase tracking-tighter italic">Lek Complete!</h2>
            <p className="text-xl text-stone-500 font-medium">
              Score: <span className="text-brand-primary font-black">{score}</span> / <span className="font-black">{lesson?.quiz.length}</span>
            </p>
          </div>
          <div className="pt-8">
            <button
              onClick={() => { setLesson(null); setFinished(false); }}
              className="px-12 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-primary-hover transition-all shadow-xl shadow-brand-primary/20"
            >
              Start New Lesson
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
