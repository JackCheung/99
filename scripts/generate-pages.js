const fs = require('fs');
const path = require('path');

// 读取数据
const rawData = fs.readFileSync('data.json', 'utf8');
const jsonData = JSON.parse(rawData);

// 查找包含文章数据的数组
let records = [];
if (Array.isArray(jsonData)) {
  records = jsonData; // 如果JSON本身就是数组
} else if (jsonData.data && Array.isArray(jsonData.data)) {
  records = jsonData.data; // 如果数据在data字段中
} else if (jsonData.records && Array.isArray(jsonData.records)) {
  records = jsonData.records; // 如果数据在records字段中
} else if (jsonData.data?.records && Array.isArray(jsonData.data.records)) {
  records = jsonData.data.records; // 最开始的假设
} else {
  throw new Error('无法识别数据结构，请检查data.json格式');
}

console.log(`找到 ${records.length} 条记录`);

// 处理文章数据
const posts = records.map((record, index) => {
  // 添加错误处理，防止字段缺失
  const fields = record.fields || record;
  return {
    id: fields['文章ID'] || `post-${index}`,
    title: fields['标题'] || '无标题',
    content: fields['内容'] || '',
    date: fields['发布日期'] || new Date().toISOString().split('T')[0],
    summary: fields['摘要'] || ''
  };
});

// 后续生成页面的代码保持不变...
