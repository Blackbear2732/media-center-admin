# 山西农业大学青年融媒体中心 · 融媒体管理系统（前端）

> 一次采集 · 多元生成 · 多端发布

山西农业大学青年融媒体中心内部使用的综合业务管理系统前端。基于 Vue 3 + Vite + Element Plus 构建，支持**三种运行模式**：本地 Mock 演示、本地直连真实后端联调、生产部署真实后端（Cloudflare Pages）。

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
├── functions/                # Cloudflare Pages Functions（部署所需）
│   ├── api/[[path]].js       # /api/* 反向代理到真实后端（保留 /api 前缀）
│   └── config.js             # 运行时配置：返回 useMock / apiBase（读 CF 环境变量）
├── public/                   # 静态资源（Logo 等）
├── src/
│   ├── api/
│   │   ├── index.js          # 所有接口方法封装（真实 / Mock 二选一）
│   │   ├── request.js        # Axios 封装（鉴权、响应拦截、401 处理）
│   │   ├── runtime.js        # 运行时配置加载（/config 覆盖构建默认值）
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
│   └── main.js               # 入口（启动时加载运行时配置）
├── .env.development          # 开发环境：VITE_USE_MOCK=false（联调真实后端）
├── .env.production           # 生产演示构建：VITE_USE_MOCK=true（Mock 数据）
├── .env.api                  # 真实 API 构建：VITE_USE_MOCK=false（Mock 被剔除）
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

## 📦 三种运行模式

| 命令 | 读取环境文件 | 数据来源 | 适用场景 |
|---|---|---|---|
| `npm run dev` | `.env.development` | **真实后端**（本地 8080） | 本地开发联调 |
| `npm run build` | `.env.production` | 本地 Mock | 演示部署（无后端时展示） |
| `npm run build:api` | `.env.api` | **真实后端** | 生产部署（上线） |

### Mock 剔除原理

`vite.config.js` 中配置了别名劫持：当 `VITE_USE_MOCK=false` 时，`@/api/mock` 指向 `mock.stub.js`（空壳），Rollup 打包时自动 Tree-shaking 掉假数据代码，防止测试数据泄漏到线上。

### 运行时配置覆盖（仅 Cloudflare Pages 部署生效）

应用启动时 `main.js` 会请求 `/config`，由 `functions/config.js` 返回 CF 环境变量对应的配置。**仅当 `/config` 返回合法 JSON 时**才会覆盖构建时的默认值；本地开发无 `/config`（vite 返回 index.html），保持 `.env.development` 的配置不变。

---

## 🌐 生产部署（Cloudflare Pages）

### 构建

```bash
npm run build:api   # 产物 dist/
```

上传时**必须包含 `functions/` 目录**（CF Pages 会自动识别为 Functions）。

### CF 后台环境变量（Settings → Environment variables）

| 变量 | 是否必填 | 说明 |
|---|---|---|
| `API_UPSTREAM` | **必填** | 真实后端地址，如 `https://api.xxx.com`。前端 `/api/*` 请求由 `functions/api/[[path]].js` 代理到 `API_UPSTREAM/api/*`（**保留 /api 前缀**，与后端一致） |
| `PAGES_USE_MOCK` | 可选 | `true` / `false`，运行时切换 Mock / 真实后端，无需重新构建 |
| `API_BASE_URL` | 可选 | 直连方案：必须含 `/api` 后缀（如 `https://api.xxx.com/api`），且后端需允许跨域。**推荐不配此项，走上方代理免跨域** |

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
