import React, { useState, useRef } from 'react';
import { Sparkles, Terminal, Copy, Check, Loader2, Send, Mic, Volume2, Square, Quote, BookOpen } from 'lucide-react';
import { runLanguageTask, speakLanguage, generateCulturalWisdom } from '../lib/gemini';
import Logo from './Logo';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { playPCMAudio } from '../lib/audio';
import { useAuth } from '../contexts/AuthContext';

export default function HeritageAssistant() {
  const { profile } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);

  // Initial welcome message
  React.useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          role: 'assistant', 
          content: `Awaka! I am Lyec, your Heritage Architect. I am here to guide you through the traditions, wisdom, and linguistic beauty of the ${profile?.targetLanguage || 'Acholi'} people. How can I assist your journey today?` 
        }
      ]);
    }
  }, [profile?.targetLanguage]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoReply, setAutoReply] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVoicePlay = async (text: string) => {
    if (isSpeaking || !text) return;
    setIsSpeaking(true);
    try {
      // Clean markdown for better TTS
      const cleanText = text.replace(/[#*`_]/g, '').slice(0, 500); 
      const base64 = await speakLanguage(cleanText, profile?.targetLanguage || 'Acholi');
      if (base64) {
        await playPCMAudio(base64);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleWisdom = async (type: 'proverb' | 'folktale') => {
    setIsLoading(true);
    const userMessage = `Generate a ${profile?.targetLanguage || 'Acholi'} ${type}.`;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await generateCulturalWisdom(type, profile?.level || 1, profile?.targetLanguage || 'Acholi');
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      if (autoReply) {
        handleVoicePlay(response);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error retrieving wisdom archive.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (audioData?: { data: string; mimeType: string }) => {
    if ((!prompt.trim() && !audioData) || isLoading) return;
    
    const currentPrompt = prompt;
    setPrompt('');
    setIsLoading(true);
    
    if (!audioData) {
      setMessages(prev => [...prev, { role: 'user', content: currentPrompt }]);
    } else {
      setMessages(prev => [...prev, { role: 'user', content: '🎤 Audio Request Analysis...' }]);
    }

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      } as any));
      
      const response = await runLanguageTask(
        currentPrompt || "Process this request", 
        audioData, 
        profile?.level || 1, 
        profile?.ageMode || 'adult', 
        history,
        profile?.targetLanguage || 'Acholi',
        profile?.nativeLanguage || 'English'
      );
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      if (autoReply) {
        handleVoicePlay(response);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error processing request. Please try again.' }]);
    } finally {
      setIsLoading(false);
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
          handleSubmit({ data: base64, mimeType: mediaRecorder.mimeType });
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

  const SUGGESTIONS = [
    "Write a short Acholi story",
    "List 5 common Acholi proverbs",
    "How do I say 'Welcome' in Acholi?",
    "Explain Acholi naming traditions"
  ];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 md:p-8 flex items-center justify-between border-b border-stone-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-brand-text uppercase italic leading-none">Archivist Lab</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Heritage AI Online</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setAutoReply(!autoReply)}
            className={`p-3 rounded-xl transition-all flex items-center gap-2 border ${autoReply ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'bg-stone-50 border-stone-100 text-stone-400'}`}
            title="Auto-Speech Reply"
          >
            <Volume2 className={`w-4 h-4 ${autoReply ? 'animate-pulse' : ''}`} />
            <span className="text-[8px] font-black uppercase tracking-widest hidden md:block">{autoReply ? 'Vox Active' : 'Vox Muted'}</span>
          </button>
          <button onClick={() => handleWisdom('proverb')} className="p-3 bg-stone-50 hover:bg-brand-primary hover:text-white rounded-xl transition-all" title="Acholi Proverbs">
            <Quote className="w-4 h-4" />
          </button>
          <button onClick={() => handleWisdom('folktale')} className="p-3 bg-stone-50 hover:bg-brand-primary hover:text-white rounded-xl transition-all" title="Acholi Folk Tales">
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
             <Logo size={80} className="opacity-20 grayscale" />
             <div className="space-y-2">
                <h3 className="text-xl font-display font-black text-stone-300 uppercase italic">Awaiting Directives</h3>
                <p className="text-sm text-stone-400 font-medium max-w-xs">Ask for translations, stories, or cultural deep-dives. Responses will be direct and heritage-focused.</p>
             </div>
             <div className="flex flex-wrap justify-center gap-2">
               {SUGGESTIONS.map((s, i) => (
                 <button 
                  key={i} 
                  onClick={() => setPrompt(s)}
                  className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:border-brand-primary hover:text-brand-primary transition-all"
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[75%] p-6 rounded-[2rem] shadow-sm relative group ${
                msg.role === 'user' 
                  ? 'bg-brand-primary text-white rounded-tr-none' 
                  : 'bg-white border border-stone-100 text-brand-text rounded-tl-none'
              }`}>
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => handleVoicePlay(msg.content)}
                    className="absolute -right-12 top-4 p-2 bg-stone-50 text-stone-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:text-brand-primary"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
                <div className="markdown-body text-sm font-medium leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white border border-stone-100 p-6 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-3">
               <div className="flex gap-1">
                 <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                 <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                 <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
               </div>
               <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Synthesizing Heritage...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 border-t border-stone-100 bg-white/80 backdrop-blur-xl">
        <div className="relative flex items-center gap-3 max-w-4xl mx-auto">
          <div className="relative flex-1 group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Direct heritage query..."
              className="w-full h-14 max-h-32 p-4 pr-12 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-brand-primary focus:bg-white outline-none transition-all resize-none font-medium text-brand-text text-sm no-scrollbar"
            />
            <div className="absolute right-3 top-3">
               {isRecording ? (
                 <button onClick={stopRecording} className="p-1.5 bg-red-500 text-white rounded-lg animate-pulse shadow-lg shadow-red-500/20">
                    <Square className="w-4 h-4 fill-current" />
                 </button>
               ) : (
                 <button onClick={startRecording} className="p-1.5 text-stone-300 hover:text-brand-primary transition-colors">
                    <Mic className="w-4 h-4" />
                 </button>
               )}
            </div>
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={(!prompt.trim() && !isRecording) || isLoading}
            className="w-14 h-14 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
