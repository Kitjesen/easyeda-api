import {runPlan} from './lib.mjs';
const [mode,plan]=process.argv.slice(2);
try{if(!plan)throw Error('Usage: node cli.mjs read|apply plan.json');const r=await runPlan(plan,mode);console.log(JSON.stringify(r,null,2));}
catch(e){console.error(JSON.stringify({error:String(e),status:e.status,directory:e.operationDirectory}));process.exitCode=1;}
