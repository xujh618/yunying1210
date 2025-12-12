# 使用官方 Node.js 18 镜像作为基础镜像
FROM node:18

# 设置工作目录
WORKDIR /app

# 复制项目文件到工作目录
COPY . /app

# 安装后端依赖
RUN cd server && npm install

# 暴露端口
EXPOSE 3000

# 启动后端服务
CMD ["npm", "start", "--prefix", "server"]