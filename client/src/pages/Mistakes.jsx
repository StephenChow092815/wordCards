import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ChevronLeft, RefreshCw, Star, Trash2, Snowflake, Waves, Ghost, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Mistakes = () => {
  const navigate = useNavigate();
  const { theme, themeName } = useTheme();
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMistakes();
  }, []);

  const fetchMistakes = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/mistakes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // 增加前端排序兜底，确保 ID 最大的（最新添加的）排在最前面
      const sortedData = [...data].sort((a, b) => b.id - a.id);
      setMistakes(sortedData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getThemeIcon = (className, style) => {
    if (themeName === 'mermaid') return <Waves className={className} style={style} />;
    if (themeName === 'frozen') return <Snowflake className={className} style={style} />;
    if (themeName === 'kuromi') return <Ghost className={className} style={style} />;
    return <Sparkles className={className} style={style} />;
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto min-h-0 transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 rounded-full shadow-sm"
          style={{ backgroundColor: 'white', color: theme.primary }}
        >
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold text-gray-800">魔法错题本</h2>
        <div className="w-10" />
      </div>

      <div className="bg-white rounded-[40px] p-8 mb-8 shadow-xl flex flex-col items-center flex-shrink-0" style={{ boxShadow: `0 20px 40px ${theme.primary}11` }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: theme.secondary }}>
          {getThemeIcon("w-10 h-10", { color: theme.primary, fill: themeName === 'frozen' ? 'none' : theme.primary })}
        </div>
        <h3 className="text-2xl font-bold text-gray-800">{mistakes.length}</h3>
        <p className="text-gray-400 text-sm">待攻克的生词</p>
        
        {mistakes.length > 0 && (
          <button 
            onClick={() => navigate('/study?tag=mistake')}
            className="mt-6 px-10 py-4 text-white font-bold rounded-full shadow-lg active:scale-95 transition-all"
            style={{ backgroundColor: theme.primary }}
          >
            开始复习
          </button>
        )}
      </div>

      <div className="space-y-4 pb-10">
        {mistakes.map((card) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={card.id} 
            className="p-5 bg-white rounded-3xl border flex items-center justify-between shadow-sm"
            style={{ borderColor: theme.accent + '22' }}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-xl font-bold text-gray-700" style={{ backgroundColor: theme.secondary }}>
                {card.content.charAt(0)}
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <p className="font-bold text-lg text-gray-700">{card.content}</p>
                  <p className="text-sm font-medium" style={{ color: theme.accent }}>{card.pinyin}</p>
                </div>
                <p className="text-[10px] opacity-60" style={{ color: theme.primary }}>错误次数: {card.miss_count}次</p>
              </div>
            </div>
            <button className="text-gray-300 hover:text-rose-500 p-2">
              <RefreshCw className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {mistakes.length === 0 && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-inner">
            {getThemeIcon("w-16 h-16 opacity-20", { color: theme.primary, fill: themeName === 'frozen' ? 'none' : theme.primary })}
          </div>
          <p className="text-gray-400 font-medium">哇！还没有错题哦<br/>宝贝真聪明！</p>
        </div>
      )}
    </div>
  );
};

export default Mistakes;
