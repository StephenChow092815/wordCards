import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, CheckCircle2, XCircle, Calculator } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { speak } from '../utils/speech';

const MathQuiz = () => {
  const [problem, setProblem] = useState(null);
  const [options, setOptions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalRounds] = useState(20); // 20 problems per session
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
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
      // For subtraction, ensure result is non-negative
      if (a < b) [a, b] = [b, a];
      question = `${a} - ${b} = ( ) ?`;
      answer = a - b;
    }

    // Generate 4 options
    const correct = answer;
    const distractors = new Set();
    while (distractors.size < 3) {
      const d = Math.floor(Math.random() * 11); // 0-10
      if (d !== correct) distractors.add(d);
    }
    
    const combined = [correct, ...Array.from(distractors)].sort(() => Math.random() - 0.5);
    
    setProblem({ question, answer, a, b, isAddition });
    setOptions(combined);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  // Ensure speech is always synced with the current problem in state
  useEffect(() => {
    if (problem && hasStarted) {
      const speechText = `${problem.a} ${problem.isAddition ? '加' : '减'} ${problem.b} 等于几？`;
      // Small delay to ensure UI transition has completed
      const timer = setTimeout(() => {
        speak(speechText);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [problem, hasStarted]);

  const handleStart = () => {
    setHasStarted(true);
    generateProblem();
  };

  // Using imported speak utility

  const handleAnswer = async (option) => {
    if (isTransitioning || selectedAnswer !== null) return;
    
    const isRight = option === problem.answer;
    setSelectedAnswer(option);
    setIsCorrect(isRight);
    
    // Feedback voice
    speak(isRight ? '答对了，你真聪明！' : '再想想看哦');

    if (!isRight) {
      // Log math mistake
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
      if (currentIndex < totalRounds - 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          generateProblem();
          setIsTransitioning(false);
        }, 500);
      } else {
        showToast('太棒了！20道题全部完成了！', 'success');
        navigate('/');
      }
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col p-6 relative overflow-hidden transition-colors duration-500" style={{ backgroundColor: theme.secondary }}>
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
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xl p-10 text-center"
          >
            <div 
              className="w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl border-4 border-white"
              style={{ backgroundColor: '#10b981', color: 'white' }}
            >
              <Calculator size={48} />
            </div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#059669' }}>准备好了吗？</h2>
            <p className="text-gray-500 mb-10 text-lg">点击下方按钮开启算术挑战吧！</p>
            <button 
              onClick={handleStart}
              className="px-12 py-5 text-white font-bold text-2xl rounded-full shadow-2xl transition-all active:scale-90"
              style={{ backgroundColor: '#10b981' }}
            >
              开始挑战
            </button>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col relative z-10">
            <div className="flex items-center justify-between mb-8">
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

            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/90 backdrop-blur-md rounded-[48px] p-10 w-full max-w-sm shadow-2xl border-4 flex flex-col items-center text-center mb-12"
                style={{ borderColor: theme.accent + '33' }}
              >
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                  style={{ backgroundColor: theme.primary, color: 'white' }}
                >
                  <Calculator size={40} />
                </div>
                <h2 className="text-4xl font-bold mb-4 tracking-tighter" style={{ color: theme.primary }}>
                  {problem?.question}
                </h2>
                <button 
                  onClick={() => speak(`${problem.a} ${problem.isAddition ? '加' : '减'} ${problem.b} 等于几？`)}
                  className="flex items-center space-x-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: theme.primary }}
                >
                  <Volume2 size={16} />
                  <span>听一遍</span>
                </button>
              </motion.div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
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
                      whileTap={{ scale: 0.95 }}
                      disabled={selectedAnswer !== null}
                      onClick={() => handleAnswer(option)}
                      className={`h-28 rounded-[32px] border-4 flex items-center justify-center text-4xl font-bold shadow-xl transition-all relative overflow-hidden`}
                      style={buttonStyle}
                    >
                      <span className={selectedAnswer !== null && isThisSelected ? 'text-white' : 'text-gray-800'}>
                        {option}
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default MathQuiz;
