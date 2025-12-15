const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 加载环境变量
dotenv.config();

// 初始化Supabase客户端
let supabase = null;

// 使用固定的Supabase配置
const supabaseUrl = 'https://oogkyuxkxksvzzhuagnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZ2t5dXhreGtzdnp6aHVhZ253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY2NTg0NywiZXhwIjoyMDgwMjQxODQ3fQ.2Uoi9rBbq3CVyzz4-h9tTrmCC5YHoVL_aPLXfn6I08I';

try {
  // 初始化Supabase
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase 客户端初始化成功');
} catch (error) {
  console.error('Supabase 客户端初始化失败:', error.message);
}

// 初始化腾讯云开发 SDK（保留作为备选）
let tcb = null;
let tcbApp = null;
let db = null;

try {
  tcb = require('@cloudbase/node-sdk');
  
  // 初始化云开发环境
  if (process.env.TCB_ENV_ID) {
    tcbApp = tcb.init({
      env: process.env.TCB_ENV_ID,
      secretId: process.env.TCB_SECRET_ID,
      secretKey: process.env.TCB_SECRET_KEY
    });
    
    // 初始化数据库
    db = tcbApp.database();
    console.log('腾讯云开发 SDK 初始化成功');
  } else {
    console.log('未配置腾讯云开发环境变量，将使用Supabase');
  }
} catch (error) {
  console.error('腾讯云开发 SDK 初始化失败:', error.message);
  console.log('将使用Supabase作为备选方案');
}

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 提供静态文件服务
app.use('/uploads', express.static('uploads'));

