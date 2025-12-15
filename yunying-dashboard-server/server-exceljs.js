const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');

// 加载环境变量
dotenv.config();

// 初始化Supabase客户端
const supabaseUrl = 'https://oogkyuxkxksvzzhuagnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZ2t5dXhreGtzdnp6aHVhZ253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY2NTg0NywiZXhwIjoyMDgwMjQxODQ3fQ.2Uoi9rBbq3CVyzz4-h9tTrmCC5YHoVL_aPLXfn6I08I';

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3000;

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 确保 uploads 目录存在
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 只允许 Excel 文件
    if (path.extname(file.originalname).toLowerCase() === '.xlsx' || 
        path.extname(file.originalname).toLowerCase() === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 Excel 文件 (.xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为 5MB
  }
});

// 中间件
app.use(cors({
  origin: ['*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 提供静态文件服务
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, '..'))); // 提供前端页面的静态服务

// 健康检查路由
app.get('/', (req, res) => {
  res.json({ 
    message: '运营数据看板后端服务已启动',
    timestamp: new Date().toISOString()
  });
});

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Server is running' });
});

// 测试Supabase连接
app.get('/test-supabase', async (req, res) => {
  try {
    // 测试连接数字图书馆月度趋势表
    const { data, error } = await supabase.from('digital_library_monthly_trend').select('count', { count: 'exact' });
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      status: 'success', 
      message: 'Supabase connection successful',
      table: 'digital_library_monthly_trend',
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

// 测试CORS
app.get('/test-cors', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'CORS is working correctly',
    timestamp: new Date().toISOString()
  });
});

