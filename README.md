# 山西农业大学青年融媒体中心 · 融媒体管理系统（前端）

> 一次采集 · 多元生成 · 多端发布

山西农业大学青年融媒体中心内部使用的综合业务管理系统前端。基于 Vue 3 + Vite + Element Plus 构建，支持**本地直连真实后端联调**与**生产部署真实后端（Cloudflare Workers）**两种模式；构建期可通过 `VITE_USE_MOCK` 切换 Mock 演示数据。

> 📄 部署环境变量一览：见工作区根目录 [docs/环境变量配置说明.md](../docs/环境变量配置说明.md)

---

## 🛠️ 技术栈

| 分类 | 选型 | 版本 | 备注 |
|---|---|---|---|
| 基础框架 | Vue | `^3.5.12` | Composition API + `<script setup>` |
| 构建工具 | Vite | `^5.4.9` | **Node 版本要求 `>= 18.0.0`（推荐 `20+`）** |
| UI 组件库 | Element Plus | `^2.8.4` | 全量引入（含图标），自动适配 |
| 路由 | Vue Router | `^4.4.5` | History 模式 |
| HTTP | Axios | `^1.7.7` | 统一封装于 `src/api/request.js`，对齐若依响应格式 |
| CSS | Sass | `^1.79.4` | 全局变量 + 响应式适配 |

---

## 📂 目录结构

```text
media-center-admin/
├── worker/
│   └── index.js              # Cloudflare Worker 入口：/api/* 反向代理（保留 /api 前缀）
│                             #   + 静态资源服务（env.ASSETS）+ SPA 回落
├── public/                   # 静态资源（Logo、_headers 缓存策略等）
├── src/
│   ├── api/
│   │   ├── index.js          # 所有接口方法封装（真实 / Mock 二选一）
│   │   ├── request.js        # Axios 封装（鉴权、响应拦截、401 处理）
│   │   ├── mock.js           # 本地模拟数据（演示模式）
│   │   ├── mock.stub.js      # 生产构建桩文件（配合 Tree-shaking 剔除假数据）
│   │   └── indexhouduan.js   # 废弃文件（勿改，勿用）
│   ├── layout/
│   │   └── BasicLayout.vue   # 全局外壳（顶部导航、移动端抽屉菜单）
│   ├── router/
│   │   └── index.js          # 路由表 + 登录守卫 + scrollBehavior
│   ├── store/
│   │   └── user.js           # 全局状态（token, role, userInfo, viewDeptId 等）
│   ├── utils/
│   │   ├── dict.js           # 数据字典（部门/角色/任务状态 ID 映射与文案）
│   │   └── validate.js       # 表单校验工具
│   ├── views/                # 业务视图
│   │   ├── Home.vue          # 首页（公开页：中心简介/六大部门/数据面板/公告/任务）
│   │   ├── login/            # 登录页
│   │   ├── layout/           # 前台公共布局
│   │   ├── dept/DeptShowcase.vue   # 部门风采展示页（/dept/:deptId）
│   │   ├── user/             # 个人区（我的任务/考评/会议/打卡/消息/资料/MeoW 教程）
│   │   ├── task/             # 任务（列表/详情/创建）
│   │   ├── material/         # 素材（列表/详情/上传）
│   │   ├── device/           # 设备申请
│   │   ├── data/             # 数据看板详情
│   │   └── admin/            # 部门管理区（概览/成员/任务/会议/考评/模板/素材/公告/
│   │                         #   部门介绍/打卡管理/数据看板/设备/模块配置/邮件/换届等）
│   ├── App.vue               # 根组件
│   └── main.js               # 入口
├── .env.development          # 开发环境：VITE_USE_MOCK=false（联调真实后端）
├── .env.production           # 生产构建：VITE_USE_MOCK=false（真实后端，Mock 被剔除）
├── .env.api                  # 真实 API 构建：VITE_USE_MOCK=false（与 production 等价，保留兼容）
├── wrangler.jsonc            # Cloudflare Workers 部署配置（main / assets / vars.API_UPSTREAM）
├── vite.config.js            # Vite 配置（mock 别名劫持、/api 代理到 localhost:8080）
└── package.json
```

---

## 🚀 快速开始

```bash
# 1. 安装依赖（Node >= 18）
npm install

# 2. 本地开发（联调真实后端，需先启动后端 8080）
npm run dev
# 打开 http://localhost:5173，/api 请求经 vite 代理转发到 http://localhost:8080
```

---

## 📦 运行模式

| 命令 | 读取环境文件 | 数据来源 | 适用场景 |
|---|---|---|---|
| `npm run dev` | `.env.development` | **真实后端**（本地 8080） | 本地开发联调 |
| `npm run build` | `.env.production` | **真实后端** | 生产部署（上线） |
| `npm run build:api` | `.env.api` | **真实后端** | 与 `build` 等价，保留兼容 |

