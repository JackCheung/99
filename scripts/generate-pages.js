const fs = require('fs');
const path = require('path');

// 读取飞书数据
const rawData = fs.readFileSync('data.json', 'utf8');
const posts = JSON.parse(rawData).data.records.map(record => ({
  id: record.fields['文章ID'],
  title: record.fields['标题'],
  content: record.fields['内容'],
  date: record.fields['发布日期'],
  summary: record.fields['摘要']
}));

// 生成列表页
const listTemplate = fs.readFileSync('_templates/index.template.html', 'utf8');
const postListHtml = posts.map(post => `
  <div class="post-item">
    <h2><a href="/posts/${post.id}.html" class="post-title">${post.title}</a></h2>
    <p class="post-meta">${post.date}</p>
    <p>${post.summary}</p>
  </div>
`).join('');
const indexHtml = listTemplate.replace('<!-- POST_LIST -->', postListHtml);
fs.writeFileSync('index.html', indexHtml);

// 生成详情页
const postTemplate = fs.readFileSync('_templates/post.template.html', 'utf8');
if (!fs.existsSync('posts')) fs.mkdirSync('posts');

posts.forEach(post => {
  let content = post.content.replace(/<img/g, '<img style="max-width:100%;"'); // 图片自适应
  const postHtml = postTemplate
    .replace('{{title}}', post.title)
    .replace('{{date}}', post.date)
    .replace('{{content}}', content);
  fs.writeFileSync(`posts/${post.id}.html`, postHtml);
});
