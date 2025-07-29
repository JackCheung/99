const fs = require('fs');
const path = require('path');

// 获取当前脚本所在目录的上级目录（项目根目录）
const rootDir = path.resolve(__dirname, '..');

// 读取飞书数据
const rawData = fs.readFileSync(path.join(rootDir, 'data.json'), 'utf8');
const jsonData = JSON.parse(rawData);

// 添加数据结构验证
if (!jsonData.data || !Array.isArray(jsonData.data.records)) {
  throw new Error('Invalid JSON structure: Missing data.records array');
}

const posts = jsonData.data.records.map(record => ({
  id: record.fields['文章ID'],
  title: record.fields['标题'],
  content: record.fields['内容'],
  date: record.fields['发布日期'],
  summary: record.fields['摘要']
}));

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
  let content = post.content.replace(/<img/g, '<img style="max-width:100%;"'); // 图片自适应
  const postHtml = postTemplate
    .replace('{{title}}', post.title)
    .replace('{{date}}', post.date)
    .replace('{{content}}', content);
    
  fs.writeFileSync(path.join(postsDir, `${post.id}.html`), postHtml);
});
