-- 材价库部门访问数据表结构（与智库结构一致）
CREATE TABLE IF NOT EXISTS material_price_department_visits (
  id SERIAL PRIMARY KEY,
  month VARCHAR(10) NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  visits INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(month, department_name)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_mp_dept_visits_month ON material_price_department_visits(month);
CREATE INDEX IF NOT EXISTS idx_mp_dept_visits_name ON material_price_department_visits(department_name);