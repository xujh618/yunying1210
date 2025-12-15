const express = require('express');
const { createClient } = require('@supabase/supabase-js');

// 使用固定的Supabase配置
const supabaseUrl = 'https://oogkyuxkxksvzzhuagnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZ2t5dXhreGtzdnp6aHVhZ253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY2NTg0NywiZXhwIjoyMDgwMjQxODQ3fQ.2Uoi9rBbq3CVyzz4-h9tTrmCC5YHoVL_aPLXfn6I08I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPlanningToolDetails() {
    console.log('=== 测试规划报告编制工具详情表 ===');
    
    try {
        // 1. 检查表是否存在
        console.log('\n1. 检查表是否存在...');
        const { data: tableInfo, error: tableError } = await supabase
            .from('digital_library_planning_tool_details')
            .select('*')
            .limit(1);
            
        if (tableError) {
            console.error('表检查失败:', tableError);
            return;
        }
        
        console.log('表存在，字段结构:', tableInfo.length > 0 ? Object.keys(tableInfo[0]).join(', ') : '表为空');
        
        // 2. 尝试插入一条测试数据
        console.log('\n2. 尝试插入测试数据...');
        const testData = {
            tool_name: '测试工具',
            usage_count: 100,
            satisfaction: 4.5
        };
        
        const { data: insertResult, error: insertError } = await supabase
            .from('digital_library_planning_tool_details')
            .insert([testData]);
            
        if (insertError) {
            console.error('插入测试数据失败:', insertError);
        } else {
            console.log('插入测试数据成功:', insertResult);
        }
        
        // 3. 查询现有数据
        console.log('\n3. 查询现有数据...');
        const { data: existingData, error: queryError } = await supabase
            .from('digital_library_planning_tool_details')
            .select('*')
            .limit(5);
            
        if (queryError) {
            console.error('查询数据失败:', queryError);
        } else {
            console.log('现有数据数量:', existingData.length);
            if (existingData.length > 0) {
                console.log('前3条数据:');
                for (let i = 0; i < Math.min(3, existingData.length); i++) {
                    console.log(`行 ${i+1}:`, JSON.stringify(existingData[i]));
                }
            }
        }
        
        // 4. 尝试使用不同字段名插入数据
        console.log('\n4. 尝试使用不同字段名插入数据...');
        
        // 尝试用户模式
        const userData = {
            user_id: 'test_user_001',
            username: '测试用户',
            department: '测试部门',
            project_name: '测试项目'
        };
        
        const { data: userResult, error: userError } = await supabase
            .from('digital_library_planning_tool_details')
            .insert([userData]);
            
        if (userError) {
            console.error('插入用户数据失败:', userError);
        } else {
            console.log('插入用户数据成功:', userResult);
        }
        
        // 5. 检查表结构
        console.log('\n5. 检查表结构...');
        const { data: schemaData, error: schemaError } = await supabase
            .rpc('get_table_schema', { table_name: 'digital_library_planning_tool_details' });
            
        if (schemaError) {
            console.error('获取表结构失败:', schemaError.message);
            
            // 尝试其他方式检查表结构
            console.log('尝试通过information_schema获取表结构...');
            const { data: infoData, error: infoError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable')
                .eq('table_name', 'digital_library_planning_tool_details')
                .eq('table_schema', 'public');
                
            if (infoError) {
                console.error('获取information_schema失败:', infoError);
            } else {
                console.log('表字段结构:');
                for (const col of infoData) {
                    console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
                }
            }
        } else {
            console.log('表结构:', schemaData);
        }
        
    } catch (error) {
        console.error('测试过程中发生异常:', error);
    }
}

testPlanningToolDetails();