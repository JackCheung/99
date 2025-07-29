const fs = require('fs');
const path = require('path');

// 1. 定义根目录路径
const rootDir = path.resolve(__dirname, '..');

// 2. 增强型内容处理函数
const processContent = (content) => {
  if (content === null || content === undefined) return '';
  
  // 转换非字符串内容
  const strContent = typeof content === 'string' ? content : JSON.stringify(content);
  
  // 安全处理HTML内容
  if (strContent.includes('<img')) {
    return strContent.replace(/<img/g, '<img style="max-width:100%;height:auto;"');
  }
  return strContent;
};

// 3. 读取和处理数据
try {
  const dataPath = path.join(rootDir, 'data.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const jsonData = JSON.parse(rawData);

  // 4. 验证数据结构
  if (!jsonData.data?.items || !Array.isArray(jsonData.data.items)) {
    throw new Error('无效的数据结构，缺少data.items数组');
  }

  // 5. 处理文章数据（增强兼容性）
  const posts = jsonData.data.items.map((item, index) => {
    const fields = item.fields || {};
    return {
      id: fields['文章ID'] || `post-${index}`,
      title: fields['标题'] || '无标题',
      content: processContent(fields['内容']), // 使用处理函数
      date: fields['发布日期'] || new Date().toISOString().split('T')[0],
      summary: fields['摘要'] || ''
    };
  });

  console.log(`成功处理 ${posts.length} 篇文章`);

  // 6. 创建目录
  const postsDir = path.join(rootDir, 'posts');
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  // 7. 生成页面
  const listTemplate = fs.readFileSync(
    path.join(rootDir, '_templates', 'index.template.html'), 
    'utf8'
  );
  
  const postTemplate = fs.readFileSync(
    path.join(rootDir, '_templates', 'post.template.html'),
    'utf8'
  );

  // 生成列表页
  const postListHtml = posts.map(post => `
    <article class="post">
      <h2><a href="/posts/${post.id}.html">${post.title}</a></h2>
      <time datetime="${post.date}">${post.date}</time>
      <p>${post.summary}</p>
    </article>
  `).join('');

  fs.writeFileSync(
    path.join(rootDir, 'index.html'),
    listTemplate.replace('<!-- POST_LIST -->', postListHtml)
  );

  // 生成详情页
  posts.forEach(post => {
    const postHtml = postTemplate
      .replace(/{{title}}/g, post.title)
      .replace(/{{date}}/g, post.date)
      .replace(/{{content}}/g, post.content);
    
    fs.writeFileSync(
      path.join(postsDir, `${post.id}.html`),
      postHtml
    );
  });

  console.log('✅ 页面生成完成！');

} catch (error) {
  console.error('❌ 生成页面时出错:', error.message);
  process.exit(1);
}
