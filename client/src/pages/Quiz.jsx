import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, CheckCircle2, XCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { speak } from '../utils/speech';
import FeedbackPopup from '../components/FeedbackPopup';

const Quiz = () => {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  const navigate = useNavigate();
  const { theme, themeName } = useTheme();
  const showToast = useToast();

  // 避免 StrictMode 的副作用
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!hasFetched) {
      setHasFetched(true);
      fetchCards();
    }
  }, [hasFetched]);

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/cards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.length < 4) {
        showToast('字卡库不足4个，无法开启听认模式哦！', 'error');
        navigate('/');
        return;
      }

      // Shuffle and pick 50
      const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 50);
      setCards(shuffled);
      setLoading(false);
      generateOptions(shuffled, 0, data);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const generateOptions = async (allQuizCards, index, pool) => {
    const correct = allQuizCards[index];
    const distractors = pool
      .filter(c => c.id !== correct.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const combined = [correct, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(combined);
    
    // 给一点时间让组件渲染新选项，然后再读音
    setTimeout(async () => {
      setIsSpeaking(true);
      await speak(`哪个是 ${correct.content} ？`);
      setIsSpeaking(false);
    }, 300);
  };

  const handleAnswer = async (option) => {
    // 如果正在过渡、已经选择过，或者正在播报语音，则不可点击
    if (isTransitioning || selectedAnswer !== null || isSpeaking) return;
    
    const correct = cards[currentIndex];
    const isRight = option.id === correct.id;
    
    setSelectedAnswer(option.id);
    setIsCorrect(isRight);
    
    // 显示视觉反馈动画
    setFeedback(isRight ? 'success' : 'error');
    
    if (!isRight) {
      try {
        const token = localStorage.getItem('token');
        await axios.post('/api/mistakes', { card_id: correct.id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to mark mistake', err);
      }
    } else {
      try {
        const token = localStorage.getItem('token');
        await axios.post('/api/study/log', { card_id: correct.id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to log study', err);
      }
    }

    // 延时等待弹窗展示后再进入下一题
    setTimeout(() => {
      setFeedback(null);
      if (currentIndex < cards.length - 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setSelectedAnswer(null);
          setIsCorrect(null);
          generateOptions(cards, nextIndex, cards);
          setIsTransitioning(false);
        }, 300);
      } else {
        showToast('太棒了！全部听认完成！', 'success');
        navigate('/');
      }
    }, 1500);
  };

  if (loading) return null;

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 relative overflow-y-auto transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
      <FeedbackPopup type={feedback} />
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none transition-all duration-1000" 
        style={{ 
          backgroundImage: `url(${theme.bg})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} 
      />

      <div className="flex items-center justify-between mb-4 sm:mb-8 relative z-10 shrink-0">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 rounded-full shadow-sm"
          style={{ backgroundColor: 'white', color: theme.primary }}
        >
          <ChevronLeft />
        </button>
        <div className="flex items-center space-x-2">
          <span className="px-4 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: theme.primary }}>
            听认挑战 {currentIndex + 1}/{cards.length}
          </span>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-sm mx-auto">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="bg-white/90 backdrop-blur-md rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 w-full shadow-xl sm:shadow-2xl border-4 flex flex-col items-center text-center mb-6 sm:mb-12 shrink-0"
          style={{ borderColor: theme.accent + '33' }}
        >
          <button 
            onClick={async () => {
              if (!isSpeaking) {
                setIsSpeaking(true);
                await speak(`哪个是 ${cards[currentIndex].content} ？`);
                setIsSpeaking(false);
              }
            }}
            disabled={isSpeaking}
            className={`relative w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg transition-transform ${isSpeaking ? 'scale-100' : 'active:scale-90'}`}
            style={{ backgroundColor: theme.primary, color: 'white' }}
          >
            {isSpeaking && (
              <>
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-40 animate-ping" style={{ animationDuration: '1.5s' }}></span>
                <span className="absolute inline-flex h-[130%] w-[130%] rounded-full bg-white opacity-20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.4s' }}></span>
              </>
            )}
            <Volume2 className={`w-8 h-8 sm:w-12 sm:h-12 relative z-10 ${isSpeaking ? "animate-bounce" : ""}`} />
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2" style={{ color: theme.primary }}>听听看</h2>
          <p className="text-gray-500 font-medium text-lg sm:text-2xl tracking-widest">哪个是 ( ) ？</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full pb-6">
          {options.map((option) => {
            const isThisSelected = selectedAnswer === option.id;
            const isThisCorrect = option.id === cards[currentIndex].id;
            
            let buttonStyle = { backgroundColor: 'white', borderColor: theme.accent + '33' };
            if (isThisSelected) {
              buttonStyle.backgroundColor = isThisCorrect ? '#10b981' : '#ef4444';
              buttonStyle.borderColor = isThisCorrect ? '#10b981' : '#ef4444';
            }

            return (
              <motion.button
                key={option.id}
                whileTap={{ scale: isSpeaking || selectedAnswer !== null ? 1 : 0.95 }}
                disabled={selectedAnswer !== null || isSpeaking}
                onClick={() => handleAnswer(option)}
                className={`h-24 sm:h-32 rounded-[24px] sm:rounded-[32px] border-4 flex items-center justify-center text-3xl sm:text-4xl font-bold shadow-md sm:shadow-xl transition-all relative overflow-hidden ${isSpeaking || selectedAnswer !== null ? 'opacity-90 cursor-not-allowed' : ''}`}
                style={buttonStyle}
              >
                <span className={selectedAnswer !== null && isThisSelected ? 'text-white' : 'text-gray-800'}>
                  {option.content}
                </span>
                
                {selectedAnswer !== null && isThisCorrect && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={20} className="text-white sm:w-6 sm:h-6" />
                  </div>
                )}
                {selectedAnswer !== null && isThisSelected && !isThisCorrect && (
                  <div className="absolute top-2 right-2">
                    <XCircle size={20} className="text-white sm:w-6 sm:h-6" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
