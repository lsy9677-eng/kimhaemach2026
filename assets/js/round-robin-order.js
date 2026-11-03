export function sameClubMatch(match,teams,tokens){
 const first=new Set((tokens(teams?.[match.t1]||{})||[]).filter(Boolean));
 return (tokens(teams?.[match.t2]||{})||[]).some(club=>club&&first.has(club));
}
export function prioritizeSameClubMatches(matches,teams,tokens){
 return [...(matches||[])].sort((a,b)=>{
  const priority=Number(sameClubMatch(b,teams,tokens))-Number(sameClubMatch(a,teams,tokens));
  if(priority)return priority;
  if(Number.isFinite(a.leagueOrder)&&Number.isFinite(b.leagueOrder)&&a.leagueOrder!==b.leagueOrder)return a.leagueOrder-b.leagueOrder;
  return String(a.id||'').localeCompare(String(b.id||''),'ko',{numeric:true});
 });
}
