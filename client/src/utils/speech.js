/**
 * Unified speech utility using Baidu TTS directly from the frontend
 * for much faster response times.
 */

let currentAudio = null;
let baiduToken = null;
let tokenFetchPromise = null;

// Lazily fetch and cache the Baidu Token
const getBaiduToken = async () => {
  if (baiduToken) return baiduToken;
  if (tokenFetchPromise) return tokenFetchPromise;
  
  tokenFetchPromise = fetch('/api/tts/token')
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        baiduToken = data.token;
      }
      return baiduToken;
    })
    .catch(err => {
      console.error('Failed to fetch Baidu token:', err);
      tokenFetchPromise = null;
      return null;
    });
    
  return tokenFetchPromise;
};

// Start fetching token proactively to warm up
getBaiduToken();

export const speak = (text) => {
  return new Promise(async (resolve) => {
    if (!text) {
      resolve();
      return;
    }

    // 中断上一个正在播放的音频
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const cleanText = text.replace(/[\s\?？\.\!！,，\(\)\（\）]/g, '').trim();
    const token = await getBaiduToken();
    
    let url;
    if (token) {
      // Direct connection to Baidu TTS for maximum speed
      url = `https://tsn.baidu.com/text2audio?tex=${encodeURIComponent(cleanText)}&tok=${token}&cuid=wordcards_app_frontend&ctp=1&lan=zh&spd=5&pit=5&vol=10&per=0`;
    } else {
      // Fallback to proxy
      url = `/api/proxy/tts?text=${encodeURIComponent(cleanText)}&t=${Date.now()}`;
    }

    const audio = new Audio(url);
    currentAudio = audio;
    
    // 播放完毕后 resolve
    audio.onended = () => {
      resolve();
    };

    audio.onerror = (err) => {
      console.error('百度语音加载失败 (onerror):', err);
      resolve(); // 即使失败也需 resolve，避免阻塞进程
    };

    audio.play().catch(err => {
      console.error('百度语音播放被阻止/失败:', err);
      // If it's a token error or CORS issue, we could theoretically fallback to proxy here
      // But for performance, we resolve immediately so the UI doesn't hang
      resolve();
    });
  });
};
