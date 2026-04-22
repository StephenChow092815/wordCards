const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'server.log');

function log(msg) {
  const time = new Date().toISOString();
  fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware for authentication
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Missing phone or password' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const info = db.prepare('INSERT INTO users (phone, password) VALUES (?, ?)').run(phone, hashedPassword);
    res.json({ message: 'User registered', userId: info.lastInsertRowid });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid phone or password' });
  }

  const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, phone: user.phone } });
});

// --- Card Routes ---

app.get('/api/cards', authenticate, (req, res) => {
  const { tag } = req.query;
  let cards;
  
  if (tag === 'mistake') {
    cards = db.prepare(`
      SELECT c.*, t.name as tags 
      FROM cards c
      JOIN mistakes m ON c.id = m.card_id
      LEFT JOIN tags t ON c.tag_id = t.id
      WHERE m.user_id = ? AND m.is_hidden = 0
      ORDER BY c.id DESC
    `).all(req.user.id);
  } else if (tag) {
    cards = db.prepare(`
      SELECT c.*, t.name as tags 
      FROM cards c
      JOIN tags t ON c.tag_id = t.id
      WHERE c.user_id = ? AND t.name = ?
      ORDER BY c.id DESC
    `).all(req.user.id, tag);
  } else {
    cards = db.prepare(`
      SELECT c.*, t.name as tags 
      FROM cards c
      LEFT JOIN tags t ON c.tag_id = t.id
      WHERE c.user_id = ?
      ORDER BY c.id DESC
    `).all(req.user.id);
  }

  res.json(cards);
});

app.get('/api/tags', authenticate, (req, res) => {
  const tags = db.prepare(`
    SELECT DISTINCT t.name FROM tags t
    JOIN cards c ON t.id = c.tag_id
    WHERE c.user_id = ?
  `).all(req.user.id);
  
  res.json(['全部', ...tags.map(t => t.name)]);
});

app.post('/api/cards', authenticate, (req, res) => {
  let { content, pinyin, tags } = req.body;
  content = content?.trim();
  log(`POST /api/cards - content: ${content}, user: ${req.user.id}`);
  
  if (!content) return res.status(400).json({ error: '汉字内容不能为空' });

  // 检查是否已存在相同的汉字内容
  const existing = db.prepare('SELECT id FROM cards WHERE user_id = ? AND content = ?').get(req.user.id, content);
  if (existing) {
    log(`Duplicate found for: ${content}`);
    return res.status(400).json({ error: '该字卡已存在，请勿重复添加' });
  }

  const firstTag = tags ? tags.split(/[，,]/)[0].trim() : '未分类';

  const transaction = db.transaction(() => {
    let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(firstTag);
    let tagId;
    if (!tag) {
      tagId = db.prepare('INSERT INTO tags (name) VALUES (?)').run(firstTag).lastInsertRowid;
    } else {
      tagId = tag.id;
    }

    const info = db.prepare('INSERT INTO cards (user_id, tag_id, content, pinyin) VALUES (?, ?, ?, ?)').run(req.user.id, tagId, content, pinyin);
    return info.lastInsertRowid;
  });

  const cardId = transaction();
  res.json({ id: cardId });
});

// --- Mistake Routes ---

app.get('/api/mistakes', authenticate, (req, res) => {
  const mistakes = db.prepare(`
    SELECT c.*, m.miss_count, m.last_missed 
    FROM mistakes m 
    JOIN cards c ON m.card_id = c.id 
    WHERE m.user_id = ? AND m.is_hidden = 0
  `).all(req.user.id);
  res.json(mistakes);
});

app.post('/api/mistakes', authenticate, (req, res) => {
  const { card_id } = req.body;
  try {
    db.prepare(`
      INSERT INTO mistakes (user_id, card_id, is_hidden) 
      VALUES (?, ?, 0) 
      ON CONFLICT(user_id, card_id) DO UPDATE SET 
        miss_count = miss_count + 1,
        last_missed = CURRENT_TIMESTAMP,
        is_hidden = 0
    `).run(req.user.id, card_id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/mistakes/:cardId', authenticate, (req, res) => {
  const { cardId } = req.params;
  try {
    db.prepare('UPDATE mistakes SET is_hidden = 1 WHERE user_id = ? AND card_id = ?').run(req.user.id, cardId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Study Log Routes ---

app.post('/api/study/log', authenticate, (req, res) => {
  const { card_id, action = 'recognized' } = req.body;
  try {
    db.prepare('INSERT INTO study_logs (user_id, card_id, action) VALUES (?, ?, ?)').run(req.user.id, card_id, action);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/study/today', authenticate, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT COUNT(DISTINCT card_id) as count 
      FROM study_logs 
      WHERE user_id = ? AND DATE(created_at, 'localtime') = DATE('now', 'localtime')
    `).get(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Seed initial data if cards table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM cards').get().count;
  if (count === 0) {
    console.log('检测到数据库为空，开始初始化...');
    try {
      // 1. 创建默认用户 (用于承载初始导入的字卡)
      const hashedPassword = bcrypt.hashSync('123456', 10);
      db.prepare('INSERT OR IGNORE INTO users (id, phone, password) VALUES (?, ?, ?)').run(1, '13800138000', hashedPassword);
      
      // 2. 调用导入脚本从 cards.txt 导入数据
      const importCards = require('./import_cards');
      importCards().then(() => {
        console.log('初始化数据导入完成！(默认账号: 13800138000 / 123456)');
      }).catch(err => {
        console.error('初始化导入脚本执行失败:', err);
      });
    } catch (e) {
      console.error('创建初始用户失败:', e);
    }
  }
});
