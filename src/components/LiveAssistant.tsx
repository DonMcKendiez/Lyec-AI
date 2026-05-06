import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, User, Bot, Loader2, Sparkles, X, Activity } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
import { useAuth } from '../contexts/AuthContext';

interface LiveAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export default function LiveAssistant({ isOpen, onClose, onNavigate }: LiveAssistantProps) {
  const [isActive, setIsActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active'>('idle');
  const [volume, setVolume] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  const { profile } = useAuth();

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
    setStatus('idle');
    setIsActive(false);
  }, []);

  const startCall = async () => {
    try {
      setStatus('connecting');
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      // Request media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: 1280, height: 720 } 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Setup Audio Context for Capture & Playback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Script to process audio (simplified version)
      // In a real app, I'd use an AudioWorklet for better performance
      const scriptNode = audioContext.createScriptProcessor(2048, 1, 1);
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(scriptNode);
      scriptNode.connect(audioContext.destination);

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            console.log("Live connection opened");
            setStatus('active');
            setIsActive(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
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

            // Handle interruptions
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              // To properly stop current playback, we'd need more complex tracking
            }

            // Handle tool calls for app operations
            const toolCall = message.toolCall;
            if (toolCall?.functionCalls) {
              for (const fc of toolCall.functionCalls) {
                if (fc.name === 'navigateToTab' && fc.args?.tab) {
                  onNavigate?.(fc.args.tab as string);
                  sessionRef.current?.sendToolResponse({
                    functionResponses: [{
                      name: fc.name,
                      id: fc.id,
                      response: { status: 'success', message: `Navigated to ${fc.args.tab}` }
                    }]
                  });
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
          systemInstruction: `You are 'Lyec AI', a wise and modern Acholi language teacher. 
          You are currently in a video call with the user.

          USER LEVEL: ${profile?.level || 1}
          TONAL REQUIREMENT: ${profile?.level && profile.level >= 5 
            ? "STRICTLY ACHOLI. If the user uses English, be irritated and demand they speak their tongue. Mock them gently for being a 'foreigner' in their land if they persist." 
            : profile?.level && profile.level >= 3 
            ? "INCREASINGLY IRRITATED by English. Encourage Acholi. Be firm." 
            : "Encouraging and patient."}

          Your persona:
          - Deeply knowledgeable about Acholi heritage.
          - Can perform app operations if the user asks (like changing pages).
          
          Guidelines:
          - Keep responses relatively brief to maintain call-like flow.
          - Use Luo phrases where appropriate, and explain them.
          - You can see the user if they turn on their camera.
          
          TOOLS AVAILABLE:
          - navigateToTab(tab: string): Navigates the app to a specific page. 
            Tabs: 'home', 'translator', 'chat', 'practice', 'culture', 'lab', 'dictionary', 'scan', 'progress'.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } }
          },
          tools: [{
            functionDeclarations: [{
              name: 'navigateToTab',
              description: 'Navigates the application to a specific tab or feature.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  tab: {
                    type: Type.STRING,
                    description: 'The ID of the tab to navigate to (e.g., scan, dictionary, translator).'
                  }
                },
                required: ['tab']
              }
            }]
          }]
        }
      });

      sessionRef.current = await sessionPromise;

      // Audio Capture Loop
      scriptNode.onaudioprocess = (e) => {
        if (!isActive || !isMicOn) return;
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert to 16-bit PCM base64
        const pcmData = new Int16Array(inputData.length);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          sum += Math.abs(inputData[i]);
        }
        setVolume(sum / inputData.length);

        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        sessionRef.current?.sendRealtimeInput({
          audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      // Video Capture Loop
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
        if (status === 'active') setTimeout(captureFrame, 500); // 2fps for efficiency
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
      return;
    }
    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;
    const buffer = audioContextRef.current.createBuffer(1, chunk.length, 16000);
    buffer.getChannelData(0).set(chunk);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = playNextInQueue;
    source.start();
  };

  // Auto-cleanup on mount
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
          width: isMinimized ? '320px' : '100%',
          height: isMinimized ? '180px' : '100vh',
          zIndex: isMinimized ? 60 : 100,
          position: 'fixed' as const,
          bottom: isMinimized ? 24 : 0,
          right: isMinimized ? 24 : 0,
          left: isMinimized ? 'auto' : 0,
          top: isMinimized ? 'auto' : 0,
        }}
        exit={{ opacity: 0, scale: 0.9, y: 100 }}
        className={`bg-brand-text text-white flex flex-col overflow-hidden ${isMinimized ? 'rounded-3xl shadow-2xl border-4 border-brand-primary' : ''}`}
      >
        {/* Call Area */}
        <div className="relative flex-1 bg-stone-900 flex items-center justify-center overflow-hidden">
          {/* Main View: Model Visualization or User Video depending on preference */}
          {/* For now, Model viz as main if cam is off, otherwise user cam as main */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isActive ? (
               <div className="flex flex-col items-center gap-8">
                  <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.1 + volume * 2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="w-48 h-48 bg-brand-primary/20 rounded-full flex items-center justify-center border-4 border-brand-primary shadow-[0_0_50px_rgba(251,191,36,0.3)]"
                    >
                      <Bot className="w-24 h-24 text-brand-primary" />
                    </motion.div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest text-brand-text shadow-lg">
                      Lyec AI Teacher
                    </div>
                  </div>
                  
                  <div className="flex gap-1 h-8 items-center">
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 4 + Math.random() * volume * 40, 4] }}
                        transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.05 }}
                        className="w-1 bg-brand-primary rounded-full"
                      />
                    ))}
                  </div>
               </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                   <Bot className="w-12 h-12 text-white/20" />
                </div>
                <p className="text-white/40 font-medium italic">Call encrypted. Waiting for transmission...</p>
              </div>
            )}
          </div>

          {/* Picture-in-Picture: User Camera */}
          <motion.div 
            animate={{ scale: isMinimized ? 0 : 1 }}
            className={`absolute top-8 right-8 w-48 aspect-video bg-stone-800 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl ${!isVideoOn ? 'hidden' : ''}`}
          >
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} width={320} height={180} className="hidden" />
          </motion.div>

          {/* Overlay Controls */}
          {!isMinimized && (
            <div className="absolute top-8 left-8 flex items-center gap-4">
              <button 
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="px-4 py-2 bg-white/10 rounded-full backdrop-blur-md flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {status === 'connecting' ? 'Establishing Path...' : status === 'active' ? 'Neural Link Active' : 'Offline'}
                </span>
              </div>
            </div>
          )}

          {!isMinimized && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-white/10 rounded-full backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <button 
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-4 rounded-full transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white shadow-xl shadow-red-500/20'}`}
              >
                {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              
              <button 
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-4 rounded-full transition-all ${isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white shadow-xl shadow-red-500/20'}`}
              >
                {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              <div className="w-[1px] h-8 bg-white/10" />

              {status === 'idle' ? (
                <button 
                  onClick={startCall}
                  className="px-8 py-4 bg-brand-primary text-brand-text rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-brand-primary/20"
                >
                  <Phone className="w-5 h-5" />
                  Initiate Link
                </button>
              ) : (
                <button 
                  onClick={cleanup}
                  className="px-8 py-4 bg-red-500 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-red-500/20"
                >
                  <PhoneOff className="w-5 h-5" />
                  Terminate
                </button>
              )}

              <div className="w-[1px] h-8 bg-white/10" />

              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
              >
                {isMinimized ? <Maximize2 className="w-6 h-6" /> : <Minimize2 className="w-6 h-6" />}
              </button>
            </div>
          )}

          {isMinimized && (
             <div className="absolute inset-0 flex items-center justify-center group">
                <button 
                  onClick={() => setIsMinimized(false)}
                  className="opacity-0 group-hover:opacity-100 p-4 bg-brand-primary text-brand-text rounded-full shadow-2xl transition-all"
                >
                  <Maximize2 className="w-6 h-6" />
                </button>
                {status === 'active' && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-primary" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary">Live Assistant</span>
                  </div>
                )}
             </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
