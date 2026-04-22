import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Heart, User, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Login = ({ onLogin }) => {
  const [phone, setPhone] = useState(''); // Keep variable name same as backend expects 'phone'
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const showToast = useToast();

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
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-pink-50 to-white">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 bg-pink-100 p-6 rounded-full"
      >
        <Heart className="w-16 h-16 text-pink-500 fill-pink-500" />
      </motion.div>
      
      <h1 className="text-3xl font-bold text-pink-600 mb-2">魔法认字卡</h1>
      <p className="text-pink-400 mb-8">开启小朋友的识字旅程</p>
-
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="relative">
          <User className="absolute left-4 top-3.5 w-5 h-5 text-pink-300" />
          <input
            type="text"
            placeholder="用户名 / 手机号"
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-pink-100 rounded-2xl focus:border-pink-400 outline-none transition-all"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 w-5 h-5 text-pink-300" />
          <input
            type="password"
            placeholder="登录密码"
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-pink-100 rounded-2xl focus:border-pink-400 outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-rose-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 transition-all active:scale-95"
        >
          {isRegister ? '开启探索' : '进入魔法世界'}
        </button>
      </form>

      <button 
        onClick={() => setIsRegister(!isRegister)}
        className="mt-6 text-pink-400 text-sm hover:text-pink-600"
      >
        {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
      </button>
    </div>
  );
};

export default Login;
