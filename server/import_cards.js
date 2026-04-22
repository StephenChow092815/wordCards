const fs = require('fs');
const path = require('path');
const db = require('./db');

/**
 * 导入脚本 (一对多版本)
 * 1. cards 表直接存储 tag_id
 * 2. 如果有多个标签，取第一个作为主分类
 */

async function importCards() {
  const filePath = path.join(__dirname, 'cards.txt');
  
  if (!fs.existsSync(filePath)) {
    console.error('错误：未找到 cards.txt 文件');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  console.log(`开始处理 ${lines.length} 条数据 (一对多模式)...`);

  const checkCard = db.prepare('SELECT id FROM cards WHERE content = ? AND user_id = 1');
  const insertCard = db.prepare('INSERT INTO cards (user_id, tag_id, content, pinyin) VALUES (?, ?, ?, ?)');
  const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
  const insertTag = db.prepare('INSERT INTO tags (name) VALUES (?)');

  let addedCount = 0;
  let skippedCount = 0;

  const transaction = db.transaction((dataLines) => {
    for (const line of dataLines) {
      const trimmedLine = line.trim();
      const firstSpace = trimmedLine.indexOf(' ');
      if (firstSpace === -1) continue;

      const word = trimmedLine.substring(0, firstSpace);
      const rest = trimmedLine.substring(firstSpace).trim();
      
      const firstChineseIdx = rest.search(/[\u4e00-\u9fa5]/);
      let pinyin, tagsPart;

      if (firstChineseIdx === -1) {
        pinyin = rest;
        tagsPart = '未分类';
      } else {
        pinyin = rest.substring(0, firstChineseIdx).trim();
        tagsPart = rest.substring(firstChineseIdx).trim();
      }

      // 处理标签：取第一个标签
      const firstTagName = tagsPart.split(/[，,]/).map(t => t.trim()).filter(t => t)[0] || '未分类';

      // 1. 确保标签存在
      let tag = getTagId.get(firstTagName);
      let tagId;
      if (!tag) {
        tagId = insertTag.run(firstTagName).lastInsertRowid;
      } else {
        tagId = tag.id;
      }

      // 2. 插入字卡
      if (checkCard.get(word)) {
        skippedCount++;
        continue;
      }

      insertCard.run(1, tagId, word, pinyin);
      addedCount++;
    }
  });

  transaction(lines);

  console.log('---------------------------');
  console.log(`导入完成！`);
  console.log(`- 新增字卡：${addedCount} 条`);
  console.log(`- 跳过重复：${skippedCount} 条`);
  console.log('---------------------------');
}

module.exports = importCards;

if (require.main === module) {
  importCards().catch(console.error);
}
