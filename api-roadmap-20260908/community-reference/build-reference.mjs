import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const repos = {
  D: 'Dogmeat88/EasyEDA-MCP', P: 'oaslananka/easyeda-mcp-pro',
  C: 'cheewee2000/easyeda-mcp', B: 'biosshot/easyeda-copilot', S: 'Spectoda/easyeda-mcp',
};
const indexes = Object.fromEntries(await Promise.all(Object.entries(repos).map(async ([key, repo]) => [key, JSON.parse(await fs.readFile(path.join(root, repo.replace('/', '__'), 'index.json')))])));
// Reviewed references and our own proposed acceptance criteria; no code is imported or run.
const groups = [
  ['会话、接口与数据读取', [
    ['A01','P0','一次取得当前工程与图页上下文','C:eda-tools.mjs','easyeda_get_state 将常用状态合并读取','统一返回工程、板、图页、类型与证据时间；写入仍逐次核对 UUID，不能只凭工程名','错误页、空页面、重连后旧窗口均不能被当成正确上下文'],
    ['A02','P0','快速发现并缓存 Bridge','C:index.mjs','缓存端口并并行探测候选端口','缓存命中也检查服务身份；失效再扫描，不复用错误服务，不为一次失败自动终止编辑器','多服务、失效缓存和端口冲突可区分；只使用当前唯一授权 Bridge'],
    ['A03','P0','能力清单和固定参数工具','D:src/bridge-runtime-capabilities.ts','检测实际方法；工具 schema 限定输入结构','分别标注文档声明、运行时可见、行为已验证；枚举与单位按实际版本适配','接口不可用时在写前停止，并给出可验证替代路径；不按工具数量衡量支持程度'],
    ['A04','P0','操作 ID、查询进度和结果','B:mcp/src/operations/manager.ts','OperationManager 管理任务与取消请求','借鉴查询接口，补持久记录、重复提交识别、未知结果隔离；取消请求与原生已停止分别报告','晚到结果、断线与重启后状态可追溯；不得在结果未知时重发同一写入'],
    ['A05','P1','精简摘要与按需详细查询','C:eda-tools.mjs','网表与 PCB 调查提供紧凑结果和详情选项','默认仅返回数量、变化及问题，按位号/网络展开；完整数据存文件，不因截断漏查','大工程摘要明确总数、已返回数量和截断状态，详情能定位原始证据'],
  ]],
  ['元件、引脚与连接模型', [
    ['B01','P1','精确物料搜索与已确认器件目录','B:mcp/docs/schematic/circuit-mod.md','按真实 MPN/part_uuid 选择器件的工作流','将候选查询、型号、额定、封装和实际 Device 分开核验；已确认器件可入本地目录','不能生成虚构 UUID/MPN；每个新增阻容都能追到真实库绑定'],
    ['B02','P1','真实引脚与 NC 状态查询/编辑','D:src/mcp-tool-runtime.ts','list_schematic_component_pins / set_schematic_pin_no_connect 已注册','使用实际引脚编号、接触点及子属性；NC 与名为 NC 的普通网络严格区分','旋转、镜像、隐藏脚和 NC 移动后保存重读均正确'],
    ['B03','P1','单脚、批量及带前缀接网','D:src/schematic-pin-stub.ts','引脚方向驱动短引线；配套批量接网工具','批量输入先展开为逐脚映射；用真实方向/单位规划正交短线，显式偏移也禁止斜线','多脚 SPI/驱动器逐脚网表与计划一致，无错误合网或悬空端口'],
    ['B04','P1','替换器件时保留设计身份','B:mcp/src/tools/circuit.ts','提供电路提取、重建与修改工具入口','我们须额外保留 Unique ID、位号、真实料号、装配属性及新旧引脚映射；不能只保留位号','换 LDO/电容后每个旧端子映射可追踪，非目标连接不变，PCB 关联不丢失'],
    ['B05','P0','图元提交、独立回读与删除核验','D:src/host-primitive-finalizer.ts','对支持 done 的返回图元完成提交','按对象类型选择已验证提交方式；随后独立读取并检查目标存在/消失；不自动重复 done','创建/修改/删除的无效成功响应均不能标记 verified，保存后状态仍符合预期'],
    ['B06','P1','统一原理图数据模型和自检','P:src/schematic-model/model-validator.ts','校验重复对象、重复位号、缺失字段及对象引用','统一元件、引脚、网络、标签、NC 与几何表示，保留原始 ID 和解析来源','删除记录不变成活动器件；未知字段保留；不完整输入输出诊断而非默默丢弃'],
    ['B07','P0','排版前后连接关系比较','P:src/schematic-model/connectivity-fingerprint.ts','归一化连接、端点、标签与 NC 并计算指纹','拆成电气连接与结构几何两种差分；电气基于稳定身份/引脚集合，不能仅哈希导线 ID','纯重排电气集合不变；导线拆合仅为结构差异；任何意外短接/断开均被发现'],
  ]],
  ['图纸布局、文字与可视检查', [
    ['C01','P1','真实图框和旋转后的包围框','P:docs/professional-schematic-layout.md','按图页、标题栏和组合包围框规划','读取图框、符号本体、引脚字、位号/值/标签及单位，不只使用中心点；缺少几何先补读取','图框、标题栏不被覆盖；全部相关文字计入范围；不猜比例缩放'],
    ['C02','P1','按功能和信号路径分组','P:src/layout/planner.ts','功能块规划与布局候选生成','功率级、局部驱动、采样、反馈等按完整局部功能组织；模块成员显式可审查','运放与反馈/偏置阻容在同块；没有把电阻统一放到远处的独立块'],
    ['C03','P1','紧凑放置与可用区域查找','P:src/workflows/schematic-safe-region.ts','按占用区域与候选位置寻找放置空间','以用户认可的字号/局部间距为基准，保留必需支路空间，控制无意义留白','模块紧凑但标签不拥挤；空间不够时调整区域或图页，不缩字藏字'],
    ['C04','P1','短正交连线和冗余线清理','D:src/schematic-pin-stub.ts','按引脚方向建立连接短引线','扩展本地 geometry 工具处理共线段、零长段、重复段；保留支路结点和端子语义','冗余段减少且端子网表不变；不跨元件本体、不生成无依据的大回路'],
    ['C05','P1','布局质量问题分类','P:src/workflows/schematic-layout-qa.ts','问题类型覆盖文字重叠、距离、绕线、留白和电气变化','分别输出几何、可读性、分组、接线、运行时证据；致命问题不能被总分抵消','标签压元件、重复 NET 字、过长线、超图框均有对象和区域定位'],
    ['C06','P1','全页/局部捕获与定位','P:docs/reference/tools.md','全页截图、区域截图及画布定位工具','记录图页 UUID、图纸到图片坐标变换、分辨率和生成时间；保留用户当前视图恢复策略','全页不裁掉电路；局部可读；图片非透明且包含本次修改'],
    ['C07','P2','可高亮网络的本地 PCB 预览','B:mcp/src/tools/pcb/pcb-preview.ts','preview_pcb 支持图层、网络/器件高亮及区域缩放','可作为分析图，必须标注本地渲染并绑定源码哈希；与编辑器原生截图分别存档','能定位相线、母线或器件；不能用本地渲染替代编辑器实际保存证据'],
  ]],
  ['复用电路与常用操作模板', [
    ['D01','P1','电源轨模块搭建','P:src/tools/L2_workflows.ts','easyeda_workflow_power_rail 提供规划和应用入口','基于实际库与电源参数构造局部电源模块；保留供电/反馈/使能及去耦关系','指定网络、端子与参数逐项通过；不把外观一致当作电气正确'],
    ['D02','P1','IC 去耦支路模板','P:src/workflows/planner.ts','decouple_ic 工作流规划局部去耦','逐个真实电源脚和地参考展开，不猜芯片脚号；容量/耐压依规格选择','每个目标电源脚确实连到去耦；图面紧凑；PCB 就近回流作为后续单独检查'],
    ['D03','P1','连接器扇出与命名','P:src/tools/L2_workflows.ts','easyeda_workflow_connector_breakout','显式 pin→net 表，按真实连接器引脚、方向和角色生成短线与必要端口','换向/镜像后脚号与外接线束对应正确，电源脚不被批量前缀误命名'],
    ['D04','P2','整块电路模板和复用端口','B:mcp/docs/schematic/circuit-mod.md','功能块复用、参数和外部端口映射约定','建立我们自己的 LDO/CAN/编码器/半桥模板，含料号候选、范围、测试及版本','模板端口无漏接；按本工程 14S 等边界重新核查，不直接套用其他 MCU 样例'],
  ]],
  ['物料、电气规则与计算', [
    ['E01','P1','供应商查询、价格阶梯与缓存来源','P:src/vendors/sourcing-facade.ts','统一查询返回供应商、缓存和时间信息','按可用授权数据源查库存/价格，保留币种、数量、时间及失败原因','缓存与实时可区分；查不到不能填 0 或捏造价格；查询不产生采购订单'],
    ['E02','P1','BOM 质量与备选料评估','P:src/bom-quality/quality.ts','缺 MPN/封装、库存、寿命周期与备选料提示','采购参数与实际封装绑定一并核对；备选料额外验证电气、引脚、热和装配','0805/0603 不符能定位；同封装不能直接判电气可替换；DNP 单独处理'],
    ['E03','P1','基于引脚角色的独立 ERC','P:src/schematic-model/pin-semantics.ts','引脚类型归一化；工具目录含 semantic_erc_auto/validate','只将名称推断当线索；未知角色保留 unknown，结合真实器件规格、网络和已批准规则','区分输出冲突、浮空、供电域错误与符号资料不足；不把弱推断当确定接线故障'],
    ['E04','P1','电源树、电流预算与 LDO 热估算','P:src/power-tree/analysis.ts','计算电源负载、压差余量、耗散和热余量','为本板分别建母线/降压/5V/3.3V 节点，区分已知/估计负载与热参数','输出计算输入、公式及缺失量；5V→3.3V 的热估算不能仅看 LDO 标称电流'],
    ['E05','P2','本地 SPICE 工作点与瞬态仿真','P:src/simulation/runner.ts','ngspice 检测及批量运行，工具含 .op/.tran','用于有正确模型的预充、分压/滤波或电源小电路；模型脚序、条件和适用范围可追溯','无求解器/模型明确报告缺口；波形有输入文件与版本，不能等同整板/散热/保护实测'],
  ]],
  ['PCB 联动和布线辅助', [
    ['F01','P1','按网络/图层调查 PCB 并统一单位','C:eda-tools.mjs','easyeda_survey_pcb 汇总元件、焊盘、线与过孔','建立按 API 字段的单位映射；不能把社区旧版缩放常数套到全部接口','已知尺寸实测一致，坐标、线宽和过孔不出现 10 倍误差'],
    ['F02','P1','同步前预览原理图与 PCB 差异','C:eda-tools.mjs','easyeda_sync_to_pcb 默认预演，按 Unique ID 对比并回读','先列缺件、仅 PCB 件、空/冲突身份、焊盘网络差异；应用纳入我们的核验流程','改变器件后不丢旧关联；机械自由器件不误删；同步后每个目标焊盘再核验'],
    ['F03','P2','网络分类、差分对与 DRC 规则管理','C:eda-tools.mjs','提供网络类别、差分对、规则查询及修改工具','依据本板制造/电气约束生成规则差异，不照搬旧客户端异常判断','单位和应用结果可回读；未覆盖规则列明；DRC 结果与接口异常分开'],
    ['F04','P2','真实焊盘锚点、板边对齐和局部走线','D:src/pcb-pad-anchor.ts','计算考虑焊盘尺寸/旋转的走线锚点；另有板边对齐','结合真实焊盘形状、孔、线宽和禁布区；未知形状不可猜默认尺寸后直接应用','旋转与异形焊盘连接正确；板边规则按实际轮廓，非仅外接矩形'],
    ['F05','P2','受约束的布线任务与结果报告','B:mcp/src/routing/easyeda-autoroute-adapter.ts','原生自动布线适配和操作结果管理','只对明确网络范围执行；前后焊盘/线/过孔/未布通与 DRC 独立比较','部分完成可见；不宣称失败取消已停止；功率/采样关键回路需专门工程规则'],
  ]],
  ['计划、恢复、导出与器件知识', [
    ['G01','P0','先生成可审查的操作清单','P:src/tools/L2_workflows.ts','preview/apply 工作流输出确定的图元操作','计划绑定工程/页、对象、前置哈希和预计差异；按现有授权执行，不新增逐步重复确认','过期计划拒绝；实际变化只在计划范围；预览不修改图纸'],
    ['G02','P0','检查点、逐项快照和恢复计划','P:src/transactions/manager.ts','操作前后快照、文档锁、失败与恢复状态记录','将其作为有条件的补偿思路；补完整工程备份、磁盘记录和用户改动检测','部分恢复失败明确保留，不能保证原子事务；恢复前核对图纸未被他人改变'],
    ['G03','P1','制造输出文件清单和一致性检查','P:src/export-manifest/validation.ts','检查来源、时间、校验和、必需角色及 BOM/贴片数据','导出 Gerber/钻孔/BOM/CPL/网表/PDF 后本地实际解析文件，不仅验证元数据声明','工程版本一致、非空、哈希匹配；BOM/CPL 位号按 DNP/纯机械件规则对应'],
    ['G04','P2','器件目录与参数证据校验','P:src/catalog/validation.ts','目录数据结构和引用校验','保存已选器件的 MPN、Device、Footprint、规格书来源、引脚与批准应用范围','缓存版本可追踪；新库版本改变符号或封装时重新校验，不继承旧结论'],
  ]],
  ['工具组织、回归与经验积累', [
    ['H01','P1','按任务组织工具及使用说明','D:src/mcp-tool-runtime.ts','工具注册表包含能力、使用指南和领域操作','提供 inspect/edit/check/export 工具集合；状态和帮助随实际能力输出，避免超大工具菜单','工具名字、schema 和帮助一致；读取入口不接受可写任意代码'],
    ['H02','P0','协议、转换与真实编辑器分层验证','S:src/bridge/mock.ts','早期项目分离 mock 协议测试和编辑器测试','复用测试分层思路；把历史错误变成固定样例，工具单元通过后再到隔离工程实测','模拟通过不能标记编辑器通过；纳入迟到结果、字体、封装、NC、UID 和持久化样例'],
    ['H03','P0','故障阶段、原始返回与经验记录','P:src/workflows/schematic-post-write-qa.ts','写后 QA 组织运行时与检查证据','统一写错误码、阶段、目标、源版本及证据路径；根因待确认时不自动编造','同一次失败可追到请求、读回与导出；已修复需独立证据，不仅追加文字结论'],
  ]],
];
const items = groups.flatMap(([group, rows]) => rows.map(([id, priority, title, ref, borrowed, adaptation, acceptance]) => {
  const [key, ...rest] = ref.split(':');
  const file = rest.join(':');
  const index = indexes[key];
  if (!index.paths.includes(file)) throw new Error(`Missing upstream path: ${ref}`);
  return { id, group, priority, title, implementationStatus: 'proposed_not_deployed', evidenceLevel: file.endsWith('.md') ? 'reference_documentation' : 'static_source_reference', source: { repository: repos[key], commit: index.commit, file, url: `https://github.com/${repos[key]}/blob/${index.commit}/${file}` }, borrowed, adaptation, acceptance };
}));
if (items.length !== 40 || new Set(items.map(x => x.id)).size !== 40) throw new Error('Expected exactly 40 unique reference items');
await fs.writeFile(path.join(root, 'community-backlog.json'), JSON.stringify({ date: '2026-09-08', status: 'research_only', scope: 'Five selected public repositories; no claim of exhaustive coverage of the entire internet. No runtime installation or live editor test.', items }, null, 2));
const sourceManifest = JSON.parse(await fs.readFile(path.join(root, 'source-manifest.json')));
if (!sourceManifest.sources.some(x => x.repo === repos.C && x.file === 'eda-tools.mjs')) {
  const body = await fs.readFile(path.join(root, 'cheewee2000__easyeda-mcp', 'eda-tools.mjs.txt'));
  sourceManifest.sources.push({ repo: repos.C, commit: indexes.C.commit, file: 'eda-tools.mjs', local: 'eda-tools.mjs.txt', url: `https://raw.githubusercontent.com/${repos.C}/${indexes.C.commit}/eda-tools.mjs`, bytes: body.length });
  await fs.writeFile(path.join(root, 'source-manifest.json'), JSON.stringify(sourceManifest, null, 2));
}
const safe = v => v.replaceAll('|', '\\|').replaceAll('\n', ' ');
const md = [
  '# 社区 MCP 借鉴清单与实施要求',
  '',
  '日期：2026-09-08。已将本轮检查的五个公开仓库中值得参考的内容整理为 **40 项、8 组**开发要求。这里只表示已纳入文档；没有安装这些社区 MCP、执行下载的源码或改变原理图。不是对互联网上全部仓库的穷尽审计。',
  '',
  '每项包含参考入口、需要我们补强的地方和验收条件；“源码参考”仅说明检查了相关实现或注册入口，不代表其全部依赖、测试和真实客户端兼容性已经通过。源码文件、文档和固定提交见本目录 manifest；机器可读待办为 [community-backlog.json](community-backlog.json)。',
  '',
  '## 仓库取舍',
  '',
  '| 仓库 | 本轮证据与价值 | 对我们的取舍 |',
  '|---|---|---|',
  `| [Dogmeat88/EasyEDA-MCP](https://github.com/${repos.D}/tree/${indexes.D.commit}) | 结构化工具、引脚短线、图元提交、焊盘锚点与板边对齐源码 | 重点借鉴低层操作封装，接到我们现有核验层 |`,
  `| [oaslananka/easyeda-mcp-pro](https://github.com/${repos.P}/tree/${indexes.P.commit}) | 布局 QA、工作流、电源树、BOM、仿真和导出清单等实现与文档 | 本轮功能参考范围最广；按模块移植，逐项核验依赖和行为 |`,
  `| [cheewee2000/easyeda-mcp](https://github.com/${repos.C}/tree/${indexes.C.commit}) | 直接包装官方 Bridge；有精简网表、单位处理、PCB 同步预演源码 | 与当前连接架构接近，优先借鉴接口设计；未发现明确开源许可标识，实际复制代码前须另核许可 |`,
  `| [biosshot/easyeda-copilot](https://github.com/${repos.B}/tree/${indexes.B.commit}) | 功能块工作流、操作管理、检查点和 PCB 预览源码/说明 | 借鉴模块表达、结果查询和可视检查；整页重建与换件要补我们的身份保护 |`,
  `| [Spectoda/easyeda-mcp](https://github.com/${repos.S}/tree/${indexes.S.commit}) | README 明确为早期骨架，含 mock 协议验证 | 仅借鉴分层测试和领域划分，不把规划的导出/采购能力写成现成实现 |`,
  '',
  '检索固定提交：',
  '',
  ...Object.entries(indexes).map(([key, index]) => `- ${repos[key]}：\`${index.commit}\`；GitHub 许可标识：${index.license ?? '未提供'}。`),
  '',
  '## 实施清单',
  '',
];
for (const [group] of groups) {
  md.push(`### ${group}`, '', '| 编号/优先级 | 能力与参考 | 我们需要如何实现 | 验收要求 |', '|---|---|---|---|');
  for (const item of items.filter(x => x.group === group)) md.push(`| ${item.id} / ${item.priority} | **${safe(item.title)}**。${safe(item.borrowed)}。[${item.evidenceLevel === 'reference_documentation' ? '文档参考' : '源码参考'}](${item.source.url}) | ${safe(item.adaptation)} | ${safe(item.acceptance)} |`);
  md.push('');
}
md.push(
  '## 不能直接照搬的行为', '',
  '1. **整页提取后重建**：不能只保留位号。必须保留 Unique ID、器件库/封装、采购绑定、隐藏属性与 NC 子属性；尽量对目标对象做局部修改。',
  '2. **自动撤销/事务**：社区有内存事务和补偿机制，但其运行时安全文档也明确不保证跨运行时完整回滚。我们保留完整备份、当前状态检查和明确的恢复计划。',
  '3. **一套连接哈希**：参考实现把 wire ID、标签 ID、端点也纳入指纹。合法拆合导线可能改变这些字段，因此我们必须另外比较由稳定器件身份与引脚组成的电气连接集合。',
  '4. **名字推断 ERC**：引脚类型可能未填写或来自命名约定；名称只能提供候选，不能证明 5V 容限、开漏模式、供电输入或实际驱动冲突。',
  '5. **备选料评分**：封装字符串、库存和生命周期评分不能证明替代电气兼容。MOS/稳压器/驱动器仍需逐项额定、引脚、热和动态条件核对。',
  '6. **预览就是实图**：本地 PNG 可用于分析，高亮很有价值；但原生截图、源码、网表与工程导出各自承担不同证据职责。',
  '7. **示例默认参数**：短线长度、坐标缩放、热阻、铜厚和模板间距都要匹配当前客户端及本板；不得照搬默认值后直接报通过。',
  '8. **工具名代表支持**：注册入口存在不表示客户端方法可用；源码里的超时控制也不代表原生操作已经取消。',
  '9. **照搬交互确认流程**：借鉴预演与差异检查，不把社区文档中的逐步人工批准约定自动加到本项目。已有授权仍有效，工具按照明确计划继续执行。',
  '10. **自动报价/下单**：本轮只收录准备资料和查询数据的能力，不增加支付、提交订单或向供应商发送信息的默认动作。',
  '',
  '## 对当前板子的落地样例', '',
  '| 我们的问题 | 对应待办 | 实际验收样例 |',
  '|---|---|---|',
  '| 标签挤在元件上、线长、间距大 | B07、C01–C06 | 在工程副本整理 CAN/编码器块；电气连接集合不变，正常字号下无重叠，新导出和图面一致 |',
  '| 料号未绑定、0805/0603 不符 | B01、B04、E02、G04 | 原始采购与封装内容核验；保留身份；临时导入器件单列，不进入正式 BOM |',
  '| LDO 5V→3.3V 是否合理 | E04、E05 | 先列实际负载与峰值、最低输入及热条件，计算耗散/余量；模型充分时才做瞬态仿真 |',
  '| API 成功但没有保存，反复重连 | A01–A04、B05、G01–G02 | 请求、结果未知、独立验证和持久化状态分开；重试不重复写入 |',
  '| DRC 只有汇总 | E03、H03 | 原生汇总原样保留；独立检查定位对象，但不伪称已取得官方 DRC 明细 |',
  '| 后续原理图转 PCB | F01–F05、G03 | 先诊断 UID/封装/焊盘网络差异；同步与制造导出分批验证 |',
  '',
  '## 开发与交付顺序', '',
  '第一批以 A01–A04、B05/B07、G01/G02、H02/H03 为共同基础：统一任务、身份、未知结果和核验。复用现有官方 Bridge，所有工具经同一写入队列。',
  '',
  '第二批完成元件/引脚/BOM 与布局工具，优先在当前项目副本重现并解决已记录问题；随后完成电源树和常用局部模块。每项完成需把 backlog 的 proposed_not_deployed 改为实际状态，并附测试及工程证据，不能批量勾完成。',
  '',
  '第三批加入仿真、PCB 协作和制造导出。缺少求解器、模型、供应商数据源或客户端 API 时，先实现可用部分并明确报告具体缺口；不为功能数叠加第二套编辑器写入服务。',
  '',
  '## 工具入口索引', '',
  '另附 [community-tool-index.csv](community-tool-index.csv)，记录本轮读取的注册/文档入口。索引是调查资料，不是我们已安装的工具列表，不保证覆盖各仓库所有实验功能。',
  '',
  '返回：[API 增强路线图](../API增强路线图.md)。',
);
await fs.writeFile(path.join(root, '社区MCP借鉴与完整功能清单.md'), md.join('\n') + '\n');
const toolRows = [];
const dogSource = await fs.readFile(path.join(root, 'Dogmeat88__EasyEDA-MCP', 'src__mcp-tool-runtime.ts.txt'), 'utf8');
for (const m of dogSource.matchAll(/name:\s*'([^']+)'/g)) toolRows.push([repos.D,m[1],'registration','src/mcp-tool-runtime.ts']);
const proDoc = await fs.readFile(path.join(root, 'oaslananka__easyeda-mcp-pro', 'docs__reference__tools.md.txt'), 'utf8');
for (const m of proDoc.matchAll(/^\|\s*`(easyeda_[^`]+)`/gm)) toolRows.push([repos.P,m[1],'documentation','docs/reference/tools.md']);
const lightSource = await fs.readFile(path.join(root, 'cheewee2000__easyeda-mcp', 'eda-tools.mjs.txt'), 'utf8');
for (const m of lightSource.matchAll(/name:\s*"(easyeda_[^"]+)"/g)) toolRows.push([repos.C,m[1],'source','eda-tools.mjs']);
for (const file of ['mcp__src__tools__checkpoint.ts.txt','mcp__src__tools__circuit.ts.txt','mcp__src__tools__pcb__pcb-preview.ts.txt']) {
  const body = await fs.readFile(path.join(root, 'biosshot__easyeda-copilot', file),'utf8');
  for (const m of body.matchAll(/registerTool\(\s*'([^']+)'/g)) toolRows.push([repos.B,m[1],'registration',file.replaceAll('__','/').replace(/\.txt$/,'')]);
}
const dedup = [...new Map(toolRows.map(row => [row[0]+'|'+row[1], row])).values()];
const quote = v => '"' + v.replaceAll('"','""') + '"';
await fs.writeFile(path.join(root,'community-tool-index.csv'), '\uFEFF' + [['repository','tool','evidence','source'],...dedup].map(row => row.map(quote).join(',')).join('\r\n') + '\r\n');
console.log(JSON.stringify({referenceItems:items.length,groups:groups.length,toolEntries:dedup.length,snapshots:sourceManifest.sources.length,allProposed:items.every(x=>x.implementationStatus==='proposed_not_deployed')}));
