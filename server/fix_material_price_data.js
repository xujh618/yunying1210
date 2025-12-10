const { createClient } = require('@supabase/supabase-js');

// 使用固定的Supabase配置
const supabaseUrl = 'https://oogkyuxkxksvzzhuagnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZ2t5dXhreGtzdnp6aHVhZ253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY2NTg0NywiZXhwIjoyMDgwMjQxODQ3fQ.2Uoi9rBbq3CVyzz4-h9tTrmCC5YHoVL_aPLXfn6I08I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMaterialPriceData() {
    console.log('=== 修复材价库数据问题 ===');
    
    try {
        // 1. 检查是否存在月度数据表
        console.log('\n1. 检查材价库月度数据表...');
        const { data: monthlyData, error: monthlyError } = await supabase
            .from('material_price_monthly_data')
            .select('*')
            .limit(1);
        
        if (monthlyError) {
            if (monthlyError.code === '42P01') {
                console.log('   material_price_monthly_data表不存在，开始创建...');
                
                // 创建月度数据表
                const { error: createTableError } = await supabase
                    .rpc('create_material_price_monthly_data_table');
                
                if (createTableError) {
                    console.error('   创建表失败:', createTableError.message);
                    
                    // 如果RPC函数不存在，尝试使用直接的SQL创建表
                    console.log('   尝试使用SQL直接创建表...');
                    const { error: directCreateError } = await supabase
                        .from('material_price_monthly_data')
                        .insert([{
                            month: '2025-01',
                            factory_quotes: 0,
                            market_inquiries: 0,
                            information_prices: 0
                        }]);
                    
                    if (directCreateError) {
                        console.error('   直接创建表失败:', directCreateError.message);
                    } else {
                        console.log('   直接创建表成功');
                    }
                } else {
                    console.log('   创建表成功');
                }
            } else {
                console.error('   查询失败:', monthlyError.message);
            }
        } else {
            console.log('   material_price_monthly_data表已存在');
        }
        
        // 2. 检查表结构
        console.log('\n2. 检查表结构...');
        const { data: structureData, error: structureError } = await supabase
            .from('material_price_monthly_data')
            .select('*')
            .limit(1);
        
        if (structureData && structureData.length > 0) {
            console.log('   表结构:', Object.keys(structureData[0]).join(', '));
        }
        
    } catch (error) {
        console.error('修复材价库数据问题时出错:', error.message);
    }
}

fixMaterialPriceData();
