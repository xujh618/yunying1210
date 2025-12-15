const fs = require('fs');

// 读取主文件的insertDigitalLibraryDepartmentVisits函数
const serverContent = fs.readFileSync('./server.js', 'utf8');
const functionStart = serverContent.indexOf('async function insertDigitalLibraryDepartmentVisits');
const functionEnd = serverContent.indexOf('\n//', functionStart);
if (functionEnd === -1) {
  const nextFunctionStart = serverContent.indexOf('\nasync function', functionStart + 1);
  const nextFunctionStart2 = serverContent.indexOf('\nfunction', functionStart + 1);
  if (nextFunctionStart !== -1 && nextFunctionStart2 !== -1) {
    functionEnd = Math.min(nextFunctionStart, nextFunctionStart2);
  } else if (nextFunctionStart !== -1) {
    functionEnd = nextFunctionStart;
  } else if (nextFunctionStart2 !== -1) {
    functionEnd = nextFunctionStart2;
  }
}
const departmentFunction = serverContent.substring(functionStart, functionEnd);

console.log('找到的函数长度:', departmentFunction.length);

// 更新其他文件
const filesToUpdate = [
  './yunying-dashboard-api/server.js',
  './functions/yunying-dashboard-api/server.js'
];

filesToUpdate.forEach(filePath => {
  console.log(`更新文件: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 找到原有函数的位置
  const oldFunctionStart = content.indexOf('async function insertDigitalLibraryDepartmentVisits');
  if (oldFunctionStart === -1) {
    console.log(`未找到函数，跳过: ${filePath}`);
    return;
  }
  
  let oldFunctionEnd = content.indexOf('\n//', oldFunctionStart);
  if (oldFunctionEnd === -1) {
    const nextFunctionStart = content.indexOf('\nasync function', oldFunctionStart + 1);
    const nextFunctionStart2 = content.indexOf('\nfunction', oldFunctionStart + 1);
    if (nextFunctionStart !== -1 && nextFunctionStart2 !== -1) {
      oldFunctionEnd = Math.min(nextFunctionStart, nextFunctionStart2);
    } else if (nextFunctionStart !== -1) {
      oldFunctionEnd = nextFunctionStart;
    } else if (nextFunctionStart2 !== -1) {
      oldFunctionEnd = nextFunctionStart2;
    }
  }
  
  // 替换函数
  const newContent = content.substring(0, oldFunctionStart) + 
                     departmentFunction + 
                     content.substring(oldFunctionEnd);
  
  fs.writeFileSync(filePath, newContent);
  console.log(`更新完成: ${filePath}`);
});

console.log('所有文件更新完成');