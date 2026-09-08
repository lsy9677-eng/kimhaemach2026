'use strict';

/**
 * 김해시테니스협회 코트 이동 저장 서비스 - Phase 32
 *
 * 실제 Firebase API 자체는 app.js의 기존 persistSingleMatchDoc()을 그대로 사용한다.
 * 이 모듈은 "저장 시도 -> 성공 후 알림/렌더 -> 실패 시 메모리 롤백" 흐름만 담당한다.
 * 데이터 구조/Firestore 경로/문서 ID 정책은 변경하지 않는다.
 */

export function cloneMatchForRollback(match){
  if(!match) return null;
  return JSON.parse(JSON.stringify(match));
}

export function restoreMatchFromSnapshot(target, snapshot){
  if(!target || !snapshot) return target;

  // 현재 객체 참조는 유지하고 속성만 원복한다.
  Object.keys(target).forEach(k=>{
    if(!(k in snapshot)){
      try{ delete target[k]; }catch(e){}
    }
  });
  Object.entries(snapshot).forEach(([k,v])=>{
    target[k]=v;
  });
  return target;
}

export async function commitCourtMove({
  key='',
  match=null,
  snapshot=null,
  persistMatch,
  setLoading,
  dispatchAlerts,
  previousNotificationState=null,
  render,
  notify,
  successMessage='코트 이동 완료 ✅',
  failurePrefix='이동 저장 실패: '
}={}){
  if(!match) return {ok:false,error:new Error('match missing')};
  if(typeof persistMatch!=='function') return {ok:false,error:new Error('persistMatch missing')};

  try{
    if(typeof setLoading==='function') setLoading(true);

    await persistMatch(key,match);

    if(typeof setLoading==='function') setLoading(false);
    if(typeof dispatchAlerts==='function'){
      try{ dispatchAlerts(previousNotificationState); }catch(e){}
    }
    if(typeof notify==='function'){
      try{ notify(successMessage,'success'); }catch(e){}
    }
    if(typeof render==='function'){
      try{ render(); }catch(e){}
    }

    return {ok:true,error:null};
  }catch(error){
    restoreMatchFromSnapshot(match,snapshot);

    if(typeof setLoading==='function') setLoading(false);
    if(typeof notify==='function'){
      try{ notify(failurePrefix+(error?.message||String(error)),'error'); }catch(e){}
    }
    if(typeof render==='function'){
      try{ render(); }catch(e){}
    }

    return {ok:false,error};
  }
}
