export function selectLowestEliminatedTeam(rows,decision=null){
 const fingerprint=JSON.stringify(rows.map(r=>({id:r.id,w:r.w,setDiff:r.setDiff,gameDiff:r.gameDiff,setsReady:r.setsReady,gamesReady:r.gamesReady,players:r.players})).sort((a,b)=>String(a.id).localeCompare(String(b.id))));
 if(!rows.length)return {status:'none',candidates:[],fingerprint};
 if(rows.some(r=>!r.setsReady))return {status:'missing',candidates:rows,fingerprint};
 let candidates=rows.filter(r=>r.w===Math.min(...rows.map(x=>x.w)));
 candidates=candidates.filter(r=>r.setDiff===Math.min(...candidates.map(x=>x.setDiff)));
 if(candidates.length>1){
  if(candidates.some(r=>!r.gamesReady))return {status:'missing',candidates,fingerprint};
  candidates=candidates.filter(r=>r.gameDiff===Math.min(...candidates.map(x=>x.gameDiff)));
 }
 if(candidates.length===1)return {status:'selected',team:candidates[0],candidates,fingerprint};
 const chosen=decision?.fingerprint===fingerprint?candidates.find(r=>r.id===decision.teamId):null;
 return {status:chosen?'selected':'tie',team:chosen||null,candidates,fingerprint};
}
