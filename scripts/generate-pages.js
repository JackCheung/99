const fs = require('fs');
const path = require('path');

try {
  // 1. 读取数据
  const rawData = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
  const jsonData = JSON.parse(rawData);
  
  // 2. 调试输出数据结构
  console.log('顶层键:', Object.keys(jsonData));
  if (jsonData.data) console.log('data键:', Object.keys(jsonData.data));
  
  // 3. 多种格式兼容
  let records = [];
  if (Array.isArray(jsonData)) {
    records = jsonData;
  } else if (jsonData.records) {
    records = jsonData.records;
  } else if (jsonData.data?.items) {
    records = jsonData.data.items;
  } else if (jsonData.value) { // 某些API格式
    records = jsonData.value;
  } else {
    throw new Error('无法识别的数据结构，请提供 data.json 的开头部分');
  }

  console.log(`找到 ${records.length} 条记录`);
  
  // 4. 处理文章数据（添加默认值防止报错）
  const posts = records.map((record, i) => ({
    id: record.id || record.fields?.文章ID || `post-${i}`,
    title: record.title || record.fields?.标题 || '无标题',
    content: record.content || record.fields?.内容 || '',
    date: record.date || record.fields?.发布日期 || new Date().toISOString().split('T')[0],
    summary: record.summary || record.fields?.摘要 || ''
  }));

  // ... 其余的页面生成代码 ...

} catch (error) {
  console.error('处理失败:', error);
  process.exit(1);
}
