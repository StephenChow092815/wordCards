import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Play, Plus, BookOpen, LogOut, Star, Wand2, Snowflake, Waves, Ghost, Volume2, Calculator } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Home = ({ user, onLogout }) => {
  const [tags, setTags] = useState(['全部']);
  const [selectedTag, setSelectedTag] = useState('全部');
  const [todayCount, setTodayCount] = useState(0);
  const navigate = useNavigate();
  const { theme, toggleTheme, themeName } = useTheme();

  const [isSecure, setIsSecure] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    fetchTags();
    fetchTodayStats();

    // Check if context is secure (required for Speech API on some mobile browsers)
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setIsSecure(false);
    }
    if (!window.speechSynthesis) {
      setSpeechSupported(false);
    }
  }, []);

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/tags', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTags(data);
    } catch (err) {
      console.error('Failed to fetch tags', err);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/study/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayCount(data.count);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const getThemeIcon = (className, style) => {
    if (themeName === 'mermaid') return <Waves className={className} style={style} />;
    if (themeName === 'frozen') return <Snowflake className={className} style={style} />;
    if (themeName === 'kuromi') return <Ghost className={className} style={style} />;
    return <Star className={className} style={style} />;
  };

  const getThemeWelcome = () => {
    if (themeName === 'mermaid') return '你好呀！小美人鱼';
    if (themeName === 'frozen') return '你好呀！小公主';
    if (themeName === 'kuromi') return '嘿！酷洛米大人';
    return '你好呀！魔法师';
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto relative transition-colors duration-500 min-h-0" style={{ backgroundColor: theme.secondary }}>
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

      <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10 shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-white/50" style={{ backgroundColor: 'white' }}>
            <img src={theme.logo} alt="logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-bold text-base sm:text-lg" style={{ color: theme.primary }}>
              {getThemeWelcome()}
            </h2>
            <p className="text-[10px] sm:text-xs opacity-60" style={{ color: theme.primary }}>{user.phone}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg transition-all active:scale-90"
            style={{ backgroundColor: theme.primary, color: 'white' }}
          >
            <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={onLogout}
            className="p-2 sm:p-3 bg-white text-gray-400 rounded-xl sm:rounded-2xl shadow-md"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 content-start relative z-10 pb-4">
        <MenuCard
          icon={<Play className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
          title="开始认字"
          desc="随机50个魔法卡"
          color={theme.cardColors[0]}
          onClick={() => navigate('/study')}
        />
        <MenuCard
          icon={<Volume2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
          title="听认挑战"
          desc="听音辨字大冲关"
          color={theme.cardColors[1]}
          onClick={() => navigate('/quiz')}
        />
        <MenuCard
          icon={<Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
          title="分类学习"
          desc="按标签挑选字卡"
          color={theme.cardColors[2]}
          onClick={() => navigate('/categories')}
        />
        <MenuCard
          icon={<BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
          title="我的错题"
          desc="复习记错的字"
          color={theme.cardColors[3]}
          onClick={() => navigate('/mistakes')}
        />
        <MenuCard
          icon={<Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
          title="算术挑战"
          desc="5以内加减法"
          color={theme.cardColors[4]}
          onClick={() => navigate('/math-quiz')}
        />
        <MenuCard
          icon={<Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
          title="字卡管理"
          desc="词库同步管理"
          color={theme.cardColors[5]}
          onClick={() => navigate('/library')}
        />
      </div>

      <div className="mt-4 sm:mt-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 flex items-center space-x-3 sm:space-x-4 shadow-sm relative z-10 shrink-0 mb-4" style={{ backgroundColor: 'white', borderColor: theme.accent + '22' }}>
        <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl shrink-0" style={{ backgroundColor: theme.secondary }}>
          {getThemeIcon("w-5 h-5 sm:w-6 sm:h-6", { color: theme.primary, fill: themeName === 'frozen' ? 'none' : theme.primary })}
        </div>
        <div>
          <p className="text-xs sm:text-sm font-bold" style={{ color: theme.primary }}>今日已学 {todayCount} 个字</p>
          <p className="text-[10px] sm:text-xs opacity-60" style={{ color: theme.primary }}>
            {todayCount > 0
              ? (themeName === 'mermaid' ? '深海珍珠正在发光，继续加油！' : (themeName === 'frozen' ? '冰雪魔法正在增强，继续加油！' : '酷洛米的恶作剧力量在提升！'))
              : '开启你的魔法识字之旅吧！'}
          </p>
        </div>
      </div>
    </div>
  );
};

const MenuCard = ({ icon, title, desc, color, onClick, className = '' }) => (
  <motion.button
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`p-4 sm:p-6 rounded-[24px] sm:rounded-3xl flex flex-col items-start text-left shadow-md sm:shadow-lg transition-all ${color} ${className}`}
  >
    <div className="bg-white/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl mb-2 sm:mb-4">{icon}</div>
    <h4 className="text-white font-bold text-base sm:text-lg">{title}</h4>
    <p className="text-white/80 text-[10px] sm:text-xs mt-1">{desc}</p>
  </motion.button>
);

export default Home;
