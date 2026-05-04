import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Eraser, Sparkles, Mic, Volume2, Square, MessageSquareCode, Activity } from 'lucide-react';
import Logo from './Logo';
import { createLanguageTutorChat, ChatMessage, speakLanguage, evaluatePronunciation } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { playPCMAudio } from '../lib/audio';
import { useAuth } from '../contexts/AuthContext';

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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-4 hidden md:block">
        <div className="flex flex-col items-center gap-4">
          <Logo size={64} />
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">
            Neural Companion
          </div>
        </div>
        <h2 className="text-4xl font-display italic font-black text-brand-text">Heritage AI Tutor</h2>
        <p className="text-stone-400 font-medium">Bilingual oral histories and language guidance.</p>
      </div>

      <div className="interactive-card flex flex-col h-[calc(100vh-14rem)] md:h-[75vh] bg-stone-50/50">
        {/* Chat Header */}
        <div className="p-4 md:p-6 bg-white flex items-center justify-between border-b border-brand-border">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative">
              <Logo size={32} />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="text-sm md:text-lg font-display italic font-black text-brand-text leading-none">Lyec Intelligence</h3>
              <p className="text-[8px] md:text-[10px] font-black text-brand-primary uppercase tracking-widest mt-1">
                {practiceMode ? '🔥 Practice' : 'Heritage Specialist'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPracticeMode(!practiceMode)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${practiceMode ? 'bg-brand-primary text-white shadow-lg' : 'bg-stone-50 text-stone-400 border border-stone-100'}`}
            >
              {practiceMode ? 'Exit' : 'Practice'}
            </button>
            <button 
              onClick={clearChat}
              className="p-2 hover:bg-stone-50 rounded-xl transition-all text-stone-300 hover:text-red-500"
              title="Wipe Session"
            >
              <Eraser className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 no-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-sm mx-auto p-4">
              <div className="relative">
                 <div className="w-20 h-20 bg-white rounded-[1.5rem] border border-brand-border flex items-center justify-center rotate-6 shadow-lg">
                   <Bot className="w-10 h-10 text-brand-primary -rotate-6" />
                 </div>
                 <div className="absolute -top-3 -right-3 w-10 h-10 bg-brand-accent rounded-full flex items-center justify-center -rotate-12 shadow-md">
                   <MessageSquareCode className="w-5 h-5 text-brand-text" />
                 </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display italic font-black text-brand-text leading-tight">Heritage Tutor</h3>
                <p className="text-xs md:text-sm text-stone-400 font-medium leading-relaxed">
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
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`p-4 rounded-[1.5rem] shadow-sm relative group ${
                    msg.role === 'user' 
                      ? 'bg-brand-primary text-white rounded-tr-none' 
                      : 'bg-white text-brand-text border border-stone-100 rounded-tl-none'
                  }`}>
                    <p className={`text-[13px] md:text-sm ${msg.role === 'model' ? 'font-medium leading-relaxed' : 'font-semibold'}`}>
                      {msg.parts[0].text}
                    </p>
                    
                    {msg.role === 'model' && (
                      <button
                        onClick={() => handleVoicePlay(msg.parts[0].text as string, i)}
                        className={`absolute -right-12 top-1 w-10 h-10 bg-white border border-stone-100 rounded-full shadow-md flex items-center justify-center transition-all active:scale-90 ${
                          isSpeaking === i ? 'text-brand-primary ring-2 ring-brand-primary/10 animate-pulse' : 'text-stone-300'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
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
    </div>
  );
}
