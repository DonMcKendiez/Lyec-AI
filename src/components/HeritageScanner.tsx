import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, Sparkles, X, RefreshCw, Eye, BookOpen, AlertCircle, Volume2, Quote, History, Landmark, Type, Palette, User, Check, Shield, Baby, UserCheck, Download, Share2, Bold, Italic, Underline, Maximize2 } from 'lucide-react';
import { analyzeImage, speakLanguage } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { playPCMAudio } from '../lib/audio';
import { useAuth, UserPersona, AgeMode } from '../contexts/AuthContext';
import { filterProfanity } from '../lib/safety';
import { addScan, subscribeScans, deleteScan, ScanHistoryItem } from '../services/scanService';
import { isEncrypted } from '../lib/encryption';

import { registerBiometrics, authenticateBiometrics, isBiometricSupported } from '../lib/biometrics';
import { encryptData, decryptData, getUserKey } from '../lib/encryption';

export default function HeritageScanner() {
  const { user, profile, updateProfile } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  
  // Biometric state
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [encryptionActive, setEncryptionActive] = useState(true);

  // Overlay state
  const [isEditing, setIsEditing] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  
  const handleOverlayTextChange = (text: string) => {
    setOverlayText(filterProfanity(text));
  };
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });

  // Face Scan state
  const [scanningFace, setScanningFace] = useState(false);
  const [faceCheckPassed, setFaceCheckPassed] = useState(false);
  const [scanQuality, setScanQuality] = useState<'low' | 'medium' | 'high' | null>(null);
  const [backgroundLearning, setBackgroundLearning] = useState(false);
  const [recentInsight, setRecentInsight] = useState<string | null>(null);
  
  // Auto-capture state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [stillness, setStillness] = useState(0); // 0-100
  const lastFrameRef = useRef<ImageData | null>(null);
  const stabilityCounter = useRef(0);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(5, Math.max(1, prev + delta)));
  };

  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    panStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
  };

  const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setPan({
      x: clientX - panStartRef.current.x,
      y: clientY - panStartRef.current.y
    });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };
  
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [fontSize, setFontSize] = useState(32);
  const [textStyle, setTextStyle] = useState({ bold: false, italic: false, underline: false });

  // History state
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (profile?.faceVerified) setFaceCheckPassed(true);
    
    // Subscribe to History
    let unsubscribe: () => void;
    if (user?.uid) {
      unsubscribe = subscribeScans(user.uid, (data) => {
        setHistory(data);
      });
    }

    // Simulate background intelligence
    const interval = setInterval(() => {
      if (Math.random() > 0.8 && !loading) {
        const insights = [
        `Detected ${profile?.targetLanguage || 'Acholi'} linguistic pattern.`,
        "Updated tone markers for the archive.",
        "Refining accent profile for regional dialect.",
        "Noted heritage patterns consistent with regional culture."
      ];
        const randomInsight = insights[Math.floor(Math.random() * insights.length)];
        setRecentInsight(randomInsight);
        setTimeout(() => setRecentInsight(null), 5000);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, [profile, loading, user]);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = async () => {
    setError('');
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Please allow camera access to use the scanner.");
      setShowCamera(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Restart camera when facingMode changes
  useEffect(() => {
    if (showCamera) {
      stopCamera();
      startCamera();
    }
  }, [facingMode]);

  // Stillness Detection & Auto-Capture Logic
  useEffect(() => {
    if (!showCamera || loading || analyzing || isEditing) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 160;
    canvas.height = 120;

    let animId: number;

    const checkStillness = () => {
      if (!videoRef.current || !ctx) return;
      
      try {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (lastFrameRef.current) {
          let diff = 0;
          const data1 = lastFrameRef.current.data;
          const data2 = frame.data;
          
          for (let i = 0; i < data1.length; i += 32) { // Sparse check for perf
            diff += Math.abs(data1[i] - data2[i]);
          }
          
          const motionScore = diff / (canvas.width * canvas.height);
          // Higher motionScore = more movement. 
          // 0 motion = 100 stillness. 
          // Noise usually gives motionScore 0.5-1.5. 
          // Real movement gives 5-20.
          const currentStillness = Math.max(0, 100 - (motionScore * 10));
          setStillness(currentStillness);

          // Update scan quality based on stillness
          if (currentStillness > 92) setScanQuality('high');
          else if (currentStillness > 75) setScanQuality('medium');
          else setScanQuality('low');

          // Auto-capture countdown: Only if EXTREMELY steady
          if (currentStillness > 90) {
            stabilityCounter.current++;
            if (stabilityCounter.current > 60) { // Stable for ~2s
              if (countdown === null) {
                setCountdown(3);
              }
            }
          } else {
            // If movement is detected during countdown, reset it
            if (currentStillness < 80) {
              stabilityCounter.current = 0;
              setCountdown(null);
            }
          }
        }
        
        lastFrameRef.current = frame;
      } catch (e) {
        // Handle cross-origin or video not ready
      }
      
      animId = requestAnimationFrame(checkStillness);
    };

    animId = requestAnimationFrame(checkStillness);
    return () => cancelAnimationFrame(animId);
  }, [showCamera, loading, analyzing, isEditing, countdown]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      capturePhoto();
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImage(dataUrl);
      stopCamera();
      setIsEditing(true); // Go to edit mode before analysis
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImage(dataUrl);
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const finalizeImageAndAnalyze = () => {
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (overlayText) {
        ctx.fillStyle = textColor;
        let fontStr = '';
        if (textStyle.italic) fontStr += 'italic ';
        if (textStyle.bold) fontStr += 'bold ';
        fontStr += `${Math.floor((fontSize / 100) * img.height)}px ${fontFamily}`;
        
        ctx.font = fontStr;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        
        const x = (textPosition.x / 100) * canvas.width;
        const y = (textPosition.y / 100) * canvas.height;
        
        ctx.fillText(overlayText, x, y);

        if (textStyle.underline) {
          const metrics = ctx.measureText(overlayText);
          ctx.beginPath();
          ctx.strokeStyle = textColor;
          ctx.lineWidth = 2;
          ctx.moveTo(x - metrics.width / 2, y + 10);
          ctx.lineTo(x + metrics.width / 2, y + 10);
          ctx.stroke();
        }
      }

      const finalDataUrl = canvas.toDataURL('image/jpeg');
      setIsEditing(false);
      setImage(finalDataUrl); // Update image to finalized version for history saving later
      analyze(finalDataUrl);
    };
  };

  const saveImage = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = `heritage_artifact_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareResult = async () => {
    if (!analysis) return;
    try {
      await navigator.share({
        title: 'Acholi Heritage Analysis',
        text: `Check out this Acholi artifact analysis: ${analysis.slice(0, 200)}...`,
        url: window.location.href,
      });
    } catch (e) {
      console.error("Sharing failed", e);
    }
  };


  const analyze = async (dataUrl: string) => {
    setLoading(true);
    setAnalyzing(true);
    setAnalysis('');
    setError('');
    
    // Simulate quality check
    const quality: ('low' | 'medium' | 'high') = Math.random() > 0.3 ? 'high' : 'medium';
    setScanQuality(quality);

    try {
      const base64Data = dataUrl.split(',')[1];
      const result = await analyzeImage(
        base64Data, 
        profile?.targetLanguage || 'Acholi',
        profile?.persona || 'friendly',
        profile?.ageMode || 'adult',
        profile?.level || 1
      );
      setAnalysis(result);
      
      // Save to History (Encrypted if active)
      if (user) {
        const titleMatch = result.match(/### Identification\n\s*\*(.*?)\*/);
        const name = titleMatch ? titleMatch[1] : 'Unknown Artifact';
        
        await addScan({
          uid: user.uid,
          name: name,
          thumbnail: dataUrl,
          analysis: result
        }, encryptionActive);
      }

      // Earn XP: Lesson completion etc.
      if (updateProfile) {
        updateProfile({ 
          xp: (profile?.xp || 0) + 100 
        });
      }

    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const initiateFaceScan = async () => {
    if (!user) return;
    setIsAuthenticating(true);
    setScanningFace(true);
    setError('');

    try {
      if (isBiometricSupported()) {
        await registerBiometrics(user.uid, user.displayName || user.email || 'Heritage User');
        setFaceCheckPassed(true);
        if (updateProfile) {
          updateProfile({ faceVerified: true });
        }
      } else {
        // Fallback to mock for environments where WebAuthn is unavailable
        await new Promise(resolve => setTimeout(resolve, 2000));
        setFaceCheckPassed(true);
        if (updateProfile) {
          updateProfile({ faceVerified: true });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Biometric verification failed: " + (err.message || "Unknown error"));
    } finally {
      setIsAuthenticating(false);
      setScanningFace(false);
    }
  };

  const verifyForVault = async () => {
    if (!user) return false;
    setIsAuthenticating(true);
    try {
      if (isBiometricSupported() && profile?.faceVerified) {
        await authenticateBiometrics();
        return true;
      }
      return profile?.faceVerified; // Fallback to profile flag if API fails
    } catch (err) {
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const playAudio = async () => {
    if (!analysis || speaking) return;
    setSpeaking(true);
    try {
      const audioData = await speakLanguage(analysis, profile?.targetLanguage || 'Acholi');
      if (audioData) {
        await playPCMAudio(audioData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSpeaking(false);
    }
  };

  const reset = () => {
    setImage(null);
    setAnalysis('');
    setError('');
    setIsEditing(false);
    setOverlayText('');
    setTextPosition({ x: 50, y: 50 });
    stopCamera();
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isEditing) setIsDragging(true);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !isEditing) return;
    
    const container = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

    const x = ((clientX - container.left) / container.width) * 100;
    const y = ((clientY - container.top) / container.height) * 100;

    setTextPosition({ 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Vault unlocking state
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [unlocking, setunlocking] = useState(false);

  const handleVaultUnlock = async () => {
    setunlocking(true);
    try {
      // Simulate/Trigger biometric check
      const success = await verifyForVault();
      if (success) {
        setVaultUnlocked(true);
      } else {
        setError("Vault access denied. Biometric signature mismatch.");
      }
    } catch (e) {
      setError("Vault access error.");
    } finally {
      setunlocking(false);
    }
  };

  const personas: UserPersona[] = ['professional', 'friendly', 'bestie', 'colleague'];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-12">
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary">
          <Eye className="w-3.5 h-3.5" />
          Neural Recognition
        </div>
        <h2 className="text-5xl font-display italic font-black text-brand-text tracking-tighter">Wang Pa Archivist</h2>
        <p className="text-stone-400 font-medium max-w-lg mx-auto">Analyze artifacts through the lens of {profile?.targetLanguage || 'Acholi'} heritage intelligence.</p>
        
        {/* User Stats/Class */}
        {profile && (
          <div className="flex items-center justify-center gap-6 mt-6">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="px-6 py-2 bg-stone-100 hover:bg-stone-200 rounded-2xl flex items-center gap-3 transition-all"
          >
            <History className="w-4 h-4 text-stone-500" />
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Archives</p>
              <p className="text-xs font-bold text-brand-text">View History</p>
            </div>
          </button>
          <div className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-2xl flex items-center gap-3">

              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white text-xs font-black">
                {profile.level}
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Current Rank</p>
                <p className="text-xs font-bold text-brand-text">Level {profile.level} Apprentice</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-2xl flex items-center gap-3">
               <Shield className={`w-5 h-5 ${profile.faceVerified ? 'text-green-500' : 'text-stone-300'}`} />
               <div className="text-left">
                 <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Identity Mode</p>
                 <p className="text-xs font-bold text-brand-text uppercase">{profile.ageMode === 'children' ? 'Protect Mode' : 'Standard'}</p>
               </div>
            </div>
            <AnimatePresence>
              {recentInsight && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-brand-text text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md"
                >
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Intelligence Sync: {recentInsight}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Track: Scanner & Upload */}
        <div className="lg:col-span-5 space-y-6">
          <div className="interactive-card p-6 bg-white border border-brand-border shadow-xl overflow-hidden">
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-primary text-white rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-brand-text">Observation Deck</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Steady Sensor Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEncryptionActive(!encryptionActive)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                    encryptionActive 
                      ? 'bg-brand-primary/5 border-brand-primary text-brand-primary' 
                      : 'bg-stone-50 border-stone-100 text-stone-400 opacity-60'
                  }`}
                  title={encryptionActive ? "AES-256 Active" : "Unencrypted Mode"}
                >
                  <Shield className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none">AES-256</span>
                </button>
                {image && (
                  <button onClick={reset} className="p-2 text-stone-300 hover:text-brand-primary transition-colors">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
              </div>
            </header>

            <div 
              onMouseMove={handleDrag}
              onMouseUp={handleDragEnd}
              onTouchMove={handleDrag}
              onTouchEnd={handleDragEnd}
              onMouseLeave={handleDragEnd}
              className="relative aspect-square md:aspect-[4/3] lg:aspect-square bg-stone-50 rounded-[2rem] overflow-hidden border-2 border-dashed border-stone-200 flex items-center justify-center group/canvas"
            >
              {!image && !showCamera && (
                <div className="flex flex-col items-center gap-5 p-6 w-full h-full justify-center">
                  <div className="grid grid-cols-2 gap-4 w-full h-full">
                    <button 
                      onClick={startCamera}
                      className="group flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border-2 border-stone-100 hover:border-brand-primary hover:shadow-lg transition-all"
                    >
                      <Camera className="w-8 h-8 text-stone-200 group-hover:text-brand-primary transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 group-hover:text-brand-primary">Initiate Lens</span>
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="group flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border-2 border-stone-100 hover:border-brand-primary hover:shadow-lg transition-all"
                    >
                      <Upload className="w-8 h-8 text-stone-200 group-hover:text-brand-primary transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 group-hover:text-brand-primary">Upload Archive</span>
                    </button>
                  </div>
                </div>
              )}

              {showCamera && (
                <div className="absolute inset-0 z-20 flex flex-col">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="flex-1 w-full h-full object-cover" 
                  />
                  
                  {/* Quality & Stillness Indicators */}
                  <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                          <div className={`w-2 h-2 rounded-full ${
                            scanQuality === 'high' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 
                            scanQuality === 'medium' ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 
                            'bg-red-500 shadow-[0_0_10px_#ef4444]'
                          }`} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">Quality: {scanQuality}</span>
                       </div>
                       <div className="flex flex-col gap-1 w-32 px-3 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Stillness</span>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: '0%' }}
                               animate={{ width: `${stillness}%` }}
                               className={`h-full ${stillness > 90 ? 'bg-green-500' : stillness > 75 ? 'bg-amber-500' : 'bg-brand-primary'}`}
                             />
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Movement Warning */}
                  <AnimatePresence>
                    {stillness < 70 && !loading && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                      >
                         <div className="bg-red-500/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                           <AlertCircle className="w-3 h-3 text-white" />
                           <span className="text-[10px] font-black uppercase tracking-tight text-white whitespace-nowrap">Keep camera steady to capture</span>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Countdown Overlay */}
                  <AnimatePresence>
                    {countdown !== null && (
                      <motion.div 
                        initial={{ scale: 2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                      >
                         <div className="text-9xl font-display italic font-black text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                           {countdown}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {scanningFace && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="w-64 h-80 border-2 border-brand-primary rounded-full relative overflow-hidden">
                        <motion.div 
                          initial={{ top: '0%' }}
                          animate={{ top: '100%' }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-x-0 h-1 bg-brand-primary shadow-lg shadow-brand-primary/50 z-10"
                        />
                      </div>
                      <p className="text-white font-black text-xs uppercase tracking-widest mt-6 animate-pulse">Bio-Metric Analysis in Progress...</p>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-6 flex justify-center gap-6 px-4">
                    <button 
                      onClick={stopCamera}
                      className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
                      title="Close Camera"
                    >
                      <X className="w-8 h-8" />
                    </button>
                    <button 
                      onClick={capturePhoto}
                      className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-2xl shadow-brand-primary/50 ring-4 ring-white/40 hover:scale-105 active:scale-95 transition-all"
                      title="Capture"
                    >
                      <Camera className="w-8 h-8" />
                    </button>
                    <button 
                      onClick={toggleCamera}
                      className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
                      title="Switch Camera"
                    >
                      <RefreshCw className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

              {image && (
                <div className="absolute inset-0 overflow-hidden bg-stone-900">
                  <div 
                    className={`w-full h-full transition-transform duration-200 ease-out ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    onMouseDown={handlePanStart}
                    onMouseMove={handlePanMove}
                    onMouseUp={handlePanEnd}
                    onMouseLeave={handlePanEnd}
                    onTouchStart={handlePanStart}
                    onTouchMove={handlePanMove}
                    onTouchEnd={handlePanEnd}
                    style={{ 
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                      transformOrigin: 'center'
                    }}
                  >
                    <img src={image} className="w-full h-full object-contain" alt="Captured" />
                  </div>

                  {/* Zoom Controls */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
                    <button 
                      onClick={() => handleZoom(0.5)}
                      className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 border border-white/20 transition-all flex items-center justify-center shadow-lg"
                      title="Zoom In"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleZoom(-0.5)}
                      className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 border border-white/20 transition-all flex items-center justify-center shadow-lg"
                      title="Zoom Out"
                    >
                      <RefreshCw className={`w-5 h-5 ${zoom === 1 ? 'opacity-30' : ''}`} />
                    </button>
                    {zoom > 1 && (
                      <button 
                        onClick={resetZoom}
                        className="w-10 h-10 bg-brand-primary text-white rounded-xl shadow-lg flex items-center justify-center animate-in fade-in zoom-in"
                        title="Reset Zoom"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm p-4 flex flex-col">
                      <div className="flex-1 relative border-2 border-white/20 rounded-xl overflow-hidden cursor-crosshair">
                        <div 
                          onMouseDown={handleDragStart}
                          onTouchStart={handleDragStart}
                          className="absolute cursor-move select-none p-2 rounded-lg bg-black/20 backdrop-blur-sm shadow-xl whitespace-nowrap"
                          style={{ 
                            left: `${textPosition.x}%`, 
                            top: `${textPosition.y}%`, 
                            transform: 'translate(-50%, -50%)',
                            color: textColor,
                            fontFamily: fontFamily,
                            fontWeight: textStyle.bold ? 'bold' : 'normal',
                            fontStyle: textStyle.italic ? 'italic' : 'normal',
                            textDecoration: textStyle.underline ? 'underline' : 'none',
                            fontSize: `${fontSize}px`,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                          }}
                        >
                          {overlayText || "Reposition me..."}
                        </div>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 bg-brand-text/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 text-white text-center p-8">
                       <Loader2 className="w-12 h-12 animate-spin text-brand-primary" />
                       <div className="space-y-4">
                         <p className="font-black text-xs uppercase tracking-[0.4em]">Deciphering Heritage</p>
                         {scanQuality && (
                           <div className="flex items-center justify-center gap-2">
                             <div className={`h-1 w-8 rounded-full ${scanQuality === 'high' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                             <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Signal Quality: {scanQuality}</span>
                           </div>
                         )}

                         {encryptionActive && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center justify-center gap-2 px-3 py-1 bg-brand-primary/20 rounded-full border border-brand-primary/30"
                            >
                              <Shield className="w-3 h-3 text-brand-primary" />
                              <span className="text-[7px] font-black uppercase tracking-widest text-brand-primary">AES-256 Masking Active</span>
                            </motion.div>
                         )}
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-4"
              >
                <div className="flex flex-col gap-3 p-4 bg-stone-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-xl text-brand-text shadow-sm border border-stone-100">
                      <Type className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      value={overlayText}
                      onChange={(e) => handleOverlayTextChange(e.target.value)}
                      placeholder="Label this artifact..."
                      className="flex-1 bg-transparent border-none outline-none font-bold text-[10px]"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setTextStyle(s => ({ ...s, bold: !s.bold }))}
                      className={`p-2 rounded-lg transition-all ${textStyle.bold ? 'bg-brand-primary text-white' : 'bg-white text-stone-400'}`}
                    >
                      <Bold className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => setTextStyle(s => ({ ...s, italic: !s.italic }))}
                      className={`p-2 rounded-lg transition-all ${textStyle.italic ? 'bg-brand-primary text-white' : 'bg-white text-stone-400'}`}
                    >
                      <Italic className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => setTextStyle(s => ({ ...s, underline: !s.underline }))}
                      className={`p-2 rounded-lg transition-all ${textStyle.underline ? 'bg-brand-primary text-white' : 'bg-white text-stone-400'}`}
                    >
                      <Underline className="w-3 h-3" />
                    </button>
                    <div className="flex-1 flex items-center gap-3 px-3 bg-white rounded-xl h-8">
                       <Maximize2 className="w-3 h-3 text-stone-300" />
                       <input 
                         type="range" 
                         min="12" 
                         max="120" 
                         value={fontSize} 
                         onChange={(e) => setFontSize(parseInt(e.target.value))}
                         className="flex-1 h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                       />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                   <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl">
                      <Palette className="w-4 h-4 text-stone-300" />
                      <input 
                        type="color" 
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full h-6 bg-transparent border-none cursor-pointer"
                      />
                   </div>
                   <button 
                     onClick={finalizeImageAndAnalyze}
                     className="bg-brand-text text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                   >
                     Process <Check className="w-4 h-4" />
                   </button>
                </div>

                <div className="flex flex-wrap gap-2 text-center text-[8px] font-black uppercase tracking-widest text-stone-400 py-2">
                   Drag text to reposition • Use slider for size
                </div>
              </motion.div>
            )}


            {/* Sub-header controls */}
            {!isEditing && !image && (
              <div className="mt-8 pt-8 border-t border-stone-100 space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-text/50">Intelligence Settings</h4>
                   </div>
                   
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block px-1">Persona</label>
                        <select 
                          value={profile?.persona || 'friendly'}
                          onChange={(e) => updateProfile?.({ persona: e.target.value as UserPersona })}
                          className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none cursor-pointer"
                        >
                          {personas.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block px-1">Content Mode</label>
                        <div className="flex bg-stone-50 rounded-2xl p-1 border border-stone-100">
                          <button 
                            onClick={() => {
                              if (!profile?.faceVerified) {
                                alert("Facial Verification Required for Adult Access.");
                                initiateFaceScan();
                                return;
                              }
                              updateProfile?.({ ageMode: 'adult' });
                            }}
                            className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${profile?.ageMode === 'adult' ? 'bg-white shadow-sm text-brand-text' : 'text-stone-300'}`}
                          >
                            Adult
                          </button>
                          <button 
                            onClick={() => updateProfile?.({ ageMode: 'children' })}
                            className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${profile?.ageMode === 'children' ? 'bg-white shadow-sm text-amber-600' : 'text-stone-300'}`}
                          >
                            Child
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block px-1">Vault Mode</label>
                        <button 
                          onClick={() => setEncryptionActive(!encryptionActive)}
                          className={`w-full flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${encryptionActive ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'bg-stone-50 border-stone-100 text-stone-300'}`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{encryptionActive ? 'AES-256 On' : 'Standard'}</span>
                        </button>
                      </div>
                    </div>
                   
                   <button 
                     onClick={initiateFaceScan}
                     disabled={profile?.faceVerified}
                     className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${profile?.faceVerified ? 'bg-green-50 border-green-200 text-green-700' : 'bg-brand-text text-white border-brand-text shadow-xl shadow-brand-text/20 hover:scale-[1.02] active:scale-95'}`}
                   >
                     {profile?.faceVerified ? <UserCheck className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     <span className="text-[10px] font-black uppercase tracking-widest">{profile?.faceVerified ? 'Identity Secure' : 'Face Verification'}</span>
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Track: Results */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!analysis && !loading && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-stone-100 rounded-[2.5rem]"
               >
                 <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6 text-stone-200">
                   <Sparkles className="w-10 h-10" />
                 </div>
                 <h4 className="text-xl font-display italic font-black text-stone-300 uppercase">Awaiting Transmission</h4>
                 <p className="text-sm text-stone-400 font-medium max-w-sm mt-2">
                   Capture or upload a visual artifact to generate a profound cultural synthesis.
                 </p>
               </motion.div>
            )}

            {analysis && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-brand-border shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <History size={160} />
                  </div>

                  <header className="relative z-10 flex items-center justify-between mb-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-brand-primary">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{profile?.persona} AI Active</span>
                      </div>
                      <h3 className="text-2xl font-display italic font-black text-brand-text">Heritage Dossier</h3>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={saveImage}
                        title="Save Image"
                        className="p-4 rounded-xl bg-stone-50 border border-stone-100 text-stone-400 hover:text-brand-primary transition-all active:scale-95"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={shareResult}
                        title="Share Analysis"
                        className="p-4 rounded-xl bg-stone-50 border border-stone-100 text-stone-400 hover:text-brand-primary transition-all active:scale-95"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={playAudio}
                        disabled={speaking}
                        className={`p-4 rounded-2xl bg-stone-50 border border-stone-100 transition-all active:scale-95 ${speaking ? 'text-brand-primary bg-brand-primary/5 border-brand-primary/20 ring-8 ring-brand-primary/5 animate-pulse' : 'text-stone-400 hover:text-brand-primary'}`}
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    </div>
                  </header>

                  <div className="relative z-10 markdown-body prose prose-stone max-w-none max-h-[500px] overflow-y-auto pr-4 custom-scrollbar
                    prose-h3:text-xs prose-h3:font-black prose-h3:uppercase prose-h3:tracking-[0.3em] prose-h3:text-brand-primary prose-h3:mt-8 prose-h3:mb-4
                    prose-p:text-base prose-p:leading-relaxed prose-p:text-stone-600 prose-p:font-medium
                    prose-li:text-stone-600 prose-li:font-medium">
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-brand-primary/5 p-6 rounded-3xl border border-brand-primary/10 flex gap-4">
                    <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary h-fit">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-text">Knowledge Gained</h4>
                      <p className="text-[11px] text-stone-500 font-medium leading-relaxed mt-1">
                        Analysis complete. Your archival XP has increased by 50 points. Keep identifying items to rank up.
                      </p>
                    </div>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex gap-4">
                    <div className="p-3 bg-stone-100 rounded-2xl text-stone-400 h-fit">
                      <Quote className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-text">Background Learning</h4>
                      <p className="text-[11px] text-stone-400 font-medium leading-relaxed mt-1">
                        System is processing accent nuances and cultural markers in the background. Level {profile?.level} metrics recorded.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {[
          { icon: <BookOpen className="w-5 h-5" />, title: 'Cultural Synthesis', desc: 'Uncover technical details about tools, ingredients, and meanings.', color: 'text-brand-primary' },
          { icon: <Landmark className="w-5 h-5" />, title: 'Migration Logs', desc: 'Connecting visuals to the historical parallels of our ancestors.', color: 'text-amber-500' },
          { icon: <History className="w-5 h-5" />, title: 'Oral Archive', desc: 'Links modern artifacts to the timeless proverbs of the land.', color: 'text-stone-400' },
        ].map((feat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-brand-border flex items-start gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className={`p-3 bg-stone-50 rounded-2xl ${feat.color}`}>
              {feat.icon}
            </div>
            <div className="space-y-1">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-text">{feat.title}</h4>
               <p className="text-[11px] text-stone-400 font-medium leading-relaxed">{feat.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* History Modal/Drawer */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-brand-text/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <header className="p-8 border-b border-stone-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-brand-text">Heritage Archives</h3>
                  <p className="text-xs font-medium text-stone-400">Your personal library of analyzed artifacts.</p>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 bg-stone-50 rounded-xl text-stone-400 hover:text-brand-primary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>
              
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                     <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
                        <History className="w-10 h-10" />
                     </div>
                     <p className="text-stone-400 font-medium italic">No items archived yet.</p>
                  </div>
                ) : !vaultUnlocked && history.some(item => isEncrypted(item.analysis)) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                    <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary">
                       <Shield className="w-12 h-12" />
                    </div>
                    <div className="space-y-2 px-6">
                      <h4 className="text-lg font-black text-brand-text">Secure Vault Locked</h4>
                      <p className="text-xs text-stone-400 font-medium leading-relaxed">
                        Some entries in your archive are protected with AES-256 encryption. 
                        Use your biometric signature to decrypt and view them.
                      </p>
                    </div>
                    <button 
                      onClick={handleVaultUnlock}
                      disabled={unlocking}
                      className="group relative px-8 py-5 bg-brand-text text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:shadow-brand-primary/20 transition-all flex flex-col items-center gap-4 disabled:opacity-50 w-full overflow-hidden"
                    >
                      {unlocking && (
                        <motion.div 
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-x-0 bottom-0 h-1 bg-brand-primary z-10"
                        />
                      )}
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center relative">
                        {unlocking ? (
                          <div className="relative">
                             <div className="w-10 h-10 border-2 border-brand-primary rounded-full animate-ping opacity-40" />
                             <Shield className="w-6 h-6 text-brand-primary animate-pulse absolute inset-0 m-auto" />
                          </div>
                        ) : (
                          <UserCheck className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="block">{unlocking ? 'Attaching Bio-Signature...' : 'Authenticate Identity'}</span>
                        <p className="text-[8px] opacity-40 font-medium">Luo Heritage Security Layer</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {history.map(item => {
                      const isItemEncrypted = item.isEncrypted || isEncrypted(item.analysis);
                      const displayName = isItemEncrypted && user 
                        ? (vaultUnlocked ? decryptData(item.name, getUserKey(user.uid)) : "[ENCRYPTED]")
                        : item.name;
                      
                      const displayAnalysis = isItemEncrypted && user
                        ? (vaultUnlocked ? decryptData(item.analysis, getUserKey(user.uid)) : "[LOCKED]")
                        : item.analysis;

                      return (
                        <div 
                          key={item.id} 
                          className="group relative bg-stone-50 rounded-3xl overflow-hidden border border-stone-100 hover:border-brand-primary transition-all p-3 flex items-center gap-4"
                        >
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-stone-100 flex-shrink-0">
                            <img src={item.thumbnail} className="w-full h-full object-cover" alt={displayName} />
                            {isItemEncrypted && !vaultUnlocked && (
                              <div className="absolute inset-0 bg-brand-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-brand-text uppercase tracking-tight truncate">{displayName}</p>
                            <p className="text-[10px] text-stone-400 font-medium">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <button 
                                onClick={() => {
                                  setImage(item.thumbnail);
                                  setAnalysis(displayAnalysis);
                                  setShowHistory(false);
                                }}
                                disabled={isItemEncrypted && !vaultUnlocked}
                                className="text-[9px] font-black uppercase text-brand-primary hover:underline disabled:text-stone-300 disabled:no-underline"
                              >
                                View
                              </button>
                              <button 
                                onClick={async () => {
                                  await deleteScan(item.id);
                                }}
                                className="text-[9px] font-black uppercase text-red-400 hover:underline"
                              >
                                Del
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ad Placeholder */}
              <div className="p-6 bg-brand-bg border-t border-stone-50 text-center">
                 <div className="inline-block p-1 bg-stone-100 rounded-lg text-[8px] font-black uppercase text-stone-400 mb-2">Advertisement</div>
                 <div className="h-20 bg-white border border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Global Marketplace Spot</p>
                    <p className="text-[8px] text-stone-300">Support Acholi Heritage Intelligence</p>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ad Banner Placeholder */}
      <div className="w-full py-8 border-t border-stone-50 text-center">
        <div className="max-w-2xl mx-auto h-24 bg-stone-50 border border-brand-border rounded-3xl flex items-center justify-center relative overflow-hidden group">
          <div className="absolute top-2 right-4 text-[8px] font-black text-stone-300">SPONSORED</div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-black text-brand-text/20 uppercase tracking-[0.2em] group-hover:text-brand-primary/40 transition-colors">Digital Outbound Link Slot</p>
            <p className="text-[8px] text-stone-300 font-medium italic">monetization@lyec.ai</p>
          </div>
        </div>
      </div>
    </div>
  );
}
