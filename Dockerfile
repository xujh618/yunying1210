FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制server目录下的package.json和package-lock.json文件
COPY server/package.json server/package-lock.json ./

# 安装依赖
RUN npm ci --only=production

# 复制server目录下的应用代码
COPY server .

# 暴露端口
EXPOSE 3000

# 设置启动命令
CMD ["npm", "start"]