// Keep record terminators exactly as read: the final EPRU record may have no '|'.
export function transformSource(source, transform) {
 return source.split(/(\r\n|\n|\r)/).map((line,index)=>{
  if(index%2)return line;
  const cut=line.indexOf('||');if(cut<0)return line;
  const terminated=line.endsWith('|'),headerText=line.slice(0,cut);
  const bodyText=line.slice(cut+2,terminated?-1:undefined);
  if(!bodyText)return line; // Preserve deleted-record tombstones in official exports.
  const header=JSON.parse(headerText),body=JSON.parse(bodyText);
  const next=transform(header,body);if(next===undefined)return line;
  return headerText+'||'+JSON.stringify(next)+(terminated?'|':'');
 }).join('');
}
