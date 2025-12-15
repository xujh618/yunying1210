FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY yunying-dashboard-server/package*.json ./

# 安装依赖
RUN npm ci --omit=dev

# 复制应用代码
COPY yunying-dashboard-server/ .

# 复制前端文件
COPY index.html ./

# 创建uploads目录
RUN mkdir -p uploads

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]