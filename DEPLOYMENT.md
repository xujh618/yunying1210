# 运营数据看板部署指南

## 项目概述

运营数据看板是一个基于Node.js和Express的前后端一体项目，用于展示和管理广咨国际各数字化产品的运营数据。

## 技术栈

- **前端**: HTML, CSS, JavaScript, Chart.js
- **后端**: Node.js, Express
- **数据库**: Supabase
- **文件上传**: Multer
- **Excel处理**: xlsx

## 部署步骤

### 1. 在CloudStudio中导入项目

1. 登录CloudStudio
2. 点击"新建工作空间"
3. 选择"从Git仓库导入"
4. 输入仓库URL: `https://github.com/xujh618/yunying1210.git`
5. 选择"Node.js"环境
6. 点击"创建"

### 2. 配置环境变量

项目使用固定的Supabase配置，已在代码中设置，无需额外配置。

### 3. 安装依赖

在CloudStudio终端中执行以下命令：

```bash
cd server
npm install
```

### 4. 启动服务

#### 方式一：直接启动

```bash
cd server
npm start
```

#### 方式二：使用Docker Compose

```bash
docker-compose up -d
```

### 5. 访问项目

- 前端页面: `http://localhost:3000`
- 管理后台: `http://localhost:3000/admin.html`
- API接口: `http://localhost:3000/api/`

## 项目结构

```
yunying-dashboard/
├── index.html          # 首页
├── admin.html          # 管理后台
├── product-detail.html # 产品详情页
├── test-upload.html    # 测试上传页面
├── server/             # 后端代码
│   ├── server.js       # 主服务器文件
│   ├── package.json    # 后端依赖
│   └── yunying-dashboard-api/ # API相关代码
├── Dockerfile          # Docker配置
└── docker-compose.yml  # Docker Compose配置
```

## 功能说明

### 前端功能

1. **数据展示**
   - 产品动态轮播
   - 数据卡片
   - 产品访问数据图表

2. **数据管理**
   - 上传Excel文件
   - 编辑产品动态
   - 配置数据卡片

### 后端功能

1. **API接口**
   - 健康检查: `/api/health`
   - 上传Excel: `/api/upload-excel`
   - 获取数据: `/api/data/:collectionName`

2. **数据处理**
   - 解析Excel文件
   - 数据验证
   - 数据存储到Supabase

## 数据库配置

项目使用Supabase作为数据库，已配置好连接信息，无需额外设置。

### 主要表结构

- `digital_library_monthly_trend` - 数字智库月度访问趋势
- `digital_library_feature_usage` - 数字智库功能使用情况
- `digital_library_department_visits` - 数字智库部门访问分布
- `smart_procurement_monthly_trend` - 广咨智采月度访问趋势
- `smart_procurement_monthly_users` - 广咨智采月度用户数据
- `material_price_monthly_trend` - 材价库月度访问趋势
- `material_price_department_visits` - 材价库部门访问分布
- `bidding_platform_monthly_trend` - 招投标平台月度访问趋势
- `bidding_platform_department_visits` - 招投标平台部门访问分布

## 常见问题

### 1. 上传文件失败

- 确保文件格式为Excel (.xlsx, .xls)
- 文件大小不超过5MB
- 确保网络连接正常

### 2. 服务无法启动

- 检查端口是否被占用
- 确保依赖安装成功
- 查看控制台输出的错误信息

### 3. 数据库连接失败

- 检查Supabase配置是否正确
- 确保网络可以访问Supabase服务

## 维护说明

1. **定期备份数据**
   - 定期导出Supabase数据库
   - 定期备份上传的Excel文件

2. **更新依赖**
   ```bash
   cd server
   npm update
   ```

3. **监控服务状态**
   - 使用CloudStudio的监控功能
   - 定期检查日志

## 联系信息

如有问题，请联系项目维护人员。