// 获取数字图书馆月度趋势数据
app.get('/api/digital-library-monthly-trend', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('digital_library_monthly_trend')
      .select('*')
      .order('month');
    
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

// 获取数字图书馆功能使用情况数据
app.get('/api/digital-library-feature-usage', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('digital_library_feature_usage')
      .select('*')
      .order('month');
    
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

// 获取数字图书馆部门访问数据
app.get('/api/digital-library-department-visits', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('digital_library_department_visits')
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

// 获取材价库月度趋势数据
app.get('/api/material-price-monthly-trend', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('material_price_monthly_trend')
      .select('*')
      .order('month');
    
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

// 获取材价库月度核心数据
app.get('/api/material-price-monthly-core', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('material_price_monthly_core')
      .select('*')
      .order('month');
    
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

// 获取材价库月度数据
app.get('/api/material-price-monthly-data', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('material_price_monthly_data')
      .select('*')
      .order('month');
    
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

// 获取材价库部门访问数据
app.get('/api/material-price-department-visits', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('material_price_department_visits')
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

// 获取招投标平台月度趋势数据
app.get('/api/bidding-platform-monthly-trend', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bidding_platform_monthly_trend')
      .select('*')
      .order('month');
    
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

// 获取招投标平台部门访问数据
app.get('/api/bidding-platform-department-visits', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bidding_platform_department_visits')
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

// 获取数字图书馆规划工具详情数据
app.get('/api/digital-library-planning-tool-details', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('digital_library_planning_tool_details')
      .select('*')
      .order('month');
    
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

// 动态表数据获取
app.get('/api/data/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // 验证表名以防止SQL注入
    const allowedTables = [
      'digital_library_monthly_trend',
      'digital_library_feature_usage',
      'digital_library_department_visits',
      'digital_library_planning_tool_details',
      'material_price_monthly_trend',
      'material_price_monthly_core',
      'material_price_monthly_data',
      'material_price_department_visits',
      'bidding_platform_monthly_trend',
      'bidding_platform_department_visits',
      'smart_procurement_monthly_trend',
      'smart_procurement_monthly_users'
    ];
    
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    
    const { data, error } = await supabase
      .from(tableName)
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

// 上传 Excel 文件并保存到 Supabase 数据库
app.post('/api/upload-excel', upload.single('excel'), async (req, res) => {
  try {
    // 检查是否上传了文件
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: '请选择要上传的 Excel 文件' 
      });
    }

    // 获取产品类型参数
    const product = req.body.product;
    if (!product) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供产品类型参数' 
      });
    }

    // 使用ExcelJS读取Excel文件
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    
    console.log(`=== 处理 ${product} Excel 文件 ===`);
    console.log('文件名:', req.file.originalname);
    console.log('工作表数量:', workbook.worksheets.length);
    
    let totalInserted = 0;

    // 先列出所有工作表名称，用于调试
    console.log('所有工作表名称:');
    workbook.eachSheet((worksheet, sheetId) => {
      console.log(`  工作表 ${sheetId}: ${worksheet.name}`);
    });
    
    // 根据产品类型处理不同的工作表
    switch (product) {
      case 'digital-think-tank':
        // 数字智库：4个表
        console.log('=== 处理数字智库数据 ===');
        
        // 1. 月度访问趋势表
        const visitsSheet = workbook.getWorksheet('各月访问数据') || workbook.worksheets[0];
        console.log(`月度访问趋势工作表: ${visitsSheet ? visitsSheet.name : '未找到'}`);
        if (visitsSheet) {
          const visitsData = await worksheetToArray(visitsSheet);
          console.log(`月度访问趋势数据行数: ${visitsData.length}`);
          if (visitsData.length >= 2) {
            const inserted = await insertDigitalLibraryMonthlyTrend(visitsData);
            console.log(`月度访问趋势插入行数: ${inserted}`);
            totalInserted += inserted;
          }
        }
        
        // 2. 功能板块使用情况表
        const featureSheet = workbook.getWorksheet('各月各功能使用次数') || workbook.worksheets[1];
        console.log(`功能板块使用情况工作表: ${featureSheet ? featureSheet.name : '未找到'}`);
        if (featureSheet) {
          const featureData = await worksheetToArray(featureSheet);
          console.log(`功能板块使用情况数据行数: ${featureData.length}`);
          if (featureData.length >= 2) {
            const inserted = await insertDigitalLibraryFeatureUsage(featureData);
            console.log(`功能板块使用情况插入行数: ${inserted}`);
            totalInserted += inserted;
          }
        }
        
        // 3. 部门访问分布表
        const departmentSheet = workbook.getWorksheet('各月各部门访问次数');
        console.log(`部门访问分布工作表: ${departmentSheet ? departmentSheet.name : '未找到'}`);
        if (departmentSheet) {
          const departmentData = await worksheetToArray(departmentSheet);
          console.log(`部门访问分布数据行数: ${departmentData.length}`);
          if (departmentData.length >= 2) {
            const inserted = await insertDigitalLibraryDepartmentVisits(departmentData);
            console.log(`部门访问分布插入行数: ${inserted}`);
            totalInserted += inserted;
          }
        }
        
        // 4. 规划报告编制工具详情表
        const planningToolSheet = workbook.getWorksheet('规划报告编制工具详情');
        console.log(`规划报告编制工具详情工作表: ${planningToolSheet ? planningToolSheet.name : '未找到'}`);
        if (planningToolSheet) {
          const planningToolData = await worksheetToArray(planningToolSheet);
          console.log(`规划报告编制工具详情数据行数: ${planningToolData.length}`);
          console.log(`规划报告编制工具详情数据表头: ${planningToolData[0]}`);
          
          if (planningToolData.length >= 2) {
            // 测试数据表是否可以插入
            try {
              const testData = { test_field: 'test_value' };
              console.log('测试插入数据到digital_library_planning_tool_details表...');
              const { error: testError } = await supabase
                .from('digital_library_planning_tool_details')
                .insert([testData]);
              
              if (testError) {
                console.error('测试插入失败:', testError);
              } else {
                console.log('测试插入成功');
              }
            } catch (err) {
              console.error('测试插入异常:', err);
            }
            
            const inserted = await insertDigitalLibraryPlanningToolDetails(planningToolData);
            console.log(`规划报告编制工具详情插入行数: ${inserted}`);
            totalInserted += inserted;
          } else {
            console.log('规划报告编制工具详情数据不足，跳过');
          }
        } else {
          console.log('未找到规划报告编制工具详情工作表');
        }
        break;
        
      case 'material-price':
        // 材价库：2个表
        console.log('=== 处理材价库数据 ===');
        
        // 1. 月度数据表
        const monthlyDataSheet = workbook.getWorksheet('月度数据') || workbook.worksheets[0];
        if (monthlyDataSheet) {
          const monthlyData = await worksheetToArray(monthlyDataSheet);
          if (monthlyData.length >= 2) {
            const inserted = await insertMaterialPriceMonthlyData(monthlyData);
            totalInserted += inserted;
          }
        }
        
        // 2. 部门访问分布表
        const materialDeptSheet = workbook.getWorksheet('部门访问分布') || workbook.worksheets[1];
        if (materialDeptSheet) {
          const materialDeptData = await worksheetToArray(materialDeptSheet);
          if (materialDeptData.length >= 2) {
            const inserted = await insertMaterialPriceDepartmentVisits(materialDeptData);
            totalInserted += inserted;
          }
        }
        break;
        
      case 'bidding-platform':
        // 广咨电子招投标交易平台：2个表
        console.log('=== 处理招投标平台数据 ===');
        
        // 1. 月度访问趋势表
        const biddingTrendSheet = workbook.getWorksheet('月度访问趋势') || workbook.worksheets[0];
        if (biddingTrendSheet) {
          const biddingTrendData = await worksheetToArray(biddingTrendSheet);
          if (biddingTrendData.length >= 2) {
            const inserted = await insertBiddingPlatformMonthlyTrend(biddingTrendData);
            totalInserted += inserted;
          }
        }
        
        // 2. 项目统计表
        const projectStatsSheet = workbook.getWorksheet('项目统计') || workbook.worksheets[1];
        if (projectStatsSheet) {
          const projectStatsData = await worksheetToArray(projectStatsSheet);
          if (projectStatsData.length >= 2) {
            const inserted = await insertBiddingPlatformProjectStats(projectStatsData);
            totalInserted += inserted;
          }
        }
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          message: '未知的产品类型' 
        });
    }

    // 清理临时文件
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      message: `成功上传并处理 ${product} 数据`,
      totalInserted: totalInserted
    });
  } catch (error) {
    console.error('处理Excel文件时出错:', error);
    
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      message: '处理Excel文件时出错: ' + error.message 
    });
  }
});