// 健康检查路由
app.get('/', (req, res) => {
  res.json({ 
    message: '运营数据看板后端服务已启动',
    timestamp: new Date().toISOString()
  });
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

    // 检查是否已配置 Supabase
    if (!supabase) {
      return res.status(500).json({ 
        success: false, 
        message: 'Supabase 客户端未正确配置，请联系管理员' 
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

    // 读取 Excel 文件
    const workbook = xlsx.readFile(req.file.path);
    
    console.log(`=== 处理 ${product} Excel 文件 ===`);
    console.log('文件名:', req.file.originalname);
    console.log('Sheet数量:', workbook.SheetNames.length);
    console.log('Sheet名称:', workbook.SheetNames);

    let totalInserted = 0;

    // 根据产品类型处理不同的 sheet
    switch (product) {
      case 'digital-think-tank':
        // 数字智库：4个表
        console.log('=== 处理数字智库数据 ===');
        
        // 1. 月度访问趋势表
        const visitsSheet = workbook.Sheets['各月访问数据'] || workbook.Sheets['Sheet1'];
        if (visitsSheet) {
          const visitsData = xlsx.utils.sheet_to_json(visitsSheet, { header: 1 });
          if (visitsData.length >= 2) {
            const inserted = await insertDigitalLibraryMonthlyTrend(visitsData);
            totalInserted += inserted;
          }
        }
        
        // 2. 功能板块使用情况表
        console.log('尝试获取功能板块使用情况表，可用的工作表名称:', Object.keys(workbook.Sheets));
        const featureSheet = workbook.Sheets['各月各功能使用次数'] || workbook.Sheets['Sheet2'] || workbook.Sheets['功能使用情况'];
        if (featureSheet) {
          const featureData = xlsx.utils.sheet_to_json(featureSheet, { header: 1 });
          console.log('功能板块数据行数:', featureData.length);
          console.log('功能板块数据前2行:', featureData.slice(0, 2));
          if (featureData.length >= 2) {
            console.log('尝试插入功能板块数据...');
            const inserted = await insertDigitalLibraryFeatureUsage(featureData);
            totalInserted += inserted;
            console.log('功能板块数据插入:', inserted, '条');
          } else {
            console.log('功能板块数据行数不足，无法插入');
          }
        } else {
          console.log('未找到功能板块使用情况表，跳过');
        }
        
        // 3. 部门访问分布表
        const departmentSheet = workbook.Sheets['各月各部门访问次数'];
        if (departmentSheet) {
          const departmentData = xlsx.utils.sheet_to_json(departmentSheet, { header: 1 });
          if (departmentData.length >= 2) {
            const inserted = await insertDigitalLibraryDepartmentVisits(departmentData);
            totalInserted += inserted;
          }
        }
        
        // 4. 规划报告编制工具详情表
        const planningToolSheet = workbook.Sheets['规划报告编制工具详情'];
        if (planningToolSheet) {
          const planningToolData = xlsx.utils.sheet_to_json(planningToolSheet, { header: 1 });
          if (planningToolData.length >= 2) {
            const inserted = await insertDigitalLibraryPlanningToolDetails(planningToolData);
            totalInserted += inserted;
          }
        }
        break;

      case 'smart-procurement':
        // 广咨智采：2个表
        console.log('=== 处理广咨智采数据 ===');
        const spSheets = workbook.SheetNames;
        console.log('广咨智采Sheet名称:', spSheets);
        
        // 1. 月度访问趋势表 - 支持多种Sheet名称
        if (spSheets.includes('访问数据') || spSheets.includes('Sheet1') || spSheets.includes('月度访问趋势')) {
          const sheetName = spSheets.includes('访问数据') ? '访问数据' : 
                          spSheets.includes('月度访问趋势') ? '月度访问趋势' : 'Sheet1';
          const spVisitsSheet = workbook.Sheets[sheetName];
          if (spVisitsSheet) {
            const spVisitsData = xlsx.utils.sheet_to_json(spVisitsSheet, { header: 1 });
            if (spVisitsData.length >= 2) {
              const inserted = await insertSmartProcurementMonthlyTrend(spVisitsData);
              totalInserted += inserted;
            }
          }
        }
        
        // 2. 月度用户数据表
        if (spSheets.includes('用户和业务数据') || spSheets.includes('Sheet2')) {
          const sheetName = spSheets.includes('用户和业务数据') ? '用户和业务数据' : 'Sheet2';
          const spUsersSheet = workbook.Sheets[sheetName];
          if (spUsersSheet) {
            const spUsersData = xlsx.utils.sheet_to_json(spUsersSheet, { header: 1 });
            if (spUsersData.length >= 2) {
              const inserted = await insertSmartProcurementMonthlyUsers(spUsersData);
              totalInserted += inserted;
            }
          }
        }
        break;

      case 'material-price':
        // 材价库：4个表
        console.log('=== 处理材价库数据 ===');
        
        // 1. 月度访问趋势表
        const mpVisitsSheet = workbook.Sheets['访问数据'] || workbook.Sheets['Sheet1'];
        if (mpVisitsSheet) {
          const mpVisitsData = xlsx.utils.sheet_to_json(mpVisitsSheet, { header: 1 });
          if (mpVisitsData.length >= 2) {
            const inserted = await insertMaterialPriceMonthlyTrend(mpVisitsData);
            totalInserted += inserted;
          }
        }
        
        // 2. 核心数据表 - 使用'访问数据'Sheet，与月度访问趋势表共用一个Sheet
        const mpCoreSheet = workbook.Sheets['访问数据'] || workbook.Sheets['Sheet1'];
        if (mpCoreSheet) {
          const mpCoreData = xlsx.utils.sheet_to_json(mpCoreSheet, { header: 1 });
          if (mpCoreData.length >= 2) {
            const inserted = await insertMaterialPriceMonthlyCore(mpCoreData);
            totalInserted += inserted;
          }
        }
        
        // 3. 部门访问分布表
        const mpDeptSheet = workbook.Sheets['各月各部门访问次数'];
        if (mpDeptSheet) {
          const mpDeptData = xlsx.utils.sheet_to_json(mpDeptSheet, { header: 1 });
          if (mpDeptData.length >= 2) {
            const inserted = await insertMaterialPriceDepartmentVisits(mpDeptData);
            totalInserted += inserted;
          }
        }
        
        // 4. 月度数据（厂商报价、市场询价、信息价）
        const mpMonthlySheet = workbook.Sheets['月度数据'];
        if (mpMonthlySheet) {
          const mpMonthlyData = xlsx.utils.sheet_to_json(mpMonthlySheet, { header: 1 });
          if (mpMonthlyData.length >= 2) {
            const inserted = await insertMaterialPriceMonthlyData(mpMonthlyData);
            totalInserted += inserted;
          }
        }
        break;

      case 'bidding-platform':
        // 广咨电子招投标交易平台：2个表
        console.log('=== 处理广咨电子招投标交易平台数据 ===');
        
        // 1. 月度访问趋势表
        const bpVisitsSheet = workbook.Sheets['访问数据'] || workbook.Sheets['Sheet1'];
        if (bpVisitsSheet) {
          const bpVisitsData = xlsx.utils.sheet_to_json(bpVisitsSheet, { header: 1 });
          if (bpVisitsData.length >= 2) {
            const inserted = await insertBiddingPlatformMonthlyTrend(bpVisitsData);
            totalInserted += inserted;
          }
        }
        
        // 2. 部门访问分布表
        const bpDeptSheet = workbook.Sheets['各月各部门访问次数'] || workbook.Sheets['部门访问数据'];
        if (bpDeptSheet) {
          const bpDeptData = xlsx.utils.sheet_to_json(bpDeptSheet, { header: 1 });
          if (bpDeptData.length >= 2) {
            const inserted = await insertBiddingPlatformDepartmentVisits(bpDeptData);
            totalInserted += inserted;
          }
        }
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          message: '无效的产品类型' 
        });
    }
    
    // 删除上传的临时文件
    fs.unlinkSync(req.file.path);
    
    // 返回成功响应
    res.json({
      success: true,
      message: `成功上传 ${totalInserted} 条记录到数据库`,
      data: {
        insertedCount: totalInserted,
        product: product,
        fileName: req.file.originalname
      }
    });
    
  } catch (error) {
    console.error('处理 Excel 文件时出错:', error);
    
    // 如果有上传的文件，确保删除它
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      message: '处理 Excel 文件时发生错误: ' + error.message 
    });
  }
});

