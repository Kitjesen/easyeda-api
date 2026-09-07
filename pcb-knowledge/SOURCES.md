# PCB 来源目录

检查时间：2026-09-07T20:48:20.996Z（UTC）。23 项精选来源。固定版本只代表可复查，不代表已移植或通过实机验证。

| ID | 来源 | 主题 / 价值 | 当前版本与范围 | 限制 |
|---|---|---|---|---|
| O01 | [PCB 功能分组](https://github.com/easyeda/eext-pcb-component-grouping/blob/95421773a0180b9c0f48b4fe382419c673bafe2a/README.md)（官方） | pcb-layout；把原理图图页/功能框映射到 PCB 组 | 95421773；最新 Release v1.9.1 | 源码写入；最近备份会被覆盖；分组不等于功率布局合格 |
| O02 | [网络、阻抗与载流规则生成](https://github.com/easyeda/eext-design-rule-generator/blob/2ae2ab975fe8af8bf4bb5ce6e8f9bd4b2eb95a7b/README.md)（官方） | pcb-dfm；按叠层和网络类别形成规则候选 | 2ae2ab97；最新 Release v1.8.2 | RBF 模型有误差；经验载流公式不是实际板卡额定 |
| O03 | [PADEN 电源网络分析](https://github.com/easyeda/eext-paden-integration-wasm/blob/92c75f057ede5b9c8e7a5db36ae79f8014f5a26b/README.md)（官方） | pcb-power；由铜皮/过孔与源负载分析压降、电流和功率密度 | 92c75f05；最新 Release v1.1.10 | 尚未运行；功率密度不是温度场，不能替代 EMI/瞬态验证 |
| O04 | [PCB 网络和坐标报告](https://github.com/easyeda/eext-export-design-report/blob/31a8cfec95bcae13e981b912c6bc86025062dca0/README.md)（官方） | pcb-dfm；取得网络长度、焊盘坐标及板级统计 | 31a8cfec；最新 Release v1.0.17 | 单位、板框和导出版本需独立核验 |
| O05 | [Gerber 转分层 SVG](https://github.com/easyeda/eext-export-pcb-to-svg/blob/f68898d18c8279e2aaf84a5b2ff07969ebeb005e/README.md)（官方） | pcb-dfm；从制造输出生成可观察的铜层/丝印等图像 | f68898d1；最新 Release v1.2.0 | 尚未运行；网络标注也引用画布信息，注意镜像和版本一致性 |
| O06 | [FreeCAD 机电协同](https://github.com/easyeda/eext-mcad-integration-with-freecad/blob/e3c30a527194d34def8ada4f84451de298caa048/README.md)（官方） | pcb-layout；检查壳体、散热片、插头和卧倒电解的三维关系 | e3c30a52；最新 Release v1.3.0 | 依赖 FreeCAD 与宏；双向位置同步需纳入统一操作状态 |
| O07 | [轻量交互式 BOM](https://github.com/easyeda/eext-interactive-bom/blob/3606355f002a9380fe2f7b956b2969b09df65545/README.md)（官方） | components；位号、值、封装与 PCB 图联动 | 3606355f；最新 Release v1.0.1 | README 指出功能少于原生 iBOM；不自动验证替代料电气兼容 |
| O08 | [器件属性更新与替换](https://github.com/easyeda/eext-update-components-attributes/blob/b26080edcc9e5e3dddadadda33d4e329973f2fc0/README.md)（官方） | components；从指定器件库匹配采购属性和器件 | b26080ed；最新 Release v2.4.3 | 整件替换可改变封装和脚序；必须保留并比较身份与网络 |
| O09 | [完整 iBOM 对接入口](https://github.com/easyeda/eext-interactive-html-bom/blob/430ea9d06a1c975ed3d2c6da83a6686a1f737084/README.md)（官方） | components；从嘉立创对接交互式装配 BOM | 430ea9d0；最新 Release v2.8.1 | 本轮审查 README/目录，未安装；功能以该扩展版本为准 |
| C01 | [PCB 布局与工艺规则手册](https://github.com/zhoushoujianwork/easyeda-agent/blob/62c0db9464bfa78cc481b907dca778b24175287c/skills/easyeda-agent/references/pcb-design-rules.md)（社区） | pcb-layout；组织布局、走线、铺铜、装配、丝印和检查清单 | 62c0db94；最新 Release v1.4.3 | 数值按具体工艺重新审查；通用默认值不能用于电机相线 |
| C02 | [PCB 约束与检查结果结构](https://github.com/oaslananka/easyeda-mcp-pro/blob/68c86fa7ef7d0b013ed6cc588727eca3baf0e1c9/docs/pcb-constraints.md)（社区） | pcb-dfm；板框、层叠、制造、装配和测试性报告结构 | 68c86fa7；最新 Release easyeda-mcp-pro-v1.0.1 | 基于输入模型；未取得真实几何的数据不可标为通过 |
| C03 | [功能区规划与尺寸输入](https://github.com/oaslananka/easyeda-mcp-pro/blob/68c86fa7ef7d0b013ed6cc588727eca3baf0e1c9/src/pcb-layout/floorplan.ts)（社区） | pcb-layout；以真实尺寸、功能角色和机械约束规划放置 | 68c86fa7；最新 Release easyeda-mcp-pro-v1.0.1 | 代码包含矩形/分次检查简化，不是功率/三维最优布局求解器 |
| C04 | [插头和装配可达性检查](https://github.com/biosshot/easyeda-copilot/blob/bf10f7f9c80156abdbf80c45860051026e74b799/mcp/docs/pcb-layout/mechanical-validation.md)（社区） | pcb-layout；按插拔方向、本体、护套、线缆及壳体检查位置 | bf10f7f9；最新 Release v1.1.8 | 放置约束不等于铜皮禁区；不存在通用板边伸出量 |
| C05 | [选型与 BOM 质量缺项](https://github.com/oaslananka/easyeda-mcp-pro/blob/68c86fa7ef7d0b013ed6cc588727eca3baf0e1c9/src/bom-quality/quality.ts)（社区） | components；定位 MPN、封装和供应商等数据缺项 | 68c86fa7；最新 Release easyeda-mcp-pro-v1.0.1 | 数据报告不等于 MOS、LDO 或替代料的电气/热验证 |
| C06 | [原理图引脚角色与 ERC](https://github.com/oaslananka/easyeda-mcp-pro/blob/68c86fa7ef7d0b013ed6cc588727eca3baf0e1c9/src/schematic-model/pin-semantics.ts)（社区） | schematic；构造有来源的引脚角色与连接检查 | 68c86fa7；最新 Release easyeda-mcp-pro-v1.0.1 | 名称推断仅作线索；未知角色和芯片差异不能被默认掩盖 |
| C07 | [原生 InteractiveHtmlBom](https://github.com/openscopeproject/InteractiveHtmlBom/blob/5f3dec9a62f24cfc12e07148743d67f6da3c637e/README.md)（社区） | components；交互式装配定位、BOM 与 PCB 联动的上游实现 | 5f3dec9a；最新 Release v2.11.2 | 本轮只查 README/目录与许可；不能当作直接操作嘉立创的 MCP |
| A01 | [官方 PCB API 定义](https://github.com/easyeda/easyeda-api-skill/blob/8895d98637dab59ed9de10bb2a340e3e4be26d99/references/classes/PCB_Drc.md)（官方） | pcb-dfm；查 DRC、器件与焊盘 API 的真实接口定义 | 8895d986；最新 Release 未取得 | 文档能力与当前客户端运行时分别验证 |
| H01 | [moteus 机器人驱动硬件](https://github.com/mjbots/moteus/blob/fdc6e318194443213c669d28d72e40be38147d2b/README.md)（硬件作者） | pcb-power；定位机器人驱动原理图、PCB 与设计说明 | fdc6e318；最新 Release rust/v0.5.5 | 未逐层审核实际 PCB；51V/54V 文档不能直接应用于 58.8V，软件 Release 不是板卡修订 |
| M01 | [TI 电机驱动 PCB 布局指南](https://www.ti.com/lit/an/slva959b/slva959b.pdf)（器件厂商） | pcb-power；回流、旁路、栅极、分流采样与热布局依据 | SLVA959B，2021-10 修订；本轮阅读 §§2–7 相关文本 | 按实际驱动芯片选择适用拓扑；本轮未作实板分析 |
| M02 | [DRV835x 数据手册布局与选型条件](https://www.ti.com/lit/ds/symlink/drv8350.pdf)（器件厂商） | pcb-power；按具体型号核对驱动回路和外围 | SLVSDY6A；本轮阅读 §11 及型号范围 | 8350/8353、SPI/硬件接口、R 变体不能混用；当前工程器件需回读确认 |
| M03 | [JLCPCB 铜厚与制造下限](https://jlcpcb.com/help/article/jlcpcb-copper-weight)（制造商） | pcb-dfm；将层数、铜厚与线宽/间距限制绑定 | 2026-09-08 查阅制造表 | 最终以选定订单工艺为准；工艺下限不是载流或耐压合格值 |
| M04 | [嘉立创专业版设计规则](https://prodocs.lceda.cn/cn/pcb/design-design-rule/)（官方） | pcb-dfm；理解默认/专用规则、间距和规则分配 | 2026-09-08 查阅规则管理和间距章节 | 配置 DRC 不能证明热、电气回流或器件选型正确 |
| M05 | [嘉立创专业版约束区域](https://prodocs.lceda.cn/cn/pcb/place-constraint-region/)（官方） | pcb-layout；明确区域内特殊线宽、过孔与间距规则 | 2026-09-08 查阅 | 不同 API 的 placement keepout/copper keepout 不是同一种对象 |

这些是原创摘要和固定来源链接，未把第三方整套手册/代码拷入仓库。机器可读字段与 SHA-256 见 [catalog.json](catalog.json)。

返回 [PCB 专题](README.md)。
