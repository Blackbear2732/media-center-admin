# 山西农业大学青年融媒体中心 · 融媒体管理系统（前端）

> 一次采集 · 多元生成 · 多端发布

山西农业大学青年融媒体中心内部使用的素材管理与查询系统前端。目前已完成全部页面与交互，使用 Mock 数据演示，可通过一个开关无缝接入真实后端。

---

## 技术栈

| 分类 | 选型 | 版本 | 备注 |
|---|---|---|---|
| 框架 | Vue | 3.2.47 | Composition API + `<script setup>` |
| 构建 | Vite | 2.9.18 | **兼容 Node 14.16+**，不要升级到 3.x/4.x/5.x |
| UI 组件库 | Element Plus | 2.3.14 | 锁死版本，升级会要求 Node ≥ 22 |
| 路由 | Vue Router | 4.2.5 | Hash 模式 |
| HTTP | Axios | 1.7.7 | 统一封装于 `src/api/request.js` |
| 图标 | @element-plus/icons-vue | 2.3.1 | |

> ⚠️ **Node 版本强约束**：本项目刻意锁定上述旧版本，专为 Node 14.16 环境设计。如果你升级了 `vite` 或 `element-plus`，可能会遇到 `Unexpected token '??='` 或 `@vueuse/core@15 requires node >= 22` 之类的报错。除非整体升级 Node，否则**请勿随意升级依赖**。

---

## 目录结构

```
media-center-admin/
├── public/                  # 静态资源
├── src/
│   ├── api/
│   │   ├── request.js       # Axios 封装（拦截器、鉴权、统一错误处理）
│   │   ├── index.js         # 所有接口方法（含 USE_MOCK 开关）
│   │   └── mock.js          # 本地模拟数据（198 名真实成员名单）
│   ├── layout/
│   │   └── BasicLayout.vue  # 顶部导航布局
│   ├── router/
│   │   └── index.js         # 路由表 + 角色守卫
│   ├── views/
│   │   ├── Home.vue         # F-01 首页
│   │   ├── login/Login.vue  # 角色快捷登录
│   │   ├── user/            # F-02 ~ F-07 个人区
│   │   ├── task/            # F-08 ~ F-10 任务
│   │   ├── material/        # F-11 ~ F-13 素材
│   │   ├── device/          # F-14 设备申请
│   │   └── admin/           # D-01 ~ D-21 部门管理区
│   ├── App.vue              # 全局品牌样式
│   └── main.js              # 入口
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
# 打开 http://localhost:5173
```

> 如果 `npm install` 卡住或报错，可尝试 `npm install --legacy-peer-deps`。  
> 如果启动后白屏，检查 Node 版本是否为 14.16+，并删除 `node_modules` 与 `package-lock.json` 重新安装。

---

## 部署

### SPA 路由回退（必须）

前端使用 History 模式路由，服务器需要把未命中的路径回退到 `index.html`，否则用户刷新 `/tasks/1` 会 404：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

完整示例（含接口反代、静态资源缓存策略）见 [`deploy/nginx.conf`](deploy/nginx.conf)。
Netlify 等静态托管已由根目录 `_redirects` 处理；Apache 可使用 `FallbackResource /index.html`。

### 构建

```bash
npm run build        # 演示构建（Mock 数据）
npm run build:api    # 接入真实后端（关闭 Mock，可 tree-shake）
```

---

## 角色与演示账号

系统包含三种角色，登录页点击对应卡片即可一键进入（**无需密码**）：

| 角色 | 姓名 | 所属部门 | 可访问范围 |
|---|---|---|---|
| 部员 | 徐钰婷 | 新闻部 | 首页、任务、素材、上传、设备、个人区 |
| 部长 | 何文静 | 摄制部 | 上述全部 + 部门管理区（含设备管理） |
| 中心主任 | 王主任 | 综合部 | 上述全部 + 部门管理区（可切换全部 6 个部门） |

> 演示环境的 `token` 与 `role` 存储于 `localStorage`，退出登录会清空。角色守卫会在 `router.beforeEach` 中拦截非法访问。

---

## 功能模块

### 前台 · 游客可见
- **F-01 首页**：中心介绍、6 大部门卡片、最新任务、最新视频、登录入口

### 前台 · 个人区
| 编号 | 页面 | 说明 |
|---|---|---|
| F-02 | 个人信息 | 姓名、学院、班级、电话、邮箱、修改密码 |
| F-03 | 我的任务 | 我参与的任务列表 |
| F-04 | 我的打卡 | 出勤率、打卡记录、申诉入口 |
| F-05 | 我的会议 | 参会记录、状态 |
| F-06 | 我的设备 | 借用设备记录 |
| F-07 | 我的消息 | 站内信（未读红点） |

### 前台 · 业务区
| 编号 | 页面 | 说明 |
|---|---|---|
| F-08 | 任务列表 | 按状态 Tab（全部 / 筹备 / 进行中 / 已结束） |
| F-09 | 任务详情 | 任务信息、参与人、素材区域（上传即展示） |
| F-10 | 发布任务 | 标签、参与部门、联动部门、关联设备 |
| F-11 | 素材库 | 全局搜索（标题 / 正文 / 部门 / 主要领导 / 时间） |
| F-12 | 素材详情 | 网盘链接、提取码、历史版本、提取记录 |
| F-13 | 统一上传 | **按部门动态渲染表单**（6 个部门字段不同） |
| F-14 | 设备申请 | 设备状态一览 + 提交申请 + 我的申请记录 |

