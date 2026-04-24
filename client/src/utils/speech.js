/**
 * Unified speech utility using Cloud TTS (Youdao) for better compatibility 
 * on mobile devices (like Huawei/Android) where native SpeechSynthesis 
 * might be blocked or missing.
 */

export const speak = (text) => {
  if (!text) return;

  // Forced: Always use local/server deployed MeloTTS via Proxy
  // This ensures consistent high-quality voice across all devices
  const url = `/api/proxy/tts?text=${encodeURIComponent(text)}&t=${Date.now()}`;
  const audio = new Audio(url);
  
  audio.play().catch(err => {
    console.warn('MeloTTS Proxy play failed:', err);
  });
};
