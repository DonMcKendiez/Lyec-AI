import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, 
  Maximize2, Minimize2, User, Bot, Loader2, Sparkles, 
  X, Activity, Settings, Check, ChevronLeft, ChevronRight, 
  Signal, Wifi, Clock, Radio, Eye, EyeOff, LayoutGrid, 
  MoreVertical, Share2, Info, MessageSquare, Hand
} from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
import { useAuth } from '../contexts/AuthContext';
import { AVATARS } from '../constants';

interface LiveAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export default function LiveAssistant({ isOpen, onClose, onNavigate }: LiveAssistantProps) {
  const { profile } = useAuth();
  
  const [isActive, setIsActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active'>('idle');
  const [volume, setVolume] = useState(0);
  const [showSettings, setShowSettings] = useState(true);
  const [selectedAvatarId, setSelectedAvatarId] = useState(profile?.selectedAvatarId || AVATARS[1].id);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [callDuration, setCallDuration] = useState(0);
  const [signalStrength, setSignalStrength] = useState(3);
  const [showLayout, setShowLayout] = useState<'focused' | 'grid'>('focused');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const timerRef = useRef<any>(null);

  const selectedAvatar = useMemo(() => 
    AVATARS.find(a => a.id === selectedAvatarId) || AVATARS[1]
  , [selectedAvatarId]);

  const filteredAvatars = useMemo(() => 
    AVATARS.filter(a => genderFilter === 'all' || a.gender === genderFilter)
  , [genderFilter]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanup = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setStatus('idle');
    setIsActive(false);
    setCallDuration(0);
  }, []);

