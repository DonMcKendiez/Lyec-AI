import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Eraser, Sparkles, Mic, Volume2, Square, MessageSquareCode, Activity, Settings, X, Check } from 'lucide-react';
import Logo from './Logo';
import { createLanguageTutorChat, ChatMessage, speakLanguage, evaluatePronunciation } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { playPCMAudio } from '../lib/audio';
import { useAuth, UserPersona, AgeMode, ProficiencyLevel } from '../contexts/AuthContext';
import { PROFICIENCY_LEVELS, LANGUAGES } from '../constants';

export default function ChatTutor() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState<any>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceStatus, setPracticeStatus] = useState<'idle' | 'grading' | 'analyzing'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { profile, updateProfile } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setChat(createLanguageTutorChat(profile?.level || 1, profile?.targetLanguage || 'Acholi', profile?.nativeLanguage || 'English'));
  }, [profile?.level, profile?.targetLanguage, profile?.nativeLanguage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (audioData?: { data: string; mimeType: string }) => {
    if ((!input.trim() && !audioData) || isLoading || !chat) return;

    // Handle Practice Mode Pronunciation Evaluation
    if (practiceMode && audioData) {
      const lastBotMsg = [...messages].reverse().find(m => m.role === 'model');
      const targetPhrase = lastBotMsg?.parts[0].text as string || (profile?.targetLanguage || "Acholi");
      
      setPracticeStatus('analyzing');
      setMessages(prev => [...prev, { role: 'user', parts: [{ text: "Analysis recording..." }] }]);
      setIsLoading(true);

      try {
        const feedback = await evaluatePronunciation(targetPhrase, audioData, profile?.level || 1, profile?.targetLanguage || 'Acholi');
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: `PRONUNCIATION ANALYSIS:\n${feedback}` }] }]);
        if (updateProfile) {
          updateProfile({ xp: (profile?.xp || 0) + 100 });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setPracticeStatus('idle');
      }
      return;
    }

    const userMessage = input || (practiceMode ? "Recording for evaluation..." : "Sent an audio message");
    if (!audioData) setInput('');
    
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setIsLoading(true);

    try {
      const promptPrefix = practiceMode 
        ? `Evaluate my ${profile?.targetLanguage || 'Acholi'} pronunciation and grammar based on this audio/text. Be a helpful but strict teacher. Score me out of 10. Focus on phonetics.`
        : audioData ? `Translate and respond to this audio message in ${profile?.targetLanguage || 'Acholi'}:` : "";

      const response = await chat.sendMessage({ 
        message: audioData ? { parts: [{ text: promptPrefix || `Respond in ${profile?.targetLanguage || 'Acholi'}:` }, { inlineData: audioData }] } : (promptPrefix + userMessage)
      });
      const botText = response.text;
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: botText }] }]);
      
      // Award XP for interaction: Practice Mode gives double XP
      if (updateProfile) {
        updateProfile({ xp: (profile?.xp || 0) + (practiceMode ? 80 : 30) });
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: "Apwoyo! I'm sorry, I'm having a bit of trouble connecting right now. Please try again." }] 
      }]);
    } finally {
      setIsLoading(false);
      setPracticeStatus('idle');
    }
  };

  const handleVoicePlay = async (text: string, index: number) => {
    if (isSpeaking !== null) return;
    setIsSpeaking(index);
    try {
      const base64 = await speakLanguage(text, profile?.targetLanguage || 'Acholi');
      if (base64) {
        await playPCMAudio(base64);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSpeaking(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          handleSend({ data: base64, mimeType: mediaRecorder.mimeType });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setChat(createLanguageTutorChat(profile?.level || 1, profile?.targetLanguage || 'Acholi', profile?.nativeLanguage || 'English'));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 px-2 md:px-0">
      <div className="text-center space-y-1 mb-2 hidden md:block">
        <div className="flex flex-col items-center gap-2">
          <Logo size={48} />
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-primary/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary">
            Neural Companion
          </div>
        </div>
        <h2 className="text-3xl font-display italic font-black text-brand-text">Heritage AI Tutor</h2>
      </div>

      <div className="interactive-card flex flex-col h-[calc(100vh-12rem)] md:h-[70vh] bg-stone-50/50 rounded-[2.5rem] overflow-hidden border-brand-border">
        {/* Chat Header */}
        <div className="p-3 md:p-5 bg-white flex items-center justify-between border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Logo size={28} />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="text-sm md:text-md font-display italic font-black text-brand-text leading-none">Wang Pa Intelligence</h3>
              <p className="text-[8px] md:text-[9px] font-black text-brand-primary uppercase tracking-widest mt-1">
                {practiceMode ? '🔥 Practice' : 'Heritage Specialist'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPracticeMode(!practiceMode)}
              className={`px-3 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${practiceMode ? 'bg-brand-primary text-white shadow-md' : 'bg-stone-50 text-stone-400 border border-stone-100'}`}
            >
              {practiceMode ? 'Exit' : 'Practice'}
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-stone-50 rounded-lg transition-all text-stone-300 hover:text-brand-primary"
              title="Preferences"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={clearChat}
              className="p-2 hover:bg-stone-50 rounded-lg transition-all text-stone-300 hover:text-red-500"
              title="Wipe Session"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 no-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-xs mx-auto p-4">
              <div className="relative">
                 <div className="w-16 h-16 bg-white rounded-[1.2rem] border border-brand-border flex items-center justify-center rotate-3 shadow-md">
                   <Bot className="w-8 h-8 text-brand-primary -rotate-3" />
                 </div>
                 <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center -rotate-12 shadow-sm">
                   <MessageSquareCode className="w-4 h-4 text-brand-text" />
                 </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-display italic font-black text-brand-text leading-tight">Heritage Tutor</h3>
                <p className="text-[11px] text-stone-400 font-medium leading-relaxed">
                  I'm your cultural navigator. Ask me about heritage, or let's practice {profile?.targetLanguage || 'Acholi'}.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`p-3 rounded-[1.2rem] shadow-sm relative group ${
                    msg.role === 'user' 
                      ? 'bg-brand-primary text-white rounded-tr-none' 
                      : 'bg-white text-brand-text border border-stone-100 rounded-tl-none'
                  }`}>
                    <p className={`text-[12px] md:text-[13px] ${msg.role === 'model' ? 'font-medium leading-relaxed' : 'font-semibold'}`}>
                      {msg.parts[0].text}
                    </p>
                    
                    {msg.role === 'model' && (
                      <button
                        onClick={() => handleVoicePlay(msg.parts[0].text as string, i)}
                        className={`absolute -right-10 top-0 w-8 h-8 bg-white border border-stone-100 rounded-full shadow-md flex items-center justify-center transition-all active:scale-90 ${
                          isSpeaking === i ? 'text-brand-primary ring-2 ring-brand-primary/10 animate-pulse' : 'text-stone-300'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="p-5 bg-white border border-brand-border rounded-[2rem] rounded-tl-none flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce"></span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 md:p-6 bg-white border-t border-brand-border">
          <div className="relative flex items-center gap-2 max-w-4xl mx-auto bg-stone-50 rounded-2xl border border-stone-100 px-4 py-1.5 focus-within:ring-2 focus-within:ring-brand-primary/10 focus-within:border-brand-primary transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Query the Archive..."
              className="flex-1 bg-transparent border-none focus:ring-0 py-2.5 text-brand-text placeholder-stone-300 font-medium resize-none max-h-32 text-[13px] md:text-sm"
              rows={1}
            />
            
            <div className="flex items-center gap-1 shrink-0">
              {isRecording ? (
                <button 
                  onClick={stopRecording}
                  className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 rounded-xl border border-red-100 animate-pulse active:scale-90 transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button 
                  onClick={startRecording}
                  className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-brand-primary hover:bg-stone-50 rounded-xl transition-all"
                  title="Voice Query"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && !isRecording) || isLoading}
                className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-hover active:scale-90 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowSettings(false)}
               className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" 
            />
            <motion.div
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display italic font-black text-brand-text uppercase leading-none">Tutor Settings</h3>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="p-2 hover:bg-stone-50 rounded-full transition-all"
                >
                  <X className="w-5 h-5 text-stone-300" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">Persona Expression</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['professional', 'friendly', 'bestie', 'colleague'] as UserPersona[]).map(p => (
                      <button
                        key={p}
                        onClick={() => updateProfile?.({ persona: p })}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border-2 transition-all active:scale-95 flex items-center justify-between ${
                          profile?.persona === p ? 'bg-brand-primary border-brand-primary text-white shadow-md' : 'bg-stone-50 border-stone-50 text-stone-400'
                        }`}
                      >
                        {p}
                        {profile?.persona === p && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">Archival Stage</label>
                   <div className="grid grid-cols-2 gap-2">
                      {(['adult', 'children'] as AgeMode[]).map(m => (
                        <button
                          key={m}
                          onClick={() => updateProfile?.({ ageMode: m })}
                          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border-2 transition-all active:scale-95 flex items-center justify-between ${
                            profile?.ageMode === m ? 'bg-brand-primary border-brand-primary text-white shadow-md' : 'bg-stone-50 border-stone-50 text-stone-400'
                          }`}
                        >
                          {m === 'children' ? 'Protect Mode' : 'Standard'}
                          {profile?.ageMode === m && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">Session Dialect</label>
                   <div className="flex flex-wrap gap-1.5">
                      {LANGUAGES.slice(0, 8).map(lang => (
                        <button
                          key={lang}
                          onClick={() => updateProfile?.({ targetLanguage: lang })}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all active:scale-95 ${
                            profile?.targetLanguage === lang ? 'bg-brand-primary border-brand-primary text-white' : 'bg-stone-50 border-stone-100 text-stone-400'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 bg-brand-text text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg active:scale-95 transition-all"
                >
                  Apply Neural Alignment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
