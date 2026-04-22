import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, Sparkles } from 'lucide-react';

const Categories = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    <div className="flex-1 flex flex-col p-6 bg-pink-50 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/')} className="p-2 text-pink-500 bg-white rounded-full shadow-sm">
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold text-gray-800">选择分类</h2>
        <div className="w-10" />
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
          <Sparkles className="text-pink-400 w-10 h-10" />
        </div>
        <p className="text-gray-400 text-sm">你想学习哪一类魔法卡呢？</p>
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
              className="p-6 bg-white rounded-[32px] border-2 border-pink-100 flex flex-col items-center justify-center shadow-md shadow-pink-100"
            >
              <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center mb-3">
                <Star className="text-pink-400 fill-pink-400 w-6 h-6" />
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
