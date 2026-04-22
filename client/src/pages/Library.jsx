import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Plus, Trash2, Search, Tag } from 'lucide-react';
import { pinyin } from 'pinyin-pro';
import { useToast } from '../context/ToastContext';

const Library = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const [cards, setCards] = useState([]);
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
    // 增加前端排序兜底，确保 ID 最大的（最新添加的）排在最前面
    const sortedCards = [...data].sort((a, b) => b.id - a.id);
    setCards(sortedCards);
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
    // 自动生成带声调的拼音
    const generatedPinyin = pinyin(content);
    setNewCard({ ...newCard, content, pinyin: generatedPinyin });
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-white overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/')} className="p-2 text-pink-500 bg-pink-50 rounded-full">
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold text-gray-800">字卡库</h2>
        <button onClick={() => setShowAdd(true)} className="p-2 text-white bg-pink-500 rounded-full shadow-lg">
          <Plus />
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[40px] p-8 animate-bubble">
            <h3 className="text-xl font-bold mb-6 text-pink-600">添加新魔法卡</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input
                type="text"
                placeholder="汉字 (如: 苹果)"
                className="w-full p-4 bg-pink-50 rounded-2xl outline-none"
                value={newCard.content}
                onChange={handleContentChange}
                required
              />
              <input
                type="text"
                placeholder="自动生成拼音"
                className="w-full p-4 bg-gray-50 text-gray-400 rounded-2xl outline-none cursor-not-allowed"
                value={newCard.pinyin}
                readOnly
              />
              <input
                type="text"
                placeholder="标签 (以逗号隔开)"
                className="w-full p-4 bg-pink-50 rounded-2xl outline-none"
                value={newCard.tags}
                onChange={(e) => setNewCard({ ...newCard, tags: e.target.value })}
              />
              <div className="flex space-x-4 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-4 text-gray-400 font-bold"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-100"
                >
                  确定添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {cards.map((card) => (
          <div key={card.id} className="p-5 bg-pink-50/50 rounded-3xl border border-pink-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 flex-shrink-0 bg-white rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-700 shadow-sm">
                {card.content.charAt(0)}
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <p className="font-bold text-lg text-gray-700">{card.content}</p>
                  <p className="text-sm text-pink-400 font-medium">{card.pinyin}</p>
                </div>
                <div className="flex gap-1 mt-1">
                  {card.tags?.split(',').map(t => (
                    <span key={t} className="text-[10px] bg-white px-2 py-0.5 rounded-full text-pink-300 border border-pink-50">{t.trim()}</span>
                  ))}
                </div>
              </div>
            </div>
            <button className="text-gray-300 hover:text-rose-500 p-2">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