> 如需纯 Mock 演示构建，临时把对应 `.env.*` 的 `VITE_USE_MOCK` 改为 `true` 再构建即可。

### Mock 剔除原理

`vite.config.js` 中配置了别名劫持：当 `VITE_USE_MOCK=false` 时，`@/api/mock` 指向 `mock.stub.js`（空壳），Rollup 打包时自动 Tree-shaking 掉假数据代码，防止测试数据泄漏到线上。

**注意：`VITE_USE_MOCK` 是构建期变量**，Vite 打包时把值直接写进产物。修改 `.env.*` 后必须重新构建；在 Cloudflare 控制台/ `wrangler.jsonc` 的 `vars` 里改运行时变量对它**无效**。

---

## 🌐 生产部署（Cloudflare Workers）

部署形态：一个真正的 Worker（`main` = `worker/index.js`），同时承担静态资源服务（`dist/`，经 `env.ASSETS` 绑定）与 `/api/*` 反向代理（转发到 `API_UPSTREAM`，**保留 /api 前缀**）。SPA 路由回落由 `wrangler.jsonc` 的 `not_found_handling: "single-page-application"` 完成。

### 构建 + 部署

```bash
npm run build        # 产出 dist/（VITE_USE_MOCK=false，直连真实后端）
npx wrangler deploy  # 按 wrangler.jsonc 发布 Worker + 静态资产
```

### 运行时变量（`wrangler.jsonc` 的 `vars`）

| 变量 | 是否必填 | 说明 |
|---|---|---|
| `API_UPSTREAM` | **必填** | 真实后端地址，如 `https://api.xxx.com`（**不带 /api 后缀**）。代理拼接 `${API_UPSTREAM}/api/...`，与后端 SecurityConfig 放行的 `/api` 前缀一致。缺失时所有 `/api` 请求返回 500 `{ code, msg }` |

- `vars` 只放**非敏感**值（明文随配置可见）；将来若有密钥类变量，用 `npx wrangler secret put <NAME>` 注入（加密存储、不进仓库），脚本里同样通过 `env.<NAME>` 读取。
- 也可以在 Cloudflare 控制台 → Workers → Settings → Variables 里改（有 `main` 的 Worker 支持运行时变量，改后无需重新构建）。

### 本地调试 Worker

```bash
npm run build        # 先产出 dist/
npx wrangler dev     # 本地启动 Worker，静态资源 + /api 代理与线上一致
```

> 首页为公开页：中心简介 / 部门 / 最新任务 / 数据看板 / 公告 5 组接口后端已放行匿名访问，未登录可正常浏览；部门风采等受保护页面点击后再引导登录。

---

## 🔐 鉴权与 401 行为

- 登录成功后 `localStorage` 保存 `token`（JWT），请求自动携带 `Authorization: Bearer <token>`
- **带 token 的请求返回 401** = 登录过期 → 清理登录态并跳转 `/login`
- **匿名请求返回 401** = 接口需登录 → 静默失败，不强制跳登录（保证首页公开可浏览）

## 📊 数据字典约定（`src/utils/dict.js`）

- 部门 Dept：`100=全中心`，`101=综合部`，`102=网宣部`，`103=影音部`，`104=摄制部`，`105=新闻部`，`106=设计部`
- 角色 Role：`0=部员`，`1=部长`，`2=主任`
- 任务状态 Status：`0=筹备中`，`1=进行中`，`2=已结束`

## 👥 角色体系

| 角色 | 视角 | 可访问范围 |
|---|---|---|
| 主任（2） | 全中心 | 可切换全部部门、配置模块、查看所有数据 |
| 部长（1） | 本部门 | 管理本部门成员、任务、素材、打卡等 |
| 部员（0） | 个人 | 与自己相关的任务、考评、打卡、消息 |

---

## 💡 开发约定

1. 所有业务组件统一从 `dict.js` 取字典，不写死中文
2. 全局状态集中于 `src/store/user.js`，避免 `localStorage` 非响应式问题
3. 异步请求使用 `try/catch` 与 `Promise.allSettled`，接口失败不白屏
4. 移动端适配：`< 768px` 媒体查询，表格横向滑动、多列转单列
5. 提交规范：`feat:` / `fix:` / `style:` / `chore:` 前缀 + `Co-Authored-By`

## 📝 更新日志

* **v1.0.0** (2026-10-28)：首个前后端一体正式版。登录页忘记密码（邮箱验证码找回）；路由切换遮罩与请求竞态修复；图标按需加载；部长任务本部门锁定
* **v0.4.0** (2026-10)：接入真实后端联调；部门风采页；运行时配置（CF 部署）；首页公开化
* **v0.3.0** (2026-10)：全面解耦，接入若依字典规范，升级 Vite 5，构建分离
* **v0.1.0**：完成全部业务页面开发与纯 Mock 演示

**维护者**：山西农业大学青年融媒体中心技术组