// 数字智库月度访问趋势插入函数
async function insertDigitalLibraryMonthlyTrend(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  for (const row of rows) {
    if (row.length >= 4) {
      const month = row[0];
      const visits = row[1];
      const users = row[2];
      const registers = row[3];
      
      const { error } = await supabase
        .from('digital_library_monthly_trend')
        .upsert([{
          month,
          visits,
          users,
          registers
        }])
        .eq('month', month);
      
      if (!error) {
        inserted++;
      } else {
        console.error('插入月度访问趋势数据失败:', error.message);
      }
    }
  }
  
  console.log('数字智库月度访问趋势表插入:', inserted, '条数据');
  return inserted;
}

// 数字智库功能使用情况插入函数
async function insertDigitalLibraryFeatureUsage(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  console.log('功能使用情况表插入 - 表头:', headers);
  console.log('功能使用情况表插入 - 数据行数:', rows.length);
  
  for (const row of rows) {
    console.log('处理行数据:', row);
    console.log('行长度:', row.length);
    
    // 调整行长度检查，确保至少有基本的数据
    if (row.length >= 2) {
      // 初始化所有字段为null
      let month = row[0];
      let homepage_visits = row[1] || null;
      let search_visits = row[2] || null;
      let stats_yearbook = row[3] || null;
      let stats_bulletin = row[4] || null;
      let macro_charts = row[5] || null;
      let indicator_query = row[6] || null;
      let industry_data = row[7] || null;
      let policy_materials = row[8] || null;
      let government_bulletin = row[9] || null;
      let engineering_specs = row[10] || null;
      let regional_news = row[11] || null;
      let current_affairs = row[12] || null;
      let project_results = row[13] || null;
      let potential_reits = row[14] || null;
      let investment_cases = row[15] || null;
      let planning_tool = row[16] || null;
      let knowledge_graph_medical = row[17] || null;
      let calculator = row[18] || null;
      let rural_revitalization = row[19] || null;
      let policy_visualization = row[20] || null;
      let personal_center = row[21] || null;
      
      console.log('准备插入数据:', {
        month,
        homepage_visits,
        search_visits,
        personal_center
      });
      
      const { error } = await supabase
        .from('digital_library_feature_usage')
        .upsert([{
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
          knowledge_graph_medical,
          calculator,
          rural_revitalization,
          policy_visualization,
          personal_center
        }])
        .eq('month', month);
      
      if (!error) {
        inserted++;
        console.log('成功插入1条功能使用数据');
      } else {
        console.error('插入功能使用数据失败:', error.message);
      }
    } else {
      console.log('行数据长度不足，跳过:', row);
    }
  }
  
  console.log('数字智库功能使用情况表插入:', inserted, '条数据');
  return inserted;
}

