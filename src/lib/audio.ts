
/**
 * Utility to play raw PCM audio returned by Gemini TTS (Sample Rate 24000)
 */
export async function playPCMAudio(base64Data: string, sampleRate = 24000) {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Gemini TTS returns 16-bit PCM
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = audioContext.createBuffer(1, bytes.length / 2, sampleRate);
  const nowBuffering = audioBuffer.getChannelData(0);
  
  const dataView = new DataView(bytes.buffer);
  for (let i = 0; i < bytes.length / 2; i++) {
    // Read 16-bit signed integer and normalize to [-1, 1]
    const pcmSample = dataView.getInt16(i * 2, true);
    nowBuffering[i] = pcmSample / 32768;
  }

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  
  return new Promise((resolve) => {
    source.onended = resolve;
  });
}

export async function recordAudio(): Promise<{ data: string; mimeType: string }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({ data: base64, mimeType: mediaRecorder.mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
      
      // Stop all tracks to release microphone
      stream.getTracks().forEach(track => track.stop());
    };
    
    // Record for 5 seconds or until manually stopped by a different mechanism
    // For this simple implementation, we'll just record then stop after 5s or let the caller decide.
    // Actually, it's better if the UI calls stop.
    (mediaRecorder as any)._chunks = chunks; // Export for external stop
    mediaRecorder.start();
    
    // Provide a way to stop it
    (window as any)._currentRecorder = mediaRecorder;
  });
}
