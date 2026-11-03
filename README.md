# 山西农业大学青年融媒体中心 · 融媒体管理系统（前端）

> 一次采集 · 多元生成 · 多端发布

山西农业大学青年融媒体中心内部使用的综合业务管理系统前端。基于 Vue 3 + Vite + Element Plus 构建，支持**本地直连真实后端联调**、**Cloudflare Workers 部署**与**自建服务器部署**三种口径；构建期可通过 `VITE_USE_MOCK` 切换 Mock 演示数据。

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
├── .env.development          # 开发环境：/api 相对路径（走 vite 代理到 127.0.0.1:8080）
├── .env.workers              # Workers 构建：直连 https://api.blackbearcode.dpdns.org
├── .env.server               # 自建服务器构建：直连 http://127.0.0.1:8080
├── .env.production           # 兜底：仅直接执行 `vite build`（默认 production mode）时读取，值与 .env.workers 一致
├── wrangler.jsonc            # Cloudflare Workers 部署配置（assets.directory = dist-workers/）
├── vite.config.js            # Vite 配置（按 mode 分产物目录、mock 别名劫持、/api 代理到 8080）
└── package.json
```

---

## 🚀 快速开始

```bash
# 1. 安装依赖（Node >= 18）
npm install

# 2. 本地开发（默认使用 Mock 数据，无需启动后端）
npm run dev
# 打开 http://localhost:5173；样式/交互验收直接看 Mock 数据
# 如需联调真实后端：把 .env.development 的 VITE_USE_MOCK 改为 false，重启 dev，
# 再启动 ruoyi-admin（8080），/api 请求经 vite 代理转发到 http://127.0.0.1:8080
```

---

## 📦 构建模式（两套独立口径，产物互不覆盖）

| 命令 | Vite mode / 环境文件 | 产物内请求基址（baseURL） | 产物目录 | 适用场景 |
|---|---|---|---|---|
| `npm run dev` | `development` / `.env.development` | Mock 数据（默认）；改 `VITE_USE_MOCK=false` 后为相对 `/api`（vite 代理 → `http://127.0.0.1:8080`） | 无 | 本地 Mock 验收 / 联调 |
| `npm run build` | `workers` / `.env.workers` | `https://api.blackbearcode.dpdns.org/api` | `dist-workers/` | **Cloudflare Workers 自动构建（保持此命令不变）** |
| `npm run build:workers` | `workers` / `.env.workers` | 同上 | `dist-workers/` | 显式执行 Workers 构建（与 `build` 完全等价） |
| `npm run build:server` | `server` / `.env.server` | `/api`（相对页面源，Nginx 同源反代到本机 8080） | `dist-server/` | 自建服务器部署（页面与后端同机、用户跨机访问） |

- `build` 是 `build:workers` 的别名，二者都读取 `.env.workers`，Cloudflare 的构建命令继续用 `npm run build` 即可；产物目录已同步到 `wrangler.jsonc` 的 `assets.directory`。
- `build:api` 与 `.env.api` 已删除（与 `build:server` 语义重叠且同样是「直连真实后端」，保留只会造成口径混淆）。
- `.env.production` 不再被任何 npm 脚本使用，仅作为有人直接执行 `vite build` 时的兜底（值必须与 `.env.workers` 保持一致），产物仍为 `dist/`。
- 本地 Mock 验收使用 `npm run dev`（读取 `.env.development`，默认 `VITE_USE_MOCK=true`，无需后端）；三套构建口径均为真实后端（`VITE_USE_MOCK=false`）。
- 如需纯 Mock 演示构建，临时把对应 `.env.*` 的 `VITE_USE_MOCK` 改为 `true` 再构建即可。

### Mock 剔除原理

`vite.config.js` 中配置了别名劫持：当 `VITE_USE_MOCK=false` 时，`@/api/mock` 指向 `mock.stub.js`（空壳），Rollup 打包时自动 Tree-shaking 掉假数据代码，防止测试数据泄漏到线上。

**注意：`VITE_USE_MOCK` 是构建期变量**，Vite 打包时把值直接写进产物。修改 `.env.*` 后必须重新构建；在 Cloudflare 控制台/ `wrangler.jsonc` 的 `vars` 里改运行时变量对它**无效**。

---

## 🌐 生产部署（Cloudflare Workers）

部署形态：一个真正的 Worker（`main` = `worker/index.js`），同时承担静态资源服务（`dist-workers/`，经 `env.ASSETS` 绑定）与 `/api/*` 反向代理（转发到 `API_UPSTREAM`，**保留 /api 前缀**）。SPA 路由回落由 `wrangler.jsonc` 的 `not_found_handling: "single-page-application"` 完成。