// 数字智库部门访问分布插入函数
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
  
  console.log(`部门访问数据处理完成，共插入 ${inserted} 行`);
  return inserted;
}

// 规划报告编制工具详情插入函数
async function insertDigitalLibraryPlanningToolDetails(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  for (const row of rows) {
    if (row.length >= 4) {
      const month = row[0];
      const projects = row[1];
      const members = row[2];
      const files = row[3];
      
      const { error } = await supabase
        .from('digital_library_planning_tool_details')
        .upsert([{
          month,
          projects,
          members,
          files
        }])
        .eq('month', month);
      
      if (!error) {
        inserted++;
      } else {
        console.error('插入规划报告编制工具详情数据失败:', error.message);
      }
    }
  }
  
  console.log('规划报告编制工具详情表插入:', inserted, '条数据');
  return inserted;
}

// 广咨智采月度访问趋势插入函数
async function insertSmartProcurementMonthlyTrend(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  for (const row of rows) {
    if (row.length >= 4) {
      const month = row[0];
      const visits = row[1];
      const users = row[2];
      const registers = row[3];
      
      const { error } = await supabase
        .from('smart_procurement_monthly_trend')
        .upsert([{
          month,
          visits,
          users,
          registers
        }])
        .eq('month', month);
      
      if (!error) {
        inserted++;
      } else {
        console.error('插入广咨智采月度访问趋势数据失败:', error.message);
      }
    }
  }
  
  console.log('广咨智采月度访问趋势表插入:', inserted, '条数据');
  return inserted;
}

// 广咨智采月度用户数据插入函数
async function insertSmartProcurementMonthlyUsers(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  console.log('广咨智采月度用户数据行数:', rows.length);
  console.log('表头:', headers);
  
  for (const row of rows) {
    // 跳过空行
    if (!row || row.length === 0 || !row[0]) {
      console.log('跳过空行:', row);
      continue;
    }
    
    // 提取数据，根据Excel表格结构调整索引
    const month = row[0];
    const total_users = parseInt(row[1] || 0);
    const new_users = parseInt(row[2] || 0);
    const companies = parseInt(row[3] || 0);
    const new_companies = parseInt(row[4] || 0);
    const page_views = parseInt(row[5] || 0);
    const visit_count = parseInt(row[7] || 0); // 访问次数（跳过了前端模板中的"访问人数"字段）
    const order_count = parseInt(row[8] || 0);
    const revenue = parseInt(row[9] || 0);
    const new_projects = parseInt(row[10] || 0);
    const service_fee = parseInt(row[11] || 0);
    
    console.log('处理广咨智采月度用户数据行:', { 
      month, total_users, new_users, companies, new_companies, page_views, visit_count, order_count, revenue, new_projects, service_fee
    });
    
    if (month) {
      try {
        const { error } = await supabase
          .from('smart_procurement_monthly_users')
          .upsert([
            {
              month,
              total_users,
              new_users,
              companies,
              new_companies,
              page_views,
              visit_count,
              order_count,
              revenue,
              new_projects,
              service_fee
            }
          ])
          .eq('month', month);
        
        if (!error) {
          inserted++;
          console.log('成功插入1条广咨智采月度用户数据');
        } else {
          console.error('广咨智采月度用户数据插入/更新失败:', error.message);
        }
      } catch (error) {
        console.error('广咨智采月度用户数据插入/更新异常:', error.message);
        console.error('错误堆栈:', error.stack);
      }
    }
  }
  
  console.log('广咨智采月度用户数据表插入:', inserted, '条数据');
  return inserted;
}

