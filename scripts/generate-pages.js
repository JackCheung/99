const fs = require('fs');
const path = require('path');

// 1. 获取项目根目录（脚本所在目录的上级目录）
const rootDir = path.resolve(__dirname, '..');

// 2. 读取数据文件
const dataPath = path.join(rootDir, 'data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const jsonData = JSON.parse(rawData);

// 3. 验证数据结构
if (!jsonData.data || !Array.isArray(jsonData.data.items)) {
  console.error('Invalid JSON structure:', {
    code: jsonData.code,
    msg: jsonData.msg,
    dataKeys: jsonData.data ? Object.keys(jsonData.data) : null
  });
  process.exit(1);
}

// 4. 处理文章数据
const posts = jsonData.data.items.map((item, index) => ({
  id: item.fields?.['文章ID'] || item.id || `post-${index}`,
  title: item.fields?.['标题'] || item.title || '无标题',
  content: item.fields?.['内容'] || item.content || '',
  date: item.fields?.['发布日期'] || item.date || new Date().toISOString().split('T')[0],
  summary: item.fields?.['摘要'] || item.summary || ''
}));

console.log(`成功加载 ${posts.length} 篇文章`);

// 5. 生成页面
try {
  // 读取模板
  const listTemplate = fs.readFileSync(
    path.join(rootDir, '_templates/index.template.html'), 
    'utf8'
  );
  const postTemplate = fs.readFileSync(
    path.join(rootDir, '_templates/post.template.html'),
    'utf8'
  );

  // 生成列表页
  const postListHtml = posts.map(post => `
    <div class="post-item">
      <h2><a href="/posts/${post.id}.html">${post.title}</a></h2>
      <p class="post-meta">${post.date}</p>
      <p>${post.summary}</p>
    </div>
  `).join('');

  fs.writeFileSync(
    path.join(rootDir, 'index.html'),
    listTemplate.replace('<!-- POST_LIST -->', postListHtml)
  );

  // 生成详情页
  const postsDir = path.join(rootDir, 'posts');
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir);

  posts.forEach(post => {
    const postHtml = postTemplate
      .replace('{{title}}', post.title)
      .replace('{{date}}', post.date)
      .replace('{{content}}', post.content);
    
    fs.writeFileSync(
      path.join(postsDir, `${post.id}.html`),
      postHtml
    );
  });

  console.log('页面生成完成！');
} catch (err) {
  console.error('生成页面时出错:', err);
  process.exit(1);
}