### 部门管理区（部长 / 主任）
| 编号 | 页面 | 说明 |
|---|---|---|
| D-01 | 部门概览 | 人数、任务数、素材数、待办事项 |
| D-02 | 成员管理 | 增删改查、停用/启用、**主任可查看全部部门** |
| D-03 | 成员详情 | 任务/打卡/会议/考评记录抽屉 |
| D-04 | 任务参与 | 添加参与人、确认报名 |
| D-05 | 会议管理 | 发起会议、点名（到场/迟到/请假/缺席） |
| D-06/07/08 | 考评管理 | 动态配置考评项、自动/手动算分 |
| D-09 | 本部门素材 | 版本、提取记录 |
| D-10 | 公告管理 | 发布/编辑/删除 |
| D-11 | 部门介绍 | 简介、联系方式、封面、照片 |
| D-12 | 数据看板 | Top10、月度趋势、CSV 上传 |
| D-13 | 打卡管理 | **综合部专属**：标记、申诉审批、统计导出 |
| D-14 | 设备管理 | **摄制部专属**：档案、申请审核、使用记录、状态统计 |

---

## Mock 与真实后端切换

### 当前状态：Mock 模式
所有接口调用都走 `src/api/mock.js` 里的本地数据，无需启动后端即可查看完整交互效果。

### 切换方式：环境变量（不再改代码）

Mock 开关由环境变量 `VITE_USE_MOCK` 控制，按构建模式读取对应文件：

| 命令 | 读取的环境文件 | Mock 数据 |
|---|---|---|
| `npm run dev` | `.env.development` | 开启 |
| `npm run build` | `.env.production` | 开启（当前演示构建） |
| `npm run build:api` | `.env.api` | 关闭（接入真实后端） |

关闭 Mock 时，`vite.config.js` 会把 `@/api/mock` 别名替换为 `src/api/mock.stub.js`（同名空导出），
整套演示数据（`mock.js` 中的成员名单、任务、素材等）不会进入构建产物，页面也不会加载它们。

接入真实后端时使用 `npm run build:api` 即可（等价于 `VITE_USE_MOCK=false vite build`）。

**第 2 步 · 配置后端地址**

方式 A（推荐）：修改 `vite.config.js` 的代理：

```js
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',   // 改成你的后端地址
      changeOrigin: true
    }
  }
}
```

方式 B：直接修改 `src/api/request.js` 里的 `baseURL`。

**第 3 步 · 对齐响应格式**

`request.js` 默认约定后端返回：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

- `code === 0` 或 `code === 200` 视为成功，直接把 `data` 返回给业务层；
- `code === 401` 会自动清除 token 并跳转 `/login`；
- 其他 code 会弹出 `message` 作为错误提示。

如果你的后端格式不同，只需修改 `src/api/request.js` 的响应拦截器即可，**所有页面代码无需改动**。

---

## 接口规范

完整接口文档（共 61 个接口）见项目内的 `docs/api.md`（或联系后端获取最新版本）。约定如下：

- **统一前缀**：`/api`
- **鉴权**：请求头 `Authorization: Bearer <token>`
- **分页**：如涉及分页，统一 `?page=1&size=10`，返回 `{ list: [], total: 0 }`
- **时间格式**：`YYYY-MM-DD HH:mm`
- **角色枚举**：`member` / `minister` / `director`

业务接口按模块分为：

| 模块 | 路径前缀 | 数量 |
|---|---|---|
| 首页 | `/center`、`/departments`、`/tasks/latest`、`/videos/latest` | 4 |
| 认证 | `/auth/*` | 2 |
| 个人区 | `/user/*` | 8 |
| 消息 | `/messages/*` | 3 |
| 任务 | `/tasks/*` | 5 |
| 素材 | `/materials/*`、`/upload/*` | 6 |
| 设备 | `/devices`、`/device-applications/*` | 3 |
| 部门管理 | `/admin/*` | 30 |

---

## 开发约定

- **样式**：全局品牌变量定义在 `src/App.vue` 的 `:root` 中（`--brand`、`--accent`、`--bg` 等），页面内尽量复用 `.surface-card`、`.pill`、`.tag-soft` 等通用 class。
- **容错**：所有异步数据都做了 `Array.isArray` 或 `?? {}` 兜底，避免接口返回空导致页面白屏。
- **组件复用**：任务卡片、成员表格、设备卡片分别在多页面出现，样式统一在 `App.vue` 里维护。
- **提交规范**：`feat:` 新功能 / `fix:` 修复 / `style:` 样式调整 / `chore:` 杂项。

---

## 常见问题

| 现象 | 原因 | 解决 |
|---|---|---|
| `Unexpected token '??='` | Node 版本过低，Vite 5 语法不兼容 | 保持当前 `vite@2.9.18`，勿升级 |
| `@vueuse/core@15 requires node >= 22` | `element-plus` 装到了 2.8.x | 确保 `package.json` 中为 `"element-plus": "2.3.14"`（无 `^`） |
| 登录后数据不刷新 | `localStorage` 非响应式 | 已在 `Login.vue` 登录后 `window.location.reload()` 处理 |
| 页面白屏，控制台报 `Cannot read property of null` | 接口返回 `null`，模板直接读属性 | 所有接口已加 `?? {}` 兜底，如有新页面请沿用 |
| `dist` 目录不提交 | 已在 `.gitignore` 中忽略 | 由 CI 或服务器构建，本地不必提交 |

---

## 维护者

- 前端：山西农业大学大学青年融媒体中心技术组
- 后端：山西农业大学大学青年融媒体中心技术组
- 产品需求文档：`docs/requirements-v1.6.md`

---

**最后更新**：2026-10-19  
**版本**：`v0.1.0`（前端演示版，后端接口待联调）