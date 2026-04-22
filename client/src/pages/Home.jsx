import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Play, Plus, BookOpen, LogOut, Star, Wand2, Snowflake } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Home = ({ user, onLogout }) => {
  const [tags, setTags] = useState(['全部']);
  const [selectedTag, setSelectedTag] = useState('全部');
  const [todayCount, setTodayCount] = useState(0);
  const navigate = useNavigate();
  const { theme, toggleTheme, themeName } = useTheme();

  useEffect(() => {
    fetchTags();
    fetchTodayStats();
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

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto relative transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
      {/* Background Pattern Overlay */}
      {themeName === 'frozen' && (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-1000" 
          style={{ 
            backgroundImage: `url(${theme.bg})`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }} 
        />
      )}
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-inner" style={{ backgroundColor: theme.accent + '33' }}>
            {themeName === 'magic' ? (
              <Star className="w-6 h-6" style={{ color: theme.primary, fill: theme.primary }} />
            ) : (
              <Snowflake className="w-6 h-6 animate-spin-slow" style={{ color: theme.primary }} />
            )}
          </div>
          <div>
            <h2 className="font-bold" style={{ color: theme.primary }}>
              {themeName === 'magic' ? '你好呀！魔法师' : '你好呀！小公主'}
            </h2>
            <p className="text-xs opacity-60" style={{ color: theme.primary }}>{user.phone}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full transition-all active:scale-90 shadow-sm"
            style={{ backgroundColor: 'white', color: theme.primary }}
          >
            <Wand2 className="w-5 h-5" />
          </button>
          <button onClick={onLogout} className="p-2 text-gray-400 hover:text-rose-500">
            <LogOut className="w-6 h-6" />
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
          icon={<Star className="w-8 h-8 text-white" />}
          title="分类学习"
          desc="按标签挑选字卡"
          color={theme.cardColors[1]}
          onClick={() => navigate('/categories')}
        />
        <MenuCard 
          icon={<BookOpen className="w-8 h-8 text-white" />}
          title="我的错题"
          desc="复习记错的字"
          color={theme.cardColors[2]}
          onClick={() => navigate('/mistakes')}
        />
        <MenuCard 
          icon={<Plus className="w-8 h-8 text-white" />}
          title="字卡管理"
          desc="添加新的生词"
          color={theme.cardColors[3]}
          onClick={() => navigate('/library')}
          className="col-span-2"
        />
      </div>

      <div className="mt-8 p-6 rounded-3xl border-2 flex items-center space-x-4 shadow-sm relative z-10" style={{ backgroundColor: 'white', borderColor: theme.accent + '22' }}>
        <div className="p-3 rounded-2xl" style={{ backgroundColor: theme.secondary }}>
          {themeName === 'magic' ? (
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          ) : (
            <Snowflake className="w-6 h-6 text-blue-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: theme.primary }}>今日已学 {todayCount} 个字</p>
          <p className="text-xs opacity-60" style={{ color: theme.primary }}>
            {todayCount > 0 ? (themeName === 'magic' ? '继续努力，宝贝最棒！' : '冰雪魔法正在增强，继续加油！') : '开始学习，开启魔法识字之旅吧！'}
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
