import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, CheckCircle2, XCircle, Calculator } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { speak } from '../utils/speech';
import FeedbackPopup from '../components/FeedbackPopup';

const MathQuiz = () => {
  const [problem, setProblem] = useState(null);
  const [options, setOptions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalRounds] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'success' | 'error' | null
  
  const navigate = useNavigate();
  const { theme } = useTheme();
  const showToast = useToast();

  const generateProblem = () => {
    const isAddition = Math.random() > 0.5;
    let a = Math.floor(Math.random() * 6); // 0-5
    let b = Math.floor(Math.random() * 6); // 0-5
    
    let question, answer;
    if (isAddition) {
      question = `${a} + ${b} = ( ) ?`;
      answer = a + b;
    } else {
      if (a < b) [a, b] = [b, a];
      question = `${a} - ${b} = ( ) ?`;
      answer = a - b;
    }

    const correct = answer;
    const distractors = new Set();
    while (distractors.size < 3) {
      const d = Math.floor(Math.random() * 11);
      if (d !== correct) distractors.add(d);
    }
    
    const combined = [correct, ...Array.from(distractors)].sort(() => Math.random() - 0.5);
    
    setProblem({ question, answer, a, b, isAddition });
    setOptions(combined);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  useEffect(() => {
    if (problem && hasStarted) {
      const speechText = `${problem.a} ${problem.isAddition ? '加' : '减'} ${problem.b} 等于几？`;
      const timer = setTimeout(async () => {
        setIsSpeaking(true);
        await speak(speechText);
        setIsSpeaking(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [problem, hasStarted]);

  const handleStart = () => {
    setHasStarted(true);
    generateProblem();
  };

  const handleAnswer = async (option) => {
    if (isTransitioning || selectedAnswer !== null || isSpeaking) return;
    
    const isRight = option === problem.answer;
    setSelectedAnswer(option);
    setIsCorrect(isRight);
    
    // 显示视觉反馈动画，替代语音
    setFeedback(isRight ? 'success' : 'error');

    if (!isRight) {
      try {
        const token = localStorage.getItem('token');
        await axios.post('/api/math-mistakes', { 
          problem: problem.question.replace('( ) ?', problem.answer), 
          answer: problem.answer.toString() 
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to log math mistake', err);
      }
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex < totalRounds - 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          generateProblem();
          setIsTransitioning(false);
        }, 300);
      } else {
        showToast('太棒了！20道题全部完成了！', 'success');
        navigate('/');
      }
    }, 1500); // 展示1.5秒的反馈动画
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 relative overflow-y-auto transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
      <FeedbackPopup type={feedback} />
      
      {/* Background Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none transition-all duration-1000" 
        style={{ 
          backgroundImage: `url(${theme.bg})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} 
      />

      <AnimatePresence>
        {!hasStarted ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xl p-6 sm:p-10 text-center overflow-y-auto"
          >
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] sm:rounded-[32px] flex items-center justify-center mb-6 sm:mb-8 shadow-2xl border-4 border-white shrink-0"
              style={{ backgroundColor: '#10b981', color: 'white' }}
            >
              <Calculator className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4" style={{ color: '#059669' }}>准备好了吗？</h2>
            <p className="text-gray-500 mb-8 sm:mb-10 text-base sm:text-lg">点击下方按钮开启算术挑战吧！</p>
            <button 
              onClick={handleStart}
              className="px-8 sm:px-12 py-4 sm:py-5 text-white font-bold text-xl sm:text-2xl rounded-full shadow-2xl transition-all active:scale-90"
              style={{ backgroundColor: '#10b981' }}
            >
              开始挑战
            </button>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col relative z-10">
            <div className="flex items-center justify-between mb-4 sm:mb-8 shrink-0">
              <button 
                onClick={() => navigate('/')} 
                className="p-2 rounded-full shadow-sm"
                style={{ backgroundColor: 'white', color: theme.primary }}
              >
                <ChevronLeft />
              </button>
              <div className="flex items-center space-x-2">
                <span className="px-4 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: theme.primary }}>
                  算术挑战 {currentIndex + 1}/{totalRounds}
                </span>
              </div>
              <div className="w-10" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/90 backdrop-blur-md rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 w-full shadow-xl sm:shadow-2xl border-4 flex flex-col items-center text-center mb-6 sm:mb-12 shrink-0"
                style={{ borderColor: theme.accent + '33' }}
              >
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg"
                  style={{ backgroundColor: theme.primary, color: 'white' }}
                >
                  <Calculator className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-4 tracking-tighter" style={{ color: theme.primary }}>
                  {problem?.question}
                </h2>
                <button 
                  disabled={isSpeaking}
                  onClick={async () => {
                    if (!isSpeaking) {
                      setIsSpeaking(true);
                      await speak(`${problem.a} ${problem.isAddition ? '加' : '减'} ${problem.b} 等于几？`);
                      setIsSpeaking(false);
                    }
                  }}
                  className={`flex items-center space-x-2 text-sm font-bold opacity-60 hover:opacity-100 transition-all ${isSpeaking ? 'opacity-100' : ''}`}
                  style={{ color: theme.primary }}
                >
                  <div className="relative flex items-center justify-center">
                    {isSpeaking && (
                      <>
                        <span className="absolute inline-flex h-6 w-6 rounded-full bg-current opacity-40 animate-ping" style={{ animationDuration: '1.5s' }}></span>
                        <span className="absolute inline-flex h-8 w-8 rounded-full bg-current opacity-20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.4s' }}></span>
                      </>
                    )}
                    <Volume2 size={16} className={`relative z-10 ${isSpeaking ? "animate-bounce" : ""}`} />
                  </div>
                  <span>{isSpeaking ? '正在发音...' : '听一遍'}</span>
                </button>
              </motion.div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full pb-6">
                {options.map((option, idx) => {
                  const isThisSelected = selectedAnswer === option;
                  const isThisCorrect = option === problem.answer;
                  
                  let buttonStyle = { backgroundColor: 'white', borderColor: theme.accent + '33' };
                  if (isThisSelected) {
                    buttonStyle.backgroundColor = isThisCorrect ? '#10b981' : '#ef4444';
                    buttonStyle.borderColor = isThisCorrect ? '#10b981' : '#ef4444';
                  }

                  return (
                    <motion.button
                      key={`${currentIndex}-${idx}`}
                      whileTap={{ scale: isSpeaking || selectedAnswer !== null ? 1 : 0.95 }}
                      disabled={selectedAnswer !== null || isSpeaking}
                      onClick={() => handleAnswer(option)}
                      className={`h-24 sm:h-28 rounded-[24px] sm:rounded-[32px] border-4 flex items-center justify-center text-3xl sm:text-4xl font-bold shadow-md sm:shadow-xl transition-all relative overflow-hidden ${isSpeaking || selectedAnswer !== null ? 'opacity-90 cursor-not-allowed' : ''}`}
                      style={buttonStyle}
                    >
                      <span className={selectedAnswer !== null && isThisSelected ? 'text-white' : 'text-gray-800'}>
                        {option}
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default MathQuiz;