// 材价库月度访问趋势插入函数
async function insertMaterialPriceMonthlyTrend(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  console.log('月度访问趋势数据行数:', rows.length);
  console.log('月度访问趋势表头:', headers);
  
  for (const row of rows) {
    console.log('处理月度访问趋势行数据:', row);
    
    if (row.length >= 3) {
      const month = row[0];
      const visits = parseInt(row[1]) || 0;
      const users = parseInt(row[2]) || 0;
      
      console.log('构建月度访问趋势数据:', { month, visits, users });
      
      const { error } = await supabase
        .from('material_price_monthly_trend')
        .upsert([{
          month,
          visits,
          users
        }])
        .eq('month', month);
      
      if (!error) {
        inserted++;
        console.log('成功插入月度访问趋势数据:', month);
      } else {
        console.error('插入材价库月度访问趋势数据失败:', error.message);
        console.error('错误详细信息:', error);
      }
    }
  }
  
  console.log('材价库月度访问趋势表插入:', inserted, '条数据');
  return inserted;
}

// 材价库核心数据插入函数
async function insertMaterialPriceMonthlyCore(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  console.log('核心数据行数:', rows.length);
  console.log('核心数据表头:', headers);
  
  for (const row of rows) {
    console.log('处理核心数据行数据:', row);
    
    if (row[0]) { // 只要求月份存在即可
      const month = row[0];
      const material_count = parseInt(row[3]) || 0; // 材价数量在第4列（索引3）
      const standard_items = parseInt(row[4]) || 0; // 标准工料机数量在第5列（索引4）
      const inquiry_count = parseInt(row[5]) || 0; // 询价申请数据在第6列（索引5）
      const inquiry_materials = parseInt(row[6]) || 0; // 询价材料数据在第7列（索引6）
      const supplier_count = parseInt(row[7]) || 0; // 供应商数量在第8列（索引7）
      
      console.log('构建核心数据:', { month, material_count, standard_items, inquiry_count, inquiry_materials, supplier_count });
      
      const { error } = await supabase
        .from('material_price_monthly_core')
        .upsert([{
          month,
          material_count,
          standard_items,
          inquiry_count,
          inquiry_materials,
          supplier_count
        }])
        .eq('month', month);
      
      if (!error) {
        inserted++;
        console.log('成功插入核心数据:', month);
      } else {
        console.error('插入材价库核心数据失败:', error.message);
        console.error('错误详细信息:', error);
      }
    }
  }
  
  console.log('材价库核心数据表插入:', inserted, '条数据');
  return inserted;
}

