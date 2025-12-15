const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// 加载环境变量
dotenv.config();

// 初始化Supabase客户端
const supabaseUrl = 'https://oogkyuxkxksvzzhuagnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZ2t5dXhreGtzdnp6aHVhZ253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY2NTg0NywiZXhwIjoyMDgwMjQxODQ3fQ.2Uoi9rBbq3CVyzz4-h9tTrmCC5YHoVL_aPLXfn6I08I';

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Yunying Dashboard Backend is running' });
});

// 测试Supabase连接
app.get('/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase.from('materials').select('count', { count: 'exact' });
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      status: 'success', 
      message: 'Supabase connection successful',
      count: data[0]?.count || 0 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Supabase connection failed',
      error: error.message 
    });
  }
});

// 获取材料列表
app.get('/api/materials', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// 获取材料价格数据
app.get('/api/material-prices', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('material_prices')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// 获取部门访问数据
app.get('/api/department-visits', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('department_visits')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Test Supabase: http://localhost:${PORT}/test-supabase`);
});