# MPic

多用户公开相册图床系统，基于 GitHub 存储，前台部署在 Vercel，自动采集由 GitHub Actions 定时执行。

## 当前架构

| 组件 | 作用 |
|------|------|
| Vercel | 托管网站前台、后台管理页、登录、上传、公开 API |
| GitHub 图片仓库 | 存储图片文件和 JSON 索引 |
| GitHub Actions | 每 5 分钟触发一次自动采集 |
| GitHub OAuth | 管理员/用户登录 |

自动采集现在不是靠打开后台页面续跑，也不是靠 Vercel Cron。

- 后台的 `开启自动采集` 开关只控制“GitHub Actions 触发后是否真正执行采集”
- 后台的 `立即采集` 按钮是手动立刻跑一轮，不等待下一个 5 分钟触发
- `/admin/crawl` 里的 `自动采集监控` 会显示最近触发、最近完成、下次触发、任务状态和 GitHub Actions 链接

## 技术栈

- Next.js 16 (App Router)
- Tailwind CSS v4
- NextAuth v4 (GitHub OAuth)
- TypeScript
- GitHub REST API (图片 + JSON 索引存储)
- Sharp (服务端图片压缩)
- GitHub Actions（自动采集调度）

## 功能特性

### 核心功能

- 公开瀑布流相册，支持时间 / 相机 / 镜头筛选
- GitHub OAuth 登录，多用户上传
- 拖拽 / 粘贴 / 点击上传
- 超过 5MB 自动压缩
- SHA-256 文件去重
- 原始链接 / CDN / 自定义 CDN / Markdown 一键复制
- 自定义域名支持

### 相册与隐私

- 多相册管理
- 单图公开 / 私密切换
- 私密图片不在公开页展示，但不影响已生成的直链

### 图片信息

- 自动提取 EXIF 元数据
- 时间线筛选
- 相机 / 镜头筛选

### 存储管理

- 多仓库自动分片
- 用户存储配额管理
- 管理员后台（仪表盘 / 图片 / 用户 / 系统设置 / 采集 / API 文档 / 操作日志）

### 自动采集

- 内置多个随机图片 API 源
- 支持 `redirect` / `json` / `direct` / `pixiv`
- 管理员可自定义添加 / 编辑 / 删除采集源
- GitHub Actions 每 5 分钟触发一次
- 后台监控最近一次自动采集状态

### 公开 API

- `GET /api/random`：随机图片接口，默认 302 跳转
- `GET /api/random?format=json`：返回随机图片元数据和链接
- `GET /api/images`：公开图片列表，支持分页 / 搜索 / 筛选

## 部署总览

完整部署分成两部分：

1. Vercel：部署站点和后台
2. GitHub：配置 Actions 和 Secrets，让自动采集每 5 分钟跑一次

如果你只部署了 Vercel，没有配置 GitHub Actions，网站能用，但自动采集不会自己持续跑。

## 部署步骤

### 1. 准备 GitHub 图片仓库

创建一个公开仓库专门存图片和索引，例如 `mpic-images`。

要求：

- 必须是公开仓库，否则默认 jsDelivr CDN 无法正常访问
- 建议单独创建，不要和主站代码仓库混用

### 2. 创建 GitHub Personal Access Token

进入：

- GitHub Settings
- Developer settings
- Personal access tokens
- Fine-grained tokens

创建一个新的 token，并给图片仓库授予：

- `Contents`: Read and write

这个 token 会同时给：

- Vercel 运行时使用
- GitHub Actions 自动采集使用

### 3. 创建 GitHub OAuth App

进入：

- GitHub Settings
- Developer settings
- OAuth Apps
- New OAuth App

填写：

- `Homepage URL`：你的站点域名
- `Authorization callback URL`：`https://你的域名/api/auth/callback/github`

### 4. 部署主站到 Vercel

1. 把代码推到 GitHub
2. 在 Vercel 导入这个仓库
3. 配置下面的 Vercel 环境变量
4. 部署

### 5. 配置 Vercel 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NEXT_PUBLIC_SITE_URL` | 站点地址，如 `https://pic.example.com` | 是 |
| `AUTH_SECRET` | NextAuth 加密密钥 | 是 |
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID | 是 |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret | 是 |
| `IMAGE_GITHUB_OWNER` | 图片仓库所有者 | 是 |
| `IMAGE_GITHUB_REPO` | 图片仓库名称 | 是 |
| `IMAGE_GITHUB_BRANCH` | 图片仓库分支，默认 `main` | 否 |
| `IMAGE_GITHUB_TOKEN` | 图片仓库 PAT | 是 |
| `ADMIN_GITHUB_USERNAMES` | 管理员 GitHub 用户名，逗号分隔；不填则默认 `IMAGE_GITHUB_OWNER` | 否 |
| `NEXT_PUBLIC_CDN_BASE_URL` | 自定义 CDN 前缀 | 否 |
| `CRON_SECRET` | 仅在你要手动调用 `/api/cron/crawl` 时使用，默认部署不是必须 | 否 |