// 材价库部门访问分布插入函数
async function insertMaterialPriceDepartmentVisits(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  console.log('部门访问数据行数:', rows.length);
  console.log('部门访问表头:', headers);
  
  for (const row of rows) {
    console.log('处理部门访问行数据:', row);
    
    if (row.length >= 2 && row[0]) {
      const month = row[0];
      
      // 遍历所有部门数据，每部门插入一行
      for (let i = 1; i < headers.length; i++) {
        if (headers[i] && row[i] !== undefined && row[i] !== '') {
          const departmentName = headers[i];
          const visits = parseInt(row[i]) || 0;
          
          const { error } = await supabase
            .from('material_price_department_visits')
            .upsert({
              month,
              department_name: departmentName,
              visits,
              updated_at: new Date().toISOString()
            })
            .eq('month', month)
            .eq('department_name', departmentName);
          
          if (!error) {
            inserted++;
            console.log('成功插入部门访问数据:', month, departmentName, visits);
          } else {
            console.error('插入材价库部门访问数据失败:', error.message);
            console.error('错误详细信息:', error);
          }
        }
      }
    }
  }
  
  console.log('材价库部门访问分布表插入:', inserted, '条数据');
  return inserted;
}

// 材价库月度数据插入函数（厂商报价、市场询价、信息价）
async function insertMaterialPriceMonthlyData(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  console.log('月度数据行数:', rows.length);
  console.log('月度数据表头:', headers);
  
  for (const row of rows) {
    console.log('处理月度数据行:', row);
    
    if (row[0]) { // 只要求月份存在即可
      let month = row[0];
      
      // 处理月份格式，确保格式为YYYY-MM
      if (month.length === 2 && !month.includes('-')) {
        // 如果是"1月"格式，转换为"2025-01"格式
        const year = new Date().getFullYear();
        const monthNum = parseInt(month.replace('月', ''));
        month = `${year}-${monthNum.toString().padStart(2, '0')}`;
      } else if (month.length === 3 && !month.includes('-')) {
        // 如果是"10月"格式，转换为"2025-10"格式
        const year = new Date().getFullYear();
        const monthNum = parseInt(month.replace('月', ''));
        month = `${year}-${monthNum}`;
      }
      
      const factory_quotes = parseInt(row[1]) || 0;
      const market_inquiries = parseInt(row[2]) || 0;
      const information_prices = parseInt(row[3]) || 0;
      
      console.log('构建月度数据:', { month, factory_quotes, market_inquiries, information_prices });
      
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
        console.log('成功插入月度数据:', month);
      } else {
        console.error('插入材价库月度数据失败:', error.message);
        console.error('错误详细信息:', error);
      }
    }
  }
  
  console.log('材价库月度数据表插入:', inserted, '条数据');
  return inserted;
}

// 广咨电子招投标交易平台月度访问趋势插入函数
async function insertBiddingPlatformMonthlyTrend(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  console.log('月度访问数据行数:', rows.length);
  console.log('表头:', headers);
  
  for (const row of rows) {
    console.log('处理行数据:', row);
    
    // 放宽条件，只要月份存在就插入数据
    if (row[0]) {
      const month = row[0];
      const visits = parseInt(row[1]) || 0;
      const users = parseInt(row[2]) || 0;
      const projects = parseInt(row[3]) || 0;
      
      console.log('准备插入数据:', month, visits, users, projects);
      
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
        console.log('插入成功:', inserted);
      } else {
        console.error('插入广咨电子招投标交易平台月度访问趋势数据失败:', error.message);
      }
    }
  }
  
  console.log('广咨电子招投标交易平台月度访问趋势表插入:', inserted, '条数据');
  return inserted;
}

// 广咨电子招投标交易平台部门访问分布插入函数
async function insertBiddingPlatformDepartmentVisits(data) {
  const headers = data[0];
  const rows = data.slice(1);
  let inserted = 0;
  
  for (const row of rows) {
    if (row.length >= 2) {
      const month = row[0];
      
      // 处理部门数据
      for (let i = 1; i < headers.length; i++) {
        // 放宽条件，只要部门名称存在就插入数据
        if (headers[i]) {
          const departmentName = headers[i];
          const visits = parseInt(row[i]) || 0;
          
          const { error } = await supabase
            .from('bidding_platform_department_visits')
            .upsert([{
              month,
              department_name: departmentName,
              visits
            }])
            .eq('month', month)
            .eq('department_name', departmentName);
          
          if (!error) {
            inserted++;
          } else {
            console.error('插入广咨电子招投标交易平台部门访问数据失败:', error.message);
          }
        }
      }
    }
  }
  
  console.log('广咨电子招投标交易平台部门访问分布表插入:', inserted, '条数据');
  return inserted;
}