// 辅助函数：将Excel工作表转换为二维数组
async function worksheetToArray(worksheet) {
  const data = [];
  worksheet.eachRow((row, rowNumber) => {
    const rowData = [];
    row.eachCell((cell, colNumber) => {
      rowData.push(cell.value);
    });
    data.push(rowData);
  });
  return data;
}

// 数字智库月度访问趋势插入函数
async function insertDigitalLibraryMonthlyTrend(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  for (const row of rows) {
    if (row[0]) {
      const month = row[0];
      const visits = parseInt(row[1]) || 0;
      const users = parseInt(row[2]) || 0;
      
      const { error } = await supabase
        .from('digital_library_monthly_trend')
        .upsert([{
          month,
          visits,
          users
        }])
        .eq('month', month);
      
      if (!error) {
        inserted++;
      }
    }
  }
  
  return inserted;
}

// 数字智库功能使用情况插入函数
async function insertDigitalLibraryFeatureUsage(data) {
  console.log('开始处理功能使用数据...');
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  console.log(`功能使用数据行数: ${rows.length}`);
  console.log(`功能使用数据表头: ${headers}`);
  console.log(`功能使用数据第一行: ${rows[0]}`);
  
  // 判断数据格式
  const hasMonthColumn = headers[0] && (headers[0].includes('月') || headers[0].includes('month'));
  
  for (const row of rows) {
    if (row[0]) {
      try {
        let insertData = {};
        
        // 格式1：包含月份列的详细功能使用数据
        if (hasMonthColumn) {
          const month = row[0] || '';
          const homepage_visits = parseInt(row[1]) || 0;
          const search_visits = parseInt(row[2]) || 0;
          const stats_yearbook = parseInt(row[3]) || 0;
          const stats_bulletin = parseInt(row[4]) || 0;
          const macro_charts = parseInt(row[5]) || 0;
          const indicator_query = parseInt(row[6]) || 0;
          const industry_data = parseInt(row[7]) || 0;
          const policy_materials = parseInt(row[8]) || 0;
          const government_bulletin = parseInt(row[9]) || 0;
          const engineering_specs = parseInt(row[10]) || 0;
          const regional_news = parseInt(row[11]) || 0;
          const current_affairs = parseInt(row[12]) || 0;
          const project_results = parseInt(row[13]) || 0;
          const potential_reits = parseInt(row[14]) || 0;
          const investment_cases = parseInt(row[15]) || 0;
          const planning_tool = row[16] || '';
          const planning_tool_projects = row[17] || '';
          const planning_tool_members = row[18] || '';
          const planning_tool_files = row[19] || '';
          const knowledge_graph_medical = parseInt(row[20]) || 0;
          const calculator = row[21] || '';
          const rural_revitalization = parseInt(row[22]) || 0;
          const policy_visualization = row[23] || '';
          const personal_center = parseInt(row[24]) || 0;
          
          insertData = {
            month,
            homepage_visits,
            search_visits,
            stats_yearbook,
            stats_bulletin,
            macro_charts,
            indicator_query,
            industry_data,
            policy_materials,
            government_bulletin,
            engineering_specs,
            regional_news,
            current_affairs,
            project_results,
            potential_reits,
            investment_cases,
            planning_tool,
            planning_tool_projects,
            planning_tool_members,
            planning_tool_files,
            knowledge_graph_medical,
            calculator,
            rural_revitalization,
            policy_visualization,
            personal_center
          };
          
          console.log(`尝试插入功能使用数据(格式1): 月份=${month}, 首页访问=${homepage_visits}, 搜索访问=${search_visits}`);
        }
        // 格式2：功能名称 | 使用次数
        else {
          const feature = row[0] || '';
          const usage_count = parseInt(row[1]) || 0;
          
          insertData = {
            feature,
            usage_count
          };
          
          console.log(`尝试插入功能使用数据(格式2): 功能=${feature}, 使用次数=${usage_count}`);
        }
        
        const { error } = await supabase
          .from('digital_library_feature_usage')
          .upsert([insertData]);
        
        if (!error) {
          inserted++;
          console.log(`成功插入功能使用数据行`);
        } else {
          console.error('插入功能使用数据时出错:', error);
        }
      } catch (err) {
        console.error('处理功能使用数据行时发生异常:', err);
      }
    }
  }
  
  console.log(`功能使用数据处理完成，共插入 ${inserted} 行`);
  return inserted;
}

