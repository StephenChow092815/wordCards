import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, Check, X, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Study = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const tag = searchParams.get('tag');

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

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
    if (!correct) {
      markAsMistake(cards[currentIndex].id);
    } else {
      // 只要记住了，就尝试从错题本中移除（软删除）
      await removeMistake(cards[currentIndex].id);
      // 记录学习日志
      await logStudyAction(cards[currentIndex].id);
    }

    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        showToast('太棒了！这一组已经学完啦！', 'success');
        navigate('/');
      }
    }, 300);
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
    <div className="flex-1 flex flex-col bg-pink-50">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 text-pink-500 bg-white rounded-full shadow-sm">
          <ChevronLeft />
        </button>
        <div className="flex-1 mx-4 h-3 bg-pink-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            className="h-full bg-pink-500"
          />
        </div>
        <span className="text-xs font-bold text-pink-400">{currentIndex + 1}/{cards.length}</span>
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
            className="relative w-full aspect-[3/4] max-h-[500px] cursor-pointer preserve-3d"
          >
            {/* Front Side */}
            <div className="absolute inset-0 bg-white rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-8 border-8 border-pink-100 backface-hidden">
              <h1 className="text-8xl font-bold text-gray-800 mb-8">{currentCard.content}</h1>
              <div className="bg-pink-50 p-4 rounded-full">
                <Volume2 className="text-pink-400 w-8 h-8" />
              </div>
              <p className="mt-8 text-gray-300 text-sm italic">点击卡片看解析</p>
            </div>

            {/* Back Side */}
            <div className="absolute inset-0 bg-white rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-8 border-8 border-pink-100 backface-hidden rotate-y-180">
              <div className="text-center">
                <p className="text-3xl text-pink-500 font-bold mb-4">{currentCard.pinyin}</p>
                <div className="h-px w-24 bg-pink-100 mx-auto mb-8" />
                <h2 className="text-6xl font-bold text-gray-800">{currentCard.content}</h2>
              </div>

              {/* 分类标签 Badge */}
              <div className="mt-4 px-4 py-1 bg-pink-100 text-pink-500 text-sm rounded-full font-medium">
                {currentCard.tags || '魔法字卡'}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); speak(currentCard.content); }}
                className="mt-12 bg-pink-50 p-6 rounded-full text-pink-500"
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
          className="flex items-center justify-center space-x-2 py-5 bg-white border-4 border-rose-100 rounded-3xl text-rose-500 font-bold active:scale-95 transition-all shadow-lg shadow-rose-50"
        >
          <X className="w-6 h-6" />
          <span>记不住</span>
        </button>
        <button
          onClick={() => handleNext(true)}
          className="flex items-center justify-center space-x-2 py-5 bg-pink-500 text-white font-bold rounded-3xl active:scale-95 transition-all shadow-lg shadow-pink-200"
        >
          <Check className="w-6 h-6" />
          <span>认识了</span>
        </button>
      </div>
    </div>
  );
};

export default Study;
