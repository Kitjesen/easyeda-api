export function segments(paths){
 const seen=new Set(),out=[];
 for(const points of paths){
  if(points.length<2)throw Error('Path needs two points');
  for(let i=1;i<points.length;i++){
   const a=points[i-1].map(v=>Math.round(v*1e6)/1e6),b=points[i].map(v=>Math.round(v*1e6)/1e6);
   if(a.length!==2||b.length!==2||![...a,...b].every(Number.isFinite))throw Error('Invalid point');
   if(a[0]===b[0]&&a[1]===b[1])continue;
   if(a[0]!==b[0]&&a[1]!==b[1])throw Error('Diagonal schematic wire rejected');
   const k=[a.join(','),b.join(',')].sort().join(':');if(!seen.has(k)){seen.add(k);out.push([...a,...b]);}
  }
 }
 return out;
}
export function covered(line, existing){
 const vertical=line[0]===line[2],axis=vertical?1:0,constant=vertical?0:1;
 const low=Math.min(line[axis],line[axis+2]),high=Math.max(line[axis],line[axis+2]);
 const ranges=existing.filter(s=>s[constant]===line[constant]&&s[constant+2]===line[constant]).map(s=>[Math.min(s[axis],s[axis+2]),Math.max(s[axis],s[axis+2])]).sort((a,b)=>a[0]-b[0]);
 let end=low;for(const [a,b]of ranges){if(b<end)continue;if(a>end)return false;end=Math.max(end,b);if(end>=high)return true;}return false;
}
