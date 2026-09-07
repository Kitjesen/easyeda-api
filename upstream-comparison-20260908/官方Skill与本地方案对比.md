# 官方 Skill 与本地方案对比

核对日期：2026-09-08。此次为只读代码和文档审查，没有替换运行中的 Bridge、安装依赖或修改原理图。

结论：有帮助，建议引入官方新版文档和适用的实现更新，同时保留现有本地核验层及 Bridge 访问限制。仓库与我们当前方案属于同一套基础工具，不是另一种可以绕过客户端限制的绘图引擎。

## 版本与来源

- 官方仓库：https://github.com/easyeda/easyeda-api-skill
- 本次主分支提交：`8895d98637dab59ed9de10bb2a340e3e4be26d99`，2026-08-27；package 与 Skill 版本为 **1.1.28**。
- 本地基础包 **1.0.3**，来源为官方 `https://image.lceda.cn/files/easyeda-api.zip`；本地 LOCAL-PATCH.md 已记录定制。
- 本地嘉立创专业版客户端 **3.2.186**，与 Skill 的版本号分别管理。升级客户端不会自动更新本地 Skill 或 Bridge。
- 本地另有 `eda-verified` v0.1，通过命令调用官方 Bridge，尚未注册为独立 MCP 服务。官方仓库提供 Skill、HTTP/WebSocket Bridge 和 API 文档，也不是一个独立实现嘉立创内核的 MCP 服务。

## 实际对比

| 方面 | 官方 1.1.28 | 我们当前方案 | 建议 |
|---|---|---|---|
| API 调用示例 | 修正组件创建为 libraryUuid/uuid 对象、documentType 判断和单位示例；增加枚举及扩展上下文说明 | 本地基础 Skill 示例较旧；项目脚本中已有部分实测修正 | 更新文档，继续逐项检查实际接口签名 |
| 源码格式 | 新增 format/，包含工程、原理图、PCB，合计 33 个文件 | 本地基础包没有 format/；source.mjs 及项目记录来自实际故障修复 | 引入格式文档用于核对存储、删除记录、属性及文字；先与真实导出匹配 |
| Bridge 核心执行 | HTTP/WebSocket 转发脚本并等待结果；固定 30 秒超时 | 同一核心机制，另有本地访问限制 | 新版没有直接解决旧请求超时和写入未落图 |
| 超时后状态 | 删除 pendingRequests 中的请求，逾期结果不再正常返回给调用者 | 同样的局限；核验层不自动重试写入 | 后续应完善不确定状态及迟到结果追踪，不能只延长时间或自动重复写入 |
| 写入质量控制 | 未提供本地方案这样的强制写前快照、每次工程/页保护、独立核验和串行计划日志 | eda-verified 已实现这些约束；源码备份不等于完整工程备份，仍无自动回滚 | 保留并继续使用核验层 |
| 本地连接限制 | 已绑定 127.0.0.1，但仍使用通配 CORS、没有我们已有的 WS Origin/路径校验 | 仅本机监听，并限制浏览器入口、WS 路径及 Origin | 合并更新时保留本地限制，避免整文件覆盖丢失 |
| DRC | 新文档将详细返回类型写为 ISCH_DrcError，标注自 EDA 4.2 新增 | 客户端 3.2.186 本次实际只返回 warn:3 汇总 | 不将更新文档视为客户端已支持明细；保持运行时能力检查 |
| 标签/连线与落图 | 提供格式依据和使用示例，没有替我们完成本项目的布局及持久化验收 | 已有线段去重、正交检查、源码及网表比较，视觉验收仍需另外进行 | 仍需完成“短线、紧凑、标签避让”和新鲜图面检查 |

## 使用新版时已发现的注意点

1. format/schematic/text.md 示例使用 positionX/positionY/vAlign/hAlign；本项目 3.2.186 实际 TEXT 使用 x/y/align。它能提供依据，但不能直接复制字段覆盖当前源码。WIRE 示例也与本项目读取到的独立 LINE 存储形式有差异。
2. 文件逐字变化不等于新增 API。comparison.json 中许多 differences 来自中文文档翻译为英文或排版重排，不能据此宣称数百个接口新增或修复。
3. README 提及 build:docs/pack 等命令，但当前 package.json 只定义 server。安装/构建应依据实际目录和脚本，而不是照搬陈旧 README。
4. 新文档提出“可能权限不足”只是排查方向。当前项目没有证据证明既往写入失败由许可证或权限引起，不能因此让用户购买版本或误报根因。

## 建议的集成顺序

1. 固定以上官方提交，备份本地 Skill 和 LOCAL-PATCH，同步 references、format、guide 与修正后的示例。
2. 对照当前 3.2.186 读取实际接口能力；保留项目/页检查、单位/枚举校验及现有可用调用。
3. 合并 Bridge 和依赖更新时保留本地访问限制、启动脚本与核验工具；先单独验证，再重启桥接。
4. 继续补齐应用准备状态和超时后的结果跟踪；写入必须独立核验，再验证原样工程导出和图面。

此顺序为建议，尚未实施工具升级。

## 证据

- [本轮文件比对](comparison.json)
- [官方版本文件](https://github.com/easyeda/easyeda-api-skill/blob/8895d98637dab59ed9de10bb2a340e3e4be26d99/package.json)
- [官方 Skill](https://github.com/easyeda/easyeda-api-skill/blob/8895d98637dab59ed9de10bb2a340e3e4be26d99/SKILL.md)
- [官方 Bridge](https://github.com/easyeda/easyeda-api-skill/blob/8895d98637dab59ed9de10bb2a340e3e4be26d99/scripts/bridge-server.mjs)
- [官方 DRC 文档](https://github.com/easyeda/easyeda-api-skill/blob/8895d98637dab59ed9de10bb2a340e3e4be26d99/references/classes/SCH_Drc.md)
- [源码格式](https://github.com/easyeda/easyeda-api-skill/tree/8895d98637dab59ed9de10bb2a340e3e4be26d99/format)
- [本地改动记录](../official-skill/LOCAL-PATCH.md)、[本地核验层](../eda-verified/README.md)