// 数字智库部门访问情况插入函数
async function insertDigitalLibraryDepartmentVisits(data) {
  console.log('开始处理部门访问数据...');
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  console.log(`部门访问数据行数: ${rows.length}`);
  console.log(`部门访问数据表头: ${headers}`);
  console.log(`部门访问数据第一行: ${rows[0]}`);
  
  // 检测数据格式：
  // 1. 列存储格式：第一行是部门名称，第一列是月份，其他单元格是访问次数
  // 2. 行存储格式：每行是 月份 | 部门名称 | 访问次数
  
  // 判断数据格式：检查第一行是否包含多个部门名称
  const firstRowContainsDept = headers && headers.length > 2 && headers.some(header => header && header.includes('部'));
  
  // 判断第一行第一列是否是月份格式
  const firstRowFirstCol = rows[0] ? rows[0][0] : '';
  const isFirstColMonth = firstRowFirstCol && (
    firstRowFirstCol.includes('-') || 
    /^\d{4}-\d{2}$/.test(firstRowFirstCol)
  );
  
  // 如果第一行包含多个部门名称，则使用列存储格式
  const isColumnFormat = firstRowContainsDept;
  
  console.log(`第一行包含部门: ${firstRowContainsDept}`);
  console.log(`第一列是月份: ${isFirstColMonth}`);
  console.log(`检测到${isColumnFormat ? '列' : '行'}存储格式`);
  
  if (isColumnFormat) {
    // 列存储格式：第一行是部门名称，第一列是月份
    console.log('按列存储格式处理部门访问数据');
    
    // 从第二行开始（跳过部门名称行）
    for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
      const month = rows[rowIdx][0] || '';  // 第一列是月份
      
      // 遍历每个部门列
      for (let colIdx = 1; colIdx < headers.length; colIdx++) {
        const department_name = headers[colIdx] || '';  // 第一行对应的是部门名称
        const visits = parseInt(rows[rowIdx][colIdx]) || 0;
        
        if (month && department_name && visits > 0) {
          console.log(`插入部门访问数据: 月份=${month}, 部门=${department_name}, 访问次数=${visits}`);
          
          const { error } = await supabase
            .from('digital_library_department_visits')
            .upsert([{
              month,
              department_name,
              visits
            }]);
          
          if (!error) {
            inserted++;
          } else {
            console.error('插入部门访问数据时出错:', error);
          }
        }
      }
    }
  }
  // 尝试处理行存储格式（备用）
  else {
    console.log('尝试使用行存储格式处理');
    
    // 行存储格式：每行是 月份 | 部门名称 | 访问次数
    for (const row of rows) {
      if (row[0] && row[1]) {
        try {
          const month = row[0] || '';
          const department_name = row[1] || '';
          const visits = parseInt(row[2]) || 0;
          
          console.log(`插入部门访问数据: 月份=${month}, 部门=${department_name}, 访问次数=${visits}`);
          
          const { error } = await supabase
            .from('digital_library_department_visits')
            .upsert([{
              month,
              department_name,
              visits
            }]);
          
          if (!error) {
            inserted++;
          } else {
            console.error('插入部门访问数据时出错:', error);
          }
        } catch (error) {
          console.error('处理部门访问数据行时出错:', error);
        }
      }
    }
  }
    // 获取所有部门名称（第一列）
    const departments = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].trim()) {
        departments.push(rows[i][0].trim());
      }
    }
    console.log('检测到部门:', departments);
    
    // 处理每个月份的数据
    for (let col = 1; col < headers.length; col++) {
      const month = headers[col] || '';
      console.log(`处理月份: ${month}`);
      
      for (let row = 1; row < rows.length; row++) {
        const department_name = rows[row][0] || '';
        const visits = parseInt(rows[row][col]) || 0;
        
        if (department_name && visits > 0) {
          console.log(`插入数据: 月份=${month}, 部门=${department_name}, 访问次数=${visits}`);
          
          const { error } = await supabase
            .from('digital_library_department_visits')
            .upsert([{
              month,
              department_name,
              visits
            }]);
              
          if (!error) {
            inserted++;
          } else {
            console.error('插入部门访问数据时出错:', error);
          }
        }
      } catch (err) {
        console.error('处理部门数据行时发生异常:', err);
      }
    }
  }
  
  console.log(`部门访问数据处理完成，共插入 ${inserted} 行`);
  return inserted;
}

