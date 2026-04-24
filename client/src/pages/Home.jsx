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
    <div className="flex-1 flex flex-col p-6 overflow-y-auto relative transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
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

      {/* Security/Speech Warning */}
      {(!isSecure || !speechSupported) && (
        <div className="relative z-20 mb-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-800 text-xs">
          <p className="font-bold mb-1 flex items-center">
            <Star className="w-3 h-3 mr-1 fill-amber-500" />
            语音功能受限提醒
          </p>
          {!speechSupported ? (
            <p>您的浏览器不支持语音播报，请更换浏览器试试。</p>
          ) : (
            <p>
              检测到您正在使用非安全连接访问（HTTP）。安卓 Chrome 等浏览器会禁用此类环境下的语音功能。
              <br />
              <span className="font-bold underline">修复方法：</span>在 Chrome 地址栏输入 <b>chrome://flags/#unsafely-treat-insecure-origin-as-secure</b> 并将您的 IP 设为白名单。
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-white/50" style={{ backgroundColor: 'white' }}>
            <img src={theme.logo} alt="logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-bold text-lg" style={{ color: theme.primary }}>
              {getThemeWelcome()}
            </h2>
            <p className="text-xs opacity-60" style={{ color: theme.primary }}>{user.phone}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl shadow-lg transition-all active:scale-90"
            style={{ backgroundColor: theme.primary, color: 'white' }}
          >
            <Wand2 size={20} />
          </button>
          <button
            onClick={onLogout}
            className="p-3 bg-white text-gray-400 rounded-2xl shadow-md"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* 移除分类魔法林部分 */}

      <div className="grid grid-cols-2 gap-4 flex-1 content-start relative z-10">
        <MenuCard
          icon={<Play className="w-8 h-8 text-white" />}
          title="开始认字"
          desc="随机50个魔法卡"
          color={theme.cardColors[0]}
          onClick={() => navigate('/study')}
        />
        <MenuCard
          icon={<Volume2 className="w-8 h-8 text-white" />}
          title="听认挑战"
          desc="听音辨字大冲关"
          color={theme.cardColors[1]}
          onClick={() => navigate('/quiz')}
        />
        <MenuCard
          icon={<Star className="w-8 h-8 text-white" />}
          title="分类学习"
          desc="按标签挑选字卡"
          color={theme.cardColors[2]}
          onClick={() => navigate('/categories')}
        />
        <MenuCard
          icon={<BookOpen className="w-8 h-8 text-white" />}
          title="我的错题"
          desc="复习记错的字"
          color={theme.cardColors[3]}
          onClick={() => navigate('/mistakes')}
        />
        <MenuCard
          icon={<Calculator className="w-8 h-8 text-white" />}
          title="算术挑战"
          desc="5以内加减法"
          color={theme.cardColors[4]}
          onClick={() => navigate('/math-quiz')}
        />
        <MenuCard
          icon={<Plus className="w-8 h-8 text-white" />}
          title="字卡管理"
          desc="词库同步管理"
          color={theme.cardColors[5]}
          onClick={() => navigate('/library')}
        />
      </div>

      <div className="mt-8 p-6 rounded-3xl border-2 flex items-center space-x-4 shadow-sm relative z-10" style={{ backgroundColor: 'white', borderColor: theme.accent + '22' }}>
        <div className="p-3 rounded-2xl" style={{ backgroundColor: theme.secondary }}>
          {getThemeIcon("w-6 h-6", { color: theme.primary, fill: themeName === 'frozen' ? 'none' : theme.primary })}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: theme.primary }}>今日已学 {todayCount} 个字</p>
          <p className="text-xs opacity-60" style={{ color: theme.primary }}>
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
    className={`p-6 rounded-3xl flex flex-col items-start text-left shadow-lg transition-all ${color} ${className}`}
  >
    <div className="bg-white/20 p-3 rounded-2xl mb-4">{icon}</div>
    <h4 className="text-white font-bold text-lg">{title}</h4>
    <p className="text-white/80 text-xs">{desc}</p>
  </motion.button>
);

export default Home;
