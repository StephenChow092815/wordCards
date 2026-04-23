import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RefreshCw, Star, Trash2, Snowflake, Waves, Ghost, Sparkles, Calculator, BookOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Mistakes = () => {
  const navigate = useNavigate();
  const { theme, themeName } = useTheme();
  const [activeTab, setActiveTab] = useState('word'); // 'word' or 'math'
  const [wordMistakes, setWordMistakes] = useState([]);
  const [mathMistakes, setMathMistakes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMistakes();
  }, []);

  const fetchMistakes = async () => {
    try {
      const token = localStorage.getItem('token');
      const [wordRes, mathRes] = await Promise.all([
        axios.get('/api/mistakes', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/math-mistakes', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setWordMistakes([...wordRes.data].sort((a, b) => b.id - a.id));
      setMathMistakes([...mathRes.data].sort((a, b) => b.id - a.id));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleRemoveMistake = async (id, type) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'word' ? `/api/mistakes/${id}` : `/api/math-mistakes/${id}`;
      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMistakes();
    } catch (err) {
      console.error('Failed to remove mistake', err);
    }
  };

  const getThemeIcon = (className, style) => {
    if (themeName === 'mermaid') return <Waves className={className} style={style} />;
    if (themeName === 'frozen') return <Snowflake className={className} style={style} />;
    if (themeName === 'kuromi') return <Ghost className={className} style={style} />;
    return <Sparkles className={className} style={style} />;
  };

  const currentMistakes = activeTab === 'word' ? wordMistakes : mathMistakes;

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto min-h-0 relative transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
      {/* Background Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-50 pointer-events-none transition-all duration-1000" 
        style={{ 
          backgroundImage: `url(${theme.bg})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} 
      />

      <div className="flex items-center justify-between mb-6 flex-shrink-0 relative z-10">
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

      {/* Tabs */}
      <div className="flex p-1 bg-white/50 backdrop-blur-md rounded-2xl mb-6 relative z-10">
        <button
          onClick={() => setActiveTab('word')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'word' ? 'bg-white shadow-md' : 'text-gray-400'}`}
          style={{ color: activeTab === 'word' ? theme.primary : undefined }}
        >
          <BookOpen size={18} />
          <span>识字错题</span>
        </button>
        <button
          onClick={() => setActiveTab('math')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'math' ? 'bg-white shadow-md' : 'text-gray-400'}`}
          style={{ color: activeTab === 'math' ? theme.primary : undefined }}
        >
          <Calculator size={18} />
          <span>加减法错题</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-[40px] p-8 mb-8 shadow-xl flex flex-col items-center flex-shrink-0 relative z-10" style={{ boxShadow: `0 20px 40px ${theme.primary}11` }}>
        <div className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center mb-4 shadow-lg border-2 border-white">
          <img src={theme.logo} alt="logo" className="w-full h-full object-cover" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800">{currentMistakes.length}</h3>
        <p className="text-gray-400 text-sm">待攻克的{activeTab === 'word' ? '生词' : '题目'}</p>
        
        {currentMistakes.length > 0 && (
          <button 
            onClick={() => {
              if (activeTab === 'word') {
                navigate('/study?tag=mistake');
              } else {
                navigate('/math-quiz');
              }
            }}
            className="mt-6 px-10 py-4 text-white font-bold rounded-full shadow-lg active:scale-95 transition-all"
            style={{ backgroundColor: theme.primary }}
          >
            重新学习
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'word' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'word' ? 20 : -20 }}
            className="space-y-4"
          >
            {currentMistakes.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex items-center p-5 bg-white rounded-[32px] shadow-sm border border-transparent hover:border-gray-100 transition-all"
              >
                {activeTab === 'word' ? (
                  <>
                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl mr-4 text-2xl font-bold" style={{ backgroundColor: theme.secondary, color: theme.primary }}>
                      {item.content.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <p className="font-bold text-lg text-gray-700">{item.content}</p>
                        <p className="text-sm font-medium" style={{ color: theme.accent }}>{item.pinyin}</p>
                      </div>
                      <p className="text-[10px] opacity-60" style={{ color: theme.primary }}>错误次数: {item.miss_count}次</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-12 flex items-center justify-center rounded-2xl mr-4 bg-emerald-50 text-emerald-600 font-mono font-bold text-xl border-b-4 border-emerald-100">
                      Math
                    </div>
                    <div>
                      <p className="font-mono font-bold text-xl text-gray-700 tracking-tight">{item.problem}</p>
                      <p className="text-[10px] font-bold text-emerald-500">正确答案: {item.answer}</p>
                    </div>
                  </>
                )}
                
                <div className="flex-1" />
                
                <button 
                  onClick={() => handleRemoveMistake(activeTab === 'word' ? item.id : item.id, activeTab)}
                  className="p-3 text-gray-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}

            {currentMistakes.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-32 h-32 bg-white/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  {getThemeIcon("w-16 h-16 opacity-20", { color: theme.primary, fill: themeName === 'frozen' ? 'none' : theme.primary })}
                </div>
                <p className="text-gray-400 font-medium">
                  {activeTab === 'word' ? '字卡错题全清空啦！' : '算术挑战全满分！'}<br/>宝贝真棒！
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Mistakes;
