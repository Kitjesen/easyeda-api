# EasyEDA API 协作工具

Kitjesen 的嘉立创专业版 API 工具仓库。保存本地核验层、官方 Bridge 补丁、可重复安装配置、设计经验和固定版本社区参考；电机硬件工程另行管理。

## 当前可用

| 内容 | 状态 |
|---|---|
| `eda-verified/` | 工程/图页 UUID 守卫、操作记录、写前源码备份、独立回读、正交线段与源码格式工具；11 项单元测试 |
| `toolchain/` | 官方 Skill/Bridge **1.1.28** 固定提交 + 本地连接限制/版本识别补丁 v2；安装到本仓库，不自动替换已运行服务 |
| `tools/reference-hub.mjs` | 30 个已核对上游的固定提交资料检索：topics / list / files / read；可通过命令行调用 |
| `pcb-knowledge/` | PCB 专题：官方分组/规则/供电分析扩展、社区布局约束、制造要求和电机布局指南；23 项精选来源 |
| `skills/motor-power-stage-layout/` | 可调用的电机功率级布局 Skill；10 份专题参考，包含整体布局反思、输入、半桥/栅极、电容/预充、采样、铜热机械、执行验收、预算、来源和场景 |
| 路线图与社区目录 | 40 项原有待办、220 条工具入口索引和本轮 8 项补充要求；逐项标明实现状态 |
| 设计指导、错误记录 | 保留历史记录，持续补充；历史硬件附件不在本仓库 |

已记录的实机基线是专业版 **3.2.186**、Gateway **1.0.5**。Skill 更新不等于客户端升级，文档里的 4.2 API 需要实机能力检测。

## 快速使用

需要 Node.js 24 LTS、Git；重新搜索 GitHub 还需要已登录的 GitHub CLI (`gh`)。核验层和参考工具使用 Node 内置模块，无根目录 npm 依赖。

```powershell
npm test
npm run check:docs
node tools/reference-hub.mjs list
node tools/reference-hub.mjs topics PCB
node tools/reference-hub.mjs topics 选型
node tools/reference-hub.mjs files hyndex/easyeda-mcp planner/schematic
node tools/reference-hub.mjs read hyndex/easyeda-mcp mcp/src/planner/schematic/verify.ts 1
```

在新机器还原官方工具及补丁：

```powershell
node tools/setup-toolchain.mjs
```

生成的 `official-skill/` 被 Git 忽略。安装器核对固定提交及补丁前后哈希，按官方锁文件安装依赖，不启动 Bridge，也不修改全局 Codex 配置。若已经有 Bridge，先沿用它；确需从这个副本启动时运行 `official-skill/scripts/start-bridge.ps1`。详细说明见 [工具链说明](toolchain/README.md)。

编辑器操作说明见 [核验工具](eda-verified/README.md)。当前 `read` 模式不是脚本沙箱，不接收不可信代码。写入超时必须先独立查明实际图纸状态，不得自动重复创建。

## 设计与后续开发

- [电机功率级布局 Skill](skills/motor-power-stage-layout/SKILL.md)：专项入口；[详细来源](skills/motor-power-stage-layout/references/sources.md) 和 [预算示例](skills/motor-power-stage-layout/references/budget-examples.md)
- [PCB 专题及优先接入顺序](pcb-knowledge/README.md)、[PCB 设计指导](pcb-knowledge/PCB-DESIGN-GUIDE.md)
- [当前限制与优先修复项](docs/KNOWN-ISSUES.md)
- [API 设计指导](docs/DESIGN-GUIDE.md)
- [原理图排版、写入与验收注意事项](docs/SCHEMATIC-EDITING-NOTES.md)：安装工具链时一并纳入官方 Skill 的参考文件与入口
- [持续错误记录](docs/ERROR-LOG.md)
- [API 增强路线图](api-roadmap-20260908/API增强路线图.md)
- [40 项社区借鉴清单](api-roadmap-20260908/community-reference/社区MCP借鉴与完整功能清单.md)
- [2026-09-08 最新参考与接入建议](upstream-latest-20260908/最新参考与接入建议.md)
- [历史原理图设计指导](stm32g431-review-20260907/原理图设计指导.md)、[历史错误与经验](stm32g431-review-20260907/错误与经验记录.md)

社区资料检索已可调用；社区 MCP 写图服务、离线布局算法、电源树及仿真模块尚未接入。不能把列入清单当作已经实现。

电机布局 Skill 的源文件由本仓库维护。本机通过 `C:\Users\99563\.codex\skills\motor-power-stage-layout` 目录联接使用同一份文件，后续更新不需要维护两份副本。新会话发现 Skill 后可显式使用 `$motor-power-stage-layout`；也允许按电机功率级 PCB 任务自动匹配。若当前会话尚未刷新目录，可直接读取上述 `SKILL.md` 应用规则。

在其他机器安装时，将该 Skill 整个目录复制或联接到该机器的 Codex Skills 目录；不要覆盖已有同名内容。Skill 提供工作方法、检查与计算依据，不自带自动布板器，也不表示已验证当前硬件或解决 Bridge 的已知问题。

手动更新参考目录：

```powershell
node upstream-latest-20260908/check-latest.mjs
node upstream-latest-20260908/build-report.mjs
```

更新会改变目录中的固定版本，先审查差异再提交。原社区 40 项清单保留其原有固定提交，单独维护。

PCB 专题来源单独锁定，最新上游索引更新不会自动改写历史引用。需刷新精选版本时，运行 `node pcb-knowledge/build-catalog.mjs` 后审查 SHA 和适配结论，再运行 `npm run check:docs`。

## 资料与来源

[来源说明](docs/PROVENANCE.md) 记录打包范围与上游处理方式。只保存必要的自有工具、补丁、研究索引和说明；社区源文件可按固定 SHA 按需下载。缓存、运行状态、凭据、依赖目录和硬件工程不纳入 Git。
