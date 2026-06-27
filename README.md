# Mpic

多用户公开相册图床系统，基于 GitHub 存储，部署在 Vercel 上，零数据库依赖。

## 技术栈

- Next.js 16 (App Router)
- Tailwind CSS v4
- NextAuth v4 (GitHub OAuth)
- TypeScript
- GitHub REST API (图片 + JSON 索引存储)

## 功能特性

- 公开瀑布流相册，支持搜索
- GitHub OAuth 登录，多用户上传
- 拖拽/粘贴/点击上传，前端可选压缩
- SHA-256 文件去重
- 4 种直链格式一键复制（原始/CDN/自定义CDN/Markdown）
- 用户存储配额管理
- 完整管理员后台（仪表盘/图片管理/用户管理/系统设置/操作日志）

## 部署步骤

### 1. 准备 GitHub 图片仓库

创建一个 **公开** 的 GitHub 仓库，用于存储图片和索引文件。

### 2. 创建 GitHub Personal Access Token

1. 进入 GitHub Settings > Developer settings > Personal access tokens > Fine-grained tokens
2. 创建新 token，权限选择刚创建的图片仓库
3. 勾选 `Contents` 读写权限

### 3. 创建 GitHub OAuth App

1. 进入 GitHub Settings > Developer settings > OAuth Apps > New OAuth App
2. 设置 Homepage URL 为你的站点域名
3. 设置 Authorization callback URL 为 `https://你的域名/api/auth/callback/github`

### 4. 部署到 Vercel

1. Fork 或推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量（见下方）
4. 部署

### 5. 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NEXT_PUBLIC_SITE_URL` | 站点域名，如 `https://mpic.example.com` | 是 |
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
      abcd1234.webp
      efgh5678.png
data/
  images.json    # 图片索引
  users.json     # 用户信息
  settings.json  # 系统设置
  logs.json      # 操作日志
```
