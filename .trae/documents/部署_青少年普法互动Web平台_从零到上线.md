# 部署：青少年普法互动Web平台（从零到上线）

部署目标：
- Nginx 监听 80/443
- 前端 `dist/` 由 Nginx 静态托管
- `/api` 反向代理到 Node.js（3001）
- Node.js 进程由 PM2 守护（可选 systemd）
- MySQL 仅本机访问（更安全）

## 0) 服务器准备

建议准备：
- 一台 CentOS 7.9 或 Ubuntu 22.04
- 一个域名（可选）
- 放行端口：80（https 还需要 443）

目录约定：
- 代码目录：`/opt/legal_for_teenager`
- Node 端口：`3001`

## 1) Ubuntu 22.04（apt）从零部署

### 1.1 系统更新
```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install curl git ufw
```

### 1.2 安装 Node.js（推荐 20.x）
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs
node -v
npm -v
```

### 1.3 安装 MySQL 8
```bash
sudo apt -y install mysql-server
sudo systemctl enable --now mysql
sudo mysql -e "SELECT VERSION();"
```

创建数据库与用户（建议专用账户）：
```bash
sudo mysql <<'SQL'
CREATE DATABASE legal_for_teenager DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lft'@'localhost' IDENTIFIED BY 'ChangeMe_StrongPassword_123';
GRANT ALL PRIVILEGES ON legal_for_teenager.* TO 'lft'@'localhost';
FLUSH PRIVILEGES;
SQL
```

### 1.4 安装 Nginx
```bash
sudo apt -y install nginx
sudo systemctl enable --now nginx
```

### 1.5 拉取代码并安装依赖
```bash
sudo mkdir -p /opt/legal_for_teenager
sudo chown -R $USER:$USER /opt/legal_for_teenager
cd /opt/legal_for_teenager

git clone <你的仓库地址> .
npm install
npm run prisma:generate
```

### 1.6 配置环境变量（后端）
```bash
cp .env.example .env
```

编辑 `.env`（至少改这两项）：
- `DATABASE_URL="mysql://lft:ChangeMe_StrongPassword_123@localhost:3306/legal_for_teenager"`
- `JWT_SECRET="ChangeMe_To_A_Long_Random_String"`

可选（启用AI）：
- `OPENAI_API_KEY="..."`
- `OPENAI_MODEL="gpt-4o-mini"`

### 1.7 初始化数据库与种子数据
```bash
npm run prisma:deploy
npm run prisma:seed
```

### 1.8 构建前端
```bash
npm run client:build
```

### 1.9 启动后端（PM2 守护）
```bash
sudo npm i -g pm2
cd /opt/legal_for_teenager

pm2 start "npm run start" --name legal-for-teenager
pm2 save
pm2 startup
```

按提示复制粘贴 `pm2 startup` 输出的那条命令执行。

### 1.10 Nginx 配置（静态 + /api 反代）
创建配置：
```bash
sudo tee /etc/nginx/sites-available/legal_for_teenager >/dev/null <<'NGINX'
server {
  listen 80;
  server_name _;

  root /opt/legal_for_teenager/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/legal_for_teenager /etc/nginx/sites-enabled/legal_for_teenager
sudo nginx -t
sudo systemctl reload nginx
```

### 1.11 防火墙（可选）
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 1.12 验证
- 打开浏览器访问：`http://<服务器IP>/`
- 后端健康检查：`http://<服务器IP>/api/health`

## 2) CentOS 7.9（yum）从零部署

### 2.1 系统更新
```bash
sudo yum -y update
sudo yum -y install curl git
```

### 2.2 安装 Node.js（推荐 20.x）
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum -y install nodejs
node -v
npm -v
```

### 2.3 安装 MySQL 8（Community Repo）
CentOS 7 默认是 MariaDB，如需 MySQL 8 建议使用官方社区源。

```bash
sudo yum -y install https://dev.mysql.com/get/mysql80-community-release-el7-11.noarch.rpm
sudo yum -y install mysql-community-server
sudo systemctl enable --now mysqld
sudo grep 'temporary password' /var/log/mysqld.log
```

首次登录并修改 root 密码：
```bash
mysql -uroot -p
```
进入后执行：
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'ChangeMe_StrongPassword_123';
```

创建数据库与用户：
```bash
mysql -uroot -p <<'SQL'
CREATE DATABASE legal_for_teenager DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lft'@'localhost' IDENTIFIED BY 'ChangeMe_StrongPassword_123';
GRANT ALL PRIVILEGES ON legal_for_teenager.* TO 'lft'@'localhost';
FLUSH PRIVILEGES;
SQL
```

### 2.4 安装 Nginx
```bash
sudo yum -y install epel-release
sudo yum -y install nginx
sudo systemctl enable --now nginx
```

### 2.5 拉取代码并安装依赖
```bash
sudo mkdir -p /opt/legal_for_teenager
sudo chown -R $USER:$USER /opt/legal_for_teenager
cd /opt/legal_for_teenager

git clone <你的仓库地址> .
npm install
npm run prisma:generate
```

### 2.6 配置 `.env`
```bash
cp .env.example .env
```
编辑并至少修改：
- `DATABASE_URL="mysql://lft:ChangeMe_StrongPassword_123@localhost:3306/legal_for_teenager"`
- `JWT_SECRET="ChangeMe_To_A_Long_Random_String"`

### 2.7 初始化数据库与构建
```bash
npm run prisma:deploy
npm run prisma:seed
npm run client:build
```

### 2.8 PM2 守护
```bash
sudo npm i -g pm2
pm2 start "npm run start" --name legal-for-teenager
pm2 save
pm2 startup
```

### 2.9 Nginx 配置
```bash
sudo tee /etc/nginx/conf.d/legal_for_teenager.conf >/dev/null <<'NGINX'
server {
  listen 80;
  server_name _;

  root /opt/legal_for_teenager/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
NGINX

sudo nginx -t
sudo systemctl reload nginx
```

### 2.10 防火墙（firewalld）
```bash
sudo systemctl enable --now firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 3) 运维常用命令

### 3.1 PM2
```bash
pm2 status
pm2 logs legal-for-teenager
pm2 restart legal-for-teenager
```

### 3.2 Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx
```

### 3.3 更新代码
```bash
cd /opt/legal_for_teenager
git pull
npm install
npm run prisma:deploy
npm run client:build
pm2 restart legal-for-teenager
```
