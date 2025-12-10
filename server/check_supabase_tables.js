const { createClient } = require('@supabase/supabase-js');

// 使用固定的Supabase配置
const supabaseUrl = 'https://oogkyuxkxksvzzhuagnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZ2t5dXhreGtzdnp6aHVhZ253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY2NTg0NywiZXhwIjoyMDgwMjQxODQ3fQ.2Uoi9rBbq3CVyzz4-h9tTrmCC5YHoVL_aPLXfn6I08I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('=== 检查材价库数据表结构 ===');
    
    try {
        // 检查月度访问趋势表
        console.log('\n1. 检查 material_price_monthly_trend 表...');
        const { data: trendData, error: trendError } = await supabase
            .from('material_price_monthly_trend')
            .select('*')
            .limit(1);
        
        if (trendError) {
            if (trendError.code === '42P01') {
                console.log('   表不存在，需要创建');
            } else {
                console.error('   查询失败:', trendError.message);
            }
        } else {
            console.log('   表存在，字段结构:');
            if (trendData.length > 0) {
                console.log('   ' + Object.keys(trendData[0]).join(', '));
            } else {
                console.log('   表为空，无法获取字段信息');
            }
        }
        
        // 检查核心数据表
        console.log('\n2. 检查 material_price_monthly_core 表...');
        const { data: coreData, error: coreError } = await supabase
            .from('material_price_monthly_core')
            .select('*')
            .limit(1);
        
        if (coreError) {
            if (coreError.code === '42P01') {
                console.log('   表不存在，需要创建');
            } else {
                console.error('   查询失败:', coreError.message);
            }
        } else {
            console.log('   表存在，字段结构:');
            if (coreData.length > 0) {
                console.log('   ' + Object.keys(coreData[0]).join(', '));
            } else {
                console.log('   表为空，无法获取字段信息');
            }
        }
        
        // 检查部门访问数据表
        console.log('\n3. 检查 material_price_department_visits 表...');
        const { data: deptData, error: deptError } = await supabase
            .from('material_price_department_visits')
            .select('*')
            .limit(1);
        
        if (deptError) {
            if (deptError.code === '42P01') {
                console.log('   表不存在，需要创建');
            } else {
                console.error('   查询失败:', deptError.message);
            }
        } else {
            console.log('   表存在，字段结构:');
            if (deptData.length > 0) {
                console.log('   ' + Object.keys(deptData[0]).join(', '));
            } else {
                console.log('   表为空，无法获取字段信息');
            }
        }
        
    } catch (error) {
        console.error('检查表结构时出错:', error.message);
    }
}

checkTables();
