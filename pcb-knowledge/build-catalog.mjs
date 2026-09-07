import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.dirname(root);
const upstream = JSON.parse(await fs.readFile(path.join(workspace,'upstream-latest-20260908/latest.json'),'utf8'));

// These are authored reference assessments, not executable design constraints.
const rows = [
  ['O01','PCB 功能分组','pcb-layout','官方','easyeda/eext-pcb-component-grouping','README.md','src/source/source-grouping.ts','把原理图图页/功能框映射到 PCB 组','源码写入；最近备份会被覆盖；分组不等于功率布局合格'],
  ['O02','网络、阻抗与载流规则生成','pcb-dfm','官方','easyeda/eext-design-rule-generator','README.md','src/core/jlc-current.ts','按叠层和网络类别形成规则候选','RBF 模型有误差；经验载流公式不是实际板卡额定'],
  ['O03','PADEN 电源网络分析','pcb-power','官方','easyeda/eext-paden-integration-wasm','README.md','go-service/internal/solver/solver.go','由铜皮/过孔与源负载分析压降、电流和功率密度','尚未运行；功率密度不是温度场，不能替代 EMI/瞬态验证'],
  ['O04','PCB 网络和坐标报告','pcb-dfm','官方','easyeda/eext-export-design-report','README.md','src/index.ts','取得网络长度、焊盘坐标及板级统计','单位、板框和导出版本需独立核验'],
  ['O05','Gerber 转分层 SVG','pcb-dfm','官方','easyeda/eext-export-pcb-to-svg','README.md','src/gerber-source.ts','从制造输出生成可观察的铜层/丝印等图像','尚未运行；网络标注也引用画布信息，注意镜像和版本一致性'],
  ['O06','FreeCAD 机电协同','pcb-layout','官方','easyeda/eext-mcad-integration-with-freecad','README.md','','检查壳体、散热片、插头和卧倒电解的三维关系','依赖 FreeCAD 与宏；双向位置同步需纳入统一操作状态'],
  ['O07','轻量交互式 BOM','components','官方','easyeda/eext-interactive-bom','README.md','','位号、值、封装与 PCB 图联动','README 指出功能少于原生 iBOM；不自动验证替代料电气兼容'],
  ['O08','器件属性更新与替换','components','官方','easyeda/eext-update-components-attributes','README.md','src/index.ts','从指定器件库匹配采购属性和器件','整件替换可改变封装和脚序；必须保留并比较身份与网络'],
  ['O09','完整 iBOM 对接入口','components','官方','easyeda/eext-interactive-html-bom','README.md','','从嘉立创对接交互式装配 BOM','本轮审查 README/目录，未安装；功能以该扩展版本为准'],
  ['C01','PCB 布局与工艺规则手册','pcb-layout','社区','zhoushoujianwork/easyeda-agent','skills/easyeda-agent/references/pcb-design-rules.md','internal/app/pcb_rules.go','组织布局、走线、铺铜、装配、丝印和检查清单','数值按具体工艺重新审查；通用默认值不能用于电机相线'],
  ['C02','PCB 约束与检查结果结构','pcb-dfm','社区','oaslananka/easyeda-mcp-pro','docs/pcb-constraints.md','src/pcb-constraints/validation.ts','板框、层叠、制造、装配和测试性报告结构','基于输入模型；未取得真实几何的数据不可标为通过'],
  ['C03','功能区规划与尺寸输入','pcb-layout','社区','oaslananka/easyeda-mcp-pro','src/pcb-layout/floorplan.ts','docs/high-level-pcb-layout.md','以真实尺寸、功能角色和机械约束规划放置','代码包含矩形/分次检查简化，不是功率/三维最优布局求解器'],
  ['C04','插头和装配可达性检查','pcb-layout','社区','biosshot/easyeda-copilot','mcp/docs/pcb-layout/mechanical-validation.md','','按插拔方向、本体、护套、线缆及壳体检查位置','放置约束不等于铜皮禁区；不存在通用板边伸出量'],
  ['C05','选型与 BOM 质量缺项','components','社区','oaslananka/easyeda-mcp-pro','src/bom-quality/quality.ts','','定位 MPN、封装和供应商等数据缺项','数据报告不等于 MOS、LDO 或替代料的电气/热验证'],
  ['C06','原理图引脚角色与 ERC','schematic','社区','oaslananka/easyeda-mcp-pro','src/schematic-model/pin-semantics.ts','','构造有来源的引脚角色与连接检查','名称推断仅作线索；未知角色和芯片差异不能被默认掩盖'],
  ['C07','原生 InteractiveHtmlBom','components','社区','openscopeproject/InteractiveHtmlBom','README.md','','交互式装配定位、BOM 与 PCB 联动的上游实现','本轮只查 README/目录与许可；不能当作直接操作嘉立创的 MCP'],
  ['A01','官方 PCB API 定义','pcb-dfm','官方','easyeda/easyeda-api-skill','references/classes/PCB_Drc.md','references/classes/PCB_PrimitiveComponent.md','查 DRC、器件与焊盘 API 的真实接口定义','文档能力与当前客户端运行时分别验证'],
  ['H01','moteus 机器人驱动硬件','pcb-power','硬件作者','mjbots/moteus','README.md','hw/n1/DESIGN.md','定位机器人驱动原理图、PCB 与设计说明','未逐层审核实际 PCB；51V/54V 文档不能直接应用于 58.8V，软件 Release 不是板卡修订'],
];
const websites = [
  ['M01','TI 电机驱动 PCB 布局指南','pcb-power','器件厂商','https://www.ti.com/lit/an/slva959b/slva959b.pdf','SLVA959B，2021-10 修订；本轮阅读 §§2–7 相关文本','回流、旁路、栅极、分流采样与热布局依据','按实际驱动芯片选择适用拓扑；本轮未作实板分析'],
  ['M02','DRV835x 数据手册布局与选型条件','pcb-power','器件厂商','https://www.ti.com/lit/ds/symlink/drv8350.pdf','SLVSDY6A；本轮阅读 §11 及型号范围','按具体型号核对驱动回路和外围','8350/8353、SPI/硬件接口、R 变体不能混用；当前工程器件需回读确认'],
  ['M03','JLCPCB 铜厚与制造下限','pcb-dfm','制造商','https://jlcpcb.com/help/article/jlcpcb-copper-weight','2026-09-08 查阅制造表','将层数、铜厚与线宽/间距限制绑定','最终以选定订单工艺为准；工艺下限不是载流或耐压合格值'],
  ['M04','嘉立创专业版设计规则','pcb-dfm','官方','https://prodocs.lceda.cn/cn/pcb/design-design-rule/','2026-09-08 查阅规则管理和间距章节','理解默认/专用规则、间距和规则分配','配置 DRC 不能证明热、电气回流或器件选型正确'],
  ['M05','嘉立创专业版约束区域','pcb-layout','官方','https://prodocs.lceda.cn/cn/pcb/place-constraint-region/','2026-09-08 查阅','明确区域内特殊线宽、过孔与间距规则','不同 API 的 placement keepout/copper keepout 不是同一种对象'],
];
const hash = data => createHash('sha256').update(data).digest('hex');
async function sourceBytes(repository,commit,file) {
  const raw=`https://raw.githubusercontent.com/${repository}/${commit}/${file}`;
  const cache=path.join(workspace,'.reference-cache',hash(raw)+'.txt');
  try { return await fs.readFile(cache); }
  catch(error) { if(error.code!=='ENOENT')throw error; }
  let data;
  try {
    const response=await fetch(raw,{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error(`HTTP ${response.status}`);
    data=Buffer.from(await response.arrayBuffer());
  } catch {
    const result=JSON.parse(execFileSync('gh',['api',`repos/${repository}/contents/${file}?ref=${commit}`],{encoding:'utf8',windowsHide:true,timeout:25000,maxBuffer:4*1024*1024}));
    if(result.encoding!=='base64'||typeof result.content!=='string')throw Error('GitHub content fallback did not return text');
    data=Buffer.from(result.content,'base64');
  }
  if(data.length>2*1024*1024||data.includes(0))throw Error('Reference exceeds text limits');
  await fs.mkdir(path.dirname(cache),{recursive:true});
  await fs.writeFile(cache,data);
  return data;
}
const sources = [];
for (const [id,title,topic,origin,repository,file,supportingFile,value,limitation] of rows) {
  const r = upstream.repositories.find(x=>x.repository===repository && !x.error);
  if(!r || !r.files.includes(file) || (supportingFile&&!r.files.includes(supportingFile))) throw Error(`Unverified catalog path: ${id}`);
  const body=await sourceBytes(repository,r.commit,file);
  const source={kind:'github',repository,commit:r.commit,file,url:`https://github.com/${repository}/blob/${r.commit}/${file}`,sha256:hash(Buffer.from(body)),license:r.license,headCommitDate:r.commitDate,latestRelease:r.latestRelease};
  if(supportingFile)source.supportingFile={path:supportingFile,url:`https://github.com/${repository}/blob/${r.commit}/${supportingFile}`,review:'Located in pinned tree; detailed review scope is stated in topic notes'};
  sources.push({id,title,topic,origin,value,limitation,status:'reference_collected_not_integrated',evidence:'Selected documentation/code sections or README and tree review; upstream tests and live editor not run',source});
}
for(const [id,title,topic,origin,url,revision,value,limitation] of websites) sources.push({id,title,topic,origin,value,limitation,status:'reference_collected_not_integrated',evidence:revision,source:{kind:'web',url,revision}});
const catalog={schemaVersion:1,checkedAt:new Date().toISOString(),scope:'Curated PCB references; no automatic rule adoption or live editor changes',sources};
await fs.writeFile(path.join(root,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
const md=['# PCB 来源目录','',`检查时间：${catalog.checkedAt}（UTC）。${sources.length} 项精选来源。固定版本只代表可复查，不代表已移植或通过实机验证。`,'','| ID | 来源 | 主题 / 价值 | 当前版本与范围 | 限制 |','|---|---|---|---|---|'];
for(const s of sources){const version=s.source.kind==='github'?`${s.source.commit.slice(0,8)}；最新 Release ${s.source.latestRelease?.tag||'未取得'}`:s.evidence;md.push(`| ${s.id} | [${s.title}](${s.source.url})（${s.origin}） | ${s.topic}；${s.value} | ${version} | ${s.limitation} |`);}
md.push('','这些是原创摘要和固定来源链接，未把第三方整套手册/代码拷入仓库。机器可读字段与 SHA-256 见 [catalog.json](catalog.json)。','', '返回 [PCB 专题](README.md)。','');
await fs.writeFile(path.join(root,'SOURCES.md'),md.join('\n'));
console.log(JSON.stringify({sources:sources.length,github:rows.length,web:websites.length}));
