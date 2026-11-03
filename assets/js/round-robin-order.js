export function sameClubMatch(match,teams,tokens){
 const first=new Set((tokens(teams?.[match.t1]||{})||[]).filter(Boolean));
 return (tokens(teams?.[match.t2]||{})||[]).some(club=>club&&first.has(club));
}
export function prioritizeSameClubMatches(matches,teams,tokens){
 const ordered=[...(matches||[])].sort((a,b)=>{
  const priority=Number(sameClubMatch(b,teams,tokens))-Number(sameClubMatch(a,teams,tokens));
  if(priority)return priority;
  if(Number.isFinite(a.leagueOrder)&&Number.isFinite(b.leagueOrder)&&a.leagueOrder!==b.leagueOrder)return a.leagueOrder-b.leagueOrder;
  return String(a.id||'').localeCompare(String(b.id||''),'ko',{numeric:true});
 });
 const participants=[...new Set(ordered.flatMap(m=>[String(m.t1),String(m.t2)]))];
 // Four teams play complementary pairs in each round: AB/CD, AC/BD, AD/BC.
 if(participants.length===4&&ordered.length===6){
  const first=ordered[0],a=String(first.t1),b=String(first.t2);
  const [c,d]=participants.filter(id=>id!==a&&id!==b).sort((x,y)=>x.localeCompare(y,'ko',{numeric:true}));
  const pairs=[[a,b],[c,d],[a,c],[b,d],[a,d],[b,c]];
  const schedule=pairs.map(([x,y])=>ordered.find(m=>(String(m.t1)===x&&String(m.t2)===y)||(String(m.t1)===y&&String(m.t2)===x)));
  if(schedule.every(Boolean)&&new Set(schedule).size===6)return schedule;
 }
 return ordered;
}
