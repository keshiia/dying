# Ubuntu 2核2G 服务器部署教程

> 项目：青少年普法互动Web平台
> 环境：Ubuntu + Node.js 20 + MySQL 8 + Nginx + PM2

---

## 第1步：更新系统 & 安装基础工具

```bash
apt update && apt upgrade -y
apt install -y curl wget git unzip vim nginx ufw
```

---

## 第2步：安装 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 验证
node -v   # v20.x.x
npm -v    # 10.x.x
```

---

## 第3步：安装 MySQL 8

```bash
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql
mysql_secure_installation
```

`mysql_secure_installation` 过程中：
- 密码策略选 `0`（低）或 `1`（中）
- 设置 MySQL root 密码（记好！）
- 其他选项全选 `Y`

---

## 第4步：配置 MySQL（节省内存）

```bash
vim /etc/mysql/mysql.conf.d/mysqld.cnf
```

在 `[mysqld]` 下面加一行：

```ini
innodb_buffer_pool_size=256M
```

保存后重启：

```bash
systemctl restart mysql
```

---

## 第5步：创建数据库

```bash
mysql -u root -p
```

在 MySQL 内执行：

```sql
CREATE DATABASE legal_for_teenager DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'legalapp'@'localhost' IDENTIFIED BY '你的数据库密码';
GRANT ALL PRIVILEGES ON legal_for_teenager.* TO 'legalapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 第6步：上传项目到服务器

**方法A：通过 Git（推荐）**

先把代码推到 GitHub/Gitee 私有仓库，然后在服务器上：

```bash
cd /var/www
git clone https://gitee.com/你的用户名/legal_for_teenager.git
cd legal_for_teenager
```

**方法B：直接上传**

在本地电脑执行：

```bash
scp -r D:\trial\legal_for_teenager root@你的服务器IP:/var/www/
```

---

## 第7步：安装项目依赖

```bash
cd /var/www/legal_for_teenager
npm install
```

---

## 第8步：配置环境变量

```bash
cp .env.example .env
vim .env
```

改成以下内容：

```env
DATABASE_URL="mysql://legalapp:你的数据库密码@localhost:3306/legal_for_teenager?connection_limit=5"
JWT_SECRET="这里换一个随机的长字符串至少32位"
JWT_EXPIRES_IN="7d"
ALLOW_TEACHER_SELF_REGISTER="true"

AI_PROVIDER="openai"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
OPENAI_BASE_URL="https://api.openai.com"

FRONTEND_ORIGIN="http://你的服务器IP"
```

生成随机 JWT_SECRET：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 第9步：初始化数据库

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

> **如果迁移报错 P3018（表名大小写问题）**，执行：
> ```bash
> npx prisma migrate resolve --rolled-back 20260404064327_add_comic_read
> mysql -u legalapp -p -e "DROP DATABASE legal_for_teenager; CREATE DATABASE legal_for_teenager DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
> npx prisma migrate deploy
> npx prisma db seed
> ```

---

## 第10步：构建前端

```bash
npx vite build
```

---

## 第11步：测试运行

```bash
NODE_ENV=production PORT=3001 npx tsx api/server.ts
```

看到 `Server running on port 3001` 说明成功，按 `Ctrl+C` 停止。

---

## 第12步：配置 PM2（进程守护）

```bash
npm install -g pm2

cd /var/www/legal_for_teenager
pm2 start "npx cross-env NODE_ENV=production PORT=3001 npx tsx --max-old-space-size=512 api/server.ts" --name legal-teenager

pm2 save
pm2 startup
# 执行上面输出中提示的那条命令
```

验证：

```bash
pm2 status    # 应显示 online
pm2 logs legal-teenager  # 查看日志
```

---

## 第13步：配置 Nginx（反向代理）

```bash
vim /etc/nginx/sites-available/legal-teenager
```

写入以下内容（替换 `你的域名或IP`）：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10m;
}
```

启用配置：

```bash
rm /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/legal-teenager /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 第14步：配置防火墙

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## 第15步：（可选）配置 HTTPS

如果有域名，用免费 Let's Encrypt：

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d 你的域名
```

---

## 第16步：云服务器安全组放行

如果是阿里云/腾讯云/华为云等，需要在**控制台安全组**中放行以下端口：

| 端口 | 用途 |
|------|------|
| 22 | SSH |
| 80 | HTTP |
| 443 | HTTPS（如配置了） |

> 这一步很多人会漏掉，导致浏览器无法访问。

---

## 验证部署

打开浏览器访问 `http://你的服务器IP`

种子账号：
- 学生：`student@example.com` / `Student123!`
- 教师：`teacher@example.com` / `Teacher123!`

---

## 排查问题

如果访问不了，依次运行：

```bash
pm2 status                                    # 进程是否 online
ss -tlnp | grep -E '80|3001'                 # 端口是否在监听
systemctl status nginx                        # Nginx 是否正常
curl -I http://127.0.0.1:3001                 # 应用是否响应
curl -I http://127.0.0.1:80                   # Nginx 是否响应
pm2 logs legal-teenager --lines 20            # 查看应用日志
```

---

## 常用运维命令

```bash
pm2 restart legal-teenager    # 重启应用
pm2 stop legal-teenager       # 停止应用
pm2 logs legal-teenager       # 查看实时日志
systemctl reload nginx        # 重载 Nginx 配置
npx prisma migrate deploy     # 更新数据库结构
npx prisma db seed            # 重新导入种子数据
```
