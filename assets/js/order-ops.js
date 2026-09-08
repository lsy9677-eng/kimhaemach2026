'use strict';

/**
 * 김해시테니스협회 온라인 오더 제출/초기화 순수 계산 - Phase 39
 * DOM/Firebase를 직접 건드리지 않는다.
 */

export function getBlankRubberNumbers(payloads){
  const out=[];
  (payloads||[]).forEach(payload=>{
    (payload?.rubbers||[]).forEach((rb,idx)=>{
      const len=(rb?.players||[]).length;
      if(len===0 || rb?.blankOrder) out.push(idx+1);
    });
  });
  return [...new Set(out)].sort((a,b)=>a-b);
}

export function getBlankRubberLabel(numbers){
  return [...new Set((numbers||[]).map(Number).filter(n=>n>0))]
    .sort((a,b)=>a-b)
    .map(n=>`${n}복식`)
    .join(', ');
}

export function validateOrderRubbers(payloads,{admin=false}={}){
  for(const payload of (payloads||[])){
    for(let r=0;r<(payload?.rubbers||[]).length;r++){
      const rb=payload.rubbers[r]||{};
      const len=(rb.players||[]).length;
      const blank=!!rb.blankOrder;
      if(!((blank && len===0) || len===2)){
        return {
          ok:false,
          rubberNo:r+1,
          message:`${r+1}복식은 ${admin?'양팀 모두 ':''}선수 2명을 선택하거나 비워서 공오더로 제출해야 합니다`
        };
      }
    }
  }
  return {ok:true,rubberNo:0,message:''};
}

export function normalizeOrderPayloadsForSave(payloads){
  return (payloads||[]).map(payload=>({
    ...payload,
    rubbers:(payload?.rubbers||[]).map(rb=>{
      const players=[...(rb?.players||[])];
      return {
        ...rb,
        players,
        blankOrder:(!!rb?.blankOrder || players.length===0)
      };
    })
  }));
}

export function applyOrderSubmissions(match,payloads,{
  nowIso='',
  submittedBy=''
}={}){
  if(!match) return match;
  if(!match.orderSubmissions || typeof match.orderSubmissions!=='object'){
    match.orderSubmissions={};
  }

  (payloads||[]).forEach(payload=>{
    const base=String(payload?.base||'').trim();
    if(!base) return;
    match.orderSubmissions[base]={
      club:payload?.club||base,
      side:payload?.side,
      submittedAt:String(nowIso||''),
      rubbers:(payload?.rubbers||[]).map(rb=>({
        players:[...(rb?.players||[])],
        blankOrder:!!rb?.blankOrder
      }))
    };
  });

  match.orderSubmitted=true;
  match.orderSubmittedAt=String(nowIso||'');
  match.orderSubmittedBy=String(submittedBy||'');
  return match;
}

export function clearOnlineOrderSubmissionState(match){
  if(!match) return match;
  match.orderSubmitted=false;
  match.orderSubmittedAt='';
  match.orderSubmittedBy='';
  match.orderSubmissions={};
  match.orderRevealed=false;
  match.orderRevealedAt='';
  return match;
}

export function resetMatchOrderResultState(match,{nowIso=''}={}){
  if(!match) return match;
  match.rubbers=[];
  match.winner=null;
  match.orderResultResetAt=String(nowIso||'');
  return match;
}

export function buildSubmitSuccessMessage({
  bothSubmitted=false,
  submittedOneSide=false,
  submittedTeamName='',
  operator=false
}={}){
  if(bothSubmitted){
    return '양팀 제출 완료 — 오더가 자동 공개되었고 이제 수정할 수 없습니다 ✅';
  }
  if(submittedOneSide){
    return `${submittedTeamName||'선택 팀'} 한팀 제출 완료 — 상대팀 제출 시 자동 공개됩니다 ✅`;
  }
  if(operator){
    return '미제출 팀 대리제출 완료 — 상대/나머지 팀 제출 시 자동 공개됩니다 ✅';
  }
  return '내 클럽 오더 제출 완료 — 상대 제출 시 자동 공개됩니다 ✅';
}

export function buildUnlockSuccessMessage({phase=''}={}){
  return phase==='group'
    ? '초기화 완료 ✅ 예선 결과가 초기화되어 본선 대진과 현황도 함께 초기화되었습니다'
    : '초기화 완료 ✅ 오더와 경기 결과가 함께 초기화되어 원래 상태로 돌아갔습니다';
}
