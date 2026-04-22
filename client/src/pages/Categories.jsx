import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, Sparkles, Snowflake } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Categories = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { theme, themeName } = useTheme();

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/tags', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTags(data.filter(t => t !== '全部')); // 排除“全部”，因为这是分类选择页
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch tags', err);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 rounded-full shadow-sm"
          style={{ backgroundColor: 'white', color: theme.primary }}
        >
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold text-gray-800">选择分类</h2>
        <div className="w-10" />
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
          {themeName === 'magic' ? (
            <Sparkles className="w-10 h-10" style={{ color: theme.accent }} />
          ) : (
            <Snowflake className="w-10 h-10 animate-spin-slow" style={{ color: theme.primary }} />
          )}
        </div>
        <p className="text-sm opacity-60" style={{ color: theme.primary }}>
          {themeName === 'magic' ? '你想学习哪一类魔法卡呢？' : '你想开启哪一扇冰雪之门呢？'}
        </p>
      </div>

      {loading ? (
        <div className="text-center text-pink-500">魔法加载中...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {tags.map((tag, index) => (
            <motion.button
              key={tag}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/study?tag=${tag}`)}
              className="p-6 bg-white rounded-[32px] border-2 flex flex-col items-center justify-center shadow-md"
              style={{ borderColor: theme.accent + '33' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: theme.secondary }}>
                {themeName === 'magic' ? (
                  <Star className="w-6 h-6" style={{ color: theme.primary, fill: theme.primary }} />
                ) : (
                  <Snowflake className="w-6 h-6" style={{ color: theme.primary }} />
                )}
              </div>
              <span className="font-bold text-gray-700 text-lg">{tag}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
