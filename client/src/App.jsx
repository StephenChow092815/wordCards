import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Study from './pages/Study';
import Library from './pages/Library';
import Categories from './pages/Categories';
import Mistakes from './pages/Mistakes';
import Quiz from './pages/Quiz';
import MathQuiz from './pages/MathQuiz';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 全局预加载所有主题的图片资源，保证各页面及弹窗无延迟
    const themes = ['mermaid', 'elsa', 'kuromi'];
    const pngFiles = ['bg.png', 'logo.png'];
    const jpgFiles = ['success.jpg', 'failure.jpg'];
    themes.forEach(theme => {
      pngFiles.forEach(file => {
        const img = new Image();
        img.src = `/themes/${theme}/${file}`;
      });
      jpgFiles.forEach(file => {
        const img = new Image();
        img.src = `/themes/${theme}/${file}`;
      });
    });

    // 全局预加载音频资源
    const audioTypes = ['success', 'failure'];
    const audioIndices = [1, 2, 3];
    audioTypes.forEach(type => {
      audioIndices.forEach(idx => {
        const audio = new Audio();
        audio.src = `/audio/${type}_${idx}.mp3`;
        audio.preload = 'auto';
      });
    });

    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);

    // Warm up speech synthesis for mobile devices (like Huawei/Android)
    const initSpeech = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        // Create a silent utterance to "unlock" the engine
        const dummy = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(dummy);
      }
    };
    
    // Trigger on first interaction
    window.addEventListener('click', initSpeech, { once: true });
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = initSpeech;
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) return <div className="h-full flex items-center justify-center text-pink-500 font-bold">加载中...</div>;

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div className="magic-app-container max-w-md mx-auto relative bg-white shadow-xl overflow-hidden">
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
              <Route path="/" element={user ? <Home user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
              <Route path="/study" element={user ? <Study /> : <Navigate to="/login" />} />
              <Route path="/library" element={user ? <Library /> : <Navigate to="/login" />} />
              <Route path="/categories" element={user ? <Categories /> : <Navigate to="/login" />} />
              <Route path="/mistakes" element={user ? <Mistakes /> : <Navigate to="/login" />} />
              <Route path="/quiz" element={user ? <Quiz /> : <Navigate to="/login" />} />
              <Route path="/math-quiz" element={user ? <MathQuiz /> : <Navigate to="/login" />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