### 6. 配置 GitHub Actions Secrets

自动采集 workflow 文件在：

- `.github/workflows/crawl.yml`

需要在主站代码仓库的 GitHub Secrets 里配置这些值：

| Secret 名称 | 说明 | 必填 |
|-------------|------|------|
| `IMAGE_GITHUB_OWNER` | 图片仓库所有者 | 是 |
| `IMAGE_GITHUB_REPO` | 图片仓库名称 | 是 |
| `IMAGE_GITHUB_BRANCH` | 图片仓库分支 | 是 |
| `IMAGE_GITHUB_TOKEN` | 图片仓库 PAT | 是 |
| `NEXT_PUBLIC_CDN_BASE_URL` | 自定义 CDN 前缀 | 否 |

进入：

- 仓库 `Settings`
- `Secrets and variables`
- `Actions`

把上面的 secrets 填进去。

### 7. 启用自动采集

部署完成后：

1. 打开 `/admin/crawl`
2. 点击 `开启自动采集`
3. 查看 `自动采集监控`

说明：

- `已开启`：表示允许 GitHub Actions 跑
- `采集中...`：表示当前真的有一轮任务在执行
- `下次触发`：下一次 5 分钟调度时间
- `立即采集`：手动立刻跑一轮

### 8. 配置自定义域名（可选）

1. 添加 DNS `CNAME`
2. 指向 `cname.vercel-dns.com`
3. 在 Vercel 里绑定域名
4. 等待证书自动签发

## 自动采集的工作方式

自动采集不是常驻进程，而是 GitHub Actions 每 5 分钟触发一次：

1. GitHub Actions 触发 `.github/workflows/crawl.yml`
2. 执行 `pnpm crawl:once`
3. 脚本读取 GitHub 图片仓库里的 `data/crawl-config.json`
4. 如果后台开关是关闭的，这轮会直接跳过
5. 如果后台开关是开启的，这轮会执行一次采集批次
6. 采集日志和监控状态会写回图片仓库

相关入口：

- 工作流：`.github/workflows/crawl.yml`
- 脚本入口：`scripts/run-crawl.ts`
- 采集核心：`src/lib/services/crawl-service.ts`

## 本地开发

### 1. 环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

`.env.example` 当前包含：

- `NEXT_PUBLIC_SITE_URL`
- `NEXTAUTH_URL`
- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `IMAGE_GITHUB_OWNER`
- `IMAGE_GITHUB_REPO`
- `IMAGE_GITHUB_BRANCH`
- `IMAGE_GITHUB_TOKEN`
- `NEXT_PUBLIC_CDN_BASE_URL`

### 2. 启动开发服务器

```bash
pnpm install
pnpm dev
```

### 3. 常用命令

```bash
# 类型检查
pnpm typecheck

# 生产构建
pnpm build

# 手动跑一轮采集
pnpm crawl:once

# 只读取采集配置，不真正执行
pnpm crawl:once -- --config-only
```

## 系统设置

管理员可在 `/admin/settings` 配置：

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| 站点名称 | MPic | 页面标题 |
| 站点描述 | 多用户公开相册图床 | 站点描述 |
| 单文件上限 | 5MB | 超过后自动压缩 |
| 默认用户配额 | 100MB | 新用户默认上限 |
| 允许注册 | 开启 | 是否允许 GitHub OAuth 新用户注册 |
| 默认开启压缩 | 开启 | 上传时自动压缩 |
| 启用随机图片接口 | 开启 | 控制 `/api/random` 是否可用 |

## 图片仓库目录结构

```text
uploads/
  2026/
    06/
      abcd1234.jpg
      efgh5678.png
data/
  images.json      # 图片索引
  albums.json      # 相册数据
  users.json       # 用户信息
  settings.json    # 系统设置
  repos.json       # 分片仓库索引
  logs.json        # 操作日志
  crawl-config.json
  crawl-logs.json
```

## 多仓库分片

当单个图片仓库接近 4GB 时，系统会自动创建新仓库，例如：

- `mpic-images`
- `mpic-images-2`
- `mpic-images-3`

图片索引仍保留在主仓库里，图片文件按仓库分散存储。后台可在相关管理页面查看仓库使用情况。
