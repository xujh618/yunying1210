// 创建数字智库部门访问数据表
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('请配置 SUPABASE_URL 和 SUPABASE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 创建数字智库部门访问数据表
async function createDepartmentVisitsTable() {
  try {
    // 删除旧表（如果存在）
    await supabase
      .from('digital_library_department_visits')
      .drop();
    console.log('已删除旧的部门访问数据表');
  } catch (error) {
    console.log('旧表不存在，继续创建新表');
  }

  try {
    // 创建新表
    const { error } = await supabase
      .rpc('create_table_if_not_exists', {
        table_name: 'digital_library_department_visits',
        columns: [
          { name: 'id', type: 'SERIAL PRIMARY KEY' },
          { name: 'month', type: 'VARCHAR(10) NOT NULL' },
          { name: 'department_name', type: 'VARCHAR(255) NOT NULL' },
          { name: 'visits', type: 'INT NOT NULL DEFAULT 0' },
          { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
          { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' }
        ],
        constraints: [
          'UNIQUE(month, department_name)'
        ]
      });

    if (error) {
      throw error;
    }

    console.log('数字智库部门访问数据表创建成功');
    
    // 创建索引
    await supabase
      .from('digital_library_department_visits')
      .createIndex('idx_month', { columns: ['month'] });
    
    await supabase
      .from('digital_library_department_visits')
      .createIndex('idx_department_name', { columns: ['department_name'] });
    
    console.log('索引创建成功');
    
  } catch (error) {
    console.error('创建表时出错:', error.message);
  }
}

// 调用创建表函数
createDepartmentVisitsTable();
