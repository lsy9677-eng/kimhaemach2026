'use strict';

/**
 * 김해시테니스협회 경기결과 저장 서비스 - Phase 34
 *
 * Firestore API 자체는 기존 app.js의 함수를 그대로 주입받아 사용한다.
 * 저장 순서/문서 경로/autoAdv 정책은 바꾸지 않고,
 * 결과 저장 분기 + 실패 시 메모리 롤백을 담당한다.
 */

export function cloneResultMatchForRollback(match){
  return match ? JSON.parse(JSON.stringify(match)) : null;
}

export function restoreResultMatchFromSnapshot(target,snapshot){
  if(!target || !snapshot) return target;
  Object.keys(target).forEach(k=>{
    if(!(k in snapshot)){
      try{ delete target[k]; }catch(e){}
    }
  });
  Object.entries(snapshot).forEach(([k,v])=>{ target[k]=v; });
  return target;
}

export function createPlayerStatSnapshot(playersStore,keys){
  const out={};
  [...new Set((keys||[]).filter(Boolean))].forEach(k=>{
    const p=playersStore?.[k];
    if(!p) return;
    out[k]={
      wins:Number(p.wins||0),
      losses:Number(p.losses||0)
    };
  });
  return out;
}

export function restorePlayerStatSnapshot(playersStore,snapshot){
  const restored=[];
  Object.entries(snapshot||{}).forEach(([k,v])=>{
    const p=playersStore?.[k];
    if(!p) return;
    p.wins=Number(v.wins||0);
    p.losses=Number(v.losses||0);
    restored.push(k);
  });
  return restored;
}

export async function runResultPersistencePlan({
  hasFinalWinner=false,
  isTieState=false,
  isIndividual=false,
  phase='',
  persistMatch,
  saveAllMatches,
  syncIndividualMain,
  ensureAutoCourtAssignments,
  logFinal,
  logTie,
  logLive,
  autoAdvance
}={}){
  let wroteMatches=false;

  if(hasFinalWinner){
    if(isIndividual){
      const syncedMain=typeof syncIndividualMain==='function'
        ? !!syncIndividualMain()
        : false;
      const autoChanged=typeof ensureAutoCourtAssignments==='function'
        ? !!ensureAutoCourtAssignments()
        : false;

      if(syncedMain || autoChanged){
        if(typeof saveAllMatches==='function') await saveAllMatches();
        wroteMatches=true;
      }
    }

    if(!wroteMatches && phase!=='main'){
      if(typeof persistMatch==='function') await persistMatch();
      wroteMatches=true;
    }

    if(typeof logFinal==='function') await logFinal();

    if(phase==='main'){
      if(typeof autoAdvance==='function') await autoAdvance();
      wroteMatches=true;
    }

    return {wroteMatches,branch:'final'};
  }

  if(isTieState){
    if(!wroteMatches){
      if(typeof persistMatch==='function') await persistMatch();
      wroteMatches=true;
    }
    if(typeof logTie==='function') await logTie();
    return {wroteMatches,branch:'tie'};
  }

  if(!wroteMatches){
    if(typeof persistMatch==='function') await persistMatch();
    wroteMatches=true;
  }
  if(typeof logLive==='function') await logLive();

  return {wroteMatches,branch:'live'};
}

export async function commitMatchResultSave({
  match,
  matchSnapshot,
  playersStore,
  playerSnapshot,
  runPersistence,
  setLoading,
  dispatchAlerts,
  previousNotificationState,
  closeModal,
  notify,
  successMessage='결과 저장 ✅',
  render,
  enqueuePlayerPersist,
  failurePrefix='저장 실패: '
}={}){
  if(!match) return {ok:false,error:new Error('match missing')};
  if(typeof runPersistence!=='function') return {ok:false,error:new Error('runPersistence missing')};

  try{
    if(typeof setLoading==='function') setLoading(true);

    const planResult=await runPersistence();

    if(typeof dispatchAlerts==='function'){
      try{ dispatchAlerts(previousNotificationState); }catch(e){}
    }

    if(typeof setLoading==='function') setLoading(false);
    if(typeof closeModal==='function'){
      try{ closeModal(); }catch(e){}
    }
    if(typeof notify==='function'){
      try{ notify(successMessage,'success'); }catch(e){}
    }
    if(typeof render==='function'){
      try{ render(); }catch(e){}
    }

    return {ok:true,error:null,planResult};
  }catch(error){
    restoreResultMatchFromSnapshot(match,matchSnapshot);
    const restoredKeys=restorePlayerStatSnapshot(playersStore,playerSnapshot);

    // updPS()가 이미 persist queue에 키를 넣었을 수 있으므로
    // 롤백된 현재 값을 다시 같은 키에 예약하여 잘못된 승패가 남지 않게 한다.
    if(restoredKeys.length && typeof enqueuePlayerPersist==='function'){
      try{ enqueuePlayerPersist(restoredKeys,100); }catch(e){}
    }

    if(typeof setLoading==='function') setLoading(false);
    if(typeof notify==='function'){
      try{ notify(failurePrefix+(error?.message||String(error)),'error'); }catch(e){}
    }
    if(typeof render==='function'){
      try{ render(); }catch(e){}
    }

    return {ok:false,error,restoredKeys};
  }
}
