const fs = require('fs');
const path = require('path');

// 1. 定义根目录路径
const rootDir = path.resolve(__dirname, '..');

// 2. 读取和处理数据
const dataPath = path.join(rootDir, 'data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const jsonData = JSON.parse(rawData);

// 3. 验证数据结构
if (!jsonData.data?.items || !Array.isArray(jsonData.data.items)) {
  console.error('无效的数据结构:', {
    code: jsonData.code,
    msg: jsonData.msg,
    data: jsonData.data ? Object.keys(jsonData.data) : 'undefined'
  });
  process.exit(1);
}

// 4. 处理文章数据（增强类型检查）
const posts = jsonData.data.items.map((item, index) => {
  const fields = item.fields || {};
  let content = fields['内容'] || '';
  
  // 确保内容是字符串
  if (typeof content !== 'string') {
    console.warn(`文章 ${index} 内容不是字符串类型，正在转换...`);
    content = String(content);
  }

  return {
    id: fields['文章ID'] || `post-${index}`,
    title: fields['标题'] || '无标题',
    content: content, // 确保是字符串
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

fs.writeFileSync(
  path.join(rootDir, 'index.html'),
  listTemplate.replace('<!-- POST_LIST -->', postListHtml)
);

// 7. 生成详情页（增强内容处理）
const postTemplatePath = path.join(rootDir, '_templates', 'post.template.html');
const postTemplate = fs.readFileSync(postTemplatePath, 'utf8');

posts.forEach(post => {
  // 确保内容存在且为字符串
  let content = post.content || '';
  
  // 处理非字符串内容
  if (typeof content !== 'string') {
    content = JSON.stringify(content);
  }
  
  // 图片自适应处理（仅当是HTML内容时）
  if (content.includes('<img')) {
    content = content.replace(/<img/g, '<img style="max-width:100%;"');
  }

  const postHtml = postTemplate
    .replace('{{title}}', post.title)
    .replace('{{date}}', post.date)
    .replace('{{content}}', content);
  
  fs.writeFileSync(
    path.join(postsDir, `${post.id}.html`),
    postHtml
  );
});

console.log('页面生成完成！');