  const startCall = async () => {
    try {
      setShowSettings(false);
      setStatus('connecting');
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: 1280, height: 720 } 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const scriptNode = audioContext.createScriptProcessor(2048, 1, 1);
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(scriptNode);
      scriptNode.connect(audioContext.destination);

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setStatus('active');
            setIsActive(true);
            timerRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1);
              if (Math.random() > 0.8) setSignalStrength(Math.floor(Math.random() * 2) + 2);
            }, 1000);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const binary = atob(base64Audio);
              const buffer = new Float32Array(binary.length / 2);
              const dataView = new DataView(new Uint8Array([...binary].map(c => c.charCodeAt(0))).buffer);
              for (let i = 0; i < buffer.length; i++) {
                buffer[i] = dataView.getInt16(i * 2, true) / 32768;
              }
              audioQueueRef.current.push(buffer);
              if (!isPlayingRef.current) playNextInQueue();
            }

            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
            }

            const toolCall = message.toolCall;
            if (toolCall?.functionCalls) {
              for (const fc of toolCall.functionCalls) {
                if (fc.name === 'navigateToTab' && fc.args?.tab) {
                  onNavigate?.(fc.args.tab as string);
                }
              }
            }
          },
          onclose: () => cleanup(),
          onerror: (err) => {
            console.error("Live error:", err);
            cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are '${selectedAvatar.name}', an Acholi ${selectedAvatar.age} ${selectedAvatar.gender === 'male' ? 'man' : 'woman'}.
          Persona: ${selectedAvatar.description}
          
          Context: You are in a high-fidelity video call with a student.
          USER LEVEL: ${profile?.level || 1}
          
          CORE RESPONSIBILITY:
          1. Act as a real tutor. If the user makes a mistake in Acholi pronunciation or grammar, GENTLY interrupt or correct them.
          2. Provide real-time feedback. (e.g., "The 'r' in 'Ber' should be trilled slightly more", or "In Acholi, the verb comes here...").
          3. Adapt your style: If they are Beginner, be extremely patient. If they are Advanced, challenge them with faster speech and complex proverbs.
          4. Maintain your tribal identity. Use Acholi phrases constantly but explain them if needed.
          
          Keep the conversation flowing naturally. Feel free to ask the user to repeat phrases to check their progress.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedAvatar.gender === 'male' ? "Charon" : "Aoede" } }
          }
        }
      });

      sessionRef.current = await sessionPromise;

      scriptNode.onaudioprocess = (e) => {
        if (!isActive || !isMicOn) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        sessionRef.current?.sendRealtimeInput({
          audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      const captureFrame = () => {
        if (!isActive || !isVideoOn || !canvasRef.current || !videoRef.current) {
          if (status === 'active') requestAnimationFrame(captureFrame);
          return;
        }
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 180);
          const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
          sessionRef.current?.sendRealtimeInput({
            video: { data: base64, mimeType: 'image/jpeg' }
          });
        }
        if (status === 'active') setTimeout(captureFrame, 500);
      };
      captureFrame();

    } catch (err) {
      console.error("Failed to start call:", err);
      setStatus('idle');
    }
  };

  const playNextInQueue = () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      setVolume(0);
      return;
    }
    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;
    const buffer = audioContextRef.current.createBuffer(1, chunk.length, 16000);
    buffer.getChannelData(0).set(chunk);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    
    const analyser = audioContextRef.current.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContextRef.current.destination);

    const checkVolume = () => {
      if (!isPlayingRef.current) {
        setVolume(0);
        return;
      }
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b) / data.length;
      setVolume(avg / 255);
      if (isPlayingRef.current) requestAnimationFrame(checkVolume);
    };
    checkVolume();

    source.onended = () => {
      isPlayingRef.current = false;
      playNextInQueue();
    };
    source.start();
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 100 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          width: isMinimized ? (window.innerWidth < 768 ? '100%' : '360px') : (window.innerWidth < 1024 ? '100%' : '440px'),
          height: isMinimized ? 'auto' : (window.innerWidth < 768 ? '100vh' : '720px'),
          zIndex: 100,
          position: 'fixed' as const,
          bottom: isMinimized ? (window.innerWidth < 768 ? 0 : 24) : (window.innerWidth < 768 ? 0 : 24),
          right: isMinimized ? (window.innerWidth < 768 ? 0 : 24) : (window.innerWidth < 768 ? 0 : 24),
          left: isMinimized ? (window.innerWidth < 768 ? 0 : 'auto') : (window.innerWidth < 768 ? 0 : 'auto'),
          top: isMinimized ? 'auto' : (window.innerWidth < 768 ? 0 : 'auto'),
        }}
        exit={{ opacity: 0, scale: 0.9, y: 200 }}
        className={`bg-stone-950 text-white flex flex-col overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] ${isMinimized || window.innerWidth >= 768 ? 'rounded-[2.5rem] border border-white/10' : ''}`}
      >
        {/* Connection Area */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          
          {/* Main Call Surface */}
          <div className="flex-1 relative bg-stone-900 overflow-hidden">
            
            {/* Avatar View */}
            <div className={`relative w-full h-full bg-stone-950 transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedAvatarId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <img 
                      src={selectedAvatar.image} 
                      alt={selectedAvatar.name}
                      className={`w-full h-full object-cover transition-all duration-1000 ${isActive ? 'scale-110 brightness-75 blur-[2px]' : 'scale-100'}`}
                  />
                  
                  {/* Neural Focus - Circular Avatar when Active */}
                  {isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <div className="relative">
                          <motion.div 
                            animate={{ 
                              scale: [1, 1.1 + volume * 0.3, 1],
                              opacity: [0.3, 0.6, 0.3] 
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-[-20%] rounded-full bg-brand-primary/20 blur-3xl"
                          />
                          <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-brand-primary shadow-[0_0_50px_rgba(242,125,38,0.4)] relative z-10">
                             <img 
                               src={selectedAvatar.image} 
                               className="w-full h-full object-cover" 
                               alt=""
                             />
                          </div>

                          {/* Voice Visualizer Ring */}
                          <svg className="absolute inset-[-15%] w-[130%] h-[130%] -rotate-90 z-20 pointer-events-none">
                            <motion.circle
                              cx="50%" cy="50%" r="48%"
                              fill="none"
                              stroke="url(#gradient)"
                              strokeWidth="4"
                              strokeDasharray="1 4"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#F27D26" />
                                <stop offset="100%" stopColor="#FB923C" />
                              </linearGradient>
                            </defs>
                          </svg>
                       </div>

                       <div className="mt-8 text-center space-y-2">
                          <h3 className="text-2xl font-display italic font-black text-white tracking-widest uppercase">{selectedAvatar.name}</h3>
                          <div className="flex items-center justify-center gap-3">
                             <div className="flex items-end gap-1 h-4">
                                {[...Array(5)].map((_, i) => (
                                  <motion.div 
                                    key={i}
                                    animate={{ height: isPlayingRef.current ? [4, 16 * Math.random() * volume, 4] : 4 }}
                                    transition={{ duration: 0.1, repeat: Infinity, delay: i * 0.05 }}
                                    className="w-1 bg-brand-primary rounded-full"
                                  />
                                ))}
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Neural Link Active</span>
                          </div>
                       </div>
                    </div>
                  )}

                  {!isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-12 text-center space-y-6">
                       <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center border border-brand-primary/20">
                          <Phone className="w-8 h-8 text-brand-primary" />
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-2xl font-display italic font-black text-white uppercase">{selectedAvatar.name}</h3>
                          <p className="text-stone-400 text-xs leading-relaxed italic">Ready to bridge the gap of ancestral wisdom.</p>
                       </div>
                       <button 
                        onClick={startCall}
                        className="px-8 py-3 bg-brand-primary text-brand-text rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all"
                       >
                         Initialize Link
                       </button>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Controls Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-8 space-y-6 z-50">
             {isActive && !isMinimized && (
                <div className="flex flex-col items-center gap-8">
                   {/* Local View - Small circle fixed to bottom right of avatar area */}
                   <div className="absolute bottom-32 right-8 w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-stone-800">
                      {isVideoOn ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-white/10" /></div>
                      )}
                      <canvas ref={canvasRef} width={320} height={180} className="hidden" />
                   </div>

                   {/* Main Call HUD */}
                   <div className="w-full flex items-center justify-between bg-black/40 backdrop-blur-3xl p-4 rounded-3xl border border-white/5 shadow-2xl">
                      <div className="flex items-center gap-1">
                         <button 
                          onClick={() => setIsMicOn(!isMicOn)}
                          className={`p-3 rounded-xl transition-all ${isMicOn ? 'text-white hover:bg-white/10' : 'bg-red-500 text-white'}`}
                         >
                           {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                         </button>
                         <button 
                          onClick={() => setIsVideoOn(!isVideoOn)}
                          className={`p-3 rounded-xl transition-all ${isVideoOn ? 'text-white hover:bg-white/10' : 'bg-red-500 text-white'}`}
                         >
                           {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                         </button>
                      </div>

                      <button 
                        onClick={cleanup}
                        className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                      >
                        <PhoneOff className="w-5 h-5 fill-current" />
                      </button>

                      <div className="flex items-center gap-1">
                         <button 
                          onClick={() => setIsMinimized(true)}
                          className="p-3 text-white hover:bg-white/10 rounded-xl transition-all"
                         >
                           <Minimize2 className="w-4 h-4" />
                         </button>
                         <button 
                          onClick={onClose}
                          className="p-3 text-white hover:bg-white/10 rounded-xl transition-all"
                         >
                           <X className="w-4 h-4" />
                         </button>
                      </div>
                   </div>

                   {/* Call Info Pills */}
                   <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-white/5 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[9px] font-mono tabular-nums text-white/60">{formatDuration(callDuration)}</span>
                      </div>
                      <div className="px-3 py-1 bg-white/5 rounded-full flex items-center gap-2">
                        <Signal className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Secure</span>
                      </div>
                   </div>
                </div>
             )}

             {isMinimized && (
               <div className="flex items-center justify-between bg-brand-primary text-brand-text p-4 rounded-3xl shadow-2xl">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
                        <img src={selectedAvatar.image} className="w-full h-full object-cover" alt="" />
                     </div>
                     <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest leading-none">{selectedAvatar.name}</h4>
                        <p className="text-[8px] font-bold opacity-60 mt-1 uppercase tracking-tighter">Link Active • {formatDuration(callDuration)}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-1">
                     <button onClick={() => setIsMinimized(false)} className="p-2 hover:bg-black/5 rounded-lg transition-all"><Maximize2 className="w-4 h-4" /></button>
                     <button onClick={cleanup} className="p-2 hover:bg-black/5 rounded-lg transition-all"><PhoneOff className="w-4 h-4" /></button>
                  </div>
               </div>
             )}
          </div>

          {/* Setup Profile Overlay */}
          <AnimatePresence>
            {showSettings && !isActive && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute inset-0 z-[60] bg-stone-950 flex flex-col p-6 md:p-10"
              >
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20 text-brand-primary">
                         <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                         <h2 className="text-xl font-display italic font-black text-white uppercase leading-none">Neural Guide</h2>
                         <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-500 mt-1">Select Your Ancestral Interface</p>
                      </div>
                   </div>
                   <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {AVATARS.map(avatar => (
                        <button
                          key={avatar.id}
                          onClick={() => setSelectedAvatarId(avatar.id)}
                          className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all ${selectedAvatarId === avatar.id ? 'border-brand-primary' : 'border-transparent opacity-60'}`}
                        >
                          <img src={avatar.image} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                             <span className="text-[9px] font-black uppercase tracking-widest text-white">{avatar.name}</span>
                          </div>
                          {selectedAvatarId === avatar.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center shadow-lg">
                               <Check className="w-3.5 h-3.5 text-brand-text" />
                            </div>
                          )}
                        </button>
                      ))}
                   </div>

                   <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{selectedAvatar.name}</h4>
                      <p className="text-[11px] text-stone-400 italic leading-relaxed">{selectedAvatar.description}</p>
                   </div>
                </div>

                <div className="pt-8 space-y-3">
                  <button 
                    onClick={startCall}
                    className="w-full py-4 bg-brand-primary text-brand-text rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl active:scale-95 transition-all"
                  >
                    Engage Neural Link
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full py-2 text-stone-600 hover:text-stone-400 font-black uppercase tracking-widest text-[8px] transition-all"
                  >
                    Close Session
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
