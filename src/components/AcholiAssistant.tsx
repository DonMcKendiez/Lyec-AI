import React, { useState, useRef } from 'react';
import { Sparkles, Terminal, Copy, Check, Loader2, Send, Mic, Volume2, Square, Quote, BookOpen } from 'lucide-react';
import { runAcholiTask, speakAcholi, generateCulturalWisdom } from '../lib/gemini';
import Logo from './Logo';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { playPCMAudio } from '../lib/audio';
import { useAuth } from '../contexts/AuthContext';

export default function AcholiAssistant() {
  const { profile } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleWisdom = async (type: 'proverb' | 'folktale') => {
    setIsLoading(true);
    setResult('');
    try {
      const response = await generateCulturalWisdom(type, profile?.level || 1);
      setResult(response);
    } catch (error) {
      console.error(error);
      setResult('Error retrieving wisdom archive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (audioData?: { data: string; mimeType: string }) => {
    if ((!prompt.trim() && !audioData) || isLoading) return;
    setIsLoading(true);
    if (!audioData) setResult('');
    try {
      const response = await runAcholiTask(prompt || "Process this audio request", audioData, profile?.level || 1);
      setResult(response);
    } catch (error) {
      console.error(error);
      setResult('Error processing request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVoicePlay = async () => {
    if (isSpeaking || !result) return;
    setIsSpeaking(true);
    try {
      const base64 = await speakAcholi(result);
      if (base64) {
        await playPCMAudio(base64);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSpeaking(false);
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
    "Write a short story about a hunter in Acholi",
    "How do you prepare Malakwang? (Explain in English + Acholi)",
    "Write an Acholi welcoming speech for a visitor",
    "List 10 Acholi proverbs with meanings"
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">
          <Terminal className="w-3 h-3" />
          Creative Lab
        </div>
        <h2 className="text-4xl font-display italic font-black text-brand-text">Heritage Architect</h2>
        <p className="text-stone-400 font-medium">Generate stories, speeches, and cultural artifacts.</p>
      </div>

      <div className="interactive-card p-6 md:p-8 space-y-8">
        <header className="flex items-center gap-4 border-b border-stone-100 pb-8">
          <Logo size={56} />
          <div>
            <h3 className="text-xl font-display italic font-black text-brand-text leading-none uppercase">Luo Synthesis</h3>
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mt-1 italic">High-Fidelity Generation</p>
          </div>
        </header>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Design Specification</label>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
               <span className="w-1 h-1 bg-brand-primary rounded-full animate-pulse"></span>
               AI Active
            </div>
          </div>
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Express your thoughts or specify a task (e.g., Compose a traditional greeting)..."
              className="w-full h-40 p-6 pb-20 bg-stone-50 border-2 border-brand-border rounded-[2rem] focus:border-brand-primary focus:bg-white outline-none transition-all resize-none font-medium text-brand-text text-[13px] leading-relaxed"
            />
            <div className="absolute bottom-4 right-4 flex gap-3">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="w-12 h-12 flex items-center justify-center bg-red-500 text-white rounded-full shadow-xl shadow-red-500/20 animate-pulse hover:scale-110 active:scale-95 transition-all"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-12 h-12 flex items-center justify-center bg-white border border-brand-border text-stone-300 hover:text-brand-primary hover:border-brand-primary rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
                  title="Vocal Input"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => handleSubmit()}
                disabled={(!prompt.trim() && !isRecording) || isLoading}
                className="w-12 h-12 flex items-center justify-center bg-brand-primary text-white rounded-full shadow-xl shadow-brand-primary/30 hover:bg-brand-primary-hover hover:scale-110 active:scale-90 disabled:opacity-50 transition-all shrink-0"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleWisdom('proverb')}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-brand-text text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all active:scale-95 disabled:opacity-50"
          >
            <Quote className="w-4 h-4" />
            Archive Proverbs
          </button>
          <button
            onClick={() => handleWisdom('folktale')}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-brand-text text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all active:scale-95 disabled:opacity-50"
          >
            <BookOpen className="w-4 h-4" />
            Oral Folk Tales
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => setPrompt(s)}
              className="px-3 py-1.5 bg-brand-bg rounded-full border border-brand-border text-[10px] font-black uppercase tracking-wider text-brand-text/60 hover:border-brand-primary hover:text-brand-primary transition-all"
            >
              {s}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-stone-900 text-stone-100 p-8 md:p-12 rounded-[2.5rem] overflow-hidden shadow-2xl group"
            >
              <div className="absolute top-0 right-0 p-8 flex gap-3 z-20">
                <button
                  onClick={handleVoicePlay}
                  className={`p-3 rounded-xl transition-all ${
                    isSpeaking ? 'bg-brand-primary text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-stone-400 hover:text-white'
                  }`}
                  title="Resonate"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  onClick={copyToClipboard}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-stone-400 hover:text-white"
                  title="Archive Content"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="markdown-body prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:italic prose-headings:font-black prose-headings:uppercase prose-p:font-medium prose-p:text-stone-300">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
              
              <div className="mt-12 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
                <div className="h-[1px] w-12 bg-white/5" />
                <span>Synthesis Complete</span>
                <div className="h-[1px] w-12 bg-white/5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
