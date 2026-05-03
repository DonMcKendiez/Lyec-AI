import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Eraser, Sparkles, Mic, Volume2, Square, MessageSquareCode } from 'lucide-react';
import Logo from './Logo';
import { createAcholiTutorChat, ChatMessage, speakAcholi } from '../lib/gemini';
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
  const [practiceStatus, setPracticeStatus] = useState<'idle' | 'grading'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { profile, updateProfile } = useAuth();

  useEffect(() => {
    setChat(createAcholiTutorChat(profile?.level || 1, profile?.ageMode || 'adult'));
  }, [profile?.level, profile?.ageMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (audioData?: { data: string; mimeType: string }) => {
    if ((!input.trim() && !audioData) || isLoading || !chat) return;

    const userMessage = input || (practiceMode ? "Recording for evaluation..." : "Sent an audio message");
    if (!audioData) setInput('');
    
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setIsLoading(true);

    try {
      const promptPrefix = practiceMode 
        ? "Evaluate my Acholi pronunciation and grammar based on this audio/text. Be a helpful but strict teacher. Score me out of 10. Focus on phonetics."
        : audioData ? "Translate and respond to this audio message in Acholi:" : "";

      const response = await chat.sendMessage({ 
        message: audioData ? { parts: [{ text: promptPrefix || "Respond in Acholi:" }, { inlineData: audioData }] } : (promptPrefix + userMessage)
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
    setChat(createAcholiTutorChat(profile?.level || 1, profile?.ageMode || 'adult'));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="flex flex-col items-center gap-4">
          <Logo size={64} />
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">
            Neural Companion
          </div>
        </div>
        <h2 className="text-4xl font-display italic font-black text-brand-text">Heritage AI Tutor</h2>
        <p className="text-stone-400 font-medium">Bilingual oral histories and language guidance.</p>
      </div>

      <div className="interactive-card flex flex-col h-[75vh] bg-stone-50/50">
        {/* Chat Header */}
        <div className="p-6 bg-white flex items-center justify-between border-b border-brand-border">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Logo size={48} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="text-lg font-display italic font-black text-brand-text leading-none">Lyec Intelligence</h3>
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mt-1">
                {practiceMode ? '🔥 Practice Mode Active' : 'Acholi Specialist Ready'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPracticeMode(!practiceMode)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${practiceMode ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
            >
              {practiceMode ? 'Exit Practice' : 'Start Practice'}
            </button>
            <button 
              onClick={clearChat}
              className="p-3 hover:bg-stone-100 rounded-full transition-all text-stone-300 hover:text-red-500 active:scale-90"
              title="Wipe Session"
            >
              <Eraser className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-sm mx-auto">
              <div className="relative">
                 <div className="w-24 h-24 bg-white rounded-[2rem] border border-brand-border flex items-center justify-center rotate-6 shadow-xl">
                   <Bot className="w-12 h-12 text-brand-primary -rotate-6" />
                 </div>
                 <div className="absolute -top-4 -right-4 w-12 h-12 bg-brand-accent rounded-full flex items-center justify-center -rotate-12 shadow-lg">
                   <MessageSquareCode className="w-6 h-6 text-brand-text" />
                 </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-display italic font-black text-brand-text leading-tight">"Kop ango?"</h3>
                <p className="text-stone-400 font-medium leading-relaxed">
                  I'm your cultural navigator. Ask me about our dances, our food, or let's practice speaking Luo together.
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
                <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`p-5 rounded-[2rem] shadow-sm relative group ${
                    msg.role === 'user' 
                      ? 'bg-brand-primary text-white rounded-tr-none' 
                      : 'bg-white text-brand-text border border-brand-border rounded-tl-none'
                  }`}>
                    <p className={`text-sm ${msg.role === 'model' ? 'font-medium leading-relaxed' : 'font-semibold'}`}>
                      {msg.parts[0].text}
                    </p>
                    
                    {msg.role === 'model' && (
                      <button
                        onClick={() => handleVoicePlay(msg.parts[0].text as string, i)}
                        className={`absolute -right-14 top-1/2 -translate-y-1/2 p-3 bg-white border border-brand-border rounded-full shadow-lg transition-all hover:scale-110 active:scale-90 ${
                          isSpeaking === i ? 'text-brand-primary ring-4 ring-brand-primary/10' : 'text-stone-300 hover:text-brand-primary'
                        }`}
                      >
                        <Volume2 className="w-5 h-5" />
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
        <div className="p-6 bg-white border-t border-brand-border">
          <div className="relative flex items-center gap-3 max-w-4xl mx-auto bg-stone-50 rounded-full border border-brand-border px-6 py-2 focus-within:ring-4 focus-within:ring-brand-primary/5 focus-within:border-brand-primary transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Query the Archive..."
              className="flex-1 bg-transparent border-none focus:ring-0 py-3 text-brand-text placeholder-stone-300 font-medium resize-none max-h-32 text-sm"
              rows={1}
            />
            
            <div className="flex items-center gap-1">
              {isRecording ? (
                <button 
                  onClick={stopRecording}
                  className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 rounded-full border border-red-100 animate-pulse active:scale-90 transition-all"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button 
                  onClick={startRecording}
                  className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-brand-primary hover:bg-stone-100 rounded-full transition-all"
                  title="Voice Query"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && !isRecording) || isLoading}
                className="w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-hover active:scale-90 disabled:opacity-50 transition-all"
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
