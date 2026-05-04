import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Languages, ArrowRightLeft, Copy, Check, Loader2, Info, Volume2, Mic, MicOff, Square } from 'lucide-react';
import Logo from './Logo';
import { translateText, speakLanguage } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { playPCMAudio } from '../lib/audio';
import debounce from 'lodash.debounce';
import { useAuth } from '../contexts/AuthContext';

export default function Translator() {
  const { profile } = useAuth();
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [direction, setDirection] = useState<'native-to-target' | 'target-to-native'>('native-to-target');
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const nativeLanguage = profile?.nativeLanguage || 'English';
  const targetLanguage = profile?.targetLanguage || 'Acholi';

  // Debounced translation function
  const debouncedTranslate = useCallback(
    debounce(async (val: string, dir: 'native-to-target' | 'target-to-native') => {
      if (!val.trim()) {
        setResult('');
        return;
      }
      setIsTranslating(true);
      try {
        const translated = await translateText(val, dir, nativeLanguage, targetLanguage);
        setResult(translated);
      } catch (error) {
        console.error(error);
      } finally {
        setIsTranslating(false);
      }
    }, 500),
    [nativeLanguage, targetLanguage]
  );

  useEffect(() => {
    debouncedTranslate(text, direction);
    return () => debouncedTranslate.cancel();
  }, [text, direction, debouncedTranslate]);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Default to common transcription lang

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error('Speech recognition failed to start:', e);
      }
    }
  };

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setIsTranslating(true);
    try {
      const translated = await translateText(text, direction, nativeLanguage, targetLanguage);
      setResult(translated);
    } catch (error) {
      console.error(error);
      setResult('Error translating. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const playAudio = async () => {
    if (!result || speaking) return;
    setSpeaking(true);
    try {
      const langToSpeak = direction === 'native-to-target' ? targetLanguage : nativeLanguage;
      const audioData = await speakLanguage(result, langToSpeak);
      if (audioData) {
        await playPCMAudio(audioData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSpeaking(false);
    }
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'native-to-target' ? 'target-to-native' : 'native-to-target');
    setText(result);
    setResult('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-2 mb-12">
        <div className="flex flex-col items-center gap-4">
          <Logo size={48} />
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">
            Real-time Engine
          </div>
        </div>
          <h2 className="text-4xl font-display italic font-black text-brand-text">Heritage Translator</h2>
          <p className="text-stone-400 font-medium tracking-tight">Bridge the linguistic gap between {nativeLanguage} and {targetLanguage}.</p>
        </div>

      <div className="interactive-card p-2 md:p-4 bg-stone-50/50">
        <div className="grid md:grid-cols-2 gap-px bg-brand-border h-full">
          {/* Input Side */}
          <div className="bg-white p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Source</span>
               <div className="px-3 py-1 bg-stone-100 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-text">
                 {direction === 'native-to-target' ? nativeLanguage : targetLanguage}
               </div>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Express your thoughts in ${direction === 'native-to-target' ? nativeLanguage : targetLanguage}...`}
              className="w-full h-64 p-0 bg-transparent border-none focus:ring-0 outline-none transition-all resize-none text-2xl font-display italic font-medium text-brand-text placeholder:text-stone-200"
            />
            
            <div className="flex items-center justify-between pt-4 border-t border-brand-border">
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleDirection}
                  className="w-10 h-10 flex items-center justify-center bg-stone-100 rounded-full hover:bg-brand-primary hover:text-white transition-all active:scale-90"
                  title="Swap Languages"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleListening}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' : 'bg-stone-100 text-stone-400 hover:text-brand-primary'}`}
                  title={isListening ? "Stop Listening" : "Voice Input"}
                >
                  {isListening ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleTranslate}
                disabled={isTranslating || !text.trim()}
                className="px-8 py-3 bg-brand-primary text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-primary-hover disabled:opacity-50 transition-all flex items-center gap-2 shadow-xl shadow-brand-primary/20"
              >
                {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process Translation'}
              </button>
            </div>
          </div>

          {/* Output Side */}
          <div className="bg-white p-6 space-y-6 min-h-[300px]">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Target</span>
               <div className="px-3 py-1 bg-brand-primary/10 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-primary">
                 {direction === 'native-to-target' ? targetLanguage : nativeLanguage}
               </div>
            </div>

            <div className="relative h-64 overflow-y-auto no-scrollbar">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key={result}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl font-display italic font-medium text-brand-primary leading-tight"
                  >
                    {result}
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-stone-200 font-display italic text-2xl">Output will manifest here...</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-brand-border gap-2">
              {result && direction === 'native-to-target' && (
                <button
                  onClick={playAudio}
                  disabled={speaking}
                  className={`p-2 rounded-full border border-stone-100 hover:border-brand-primary hover:text-brand-primary transition-all active:scale-90 ${speaking ? 'text-brand-primary bg-brand-primary/5 animate-pulse' : 'text-stone-300'}`}
                  title="Hear Pronunciation"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              )}
              {result && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-stone-50 rounded-full transition-all text-[10px] font-black uppercase tracking-widest text-stone-400"
                >
                  {copied ? (
                    <><Check className="w-4 h-4 text-green-500" /> Copied</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Copy Text</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-brand-border flex gap-4 items-start shadow-sm">
        <div className="p-2 bg-brand-primary/10 rounded-lg">
          <Info className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h3 className="font-black text-brand-primary mb-1 uppercase tracking-widest text-xs">Phonetic Guide</h3>
          <p className="text-brand-text/60 text-sm italic leading-relaxed">
            "Acholi (Luo) is a tonal language spoken mainly by the Acholi people in Northern Uganda. Pronunciation is key to meaning."
          </p>
        </div>
      </div>
    </div>
  );
}
