const fs = require('fs');
const path = require('path');

// 读取数据文件
const rawData = fs.readFileSync('data.json', 'utf8');
console.log('--- 数据文件前200字符 ---');
console.log(rawData.substring(0, 200));
console.log('------------------------');

// 解析JSON
const jsonData = JSON.parse(rawData);
console.log('--- JSON顶层结构 ---');
console.log('顶层字段:', Object.keys(jsonData));
console.log('--------------------');

// 如果顶层有数据字段，进一步检查
if (jsonData.data) {
  console.log('--- data字段结构 ---');
  console.log('data字段类型:', typeof jsonData.data);
  if (jsonData.data && typeof jsonData.data === 'object') {
    console.log('data字段的键:', Object.keys(jsonData.data));
  }
  console.log('-------------------');
}

// 如果可能包含记录，尝试查找数组
let foundRecords = null;

if (Array.isArray(jsonData)) {
  foundRecords = jsonData;
} else if (jsonData.data && Array.isArray(jsonData.data)) {
  foundRecords = jsonData.data;
} else if (jsonData.records && Array.isArray(jsonData.records)) {
  foundRecords = jsonData.records;
} else if (jsonData.data?.records && Array.isArray(jsonData.data.records)) {
  foundRecords = jsonData.data.records;
} else {
  // 尝试深度搜索数组
  const deepSearch = (obj) => {
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        return obj[key];
      }
      if (typeof obj[key] === 'object') {
        const result = deepSearch(obj[key]);
        if (result) return result;
      }
    }
    return null;
  };
  foundRecords = deepSearch(jsonData);
}

if (!foundRecords) {
  console.error('无法找到记录数组，请检查data.json结构');
  console.log('完整JSON结构:', JSON.stringify(jsonData, null, 2).substring(0, 500));
  process.exit(1);
}

console.log(`找到 ${foundRecords.length} 条记录`);
process.exit(0); // 仅用于调试，查看结构后移除
