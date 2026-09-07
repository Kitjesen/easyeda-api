# 来源与使用范围

核对日期：2026-09-08。以下为厂商原始文档及工具官方说明；版本以本次读到的标题/修订为准，不声称旧版笔记是最新 PCB 产品设计。本 Skill 的表格、执行步骤和算例为项目整理，没有复制上游完整手册或自动安装上游程序。

| 来源 | 本次核对范围 | 如何使用及边界 |
|---|---|---|
| [TI SLVA959B — Best Practices for Board Layout of Motor Drivers](https://www.ti.com/lit/an/slva959b/slva959b.pdf) | Rev B，2021-10；热、旁路、功率器件、驱动与采样布局章节 | 作为回路设计依据；按当前器件/封装落实，示意图尺寸和阻容值不直接照抄 |
| [TI DRV835x 数据手册](https://www.ti.com/lit/ds/symlink/drv8350.pdf) | SLVSDY6A，2019-06；变体、引脚、应用/电源/布局章节 | DRV8350/8353、S/H 与 R 变体逐一核对；实际器件选定后重新确认最新适用修订 |
| [TI SLPA020 — Tips for Successfully Paralleling Power MOSFETs](https://www.ti.com/document-viewer/lit/html/slpa020) | 2022；并联驱动、路径与均流建议 | 支持独立栅阻、对称路径与热条件检查，不提供本板并联后电流额定 |
| [TI SBAA460 — Shunt Resistor Selection](https://www.ti.com/document-viewer/lit/html/sbaa460) | 分流电阻功率、端子温度、Kelvin 及选择条件 | 用于分流器件和取样检查；前端仍读本板真实型号的输入/滤波要求 |
| [TI SLVAFT0 — Bulk Capacitor Sizing for DC Motor Drive Applications](https://www.ti.com/lit/an/slvaft0/slvaft0.pdf) | 电容纹波、储能及简化模型章节 | 原应用条件不能不加转换地覆盖三相 FOC 电容 RMS 与回灌 |
| [Murata — DC 偏压与陶瓷电容容值](https://www.murata.com/en-us/support/faqs/capacitor/ceramiccapacitor/char/0005) | FAQ 中 DC 偏压特性说明 | 实际料号另查曲线；不能统一给所有 MLCC 一个容值折扣 |
| [ADI LTC7001 数据手册](https://www.analog.com/media/en/technical-documentation/data-sheets/ltc7001.pdf) | Rev G；特性、应用信息和 Figures 5–7 | 识别静态驱动、斜率控制与反向路径条件；压差/超时功能需系统分工 |
| [TI SPRA953D — Semiconductor and IC Package Thermal Metrics](https://www.ti.com/document-viewer/lit/html/SPRA953) | 2024-03；目录及 RθJA Usage / RθJC Application 小节 | 分清测试板依赖、case 测点和热参数；不将手册热阻当本板实测 |
| [TI SLUAAT8 — Using MOSFET Transient Thermal Impedance Curves In Your Design](https://www.ti.com/lit/an/sluaat8/sluaat8.pdf) | 2023-12；单次/重复脉冲、归一化热阻和温度条件 | 按真实脉宽/重复周期使用；冷板例子不能直接批准本板峰值 |
| [TI SLUAAO2 — Using MOSFET Safe Operating Area Curves in Your Design](https://www.ti.com/lit/pdf/SLUAAO2) | 2023-03；SOA、温度降额和非矩形脉冲 | 用于线性预充和故障应力；总能量或标称电流不能独立批准工作点 |
| [JLCPCB Copper Weight](https://jlcpcb.com/help/article/jlcpcb-copper-weight) | 铜厚与制造能力页面 | 工艺下限不是电气额定；以当前订单/叠层核实 |
| [嘉立创专业版设计规则](https://prodocs.lceda.cn/cn/pcb/design-design-rule/) | 规则与配置说明 | 现场版本的 API 和规则优先级需回读，不等于已写入 |
| [嘉立创专业版约束区域](https://prodocs.lceda.cn/cn/pcb/place-constraint-region/) | 区域及相关约束说明 | 区分放置、走线、过孔和铜皮约束；独立验证实际生效范围 |

## 官方与社区工具如何配合

在 `easyeda-api` 仓库中，`pcb-knowledge/catalog.json` / `SOURCES.md` 另外保存 23 项 PCB 精选来源和固定提交，`tools/reference-hub.mjs` 提供按主题/文件的只读检索。本 Skill 不内置那些扩展，也不要求把所有上游内容加载进上下文。

| 资料类别 | 取用方式 | 必须补做的项目检查 |
|---|---|---|
| 官方分组/布局辅助 | 用原理图映射和对象 UID 帮助识别功能组 | 真实焊盘、回路、热/机械及跨组碰撞 |
| 官方规则生成/供电分析 | 作为有条件的候选规则、压降和密度分析 | 实际叠层、单位、模型输入/边界；不当温度/EMI 结论 |
| 官方制造层/机械/BOM 工具 | 提供导出、检查和对象定位证据 | 输出版本一致、层镜像、装配空间及电气等效 |
| 社区约束/规则手册 | 借鉴数据结构和检查条目 | 拒绝无来源线宽/间距/安培默认值，核查简化几何和许可 |
| 机器人开源硬件 | 对照准确板型/修订的设计取舍 | 软件 Release 不等于 PCB 修订；不同电压板不能直接覆盖 58.8V |

从 API 仓库根目录可运行 `node tools/reference-hub.mjs topics PCB` 找到已收录来源。目录条目表示“可检索”，并不证明扩展已经安装、已完成适配或在本板跑过。

## 更新规则

- 新增资料先打开原文确认标题、文档号、修订和具体章节；不要根据记忆拼文档编号再把不相关 PDF 当依据。
- 链接读取失败只说明本次读取失败，不证明文档不存在；可从厂商产品页的正式链接重新定位。
- 把实际读到的内容与仅看到的目录区分。未检查某参考板逐层铜皮时，不称其布局已被完整评审。
- 更新来源不自动改 PCB。提炼适用结论后，才按用户当前任务决定是否需要调整设计。