// 数字智库规划工具详情插入函数
async function insertDigitalLibraryPlanningToolDetails(data) {
  console.log('开始处理规划工具详情数据...');
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  console.log(`规划工具详情数据行数: ${rows.length}`);
  console.log(`规划工具详情数据表头: ${headers}`);
  console.log(`规划工具详情数据第一行: ${rows[0]}`);
  
  // 映射Excel列名到数据库字段名
  const fieldMapping = {
    '月份': 'month',
    'month': 'month',
    '项目数': 'projects',
    'projects': 'projects',
    '成员数': 'members',
    'members': 'members',
    '上传文件数量': 'files',
    'files': 'files'
  };
  
  // 找到各列在Excel中的索引
  const columnIndex = {};
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i] || '';
    const normalizedHeader = header.toLowerCase().trim();
    
    // 直接匹配或通过映射表匹配
    if (fieldMapping[header] || fieldMapping[normalizedHeader]) {
      const dbField = fieldMapping[header] || fieldMapping[normalizedHeader];
      columnIndex[dbField] = i;
      console.log(`找到字段映射: "${header}" -> ${dbField} (列索引: ${i})`);
    }
    // 尝试部分匹配
    else if (normalizedHeader.includes('月') || normalizedHeader.includes('month')) {
      columnIndex.month = i;
      console.log(`通过部分匹配找到月份列: "${header}" (列索引: ${i})`);
    }
    else if (normalizedHeader.includes('项目') || normalizedHeader.includes('project')) {
      columnIndex.projects = i;
      console.log(`通过部分匹配找到项目数列: "${header}" (列索引: ${i})`);
    }
    else if (normalizedHeader.includes('成员') || normalizedHeader.includes('member')) {
      columnIndex.members = i;
      console.log(`通过部分匹配找到成员数列: "${header}" (列索引: ${i})`);
    }
    else if (normalizedHeader.includes('文件') || normalizedHeader.includes('file')) {
      columnIndex.files = i;
      console.log(`通过部分匹配找到文件数列: "${header}" (列索引: ${i})`);
    }
  }
  
  console.log('最终列索引映射:', columnIndex);
  
  // 处理每一行数据
  for (const row of rows) {
    if (row[0]) {
      try {
        // 根据映射构建插入数据
        const insertData = {};
        
        if (columnIndex.month !== undefined) {
          insertData.month = row[columnIndex.month] || '';
        }
        
        if (columnIndex.projects !== undefined) {
          insertData.projects = parseInt(row[columnIndex.projects]) || 0;
        }
        
        if (columnIndex.members !== undefined) {
          insertData.members = parseInt(row[columnIndex.members]) || 0;
        }
        
        if (columnIndex.files !== undefined) {
          insertData.files = parseInt(row[columnIndex.files]) || 0;
        }
        
        // 如果没有找到任何有效字段，使用通用处理
        if (Object.keys(insertData).length === 0) {
          console.log('未找到已知字段，使用通用处理');
          for (let i = 0; i < Math.min(headers.length, row.length); i++) {
            const header = headers[i] || '';
            const value = row[i];
            
            if (!isNaN(value) && value !== '' && value !== null) {
              insertData[header] = parseInt(value) || parseFloat(value) || 0;
            } else {
              insertData[header] = value;
            }
          }
        }
        
        console.log(`尝试插入规划工具详情数据:`, JSON.stringify(insertData));
        
        const { error } = await supabase
          .from('digital_library_planning_tool_details')
          .insert([insertData]);
        
        if (!error) {
          inserted++;
          console.log(`成功插入规划工具详情数据行`);
        } else {
          console.error('插入规划工具详情数据时出错:', error);
          console.error('尝试使用upsert方式...');
          
          // 尝试使用upsert而不是insert
          const { error: upsertError } = await supabase
            .from('digital_library_planning_tool_details')
            .upsert([insertData]);
          
          if (!upsertError) {
            inserted++;
            console.log(`使用upsert成功插入规划工具详情数据行`);
          } else {
            console.error('upsert也失败:', upsertError);
          }
        }
      } catch (err) {
        console.error('处理规划工具详情数据行时发生异常:', err);
      }
    }
  }
  
  console.log(`规划工具详情数据处理完成，共插入 ${inserted} 行`);
  return inserted;
}

