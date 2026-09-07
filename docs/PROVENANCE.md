# 来源与打包范围

2026-09-08，从既有 `jlceda-connection` 工作区整理成独立 API 仓库。复制前内容哈希保存在 [import-provenance.json](import-provenance.json)；这些是导入基线，不是之后进行路径修订的文件哈希。

保留：本地 eda-verified 源码和测试、研究与索引生成器、40 项功能待办/220 条入口、19 仓库最新版本目录、设计指导和错误记录、官方工具升级与比较历史说明。

不包含：原理图/PCB 工程导出、硬件修改脚本全集、运行状态、日志、凭据、node_modules、全局 Skill 安装、下载的第三方源码缓存。两个历史设计文档和历史升级/比较说明可能引用原工作区附件或路径；这些是历史背景，不是本仓库的有效安装路径。新安装路径以 README 和 toolchain 为准。

官方工具链来自 [easyeda/easyeda-api-skill](https://github.com/easyeda/easyeda-api-skill)，锁定 SHA 见 [工具链清单](../toolchain/manifest.json)。本仓库保存小型差异补丁和本地新增文件，安装时取得官方源树与锁文件。官方 SKILL.md 声明 MIT，但本次源树未发现独立 LICENSE；不对所有社区仓库推定统一许可，也不为用户自有代码擅自选定开源许可。

社区条目记录来源链接和固定提交，没有批量复制第三方实现。需要完整文本做再核验时，在仓库根目录运行：

```powershell
node api-roadmap-20260908/community-reference/collect-sources.mjs
node api-roadmap-20260908/community-reference/verify-documentation.mjs --require-cache
```

下载只将源码保存为文本，不执行代码；缓存被 Git 忽略。之后可运行 `build-reference.mjs` 重新生成原社区文档及入口索引，审查差异后再提交。默认文档检查报告的是索引/链接完整性，不能声称重新验证了未下载的原始源码。
