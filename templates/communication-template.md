# 设计协作 · [项目名]

> 知识总管代理 ↔ 设计智能体([名字])
> 创建：YYYY-MM-DD

---

## zone=layout

[知识总管代理在此写入]

场景：[A 已有 / B 新建]
知识库路径：[路径]（✅ / ⚠️ 待补充）
部署目标：[URL 或平台]（✅ / ⚠️ 待补充）
布局：三栏 / 两栏
设计智能体：[用户指定的名字]
勾选功能：[从 16 项中勾选的列表]
preview-base 路径：[路径]
站点名：[xxx]
副标题：[xxx]

---

## zone=design

[设计智能体在此回复]

<!-- 设计智能体确认布局/功能无误后，在 preview-base.html 的 <style id="design-css"> 中写 CSS，然后在此告知修改了哪些 @zone -->

修改区域：zone=xxx, zone=xxx
CSS 工作区：preview-base.html 的 <style id="design-css">

---

## zone=review

[知识总管代理部署后在此写入]

线上站：https://xxx.github.io/xxx
构建时间：YYYY-MM-DD HH:MM
请验收 —— 对比 preview-base.html 与线上站

<!-- 设计智能体逐 zone 验收：✅ 通过 / ⚠️ 待调整 / ❌ 未显示 -->

---

## zone=issues

### 待办
- [ ] [描述] — zone=xxx — 负责人

### 已解决
- [x] [描述] — 解决方案：xxx

---

## 使用说明

**为什么用沟通文件而不是 API？**

- **文件即协议**：两个代理通过共享 Markdown 文件交换信息，无需任何网络通信或 API 调用。
- **零依赖**：不引入额外的消息队列、数据库或服务——文件系统本身就是传输层。
- **Obsidian 原生支持**：Markdown 文件可直接在 Obsidian 中打开、编辑、追踪变更，享受 Obsidian 的链接、搜索、版本历史等全部功能。
- **可审计**：整个协作过程记录在单一文件中，方便回溯、调试和归档。
- **无状态**：每次协作都是独立的文件实例，不会因服务重启或状态不一致而出错。