// 材价库月度数据插入函数
async function insertMaterialPriceMonthlyData(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  for (const row of rows) {
    if (row[0]) {
      const month = row[0];
      const factory_quotes = parseInt(row[1]) || 0;
      const market_inquiries = parseInt(row[2]) || 0;
      const information_prices = parseInt(row[3]) || 0;
      
      const { error } = await supabase
        .from('material_price_monthly_data')
        .upsert([{
          month,
          factory_quotes,
          market_inquiries,
          information_prices
        }])
        .eq('month', month);
      
      if (!error) {
        inserted++;
      }
    }
  }
  
  return inserted;
}

// 材价库部门访问数据插入函数
async function insertMaterialPriceDepartmentVisits(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  for (const row of rows) {
    if (row[0]) {
      const department = row[0];
      const visit_count = parseInt(row[1]) || 0;
      
      const { error } = await supabase
        .from('material_price_department_visits')
        .upsert([{
          department,
          visit_count
        }])
        .eq('department', department);
      
      if (!error) {
        inserted++;
      }
    }
  }
  
  return inserted;
}

// 招投标平台月度访问趋势插入函数
async function insertBiddingPlatformMonthlyTrend(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  for (const row of rows) {
    if (row[0]) {
      const month = row[0];
      const visits = parseInt(row[1]) || 0;
      const users = parseInt(row[2]) || 0;
      const projects = parseInt(row[3]) || 0;
      
      const { error } = await supabase
        .from('bidding_platform_monthly_trend')
        .upsert([{
          month,
          visits,
          users,
          projects
        }])
        .eq('month', month);
      
      if (!error) {
        inserted++;
      }
    }
  }
  
  return inserted;
}

// 招投标平台项目统计插入函数
async function insertBiddingPlatformProjectStats(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  for (const row of rows) {
    if (row[0]) {
      const project_type = row[0];
      const project_count = parseInt(row[1]) || 0;
      const total_value = parseFloat(row[2]) || 0;
      
      const { error } = await supabase
        .from('bidding_platform_project_stats')
        .upsert([{
          project_type,
          project_count,
          total_value
        }])
        .eq('project_type', project_type);
      
      if (!error) {
        inserted++;
      }
    }
  }
  
  return inserted;
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`运营数据看板后端服务已启动，端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`测试Supabase连接: http://localhost:${PORT}/test-supabase`);
});