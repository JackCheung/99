const fs = require('fs');
const path = require('path');

// 1. 获取数据文件
const dataPath = path.join(__dirname, '..', 'data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const jsonData = JSON.parse(rawData);

// 2. 调试输出
console.log('JSON顶层字段:', Object.keys(jsonData));
if (jsonData.data) console.log('data字段:', Object.keys(jsonData.data));

// 3. 获取记录数组
let records = [];
if (Array.isArray(jsonData)) {
  records = jsonData;
} else if (jsonData.records) {
  records = jsonData.records;
} else if (jsonData.data?.items) {
  records = jsonData.data.items;
} else {
  // 深度搜索
  const findArray = (obj) => {
    if (Array.isArray(obj)) return obj;
    for (const key in obj) {
      if (Array.isArray(obj[key])) return obj[key];
      if (typeof obj[key] === 'object') {
        const found = findArray(obj[key]);
        if (found) return found;
      }
    }
  };
  records = findArray(jsonData) || [];
}

if (records.length === 0) {
  throw new Error('未找到文章数据，请检查data.json格式');
}

// 4. 处理文章数据
const posts = records.map((record, i) => ({
  id: record.fields?.['文章ID'] || record.id || `post-${i}`,
  title: record.fields?.['标题'] || record.title || '无标题',
  content: record.fields?.['内容'] || record.content || '',
  date: record.fields?.['发布日期'] || record.date || new Date().toISOString().split('T')[0],
  summary: record.fields?.['摘要'] || record.summary || ''
}));

// 5. 后续页面生成代码...

// 生成列表页
const listTemplate = fs.readFileSync(path.join(rootDir, '_templates/index.template.html'), 'utf8');
const postListHtml = posts.map(post => `
  <div class="post-item">
    <h2><a href="/posts/${post.id}.html" class="post-title">${post.title}</a></h2>
    <p class="post-meta">${post.date}</p>
    <p>${post.summary}</p>
  </div>
`).join('');

const indexHtml = listTemplate.replace('<!-- POST_LIST -->', postListHtml);
fs.writeFileSync(path.join(rootDir, 'index.html'), indexHtml);

// 生成详情页
const postTemplate = fs.readFileSync(path.join(rootDir, '_templates/post.template.html'), 'utf8');
const postsDir = path.join(rootDir, 'posts');
if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir);

posts.forEach(post => {
  let content = post.content.replace(/<img/g, '<img style="max-width:100%;"');
  const postHtml = postTemplate
    .replace('{{title}}', post.title)
    .replace('{{date}}', post.date)
    .replace('{{content}}', content);
    
  fs.writeFileSync(path.join(postsDir, `${post.id}.html`), postHtml);
});
