# Mpic

多用户公开相册图床系统，基于 GitHub 存储，部署在 Vercel 上，零数据库依赖。

## 技术栈

- Next.js 16 (App Router)
- Tailwind CSS v4
- NextAuth v4 (GitHub OAuth)
- TypeScript
- GitHub REST API (图片 + JSON 索引存储)
- Sharp (服务端图片压缩)

## 功能特性

### 核心功能
- 公开瀑布流相册，Pinterest 风格布局
- GitHub OAuth 登录，多用户上传
- 拖拽/粘贴/点击上传，支持 JPG / PNG / WebP / GIF
- 超过 5MB 自动压缩（可在系统设置中开关）
- SHA-256 文件去重
- 4 种直链格式一键复制（原始/CDN/自定义CDN/Markdown）
- 自定义域名支持

### 相册与隐私
- 创建多个相册，支持公开/隐私权限
- 单张图片可设置公开或隐私
- 隐私图片不影响直链，仅不在公开展示
- 相册支持命名、编辑、删除

### 图片信息
- 自动提取 EXIF 元数据（拍摄时间、相机、镜头、光圈、快门、ISO、焦段、GPS）
- 时间线筛选（按拍摄时间）
- 相机/镜头筛选下拉框，果冻弹出动画

### 存储管理
- 多仓库自动分片（单仓库上限 4GB，自动创建新仓库）
- 用户存储配额管理
- 管理员后台（仪表盘/图片管理/用户管理/系统设置/操作日志）

## 部署步骤

### 1. 准备 GitHub 图片仓库

创建一个 **公开** 的 GitHub 仓库，用于存储图片和索引文件。例如 `mpic-images`。

> 仓库必须是公开的，jsDelivr CDN 才能正常访问。文件名均为随机 ID，不会暴露原始信息。

### 2. 创建 GitHub Personal Access Token

1. 进入 GitHub Settings > Developer settings > Personal access tokens > Fine-grained tokens
2. 创建新 token，权限选择刚创建的图片仓库
3. 勾选 `Contents` 读写权限

### 3. 创建 GitHub OAuth App

1. 进入 GitHub Settings > Developer settings > OAuth Apps > New OAuth App
2. Homepage URL 填你的站点域名
3. Authorization callback URL 填 `https://你的域名/api/auth/callback/github`

### 4. 部署到 Vercel

1. Fork 或推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量（见下方）
4. 部署

### 5. 配置自定义域名（可选）

1. 添加 DNS CNAME 记录：
   - 类型：`CNAME`
   - 名称：你的子域名（如 `pic`）
   - 值：`cname.vercel-dns.com`
   - 代理状态：关闭（灰色，不要开 Cloudflare 代理）
2. 在 Vercel 项目设置中添加自定义域名
3. Vercel 会自动签发 SSL 证书

### 6. 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NEXT_PUBLIC_SITE_URL` | 站点域名，如 `https://pic.example.com` | 是 |
| `AUTH_SECRET` | NextAuth 加密密钥，用 `openssl rand -base64 32` 生成 | 是 |
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID | 是 |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret | 是 |
| `IMAGE_GITHUB_OWNER` | 图片仓库所有者（默认管理员） | 是 |
| `IMAGE_GITHUB_REPO` | 图片仓库名称 | 是 |
| `IMAGE_GITHUB_BRANCH` | 仓库分支，默认 `main` | 否 |
| `IMAGE_GITHUB_TOKEN` | GitHub Personal Access Token | 是 |
| `ADMIN_GITHUB_USERNAMES` | 自定义管理员，逗号分隔（可选） | 否 |
| `NEXT_PUBLIC_CDN_BASE_URL` | 自定义 CDN 前缀，可选 | 否 |

> 默认 `IMAGE_GITHUB_OWNER` 为管理员。如需指定其他管理员，设置 `ADMIN_GITHUB_USERNAMES`（会覆盖默认值）。

## 系统设置

管理员可在 `/admin/settings` 配置：

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| 站点名称 | Mpic | 显示在页面标题 |
| 站点描述 | 多用户公开相册图床 | meta 描述 |
| 单文件上限 | 5MB | 超过自动压缩 |
| 默认用户配额 | 100MB | 新用户存储上限 |
| 允许注册 | 开启 | GitHub OAuth 登录即注册 |
| 启用压缩 | 开启 | 超过 5MB 自动压缩图片 |

## 本地开发

```bash
# 安装依赖
pnpm install

# 复制环境变量
cp .env.example .env.local
# 编辑 .env.local 填入实际值

# 启动开发服务器
pnpm dev
```

## 图片仓库目录结构

```
uploads/
  2026/
    06/
      abcd1234.jpg
      efgh5678.png
data/
  images.json    # 图片索引
  albums.json    # 相册数据
  users.json     # 用户信息
  settings.json  # 系统设置
  repos.json     # 多仓库分片索引
  logs.json      # 操作日志
```

## 多仓库分片

当单个图片仓库接近 4GB 时，系统会自动创建新仓库（如 `mpic-images-2`）。图片索引始终在主仓库，图片文件分散存储。管理员可在 `/api/admin/repos` 查看各仓库使用情况。
