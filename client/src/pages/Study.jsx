import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, Check, X, RefreshCw, Snowflake } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { speak } from '../utils/speech';
import FeedbackPopup from '../components/FeedbackPopup';

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);

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
    
    // 显示视觉反馈动画
    setFeedback(correct ? 'success' : 'error');

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
    
    // 等待弹窗展示结束
    setTimeout(() => {
      setFeedback(null);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setTimeout(() => setIsTransitioning(false), 300);
      } else {
        showToast('太棒了！这一组已经学完啦！', 'success');
        navigate('/');
        setIsTransitioning(false);
      }
    }, 1500);
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

  if (loading) return <div className="h-full flex items-center justify-center text-pink-500">加载中...</div>;
  if (cards.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <p className="text-gray-400 mb-4">没有找到相关字卡哦</p>
      <button onClick={() => navigate('/library')} className="text-pink-500 underline">去添加一些吧</button>
    </div>
  );

  const currentCard = cards[currentIndex];

  return (
    <div className="flex-1 flex flex-col transition-colors duration-500 overflow-y-auto" style={{ backgroundColor: theme.secondary }}>
      <FeedbackPopup type={feedback} />
      {/* Header */}
      <div className="p-4 flex items-center justify-between shrink-0">
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
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 perspective-1000 min-h-[50vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1, rotateY: isFlipped ? 180 : 0 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            onClick={() => {
              if (!isFlipped) {
                // Start speech without blocking the flip
                const playSpeech = async () => {
                  setIsSpeaking(true);
                  await speak(currentCard.content);
                  setIsSpeaking(false);
                };
                setTimeout(playSpeech, 100);
              }
              setIsFlipped(!isFlipped);
            }}
            className="relative w-full h-[55vh] sm:h-[60vh] max-h-[600px] cursor-pointer preserve-3d"
          >
            {/* Front Side */}
            <div 
              className="absolute inset-0 bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-6 sm:p-8 border-4 sm:border-8 backface-hidden"
              style={{ borderColor: theme.accent + '33' }}
            >
              <h1 className="text-7xl sm:text-8xl font-bold text-gray-800 mb-6 sm:mb-8">{currentCard.content}</h1>
              <div className={`p-3 sm:p-4 rounded-full relative flex items-center justify-center transition-transform ${isSpeaking && !isFlipped ? 'scale-110' : ''}`} style={{ backgroundColor: theme.secondary }}>
                {isSpeaking && !isFlipped && (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ animationDuration: '1.5s', backgroundColor: theme.primary }}></span>
                    <span className="absolute inline-flex h-[130%] w-[130%] rounded-full opacity-20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.4s', backgroundColor: theme.primary }}></span>
                  </>
                )}
                <Volume2 className={`w-6 h-6 sm:w-8 sm:h-8 relative z-10 ${isSpeaking && !isFlipped ? "animate-bounce" : ""}`} style={{ color: theme.primary }} />
              </div>
              <p className="mt-6 sm:mt-8 text-xs sm:text-sm italic opacity-40" style={{ color: theme.primary }}>点击卡片看解析</p>
            </div>

            {/* Back Side */}
            <div 
              className="absolute inset-0 bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-6 sm:p-8 border-4 sm:border-8 backface-hidden rotate-y-180"
              style={{ borderColor: theme.accent + '33' }}
            >
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4" style={{ color: theme.primary }}>{currentCard.pinyin}</p>
                <div className="h-px w-16 sm:w-24 mx-auto mb-4 sm:mb-8" style={{ backgroundColor: theme.accent + '33' }} />
                <h2 className="text-5xl sm:text-6xl font-bold text-gray-800">{currentCard.content}</h2>
              </div>

              {/* 分类标签 Badge */}
              <div 
                className="mt-4 px-3 sm:px-4 py-1 text-xs sm:text-sm rounded-full font-medium"
                style={{ backgroundColor: theme.secondary, color: theme.primary }}
              >
                {currentCard.tags || '魔法字卡'}
              </div>

              <button
                disabled={isSpeaking}
                onClick={async (e) => { 
                  e.stopPropagation(); 
                  setIsSpeaking(true);
                  await speak(currentCard.content);
                  setIsSpeaking(false);
                }}
                className={`mt-8 sm:mt-12 p-4 sm:p-6 rounded-full relative flex items-center justify-center transition-transform ${isSpeaking && isFlipped ? 'scale-110 shadow-lg' : 'active:scale-90'}`}
                style={{ backgroundColor: theme.secondary, color: theme.primary }}
              >
                {isSpeaking && isFlipped && (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ animationDuration: '1.5s', backgroundColor: theme.primary }}></span>
                    <span className="absolute inline-flex h-[130%] w-[130%] rounded-full opacity-20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.4s', backgroundColor: theme.primary }}></span>
                  </>
                )}
                <Volume2 className={`w-8 h-8 sm:w-10 sm:h-10 relative z-10 ${isSpeaking && isFlipped ? "animate-bounce" : ""}`} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-4 sm:p-8 grid grid-cols-2 gap-4 sm:gap-6 shrink-0 pb-6 sm:pb-8">
        <button
          onClick={() => handleNext(false)}
          disabled={isTransitioning}
          className={`flex items-center justify-center space-x-2 py-4 sm:py-5 bg-white border-4 border-rose-100 rounded-2xl sm:rounded-3xl text-rose-500 font-bold transition-all shadow-md sm:shadow-lg shadow-rose-50 ${isTransitioning ? 'opacity-50 grayscale' : 'active:scale-95'}`}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-sm sm:text-base">记不住</span>
        </button>
        <button
          onClick={() => handleNext(true)}
          disabled={isTransitioning}
          className={`flex items-center justify-center space-x-2 py-4 sm:py-5 text-white font-bold rounded-2xl sm:rounded-3xl transition-all shadow-md sm:shadow-lg ${isTransitioning ? 'opacity-50 grayscale' : 'active:scale-95'}`}
          style={{ backgroundColor: theme.primary, boxShadow: isTransitioning ? 'none' : `0 10px 20px ${theme.primary}33` }}
        >
          <Check className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-sm sm:text-base">认识了</span>
        </button>
      </div>
    </div>
  );
};

export default Study;
