'use strict';
function isMainPhase(phase=''){return String(phase||'').toLowerCase()==='main';}
export function getSimpleResultOptions(totalRubbers=5,phase='prelim'){
  const total=Math.max(1,Number(totalRubbers)||5),need=Math.floor(total/2)+1,out=[];
  if(!isMainPhase(phase)){
    for(let s1=total;s1>=0;s1--){const s2=total-s1;if(s1===s2)continue;out.push({score1:s1,score2:s2,winnerSide:s1>s2?1:2,label:`${s1}:${s2}`});}
    return out;
  }
  // 본선은 승부가 결정되면 잔여 경기를 중단할 수 있다. 종료 시점의 유효 결과를 모두 허용한다.
  for(let loser=0;loser<need;loser++){
    out.push({score1:need,score2:loser,winnerSide:1,label:`${need}:${loser}`});
    out.push({score1:loser,score2:need,winnerSide:2,label:`${loser}:${need}`});
  }
  return out;
}
export function normalizeSimpleResult(result,totalRubbers=5,phase='prelim'){
  if(!result||typeof result!=='object')return null;
  const total=Math.max(1,Number(totalRubbers)||5),need=Math.floor(total/2)+1,s1=Number(result.score1),s2=Number(result.score2);
  if(!Number.isInteger(s1)||!Number.isInteger(s2)||s1<0||s2<0||s1===s2)return null;
  if(isMainPhase(phase)){
    if(!((s1===need&&s2<need)||(s2===need&&s1<need)))return null;
  }else if(s1+s2!==total)return null;
  return{score1:s1,score2:s2,winnerSide:s1>s2?1:2};
}
export function getSimpleResultWinnerTeam(result,t1,t2,totalRubbers=5,phase='prelim'){const r=normalizeSimpleResult(result,totalRubbers,phase);return!r?null:(r.winnerSide===1?t1:t2);}
export function buildSimpleResultRecord(result,totalRubbers=5,actor='',phase='prelim'){const r=normalizeSimpleResult(result,totalRubbers,phase);return!r?null:{...r,phase:String(phase||'prelim'),confirmed:true,confirmedAt:new Date().toISOString(),confirmedBy:String(actor||'').trim()};}
