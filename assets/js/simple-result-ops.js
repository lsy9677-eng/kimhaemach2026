'use strict';
export function getSimpleResultOptions(totalRubbers=5){
  const total=Math.max(1,Number(totalRubbers)||5),out=[];
  for(let s1=total;s1>=0;s1--){
    const s2=total-s1;
    if(s1===s2) continue;
    out.push({score1:s1,score2:s2,winnerSide:s1>s2?1:2,label:`${s1}:${s2}`});
  }
  return out;
}
export function normalizeSimpleResult(result,totalRubbers=5){
  if(!result||typeof result!=='object')return null;
  const total=Math.max(1,Number(totalRubbers)||5),s1=Number(result.score1),s2=Number(result.score2);
  if(!Number.isInteger(s1)||!Number.isInteger(s2)||s1<0||s2<0||s1+s2!==total||s1===s2)return null;
  return{score1:s1,score2:s2,winnerSide:s1>s2?1:2};
}
export function getSimpleResultWinnerTeam(result,t1,t2,totalRubbers=5){const r=normalizeSimpleResult(result,totalRubbers);return!r?null:(r.winnerSide===1?t1:t2);}
export function buildSimpleResultRecord(result,totalRubbers=5,actor=''){const r=normalizeSimpleResult(result,totalRubbers);return!r?null:{...r,confirmed:true,confirmedAt:new Date().toISOString(),confirmedBy:String(actor||'').trim()};}
