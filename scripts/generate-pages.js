// scripts/generate-pages.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. 增强路径处理
const rootDir = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(rootDir, '_templates');

// 2. 安全内容处理
const safeString = (content) => {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object') return JSON.stringify(content);
  return String(content);
};

// 3. 主执行函数
const main = () => {
  try {
    // 读取数据
    const dataPath = path.join(rootDir, 'data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // 验证数据结构
    if (!jsonData.data?.items) {
      throw new Error('数据格式错误，缺少data.items');
    }

    // 处理文章数据
    const posts = jsonData.data.items.map((item, index) => ({
      id: item.fields?.['文章ID'] || `post-${index}`,
      title: item.fields?.['标题'] || '无标题',
      content: safeString(item.fields?.['内容']),
      date: item.fields?.['发布日期'] || new Date().toISOString().split('T')[0],
      summary: item.fields?.['摘要'] || ''
    }));

    // 生成页面
    const listTemplate = fs.readFileSync(
      path.join(TEMPLATE_DIR, 'index.template.html'),
      'utf8'
    );
    
    const postTemplate = fs.readFileSync(
      path.join(TEMPLATE_DIR, 'post.template.html'),
      'utf8'
    );

    // 创建posts目录
    const postsDir = path.join(rootDir, 'posts');
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    // 生成列表页
    fs.writeFileSync(
      path.join(rootDir, 'index.html'),
      listTemplate.replace('<!-- POST_LIST -->', 
        posts.map(post => `
          <article>
            <h2><a href="/posts/${post.id}.html">${post.title}</a></h2>
            <time>${post.date}</time>
            <p>${post.summary}</p>
          </article>
        `).join(''))
    );

    // 生成详情页
    posts.forEach(post => {
      fs.writeFileSync(
        path.join(postsDir, `${post.id}.html`),
        postTemplate
          .replace(/{{title}}/g, post.title)
          .replace(/{{date}}/g, post.date)
          .replace(/{{content}}/g, post.content)
      );
    });

    console.log('✅ 页面生成完成');

    // 4. 自动化部署
    const gitCommands = [
      'git config --global user.name "自动部署机器人"',
      'git config --global user.email "bot@example.com"',
      'git add .',
      `git commit -m "自动更新: ${new Date().toLocaleString('zh-CN')}" || exit 0`,
      'git push'
    ];

    gitCommands.forEach(cmd => {
      try {
        console.log(`执行: ${cmd}`);
        const output = execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
        console.log(output?.toString() || '执行成功');
      } catch (err) {
        console.warn(`命令执行警告: ${err.message}`);
      }
    });

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    process.exit(1);
  }
};

main();
