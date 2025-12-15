// 测试脚本：模拟Excel文件上传
const fs = require('fs');
const path = require('path');

console.log('测试Excel上传功能...');
console.log('请确保服务器正在运行在 http://localhost:3000');

// 创建一个简单的测试说明
console.log(`
要测试Excel上传功能，请使用以下curl命令：

curl -X POST http://localhost:3000/api/upload-excel \\
  -F "excel=@test-data.xlsx" \\
  -F "collectionName=test_collection"

或者使用Postman等工具发送POST请求到:
http://localhost:3000/api/upload-excel

参数:
- excel: Excel文件 (必需)
- collectionName: 数据库集合名称 (可选，默认为excel_data)
`);