### 构建 + 部署

```bash
npm run build        # 产出 dist-workers/（= build:workers，VITE_USE_MOCK=false，直连真实后端）
npx wrangler deploy  # 按 wrangler.jsonc 发布 Worker + 静态资产
```

Cloudflare 控制台的构建命令**保持 `npm run build` 不变**；产物目录已改为 `dist-workers/`，并同步写入 `wrangler.jsonc` 的 `assets.directory`，Worker 仍能正确找到静态资源。自建服务器的 `dist-server/` 不参与 Worker 部署。

### 运行时变量（`wrangler.jsonc` 的 `vars`）

| 变量 | 是否必填 | 说明 |
|---|---|---|
| `API_UPSTREAM` | **必填** | 真实后端地址，**只填协议+域名**，如 `https://api.xxx.com`。不带 `/api`、不带结尾斜杠。代理拼接 `${API_UPSTREAM}/api/...`，与后端 SecurityConfig 放行的 `/api` 前缀一致。缺失时所有 `/api` 请求返回 500 `{ code, msg }`；误填成带路径的接口地址（如 `.../api/center`）会产生 `/api/api/...` 双前缀、**全部接口 401**（worker/index.js 已做兜底剥离，但仍应以正确值为准） |

- `vars` 只放**非敏感**值（明文随配置可见）；将来若有密钥类变量，用 `npx wrangler secret put <NAME>` 注入（加密存储、不进仓库），脚本里同样通过 `env.<NAME>` 读取。
- 也可以在 Cloudflare 控制台 → Workers → Settings → Variables 里改（有 `main` 的 Worker 支持运行时变量，改后无需重新构建）。

### 本地调试 Worker

```bash
npm run build        # 先产出 dist-workers/
npx wrangler dev     # 本地启动 Worker，静态资源 + /api 代理与线上一致
```

> 首页为公开页：中心简介 / 部门 / 最新任务 / 数据看板 / 公告 5 组接口后端已放行匿名访问，未登录可正常浏览；部门风采等受保护页面点击后再引导登录。

---

## 🖥️ 自建服务器部署（`build:server`）

场景：**页面与后端部署在同一台服务器，用户从各自电脑访问**。

```bash
npm run build:server   # 产出 dist-server/，产物内 baseURL = /api（相对页面源）
# 把 dist-server/ 的内容整体上传到站点根目录（如 /var/www/media-center-admin/）
```

请求链路：浏览器请求 `同源/api/...` → Nginx 反代 → `http://127.0.0.1:8080/api/...`（保留 `/api` 前缀）。

### Nginx 关键片段（`deploy/nginx.conf`）

```nginx
root /var/www/media-center-admin/dist-server;
index index.html;

location /api/ {
    proxy_pass         http://127.0.0.1:8080;   # 不带结尾斜杠，保留 /api 前缀
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
```

`proxy_pass` 的结尾斜杠决定是否剥前缀：

- `proxy_pass http://127.0.0.1:8080;`（无斜杠）：原样转发，`/api/center` → `/api/center`，后端按 `/api` 鉴权正常；
- `proxy_pass http://127.0.0.1:8080/;`（有斜杠）：把匹配到的 `/api/` 替换成 `/`，`/api/center` → `/center`，前缀丢失，后端 SecurityConfig 不匹配，接口 401/404。

### `127.0.0.1` 只用于同机调试

默认产物不含 `127.0.0.1`。只有在**浏览器与后端真的跑在同一台机器**（同机调试）时，才把 `.env.server` 临时改为 `VITE_API_BASE_URL=http://127.0.0.1:8080` 重新构建；面向其他电脑访问的产物必须保持相对 `/api`。

### 跨域 / 混合内容：同源反代下不存在

默认的「相对 `/api` + Nginx 同源反代」中，页面与接口同源同协议，**不存在 CORS 预检，也不存在 HTTPS 混合内容拦截**，后端无需额外放行跨域。

只有把 `VITE_API_BASE_URL` 改成绝对地址（如 `http://127.0.0.1:8080` 或另一域名的接口地址）时才会出现：

- 跨域：浏览器先发 `OPTIONS` 预检，后端需返回 `Access-Control-Allow-Origin`（页面确切来源，不能与 `Access-Control-Allow-Credentials: true` 同时用 `*`）、`Access-Control-Allow-Methods`（含 `OPTIONS`）、`Access-Control-Allow-Headers`（至少 `Authorization, Content-Type`），并让 SecurityConfig 放行预检；
- 混合内容：HTTPS 页面调用 `http://` 接口会被浏览器直接拦截，CORS 配置再对也无法通过，此时应改回相对 `/api` 同源反代。

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
