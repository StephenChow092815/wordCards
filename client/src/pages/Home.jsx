import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Play, Plus, BookOpen, LogOut, Star } from 'lucide-react';

const Home = ({ user, onLogout }) => {
  const [tags, setTags] = useState(['全部']);
  const [selectedTag, setSelectedTag] = useState('全部');
  const [todayCount, setTodayCount] = useState(0);
  const navigate = useNavigate();

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
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
            <Star className="text-pink-500 fill-pink-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-pink-600">你好呀！</h2>
            <p className="text-xs text-pink-400">{user.phone}</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 text-gray-400 hover:text-rose-500">
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* 移除分类魔法林部分 */}

      <div className="grid grid-cols-2 gap-4 flex-1 content-start">
        <MenuCard 
          icon={<Play className="w-8 h-8 text-white" />}
          title="开始认字"
          desc="随机50个魔法卡"
          color="bg-rose-400"
          onClick={() => navigate('/study')}
        />
        <MenuCard 
          icon={<Star className="w-8 h-8 text-white" />}
          title="分类学习"
          desc="按标签挑选字卡"
          color="bg-pink-400"
          onClick={() => navigate('/categories')}
        />
        <MenuCard 
          icon={<BookOpen className="w-8 h-8 text-white" />}
          title="我的错题"
          desc="复习记错的字"
          color="bg-purple-400"
          onClick={() => navigate('/mistakes')}
        />
        <MenuCard 
          icon={<Plus className="w-8 h-8 text-white" />}
          title="字卡管理"
          desc="添加新的生词"
          color="bg-amber-400"
          onClick={() => navigate('/library')}
          className="col-span-2"
        />
      </div>

      <div className="mt-8 p-6 bg-pink-50 rounded-3xl border-2 border-pink-100 flex items-center space-x-4">
        <div className="bg-white p-3 rounded-2xl">
          <Star className="text-amber-400 fill-amber-400 w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-pink-600">今日已学 {todayCount} 个字</p>
          <p className="text-xs text-pink-400">{todayCount > 0 ? '继续努力，宝贝最棒！' : '开始学习，开启魔法识字之旅吧！'}</p>
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
