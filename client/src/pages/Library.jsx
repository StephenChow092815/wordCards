import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Plus, Trash2, Search, CloudDownload } from 'lucide-react';
import { pinyin } from 'pinyin-pro';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const Library = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const { theme } = useTheme();
  const [cards, setCards] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({ content: '', pinyin: '', tags: '' });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const token = localStorage.getItem('token');
    const { data } = await axios.get('/api/cards', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sortedCards = [...data].sort((a, b) => b.id - a.id);
    setCards(sortedCards);
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('/api/cards/sync', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`同步成功！新增了 ${data.count} 个字卡`, 'success');
      fetchCards();
    } catch (err) {
      showToast(err.response?.data?.error || '同步失败', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/cards', newCard, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCard({ content: '', pinyin: '', tags: '' });
      setShowAdd(false);
      fetchCards();
      showToast('添加成功！新的魔法卡已入库', 'success');
    } catch (err) {
      if (err.response?.data?.error) {
        showToast(err.response.data.error, 'error');
      } else {
        showToast('添加失败，请稍后重试', 'error');
      }
    }
  };

  const handleContentChange = (e) => {
    const content = e.target.value;
    const generatedPinyin = pinyin(content);
    setNewCard({ ...newCard, content, pinyin: generatedPinyin });
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto min-h-0 transition-colors duration-500" style={{ backgroundColor: 'white' }}>
      <div className="flex items-center justify-between mb-4 sm:mb-8 shrink-0">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 rounded-full shadow-sm"
          style={{ backgroundColor: theme.secondary, color: theme.primary }}
        >
          <ChevronLeft />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">字卡库</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`p-2 rounded-full shadow-sm ${isSyncing ? 'animate-spin' : ''}`}
            style={{ backgroundColor: theme.secondary, color: theme.primary }}
          >
            <CloudDownload size={20} />
          </button>
          <button 
            onClick={() => setShowAdd(true)} 
            className="p-2 text-white rounded-full shadow-lg"
            style={{ backgroundColor: theme.primary }}
          >
            <Plus />
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[32px] sm:rounded-t-[40px] p-6 sm:p-8 animate-bubble">
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ color: theme.primary }}>添加新魔法卡</h3>
            <form onSubmit={handleAdd} className="space-y-3 sm:space-y-4">
              <input
                type="text"
                placeholder="汉字 (如: 苹果)"
                className="w-full p-3 sm:p-4 rounded-2xl outline-none"
                style={{ backgroundColor: theme.secondary }}
                value={newCard.content}
                onChange={handleContentChange}
                required
              />
              <input
                type="text"
                placeholder="自动生成拼音"
                className="w-full p-3 sm:p-4 bg-gray-50 text-gray-400 rounded-2xl outline-none cursor-not-allowed text-sm sm:text-base"
                value={newCard.pinyin}
                readOnly
              />
              <input
                type="text"
                placeholder="标签 (以逗号隔开)"
                className="w-full p-3 sm:p-4 rounded-2xl outline-none"
                style={{ backgroundColor: theme.secondary }}
                value={newCard.tags}
                onChange={(e) => setNewCard({ ...newCard, tags: e.target.value })}
              />
              <div className="flex space-x-3 sm:space-x-4 mt-2 sm:mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 sm:py-4 text-gray-400 font-bold text-sm sm:text-base"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 sm:py-4 text-white rounded-2xl font-bold shadow-lg text-sm sm:text-base"
                  style={{ backgroundColor: theme.primary, boxShadow: `0 10px 20px ${theme.primary}33` }}
                >
                  确定添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4 pb-12 sm:pb-20">
        {cards.map((card) => (
          <div 
            key={card.id} 
            className="p-4 sm:p-5 rounded-[24px] sm:rounded-3xl border flex items-center justify-between"
            style={{ backgroundColor: theme.secondary + '66', borderColor: theme.accent + '22' }}
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-white rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold text-gray-700 shadow-sm">
                {card.content.charAt(0)}
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <p className="font-bold text-base sm:text-lg text-gray-700">{card.content}</p>
                  <p className="text-xs sm:text-sm font-medium" style={{ color: theme.accent }}>{card.pinyin}</p>
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {card.tags?.split(',').map(t => (
                    <span 
                      key={t} 
                      className="text-[10px] px-2 py-0.5 rounded-full border mb-1"
                      style={{ backgroundColor: 'white', color: theme.primary, borderColor: theme.accent + '33' }}
                    >
                      {t.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button className="text-gray-300 hover:text-rose-500 p-2 shrink-0">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
