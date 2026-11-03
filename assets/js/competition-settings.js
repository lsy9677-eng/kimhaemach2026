export function mergeCompetitionSettings(previous={},patch={},teamCount=0,organization='kimhae'){
 const next={...previous,...patch};
 if(!['group_knockout','roundrobin','knockout'].includes(next.format))throw new Error('경기 방식을 확인하세요.');
 next.grpSize=Math.max(2,Number(next.grpSize)||4);next.advance=Math.max(1,Number(next.advance)||1);
 if(next.format==='roundrobin'){
  if(teamCount<2)throw new Error('풀리그는 최소 2팀이 필요합니다.');
  next.grpSize=teamCount;next.advance=1;
  next.prelimDrawSettings={...(patch.prelimDrawSettings||previous.prelimDrawSettings||{}),teamCount,groupSizes:[teamCount],advance:1,format:'roundrobin'};
 }else if(patch.prelimDrawSettings){
  next.prelimDrawSettings={...patch.prelimDrawSettings,format:next.format};
 }else if(next.format!==previous.format||next.grpSize!==previous.grpSize||next.advance!==previous.advance){
  next.prelimDrawSettings=null;
 }
 if(organization==='jangyu')next.thirdPlaceMode='shared';
 return next;
}
