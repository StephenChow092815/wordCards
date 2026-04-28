import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const successTexts = [
  "答对了，你真聪明！",
  "太棒啦，继续保持！",
  "哇，完全正确，你好棒！"
];

const failureTexts = [
  "再想想看哦！",
  "差一点点就对了，加油！",
  "没关系，我们再试一次！"
];

const FeedbackPopup = ({ type }) => {
  const { themeName } = useTheme();
  const [randomIndex, setRandomIndex] = useState(1);

  useEffect(() => {
    if (type) {
      // 1 to 3
      const idx = Math.floor(Math.random() * 3) + 1;
      setRandomIndex(idx);
      
      const filePrefix = type === 'error' ? 'failure' : 'success';
      const audioPath = `/audio/${filePrefix}_${idx}.mp3`;
      const audio = new Audio(audioPath);
      audio.play().catch(e => console.error("本地提示音播放失败:", e));
    }
  }, [type]);

  const isSuccess = type === 'success';
  const folderName = themeName === 'frozen' ? 'elsa' : themeName;
  const imgSrc = type ? `/themes/${folderName}/${isSuccess ? 'success' : 'failure'}.jpg` : '';
  
  const text = type ? (isSuccess ? successTexts[randomIndex - 1] : failureTexts[randomIndex - 1]) : '';

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          key="feedback-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            key="feedback-content"
            initial={{ scale: 0.5, y: 50, rotate: isSuccess ? -10 : 10 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              rotate: 0,
              transition: { type: 'spring', bounce: 0.5, duration: 0.6 }
            }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl border-4"
            style={{ borderColor: isSuccess ? '#10b981' : '#f43f5e' }}
          >
            <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-3xl overflow-hidden mb-4 shadow-inner relative">
              <img 
                src={imgSrc} 
                alt={isSuccess ? 'Success' : 'Failure'} 
                className={`w-full h-full object-cover ${isSuccess ? 'animate-bounce' : 'animate-pulse'}`}
              />
            </div>
            <h2 
              className="text-2xl sm:text-4xl font-black tracking-widest drop-shadow-sm text-center"
              style={{ color: isSuccess ? '#10b981' : '#f43f5e' }}
            >
              {text}
            </h2>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackPopup;