// 查询数据库中的数据
app.get('/api/data/:collectionName', async (req, res) => {
  try {
    // 检查是否已配置 Supabase
    if (!supabase) {
      return res.status(500).json({ 
        success: false, 
        message: 'Supabase 客户端未正确配置，请联系管理员' 
      });
    }
    
    const tableName = req.params.collectionName || 'digital_library_monthly_trend';
    const { startDate, endDate } = req.query;
    
    console.log(`查询表: ${tableName}，日期范围: ${startDate} 至 ${endDate}`);
    
    // 从 Supabase 查询数据
    let query = supabase
      .from(tableName)
      .select('*')
      .order('month', { ascending: false });
    
    // 添加日期筛选条件
    if (startDate || endDate) {
      console.log(`应用日期筛选: ${startDate} 至 ${endDate}`);
      
      if (startDate) {
        query = query.gte('month', startDate);
      }
      
      if (endDate) {
        query = query.lte('month', endDate);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    console.log(`查询结果: ${data.length} 条数据`);
    
    // 处理数据，将数据库字段映射为前端期望的字段名
    let processedData = data;
    
    // 处理广咨智采月度访问趋势表
    if (tableName === 'smart_procurement_monthly_trend') {
      processedData = data.map(item => ({
        id: item.id,
        month: item.month,
        visits: item.visits,
        users: item.users,
        registers: item.registers,
        // 映射为前端期望的字段名
        personal_users: item.users, // 访问人数作为个人用户数量
        enterprise_users: 0, // 企业用户数量默认0，实际应从smart_procurement_monthly_users表获取
        orders: 0, // 订单数量默认0，实际应从smart_procurement_monthly_users表获取
        service_income: 0, // 服务费收入默认0，实际应从smart_procurement_monthly_users表获取
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    }
    
    // 处理广咨智采月度用户数据表
    if (tableName === 'smart_procurement_monthly_users') {
      processedData = data.map(item => ({
        id: item.id,
        month: item.month,
        total_users: item.total_users,
        new_users: item.new_users,
        companies: item.companies,
        new_companies: item.new_companies,
        page_views: item.page_views,
        visit_count: item.visit_count,
        order_count: item.order_count,
        revenue: item.revenue,
        new_projects: item.new_projects,
        service_fee: item.service_fee,
        // 映射为前端期望的字段名
        personal_users: item.total_users, // 总用户数作为个人用户数量
        enterprise_users: item.companies, // 企业数作为企业用户数量
        orders: item.order_count, // 订单数量
        service_income: item.service_fee, // 服务费作为服务费收入
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    }
    
    // 对于部门访问数据，确保返回格式正确
    if (tableName === 'digital_library_department_visits') {
      console.log('处理部门访问数据...');
      // 这里可以添加额外的处理逻辑，如果需要的话
      // 例如，按部门分组或计算统计数据
    }
    
    res.json({
      success: true,
      data: processedData || []
    });
  } catch (error) {
    console.error('获取数据失败:', error.message);
    res.status(500).json({
      success: false,
      message: `获取数据失败: ${error.message}`
    });
  }
});

// 启动服务器（本地开发使用）
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`运营数据看板后端服务正在运行在端口 ${PORT}`);
    console.log(`API 地址: http://localhost:${PORT}`);
  });
}

// 导出CloudBase函数
module.exports.main = async (event, context) => {
  // 将CloudBase事件转换为Express请求
  const { req, res } = await require('@cloudbase/node-sdk/server').createMiddleware(app);
  return res;
};