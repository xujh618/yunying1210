const { createClient } = require('@supabase/supabase-js');

// 使用固定的Supabase配置
const supabaseUrl = 'https://oogkyuxkxksvzzhuagnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZ2t5dXhreGtzdnp6aHVhZ253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY2NTg0NywiZXhwIjoyMDgwMjQxODQ3fQ.2Uoi9rBbq3CVyzz4-h9tTrmCC5YHoVL_aPLXfn6I08I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
    console.log('=== 检查所有数字智库相关表的结构和数据 ===');
    
    const tables = [
        'digital_library_monthly_trend',
        'digital_library_feature_usage',
        'digital_library_department_visits',
        'digital_library_planning_tool_details'
    ];
    
    for (const tableName of tables) {
        console.log(`\n=== 检查表: ${tableName} ===`);
        
        try {
            // 检查表结构
            const { data: structureData, error: structureError } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (structureError) {
                console.error(`表 ${tableName} 结构查询失败:`, structureError.message);
                continue;
            }
            
            if (structureData.length > 0) {
                console.log('表字段结构:', Object.keys(structureData[0]).join(', '));
            } else {
                console.log('表为空，无法获取字段信息');
            }
            
            // 检查表数据
            const { data: tableData, error: dataError, count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact' });
            
            if (dataError) {
                console.error(`表 ${tableName} 数据查询失败:`, dataError.message);
                continue;
            }
            
            console.log(`数据行数: ${count}`);
            
            if (count > 0) {
                console.log('前3行数据:');
                for (let i = 0; i < Math.min(3, tableData.length); i++) {
                    console.log(`行 ${i+1}:`, JSON.stringify(tableData[i]));
                }
            }
            
        } catch (error) {
            console.error(`检查表 ${tableName} 时发生错误:`, error.message);
        }
    }
}

checkAllTables();