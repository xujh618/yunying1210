# 运营数据看板后端服务

这是一个基于Node.js的后端服务，用于处理Excel数据上传并将数据存储到腾讯云文档型数据库中。

## 功能特性

1. 接收Excel文件上传
2. 解析Excel数据
3. 将数据存储到腾讯云文档型数据库
4. 提供数据查询接口

## 技术栈

- Node.js
- Express.js
- Multer (文件上传)
- XLSX (Excel解析)
- 腾讯云开发(CloudBase) Node.js SDK

## 安装和运行

1. 克隆项目代码
2. 进入 `server` 目录
3. 安装依赖：
   ```bash
   npm install
   ```

4. 配置环境变量：
   - 复制 `.env.example` 文件为 `.env`
   - 填入腾讯云开发的相关凭证

5. 启动服务：
   ```bash
   npm start
   ```
   或者开发模式：
   ```bash
   npm run dev
   ```

## API 接口

### 1. 上传Excel文件

- **URL**: `/api/upload-excel`
- **方法**: `POST`
- **内容类型**: `multipart/form-data`
- **参数**:
  - `excel` (文件): Excel文件 (必需)
  - `collectionName` (字符串): 数据库集合名称 (可选，默认为 `excel_data`)
- **响应**:
  ```json
  {
    "success": true,
    "message": "成功上传 N 条记录到 \"collectionName\" 集合",
    "data": {
      "insertedCount": N,
      "collectionName": "collectionName",
      "fileId": "file_id"
    }
  }
  ```

### 2. 查询数据

- **URL**: `/api/data/:collectionName`
- **方法**: `GET`
- **参数**:
  - `collectionName`: 数据库集合名称 (路径参数)
- **响应**:
  ```json
  {
    "success": true,
    "data": [...],
    "count": N
  }
  ```

## 腾讯云开发配置

要使用腾讯云文档型数据库，需要在腾讯云控制台获取以下信息并配置到 `.env` 文件中：

- `TCB_ENV_ID`: 环境ID
- `TCB_SECRET_ID`: Secret ID
- `TCB_SECRET_KEY`: Secret Key

## 错误处理

服务会对各种异常情况进行处理，并返回相应的错误信息：

- 文件格式不正确
- 文件过大
- 数据库连接失败
- 数据解析错误

## 许可证

MIT