import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  BookOpen, MapPin, CheckCircle2, ChevronRight, Loader2, Trophy, 
  ArrowRight, User, Volume2, XCircle, Mic, Square, Activity, 
  Sparkles, Plus, Trash2, Edit2, Settings, RefreshCw, 
  GripVertical, Check, AlertCircle
} from 'lucide-react';
import Logo from './Logo';
import { generateLessonContent, speakLanguage, evaluatePronunciation } from '../lib/gemini';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { playPCMAudio } from '../lib/audio';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getLessonTopics, addLessonTopic, deleteLessonTopic, LessonTopic } from '../services/topicService';

interface Drill {
  id: string;
  type: 'multiple-choice' | 'fill-in' | 'ordering' | 'pronunciation';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  audioText?: string;
  words?: string[]; // for ordering
}

export default function Practice() {
  const { profile, isAdmin } = useAuth();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(false);
  const [drillAnswers, setDrillAnswers] = useState<{ [id: string]: { selected: any; isCorrect: boolean; showExplanation: boolean; scoring?: any } }>({});
  const [topics, setTopics] = useState<LessonTopic[]>([]);
  const [activeTopic, setActiveTopic] = useState<LessonTopic | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [newTopic, setNewTopic] = useState<Partial<LessonTopic>>({ title: '', description: '', difficulty: 'beginner', keywords: [] });
  const [keywordInput, setKeywordInput] = useState('');
  
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    const fetched = await getLessonTopics();
    setTopics(fetched);
    if (fetched.length > 0 && !activeTopic) {
      setActiveTopic(fetched[0]);
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.title) return;
    await addLessonTopic({
      title: newTopic.title as string,
      description: newTopic.description || '',
      difficulty: (newTopic.difficulty || 'beginner') as any,
      keywords: newTopic.keywords || []
    });
    setNewTopic({ title: '', description: '', difficulty: 'beginner', keywords: [] });
    loadTopics();
  };

  const handleDeleteTopic = async (id: string) => {
    await deleteLessonTopic(id);
    loadTopics();
  };

  const generateDrills = async (topic: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await generateLessonContent(
        `Generate 5 interactive drills for the topic: ${topic}. 
        Mixed types: 
        - multiple-choice: standard 4-option quiz
        - fill-in: a sentence with a blank like "Joni ___ Acholi" (English: John speaks Acholi). correctAnswer is the missing word.
        - ordering: provide the English sentence in 'question', and the scrambled Acholi words in 'words' array. correctAnswer is the full correct sentence.
        - pronunciation: 'question' is a native phrase to repeat.
        Return items with fields: type, question, options (for multiple choice), words (for ordering), correctAnswer, and explanation.`,
        profile?.targetLanguage || 'Acholi',
        profile?.nativeLanguage || 'English'
      );
      
      const newItems: Drill[] = response.quiz.map((q: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        type: q.type || 'multiple-choice',
        question: q.question,
        options: q.options,
        words: q.words,
        correctAnswer: q.correctAnswer || q.options?.[q.correctIndex],
        explanation: q.explanation,
        audioText: q.audioText || q.correctAnswer
      }));

      setDrills(prev => [...prev, ...newItems]);
    } catch (error) {
       // Graceful retry or informative error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTopic) {
      setDrills([]);
      generateDrills(activeTopic.title);
    }
  }, [activeTopic]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && drills.length > 0) {
        generateDrills(activeTopic?.title || 'General');
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, activeTopic, drills.length]);

  const handleAnswerDrill = (drill: Drill, selected: any, scoring?: any) => {
    // Scoring logic
    let isCorrect = false;
    
    if (drill.type === 'ordering') {
      isCorrect = (selected as string[]).join(' ').trim().toLowerCase() === drill.correctAnswer.trim().toLowerCase();
    } else if (drill.type === 'pronunciation') {
      isCorrect = scoring?.accuracy >= 80;
    } else {
      isCorrect = (typeof selected === 'string' && selected.toLowerCase().trim() === drill.correctAnswer.toLowerCase().trim());
    }
    
    setDrillAnswers(prev => ({
      ...prev,
      [drill.id]: { selected, isCorrect, showExplanation: true, scoring }
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 md:p-4 flex flex-col gap-8 pb-32">
      {/* Header & Topic Bar */}
      <div className="text-center space-y-4 pt-6">
        <div className="flex justify-center mb-4">
           <Logo size={80} />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary border border-brand-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          Neural Heritage Gym
        </div>
        <h2 className="text-4xl md:text-6xl font-display italic font-black text-brand-text tracking-tighter leading-none">
          Mental <span className="text-brand-primary">Fortress</span>
        </h2>
        <p className="text-stone-400 font-medium max-w-xs mx-auto text-[13px] leading-relaxed italic">
          Sharpening the mind through high-frequency ancestral speech.
        </p>

        <div className="flex overflow-x-auto no-scrollbar gap-2 px-2 pb-4 justify-center pt-6">
           {topics.map(t => (
             <button 
               key={t.id} 
               onClick={() => setActiveTopic(t)}
               className={`px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap shadow-sm group relative ${
                 activeTopic?.id === t.id 
                  ? 'bg-brand-primary text-white border-brand-primary shadow-lg scale-105' 
                  : 'bg-white text-stone-400 border-stone-100 hover:border-brand-primary/30 hover:text-brand-text'
               }`}
             >
               {t.title}
             </button>
           ))}
           {topics.length === 0 && !loading && (
             <button onClick={() => generateDrills('Greetings')} className="px-6 py-3 rounded-2xl bg-stone-100 text-stone-400 text-[10px] font-black uppercase tracking-widest">
               Load Syllabus...
             </button>
           )}
        </div>

        {isAdmin && (
           <div className="pt-4">
              <button 
                onClick={() => setShowAdmin(!showAdmin)}
                className="inline-flex items-center gap-3 px-6 py-3 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-primary hover:scale-105 transition-all shadow-xl"
              >
                <Settings className="w-5 h-5" />
                Manage Ancestral Syllabus
              </button>
           </div>
        )}
      </div>

      <AnimatePresence>
        {showAdmin && isAdmin && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white/50 backdrop-blur-xl rounded-[3rem] border border-stone-100 shadow-2xl"
          >
            <div className="p-10 space-y-10">
              <div className="space-y-6">
                <h3 className="text-2xl font-black uppercase italic tracking-tight text-brand-text flex items-center gap-3">
                  <Edit2 className="w-6 h-6 text-brand-primary" />
                  Define Path
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Topic Title</label>
                    <input 
                      placeholder="e.g., Traditional Medicine"
                      value={newTopic.title}
                      onChange={e => setNewTopic({...newTopic, title: e.target.value})}
                      className="w-full p-5 bg-white rounded-3xl border border-stone-100 focus:focus-ring outline-none text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Maturity Level</label>
                    <select 
                      value={newTopic.difficulty}
                      onChange={e => setNewTopic({...newTopic, difficulty: e.target.value as any})}
                      className="w-full p-5 bg-white rounded-3xl border border-stone-100 focus:focus-ring outline-none text-sm font-black uppercase tracking-widest"
                    >
                      <option value="beginner">Seedling (Beginner)</option>
                      <option value="intermediate">Rising (Intermediate)</option>
                      <option value="advanced">Elder (Advanced)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Spiritual Description</label>
                    <textarea 
                      placeholder="What wisdom is contained here?"
                      value={newTopic.description}
                      onChange={e => setNewTopic({...newTopic, description: e.target.value})}
                      className="w-full p-6 bg-white rounded-3xl border border-stone-100 focus:focus-ring outline-none text-sm font-medium h-32 resize-none"
                    />
                  </div>
                  <button 
                    onClick={handleAddTopic}
                    className="md:col-span-2 py-6 bg-brand-primary text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(242,125,38,0.3)]"
                  >
                    Forge New Topic
                  </button>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-10 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 italic">Living Syllabus</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topics.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-stone-100 shadow-sm border-transparent hover:border-brand-primary/20 transition-all group">
                      <div className="flex flex-col">
                        <p className="text-sm font-black text-brand-text">{t.title}</p>
                        <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${t.difficulty === 'beginner' ? 'text-emerald-500' : t.difficulty === 'intermediate' ? 'text-amber-500' : 'text-red-500'}`}>
                          {t.difficulty}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteTopic(t.id)}
                        className="p-3 text-stone-200 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drill Content */}
      <div className="space-y-12">
        {drills.map((drill, idx) => (
          <motion.div
            key={drill.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="group"
          >
            <div className="interactive-card bg-white overflow-hidden relative border-transparent hover:border-brand-primary/20 transition-all duration-500">
              {/* Card Ribbon */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary opacity-20" />
              
              <div className="p-10 md:p-16 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                        <span className="text-[10px] font-black text-brand-primary">{idx + 1}</span>
                     </div>
                     <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary italic">Neural Challenge</span>
                        <p className="text-[9px] text-stone-400 font-black uppercase mt-0.5 tracking-widest uppercase">{drill.type.replace('-', ' ')}</p>
                     </div>
                  </div>
                  {drillAnswers[drill.id] && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${drillAnswers[drill.id].isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                       {drillAnswers[drill.id].isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                       {drillAnswers[drill.id].isCorrect ? 'Legacy Preserved' : 'Sync Failed'}
                    </div>
                  )}
                </div>
                
                <div className="space-y-10">
                  <h3 className="text-4xl md:text-5xl font-display italic font-black text-brand-text leading-[1.1] tracking-tighter max-w-3xl">
                    {drill.question}
                  </h3>
                  
                  {drill.type === 'pronunciation' && (
                    <PronunciationDrill 
                      phrase={drill.question} 
                      onComplete={(scoring) => handleAnswerDrill(drill, 'complete', scoring)} 
                    />
                  )}

                  {drill.type === 'multiple-choice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {drill.options?.map((opt, i) => {
                        const ans = drillAnswers[drill.id];
                        const isSelected = ans?.selected === opt;
                        const isCorrect = opt === drill.correctAnswer;
                        
                        return (
                          <button
                            key={i}
                            disabled={!!ans}
                            onClick={() => handleAnswerDrill(drill, opt)}
                            className={`p-8 rounded-[2.5rem] text-left transition-all border-2 font-display italic text-xl font-bold flex items-center justify-between group active:scale-95 ${
                              !ans 
                                ? 'bg-stone-50 border-stone-100 hover:border-brand-primary hover:bg-white text-stone-600' 
                                : isCorrect
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
                                  : isSelected 
                                    ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/20' 
                                    : 'bg-stone-100 border-stone-200 opacity-40 grayscale pointer-events-none'
                            }`}
                          >
                            <span>{opt}</span>
                            <div className="shrink-0 ml-4">
                              {ans && isCorrect && <CheckCircle2 className="w-6 h-6" />}
                              {ans && isSelected && !isCorrect && <XCircle className="w-6 h-6" />}
                              {!ans && <div className="w-6 h-6 border-2 border-stone-300 rounded-full group-hover:border-brand-primary transition-colors" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {drill.type === 'fill-in' && (
                    <FillInDrill 
                      drill={drill} 
                      onComplete={(answer) => handleAnswerDrill(drill, answer)} 
                      disabled={!!drillAnswers[drill.id]}
                    />
                  )}

                  {drill.type === 'ordering' && (
                    <OrderingDrill 
                      drill={drill} 
                      onComplete={(ordered) => handleAnswerDrill(drill, ordered)} 
                      disabled={!!drillAnswers[drill.id]}
                    />
                  )}

                  <AnimatePresence>
                    {drillAnswers[drill.id]?.showExplanation && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="bg-brand-primary/5 rounded-[3rem] border border-brand-primary/10 overflow-hidden"
                      >
                        <div className="p-12 flex flex-col md:flex-row items-center gap-10">
                           <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 border-2 ${drillAnswers[drill.id].isCorrect ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-red-100 border-red-200 text-red-600'}`}>
                              {drillAnswers[drill.id].isCorrect ? <Trophy className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                           </div>
                           <div className="flex-1 space-y-4 text-center md:text-left">
                             <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-stone-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-brand-primary">
                               <Sparkles className="w-3 h-3" />
                               Ancestral Context
                             </div>
                             <p className="text-lg font-medium text-brand-text/80 italic leading-relaxed">
                               {drill.explanation}
                             </p>
                             {!drillAnswers[drill.id].isCorrect && (
                               <p className="text-sm font-black text-brand-primary uppercase tracking-[0.2em]">Correct Path: {drill.correctAnswer}</p>
                             )}
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div ref={loaderRef} className="py-32 flex flex-col items-center justify-center gap-6">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
             <RefreshCw className="w-10 h-10 text-brand-primary animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-primary animate-pulse italic">Manifesting Lessons...</p>
          </div>
        ) : drills.length > 0 && (
          <div className="h-2 w-32 bg-stone-100 rounded-full overflow-hidden">
             <motion.div 
               animate={{ x: [-128, 128] }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               className="h-full w-32 bg-brand-primary/30"
             />
          </div>
        )}
      </div>
    </div>
  );
}

function FillInDrill({ drill, onComplete, disabled }: { drill: Drill; onComplete: (val: string) => void; disabled: boolean }) {
  const [value, setValue] = useState('');
  
  return (
    <div className="space-y-6">
      <div className="relative group">
        <input 
          disabled={disabled}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Manifest the missing link..."
          className="w-full p-8 bg-stone-50 border-2 border-stone-100 rounded-[2.5rem] text-2xl font-display italic font-bold focus:border-brand-primary focus:bg-white outline-none transition-all pr-32"
          onKeyPress={e => e.key === 'Enter' && value && onComplete(value)}
        />
        <button 
          disabled={disabled || !value}
          onClick={() => onComplete(value)}
          className="absolute right-4 top-4 bottom-4 px-8 bg-brand-primary text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all disabled:opacity-0"
        >
          Verify
        </button>
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-6">Type the missing Acholi word from the sequence above</p>
    </div>
  );
}

function OrderingDrill({ drill, onComplete, disabled }: { drill: Drill; onComplete: (val: string[]) => void; disabled: boolean }) {
  const [words, setWords] = useState<string[]>(drill.words || []);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 justify-center">
        <Reorder.Group axis="x" values={words} onReorder={disabled ? () => {} : setWords} className="flex flex-wrap gap-4 justify-center">
          {words.map(word => (
            <Reorder.Item key={word} value={word}>
               <div className={`px-8 py-5 bg-white border-2 border-stone-100 rounded-[2rem] shadow-sm flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-brand-primary transition-all font-display italic font-bold text-xl ${disabled ? 'opacity-50 grayscale' : ''}`}>
                  <GripVertical className="w-5 h-5 text-stone-200" />
                  {word}
               </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
      {!disabled && (
        <div className="flex justify-center">
          <button 
            onClick={() => onComplete(words)}
            className="px-16 py-6 bg-brand-primary text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/20"
          >
            Confirm Alignment
          </button>
        </div>
      )}
    </div>
  );
}

function PronunciationDrill({ phrase, onComplete }: { phrase: string; onComplete: (scoring: any) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState<any>(null);
  const { profile } = useAuth();
  const { notify } = useNotification();
  const [speaking, setSpeaking] = useState(false);

  const startAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setAnalyzing(true);
          try {
            const result = await evaluatePronunciation(
              phrase,
              { data: base64Audio, mimeType: "audio/webm" }, 
              profile?.level || 1,
              profile?.targetLanguage || 'Acholi'
            );
            setScore(result);
            onComplete(result);
          } catch (err) {
            console.error(err);
          } finally {
            setAnalyzing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      setIsRecording(true);
      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
        setIsRecording(false);
      }, 3000);

    } catch (err) {
      console.error("Microphone access denied or error:", err);
      notify("Recording Error", "Could not access microphone.", "warning");
    }
  };

  const playPhrase = async () => {
    if (speaking) return;
    setSpeaking(true);
    try {
      const base64 = await speakLanguage(phrase, profile?.targetLanguage || 'Acholi');
      if (base64) await playPCMAudio(base64);
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <div className="space-y-10">
       <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          <div className="text-center space-y-4">
             <button 
                onClick={playPhrase}
                className="w-24 h-24 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center hover:bg-brand-primary/10 hover:text-brand-primary transition-all active:scale-90 group relative"
              >
                <Volume2 className={`w-10 h-10 ${speaking ? 'animate-pulse' : ''}`} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-stone-400 group-hover:text-brand-primary">Master Voice</span>
              </button>
          </div>
          
          <div className="relative">
             <button
                onClick={startAnalysis}
                disabled={isRecording || analyzing}
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-2xl relative z-10 ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : analyzing 
                      ? 'bg-stone-100 text-stone-300 border-2 border-stone-100'
                      : 'bg-brand-primary text-white hover:scale-110 shadow-[0_20px_60px_rgba(242,125,38,0.4)]'
                }`}
              >
                {isRecording ? <Square className="w-8 h-8" /> : analyzing ? <Loader2 className="w-10 h-10 animate-spin" /> : <Mic className="w-12 h-12" />}
                <span className="text-[8px] font-black uppercase tracking-widest">{isRecording ? 'Capturing' : analyzing ? 'Analyzing' : 'Speak'}</span>
              </button>
              {isRecording && (
                 <motion.div 
                   animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                   transition={{ repeat: Infinity, duration: 1.5 }}
                   className="absolute inset-0 bg-red-400 rounded-full"
                 />
              )}
          </div>
       </div>

       <AnimatePresence>
         {score && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-10 rounded-[3rem] border-2 flex flex-col items-center text-center gap-6 ${score.accuracy >= 80 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}
            >
               <div className="flex items-center gap-6">
                  <div className="relative">
                    <Activity className={`w-12 h-12 ${score.accuracy >= 80 ? 'text-emerald-500' : 'text-red-500'}`} />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`absolute inset-0 border-2 rounded-full ${score.accuracy >= 80 ? 'border-emerald-200' : 'border-red-200'}`}
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-4xl font-display italic font-black text-brand-text">{score.accuracy}%</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Harmonic Alignment</p>
                  </div>
               </div>
               <div className="p-6 bg-white rounded-[2rem] border border-stone-100 shadow-sm max-w-lg">
                  <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-2 italic">Neural Feedback</p>
                  <p className="font-medium text-brand-text italic leading-relaxed">{score.feedback}</p>
               </div>
            </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}
