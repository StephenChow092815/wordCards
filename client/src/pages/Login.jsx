import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Heart, User, Lock, Wand2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const Login = ({ onLogin }) => {
  const [phone, setPhone] = useState(''); // Keep variable name same as backend expects 'phone'
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const showToast = useToast();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Preload theme background images
    const images = [
      '/themes/mermaid/bg.png',
      '/themes/elsa/bg.png',
      '/themes/kuromi/bg.png'
    ];
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const url = isRegister ? '/api/auth/register' : '/api/auth/login';
      const { data } = await axios.post(url, { phone, password });
      
      if (isRegister) {
        setIsRegister(false);
        showToast('注册成功，请登录！', 'success');
      } else {
        onLogin(data.user, data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
      {/* Background Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none transition-all duration-1000" 
        style={{ 
          backgroundImage: `url(${theme.bg})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} 
      />

      {/* Theme Switcher in Login */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-2xl shadow-lg transition-all active:scale-90"
          style={{ backgroundColor: theme.primary, color: 'white' }}
        >
          <Wand2 size={20} />
        </button>
      </div>

      <motion.div 
        key={theme.logo}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 bg-white p-2 rounded-3xl shadow-2xl relative z-10 border-2"
        style={{ borderColor: theme.accent + '33' }}
      >
        <div className="w-24 h-24 rounded-2xl overflow-hidden">
          <img src={theme.logo} alt="logo" className="w-full h-full object-cover" />
        </div>
      </motion.div>
      
      <h1 className="text-3xl font-bold mb-2 relative z-10 transition-colors" style={{ color: theme.primary }}>
        魔法认字卡
      </h1>
      <p className="mb-8 relative z-10 opacity-70 transition-colors" style={{ color: theme.primary }}>
        开启小朋友的识字旅程
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-4 relative z-10 max-w-sm">
        <div className="relative">
          <User className="absolute left-4 top-3.5 w-5 h-5 transition-colors" style={{ color: theme.primary + '88' }} />
          <input
            type="text"
            placeholder="用户名 / 手机号"
            className="w-full pl-12 pr-4 py-3.5 bg-white/90 backdrop-blur-sm border-2 rounded-2xl outline-none transition-all focus:ring-2"
            style={{ 
              borderColor: theme.accent + '33',
              '--tw-ring-color': theme.primary + '33'
            }}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 w-5 h-5 transition-colors" style={{ color: theme.primary + '88' }} />
          <input
            type="password"
            placeholder="登录密码"
            className="w-full pl-12 pr-4 py-3.5 bg-white/90 backdrop-blur-sm border-2 rounded-2xl outline-none transition-all focus:ring-2"
            style={{ 
              borderColor: theme.accent + '33',
              '--tw-ring-color': theme.primary + '33'
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-rose-500 text-sm text-center font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
          style={{ backgroundColor: theme.primary, boxShadow: `0 10px 20px ${theme.primary}44` }}
        >
          {isRegister ? '开启探索' : '进入魔法世界'}
        </button>
      </form>

      <button 
        onClick={() => setIsRegister(!isRegister)}
        className="mt-6 text-sm font-medium hover:opacity-80 transition-all relative z-10"
        style={{ color: theme.primary }}
      >
        {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
      </button>
    </div>
  );
};

export default Login;
