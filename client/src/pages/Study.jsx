import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, Check, X, RefreshCw, Snowflake } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const Study = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { theme } = useTheme();
  const tag = searchParams.get('tag');

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [tag]);

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`/api/cards${tag ? `?tag=${tag}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // 默认随机打乱
      let finalCards = [...data].sort(() => Math.random() - 0.5);

      // 如果没有指定标签（即“开始认字”），限制为 50 个
      if (!tag) {
        finalCards = finalCards.slice(0, 50);
      }

      setCards(finalCards);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleNext = async (correct) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    try {
      if (!correct) {
        await markAsMistake(cards[currentIndex].id);
      } else {
        // 只要记住了，就尝试从错题本中移除（软删除）
        await removeMistake(cards[currentIndex].id);
        // 记录学习日志
        await logStudyAction(cards[currentIndex].id);
      }
    } catch (err) {
      console.error('Action failed', err);
    }

    setIsFlipped(false);
    
    // Wait for exit animation to complete before moving to next card
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        // Add a small delay for the next card's entrance animation before re-enabling
        setTimeout(() => setIsTransitioning(false), 300);
      } else {
        showToast('太棒了！这一组已经学完啦！', 'success');
        navigate('/');
        setIsTransitioning(false);
      }
    }, 400);
  };

  const markAsMistake = async (cardId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/mistakes', { card_id: cardId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const removeMistake = async (cardId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/mistakes/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const logStudyAction = async (cardId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/study/log', { card_id: cardId, action: 'recognized' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    speechSynthesis.speak(utterance);
  };

  if (loading) return <div className="h-full flex items-center justify-center text-pink-500">加载中...</div>;
  if (cards.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <p className="text-gray-400 mb-4">没有找到相关字卡哦</p>
      <button onClick={() => navigate('/library')} className="text-pink-500 underline">去添加一些吧</button>
    </div>
  );

  const currentCard = cards[currentIndex];

  return (
    <div className="flex-1 flex flex-col transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 rounded-full shadow-sm"
          style={{ backgroundColor: 'white', color: theme.primary }}
        >
          <ChevronLeft />
        </button>
        <div className="flex-1 mx-4 h-3 bg-white/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            className="h-full"
            style={{ backgroundColor: theme.primary }}
          />
        </div>
        <span className="text-xs font-bold" style={{ color: theme.primary }}>{currentIndex + 1}/{cards.length}</span>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex items-center justify-center p-6 perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1, rotateY: isFlipped ? 180 : 0 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative w-full h-[60vh] max-h-[600px] cursor-pointer preserve-3d"
          >
            {/* Front Side */}
            <div 
              className="absolute inset-0 bg-white rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-8 border-8 backface-hidden"
              style={{ borderColor: theme.accent + '33' }}
            >
              <h1 className="text-8xl font-bold text-gray-800 mb-8">{currentCard.content}</h1>
              <div className="p-4 rounded-full" style={{ backgroundColor: theme.secondary }}>
                <Volume2 className="w-8 h-8" style={{ color: theme.primary }} />
              </div>
              <p className="mt-8 text-sm italic opacity-40" style={{ color: theme.primary }}>点击卡片看解析</p>
            </div>

            {/* Back Side */}
            <div 
              className="absolute inset-0 bg-white rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-8 border-8 backface-hidden rotate-y-180"
              style={{ borderColor: theme.accent + '33' }}
            >
              <div className="text-center">
                <p className="text-3xl font-bold mb-4" style={{ color: theme.primary }}>{currentCard.pinyin}</p>
                <div className="h-px w-24 mx-auto mb-8" style={{ backgroundColor: theme.accent + '33' }} />
                <h2 className="text-6xl font-bold text-gray-800">{currentCard.content}</h2>
              </div>

              {/* 分类标签 Badge */}
              <div 
                className="mt-4 px-4 py-1 text-sm rounded-full font-medium"
                style={{ backgroundColor: theme.secondary, color: theme.primary }}
              >
                {currentCard.tags || '魔法字卡'}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); speak(currentCard.content); }}
                className="mt-12 p-6 rounded-full"
                style={{ backgroundColor: theme.secondary, color: theme.primary }}
              >
                <Volume2 className="w-10 h-10" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-8 grid grid-cols-2 gap-6">
        <button
          onClick={() => handleNext(false)}
          disabled={isTransitioning}
          className={`flex items-center justify-center space-x-2 py-5 bg-white border-4 border-rose-100 rounded-3xl text-rose-500 font-bold transition-all shadow-lg shadow-rose-50 ${isTransitioning ? 'opacity-50 grayscale' : 'active:scale-95'}`}
        >
          <X className="w-6 h-6" />
          <span>记不住</span>
        </button>
        <button
          onClick={() => handleNext(true)}
          disabled={isTransitioning}
          className={`flex items-center justify-center space-x-2 py-5 text-white font-bold rounded-3xl transition-all shadow-lg ${isTransitioning ? 'opacity-50 grayscale' : 'active:scale-95'}`}
          style={{ backgroundColor: theme.primary, boxShadow: isTransitioning ? 'none' : `0 10px 20px ${theme.primary}33` }}
        >
          <Check className="w-6 h-6" />
          <span>认识了</span>
        </button>
      </div>
    </div>
  );
};

export default Study;
