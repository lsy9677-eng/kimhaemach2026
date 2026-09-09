'use strict';

/**
 * 김해시테니스협회 온라인 오더 저장 서비스 - Phase 41
 *
 * Firestore API를 직접 호출하지 않는다.
 * app.js의 기존 저장 함수를 callback으로 받아
 * 저장 성공/실패/메모리 롤백 흐름만 담당한다.
 */

export function cloneOrderState(value){
  if(value==null) return value;
  return JSON.parse(JSON.stringify(value));
}

export function restoreObjectInPlace(target,snapshot){
  if(!target || !snapshot) return target;
  Object.keys(target).forEach(k=>{
    if(!(k in snapshot)){
      try{ delete target[k]; }catch(e){}
    }
  });
  Object.entries(snapshot).forEach(([k,v])=>{ target[k]=v; });
  return target;
}

export function restoreArrayInPlace(target,snapshot){
  if(!Array.isArray(target) || !Array.isArray(snapshot)) return target;
  target.splice(0,target.length,...cloneOrderState(snapshot));
  return target;
}

export async function commitOrderSubmission({
  key='',
  match=null,
  matchSnapshot=null,
  persistMatch,
  setLoading,
  afterPersist,
  getSuccessMessage,
  closeModal,
  notify,
  render,
  failurePrefix='저장 실패: '
}={}){
  if(!match) return {ok:false,error:new Error('match missing')};
  if(typeof persistMatch!=='function') return {ok:false,error:new Error('persistMatch missing')};

  try{
    if(typeof setLoading==='function') setLoading(true);
    await persistMatch(key,match);

    if(typeof afterPersist==='function') await afterPersist();

    if(typeof setLoading==='function') setLoading(false);
    const msg=typeof getSuccessMessage==='function' ? getSuccessMessage() : '오더 제출 완료 ✅';
    if(typeof notify==='function') notify(msg,'success');
    if(typeof closeModal==='function') closeModal();
    if(typeof render==='function') render();

    return {ok:true,error:null};
  }catch(error){
    restoreObjectInPlace(match,matchSnapshot);
    if(typeof setLoading==='function') setLoading(false);
    if(typeof notify==='function') notify(failurePrefix+(error?.message||String(error)),'error');
    if(typeof render==='function') render();
    return {ok:false,error};
  }
}

export async function commitOrderReset({
  matchList=null,
  matchListSnapshot=null,
  drawsStore=null,
  drawKey='',
  drawSnapshot=null,
  playersStore=null,
  playerSnapshot=null,
  persistRestoredPlayers=null,
  prelimToggleStore=null,
  prelimToggleKey='',
  prelimToggleSnapshot=null,
  saveMatches,
  saveDraw,
  hasDraw=false,
  setLoading,
  afterSuccess,
  notify,
  successMessage='초기화 완료 ✅',
  render,
  renderPlayers,
  updateClubHome,
  failurePrefix='해제 실패: '
}={}){
  if(!Array.isArray(matchList)) return {ok:false,error:new Error('matchList missing')};
  if(typeof saveMatches!=='function') return {ok:false,error:new Error('saveMatches missing')};

  try{
    if(typeof setLoading==='function') setLoading(true);
    await saveMatches();

    if(hasDraw && typeof saveDraw==='function'){
      await saveDraw();
    }

    if(typeof setLoading==='function') setLoading(false);
    if(typeof afterSuccess==='function') afterSuccess();
    if(typeof notify==='function') notify(successMessage,'success');
    if(typeof render==='function') render();
    if(typeof renderPlayers==='function') renderPlayers();
    if(typeof updateClubHome==='function') updateClubHome();

    return {ok:true,error:null};
  }catch(error){
    restoreArrayInPlace(matchList,matchListSnapshot);

    if(drawsStore && drawKey){
      if(drawSnapshot==null){
        try{ delete drawsStore[drawKey]; }catch(e){}
      }else{
        drawsStore[drawKey]=cloneOrderState(drawSnapshot);
      }
    }

    const restoredPlayerKeys=restoreOrderResetPlayerSnapshot(playersStore,playerSnapshot);
    if(restoredPlayerKeys.length && typeof persistRestoredPlayers==='function'){
      try{ await persistRestoredPlayers(restoredPlayerKeys); }catch(recoveryError){
        console.error('[order-reset] player stat recovery persist failed',recoveryError);
      }
    }

    if(prelimToggleStore && prelimToggleKey){
      restoreBooleanMapEntry(prelimToggleStore,prelimToggleKey,prelimToggleSnapshot);
    }

    if(typeof setLoading==='function') setLoading(false);
    if(typeof notify==='function') notify(failurePrefix+(error?.message||String(error)),'error');
    if(typeof render==='function') render();
    if(typeof renderPlayers==='function') renderPlayers();
    if(typeof updateClubHome==='function') updateClubHome();

    return {ok:false,error,restoredPlayerKeys};
  }
}


export function createOrderResetPlayerSnapshot(playersStore,keys){
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

export function restoreOrderResetPlayerSnapshot(playersStore,snapshot){
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

export function snapshotBooleanMapEntry(store,key){
  if(!store || !Object.prototype.hasOwnProperty.call(store,key)){
    return {exists:false,value:undefined};
  }
  return {exists:true,value:!!store[key]};
}

export function restoreBooleanMapEntry(store,key,snapshot){
  if(!store || !snapshot) return;
  if(snapshot.exists) store[key]=!!snapshot.value;
  else{
    try{ delete store[key]; }catch(e){}
  }
}
