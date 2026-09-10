# 官方工具链与本地补丁

固定 upstream SHA、包版本、补丁前后哈希见 [manifest.json](manifest.json)。补丁仅保存当前已使用的 HTTP/WS 本地连接限制和 health 版本字段；已知 P0 缺陷见 [问题表](../docs/KNOWN-ISSUES.md)。

安装命令：`node tools/setup-toolchain.mjs`。安装到仓库根目录的 `official-skill/`，不覆盖已有目录。安装失败保留现场，检查原因后改用新的 `--target` 目录；脚本不删除目录。

可用选项：

- `--target <全新目录>`：安装到另一个不存在的目录。
- `--source <本地官方仓库>`：从可信本地克隆复制 Git 对象，仍核对指定提交及哈希；不改变默认版本。
- `--skip-deps`：仅恢复文件与补丁，不安装依赖；这时尚不能启动 Bridge。

脚本使用官方 package-lock 执行 `npm ci --ignore-scripts --omit=dev`。本地 Windows 启动器读取生成的 local-runtime.json，把日志写到本 API 仓库，启动前查找现存 Bridge。不会更改 Codex 注册路径、桌面客户端或 Gateway。

`local-additions/scripts/verify-bridge.mjs` 是网络隔离规则检查工具，会建立测试 WebSocket 会话；只在没有真实 EDA 会话的隔离测试 Bridge 上运行，避免干扰现场窗口发现。它不验证电路设计或持久化。

`SKILL.md` 安装时保留官方正文，追加本地环境说明链接；原始官方文件和本地变更职责分开记录。当前机器已注册的全局 Skill 不因本仓库建立而被替换。

原理图注意事项由 [docs/SCHEMATIC-EDITING-NOTES.md](../docs/SCHEMATIC-EDITING-NOTES.md) 维护。安装器将其复制到生成的 Skill 内 `references/schematic-editing-practices.md`，并在 `SKILL.md` 添加适用任务入口。它记录已观察到的排版与 API 操作经验，不改变官方 Bridge 或自动修复已知 P0 问题。已安装副本需同步该参考文件及入口才能取得后续文档更新；不必因此重启服务。
