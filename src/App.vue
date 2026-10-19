<template>
  <router-view />
</template>

<style>
:root {
  --brand: #2b5f8e;
  --brand-deep: #153a56;
  --brand-soft: #e8f0f7;
  --accent: #e8833a;
  --bg: #f4f6f9;
  --text: #1f2d3d;
  --text-sub: #6b7a8c;
  --border: #e6ebf1;
  --radius: 14px;
  --shadow-sm: 0 2px 8px rgba(24, 52, 77, 0.05);
  --shadow-md: 0 8px 28px rgba(24, 52, 77, 0.08);
  --el-color-primary: #2b5f8e;
  --el-border-radius-base: 10px;
}
* { box-sizing: border-box; }
html, body, #app { height: 100%; margin: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  background: var(--bg); color: var(--text); font-size: 14px; -webkit-font-smoothing: antialiased;
}
.page { padding: 0; }
.section-head { display: flex; align-items: flex-end; justify-content: space-between; margin: 32px 0 16px; }
.section-head h3 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: .5px; }
.section-head .sub { color: var(--text-sub); font-size: 13px; margin-top: 4px; }
.muted { color: var(--text-sub); font-size: 12px; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.surface-card {
  background: #fff; border-radius: var(--radius);
  box-shadow: var(--shadow-sm); border: 1px solid rgba(230, 235, 241, 0.8);
}
.pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 999px; font-size: 13px;
  background: #fff; color: var(--text-sub); border: 1px solid var(--border);
  cursor: pointer; transition: all .18s ease; user-select: none; text-decoration: none;
}
.pill:hover { color: var(--brand); border-color: #cfe0ee; }
.pill.active { background: var(--brand); color: #fff; border-color: var(--brand); box-shadow: 0 4px 12px rgba(43,95,142,.25); }
.tag-soft {
  display: inline-block; padding: 2px 9px; border-radius: 999px;
  font-size: 12px; background: var(--brand-soft); color: var(--brand);
}
.task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
.task-card {
  padding: 20px; cursor: pointer; transition: all .2s;
  display: flex; flex-direction: column; gap: 10px;
}
.task-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: #cfe0ee; }
.task-card-head { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-sub); }
.status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.dot-prepare { background: #3d7aab; } .dot-doing { background: #e8833a; } .dot-done { background: #4a9d6e; }
.task-card h3 { margin: 0; font-size: 17px; font-weight: 600; line-height: 1.4; }
.task-card-meta { color: var(--text-sub); font-size: 13px; }
.task-card-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.task-card-foot {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 4px; padding-top: 12px; border-top: 1px dashed var(--border);
}
.avatars { display: flex; }
.mini-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff; display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; margin-right: -6px; border: 2px solid #fff;
}
</style>