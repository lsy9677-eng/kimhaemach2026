'use strict';

/**
 * 김해시테니스협회 코트 이동/대기열 순수 계산 유틸 - Phase 28
 *
 * Firebase/DOM/전역상태를 직접 건드리지 않는다.
 * 실제 저장 전 검증과 patch 계산만 담당한다.
 */

export function normalizeCourtTarget(targetCourt){
  return String(targetCourt||'').trim();
}

export function validateCourtMoveTarget({
  targetCourt='',
  allowedCourts=[]
}={}){
  const court=normalizeCourtTarget(targetCourt);
  const allowed=[...(allowedCourts||[])].map(String).filter(Boolean);
  if(court && allowed.length && !allowed.includes(court)){
    return {
      ok:false,
      court,
      error:'현재 선택한 운영 코트 안에서만 이동할 수 있습니다'
    };
  }
  return {ok:true,court,error:''};
}

export function buildManualCourtMoveMeta({
  targetCourt='',
  nowIso=''
}={}){
  const court=normalizeCourtTarget(targetCourt);
  const stamp=String(nowIso||'');
  return court
    ? {
        set:{
          manualCourtTarget:court,
          manualSharedHold:false,
          manualCourtPinnedAt:stamp
        },
        del:[]
      }
    : {
        set:{
          manualCourtTarget:'',
          manualSharedHold:true,
          manualCourtPinnedAt:stamp
        },
        del:[]
      };
}

export function hasEarlierMatchOnCourt({
  matches=[],
  matchId='',
  targetCourt='',
  assignedAt=''
}={}){
  const court=normalizeCourtTarget(targetCourt);
  if(!court) return false;
  const mid=String(matchId||'');
  const currentAssigned=String(assignedAt||'');

  return (matches||[]).some(x=>{
    if(!x || x.winner!=null || String(x.id)===mid) return false;
    const courts=Array.isArray(x.courts)?x.courts:[x.court||''];
    if(!courts.map(String).includes(court)) return false;
    const order=String(x.courtQueueOrder||x.courtAssignedAt||'');
    return order < currentAssigned;
  });
}

export function buildTeamCourtMovePatch({
  matches=[],
  match={},
  targetCourt='',
  nowIso=''
}={}){
  const court=normalizeCourtTarget(targetCourt);
  const stamp=String(nowIso||'');
  const prevCourt=String(match?.court||'').trim();

  if(!court){
    return {
      court:'',
      set:{
        courts:[],
        court:''
      },
      del:['courtAssignedAt','waitingFirstAt']
    };
  }

  const isNewCourt=prevCourt!==court;
  const courtAssignedAt=(!match?.courtAssignedAt || isNewCourt)
    ? stamp
    : String(match.courtAssignedAt);

  const earlier=hasEarlierMatchOnCourt({
    matches,
    matchId:match?.id,
    targetCourt:court,
    assignedAt:courtAssignedAt
  });

  const set={
    courts:[court],
    court,
    courtAssignedAt
  };
  const del=[];

  if(earlier){
    set.waitingFirstAt=String(match?.waitingFirstAt||stamp);
  }else{
    del.push('waitingFirstAt');
  }

  return {court,set,del};
}

export function applyCourtMovePatch(match, patch){
  if(!match || !patch) return match;
  Object.entries(patch.set||{}).forEach(([k,v])=>{ match[k]=v; });
  (patch.del||[]).forEach(k=>{ try{ delete match[k]; }catch(e){} });
  return match;
}

export function buildCourtMoveOptions(allowedCourts=[]){
  return [...new Set((allowedCourts||[]).map(String).filter(Boolean))]
    .map(c=>({value:c,label:`🎾 ${c}`}));
}
