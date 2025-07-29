const fs = require('fs');
const path = require('path');

// 1. 定义根目录路径（脚本所在目录的上级目录）
const rootDir = path.resolve(__dirname, '..');

// 2. 读取和处理数据
const dataPath = path.join(rootDir, 'data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const jsonData = JSON.parse(rawData);

// 3. 验证数据结构并提取记录
if (!jsonData.data || !jsonData.data.items || !Array.isArray(jsonData.data.items)) {
  console.error('无效的数据结构，顶层字段:', Object.keys(jsonData));
  if (jsonData.data) console.error('data对象字段:', Object.keys(jsonData.data));
  throw new Error('无法找到文章数据，请检查data.json格式');
}

const records = jsonData.data.items;

// 4. 处理文章数据
const posts = records.map((item, index) => {
  // 确保字段存在
  const fields = item.fields || {};
  
  return {
    id: fields['文章ID'] || `post-${index}`,
    title: fields['标题'] || '无标题',
    content: fields['内容'] || '',
    date: fields['发布日期'] || new Date().toISOString().split('T')[0],
    summary: fields['摘要'] || ''
  };
});

console.log(`成功处理 ${posts.length} 篇文章`);

// 5. 创建必要目录
const postsDir = path.join(rootDir, 'posts');
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir);
}

// 6. 生成列表页
const listTemplatePath = path.join(rootDir, '_templates', 'index.template.html');
const listTemplate = fs.readFileSync(listTemplatePath, 'utf8');

const postListHtml = posts.map(post => `
  <div class="post-item">
    <h2><a href="/posts/${post.id}.html">${post.title}</a></h2>
    <p class="post-meta">${post.date}</p>
    <p>${post.summary}</p>
  </div>
`).join('');

const indexHtml = listTemplate.replace('<!-- POST_LIST -->', postListHtml);
fs.writeFileSync(path.join(rootDir, 'index.html'), indexHtml);

// 7. 生成详情页
const postTemplatePath = path.join(rootDir, '_templates', 'post.template.html');
const postTemplate = fs.readFileSync(postTemplatePath, 'utf8');

posts.forEach(post => {
  // 图片自适应处理
  const content = post.content.replace(/<img/g, '<img style="max-width:100%;"');
  
  const postHtml = postTemplate
    .replace('{{title}}', post.title)
    .replace('{{date}}', post.date)
    .replace('{{content}}', content);
  
  fs.writeFileSync(path.join(postsDir, `${post.id}.html`), postHtml);
});

console.log('页面生成完成！');
