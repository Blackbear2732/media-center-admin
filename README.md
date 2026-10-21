# 山西农业大学青年融媒体中心 · 融媒体管理系统（前端）

> 一次采集 · 多元生成 · 多端发布

山西农业大学青年融媒体中心内部使用的综合业务管理系统前端。目前已完成全部页面与交互，内置完整的 Mock 数据用于演示。
项目架构已全面适配**若依（RuoYi-Vue）**后端规范，支持一键切换真实后端联调，并在生产环境自动剔除演示数据。

---

## 🛠️ 技术栈

| 分类 | 选型 | 版本 | 备注 |
|---|---|---|---|
| 基础框架 | Vue | `^3.5.12` | Composition API + `<script setup>` |
| 构建工具 | Vite | `^5.4.9` | **Node 版本要求 `>= 18.0.0`（推荐 `20+`）** |
| UI 组件库 | Element Plus | `^2.8.4` | 全量引入，自动适配 |
| 路由 | Vue Router | `^4.4.5` | History 模式（部署需配置 SPA Fallback） |
| HTTP | Axios | `^1.7.7` | 统一封装于 `src/api/request.js`，对齐若依响应 |
| CSS 预处理 | Sass | `^1.79.4` | 全局变量 + 响应式适配 |

> ⚠️ **Node 环境强约束**：由于 Vite 5 底层依赖 `crypto.getRandomValues`，请确保本地开发、部署服务器或 CI 环境的 **Node.js 版本在 18 及以上**。旧版本（如 Node 16）会导致构建失败。

---

## 📂 目录结构

```text
media-center-admin/
├── deploy/                  # 部署相关配置（如 nginx.conf）
├── public/                  # 静态资源（Logo等）
├── src/
│   ├── api/
│   │   ├── index.js         # 所有接口方法封装
│   │   ├── mock.js          # 本地模拟数据（198 名真实成员名单等）
│   │   ├── mock.stub.js     # 生产环境构建桩文件（用于 Tree-shaking 剔除数据）
│   │   └── request.js       # Axios 封装（拦截器、鉴权、若依格式适配）
│   ├── layout/
│   │   └── BasicLayout.vue  # 全局外壳（顶部导航、H5抽屉菜单、悬浮问卷）
│   ├── router/
│   │   └── index.js         # 路由表 + 权限守卫
│   ├── store/
│   │   └── user.js          # 全局状态管理（token, role, userInfo, adminDept）
│   ├── styles/
│   │   └── index.css        # 全局样式 + 移动端响应式媒体查询
│   ├── utils/
│   │   ├── dict.js          # 全站字典中心（部门、状态、角色的 ID 映射与颜色）
│   │   ├── usePagination.js # 分页 Hook（预留）
│   │   └── validate.js      # 表单校验工具
│   ├── views/               # 业务视图
│   │   ├── Home.vue         # F-01 首页（含大屏数据面板）
│   │   ├── login/           # 快捷登录
│   │   ├── user/            # F-02 ~ F-07 个人区
│   │   ├── task/            # F-08 ~ F-10 任务
│   │   ├── material/        # F-11 ~ F-13 素材
│   │   ├── device/          # F-14 设备申请
│   │   ├── data/            # 数据看板详情
│   │   └── admin/           # D-01 ~ D-21 部门管理区
│   ├── App.vue              # 根组件
│   └── main.js              # 入口
├── .env                     # 环境变量基础配置
├── .env.api                 # 真实 API 构建配置 (VITE_USE_MOCK=false)
├── .env.development         # 开发环境配置
├── .env.production          # 生产演示构建配置
├── _redirects               # Netlify 等静态托管的重定向规则
├── index.html
├── vite.config.js           # Vite 配置（含 alias 劫持与代理）
└── package.json
```

