import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, CheckCircle2, XCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const Quiz = () => {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  
  const navigate = useNavigate();
  const { theme, themeName } = useTheme();
  const showToast = useToast();

  useEffect(() => {
    fetchCards();
  }, []);

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

  const generateOptions = (allQuizCards, index, pool) => {
    const correct = allQuizCards[index];
    const distractors = pool
      .filter(c => c.id !== correct.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const combined = [correct, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(combined);
    
    setTimeout(() => {
      speak(`哪个是 ${correct.content} ？`);
    }, 500);
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleAnswer = async (option) => {
    if (isTransitioning || selectedAnswer !== null) return;
    
    const correct = cards[currentIndex];
    const isRight = option.id === correct.id;
    
    setSelectedAnswer(option.id);
    setIsCorrect(isRight);
    
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

    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setSelectedAnswer(null);
          setIsCorrect(null);
          generateOptions(cards, nextIndex, cards);
          setIsTransitioning(false);
        }, 500);
      } else {
        showToast('太棒了！全部听认完成！', 'success');
        navigate('/');
      }
    }, 1500);
  };

  if (loading) return null;

  return (
    <div className="flex-1 flex flex-col p-6 relative overflow-hidden transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none transition-all duration-1000" 
        style={{ 
          backgroundImage: `url(${theme.bg})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} 
      />

      <div className="flex items-center justify-between mb-8 relative z-10">
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

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="bg-white/90 backdrop-blur-md rounded-[48px] p-10 w-full max-w-sm shadow-2xl border-4 flex flex-col items-center text-center mb-12"
          style={{ borderColor: theme.accent + '33' }}
        >
          <button 
            onClick={() => speak(`哪个是 ${cards[currentIndex].content} ？`)}
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg transition-transform active:scale-90"
            style={{ backgroundColor: theme.primary, color: 'white' }}
          >
            <Volume2 size={48} className="animate-pulse" />
          </button>
          <h2 className="text-3xl font-bold mb-2" style={{ color: theme.primary }}>听听看</h2>
          <p className="text-gray-500 font-medium text-2xl tracking-widest">哪个是 ( ) ？</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
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
                whileTap={{ scale: 0.95 }}
                disabled={selectedAnswer !== null}
                onClick={() => handleAnswer(option)}
                className={`h-32 rounded-[32px] border-4 flex items-center justify-center text-4xl font-bold shadow-xl transition-all relative overflow-hidden`}
                style={buttonStyle}
              >
                <span className={selectedAnswer !== null && isThisSelected ? 'text-white' : 'text-gray-800'}>
                  {option.content}
                </span>
                
                {selectedAnswer !== null && isThisCorrect && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={24} className="text-white" />
                  </div>
                )}
                {selectedAnswer !== null && isThisSelected && !isThisCorrect && (
                  <div className="absolute top-2 right-2">
                    <XCircle size={24} className="text-white" />
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