---

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
# 打开 http://localhost:5173
```

---

## 📦 构建与 Mock 机制

本项目通过环境变量与 Vite 的 `mode` 实现了**极致的构建隔离**，演示数据在生产环境会被完全 Tree-shaking。

| 命令 | 读取环境文件 | 数据来源 | 适用场景 |
|---|---|---|---|
| `npm run dev` | `.env.development` | 本地 Mock | 本地开发、UI调试 |
| `npm run build` | `.env.production` | 本地 Mock | **演示部署**（发给客户看） |
| `npm run build:api` | `.env.api` | 真实后端 API | **生产部署**（联调上线） |

### ✨ 生产环境数据剔除原理
在 `vite.config.js` 中配置了别名劫持：
当 `VITE_USE_MOCK=false` 时，导入的 `@/api/mock` 会被指向 `mock.stub.js`（仅有变量名定义的轻量空壳）。
Rollup 在打包时会自动将未被执行的假数据代码彻底删除（Tree-Shaking），不仅减小打包体积，更**绝对防止测试数据泄漏到线上**。

---

## 🌐 部署规范

### SPA 路由回退（必须）
前端使用 History 模式路由，服务器需要把未命中的路径回退到 `index.html`，否则用户刷新 `/tasks/1` 会 404。

**Nginx 示例：**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 静态托管
* Netlify / Vercel 等平台已由根目录的 `_redirects` 处理。
* Apache 可使用 `FallbackResource /index.html`。

---

## 👥 角色与演示账号

系统包含三种角色，登录页点击对应卡片即可一键进入（**无需密码**，当前为演示模式）：

| 角色 | 姓名 | 所属部门 | 可访问范围 |
|---|---|---|---|
| 中心主任 | 张钧益 | 全中心 | 全局视角：可切换全部 6 个部门，配置模块，查看所有数据 |
| 部门部长 | 何文静等 | 各自部门 | 部门视角：仅查看和管理本部门的人员、任务、素材 |
| 部门部员 | 徐钰婷等 | 各自部门 | 个人视角：仅查看与自己相关的任务、考评、个人记录 |

> 演示环境的 `token`、`role`、`userInfo`、`adminDept` 统一存储于 `localStorage`，退出登录会通过 `userStore.logout()` 彻底清理。路由守卫会在 `router.beforeEach` 中拦截越权访问。

---

## 📡 后端联调规范（致后端开发）

当使用 `npm run build:api` 构建或开启真实代理联调时，请严格遵循以下若依（RuoYi）标准：

### 1. 响应格式对齐
后端返回格式必须为：
```json
{
  "code": 200,          // 200 或 0 表示成功，401 表示 token 过期
  "msg": "操作成功",     // 注意：若依使用 msg 而非 message
  "data": { ... }       // 实际业务数据
}
```

### 2. 数据字典（ID）约定
前端已在 `src/utils/dict.js` 中固化了数据字典，请后端接口直接使用数字 ID 或布尔值，不要传中文：
*   **部门 (Dept)**：`100=全中心`, `101=综合部`, `102=网宣部`, `103=影音部`, `104=摄制部`, `105=新闻部`, `106=设计部`
*   **任务状态 (Status)**：`0=筹备中`, `1=进行中`, `2=已结束`
*   **角色 (Role)**：`0=部员`, `1=部长`, `2=主任`

### 3. 接口前缀与代理
前端默认请求前缀为 `/api`（已配置代理到 `http://localhost:8080`）。
如果后端接口本身没有 `/api` 前缀，请在 `vite.config.js` 的代理配置中开启 `rewrite` 剔除 `/api`。

### 4. 鉴权机制
前端请求头会自动携带：`Authorization: Bearer <token>`。

---

## 💡 架构亮点与开发约定

1. **前后端彻底解耦**：所有业务组件不直接写死中文字典和状态，统一从 `dict.js` 取用，彻底告别魔法字符串。
2. **全局状态集中管理**：`src/store/user.js` 基于 `reactive` 实现轻量级全局状态，避免了 `localStorage` 非响应式导致的数据不同步问题。
3. **高可用容错**：所有异步请求均使用了 `try/catch` 与 `Promise.allSettled`，接口报错或返回空不会导致页面白屏。
4. **移动端适配**：`src/styles/index.css` 内置了针对 `< 768px` 屏幕的媒体查询，表格支持横向滑动、多列布局自动转为单列。
5. **提交规范**：建议遵循 `feat:` 新功能 / `fix:` 修复 / `style:` 样式 / `chore:` 杂项的 Commit 约定。

---

## 📝 更新日志

*   **v0.3.0** (2026-10)：全面解耦，接入若依字典规范，升级 Vite 5，支持构建分离。
*   **v0.1.0** (初始版本)：完成全部业务页面开发与纯 Mock 演示。

**维护者**：山西农业大学青年融媒体中心技术组