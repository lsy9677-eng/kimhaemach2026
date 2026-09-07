'use strict';

/**
 * 김해시테니스협회 코트 현황판 계산 유틸 - Phase 22
 *
 * DOM/Firebase/전역 상태를 직접 건드리지 않는다.
 * 코트대기 표시 제한과 현황 집계처럼 순수 계산만 담당한다.
 */

export function getCourtBoardDisplayLimitsForMatch(match){
  const phase=String(match?.phase||'');
  if(phase==='main' || phase==='playin'){
    return {bucket:'main',limit:1};
  }
  return {bucket:'group',limit:Number.POSITIVE_INFINITY};
}

export function splitCourtWaitingByDisplayLimit(waiting){
  const list=[...(waiting||[])];
  const visible=[];
  const overflow=[];
  const counts={group:0,main:0};

  list.forEach(match=>{
    const cfg=getCourtBoardDisplayLimitsForMatch(match);
    const current=counts[cfg.bucket]||0;
    if(current < cfg.limit){
      counts[cfg.bucket]=current+1;
      visible.push(match);
    }else{
      overflow.push(match);
    }
  });

  return {visible,overflow,counts};
}

export function getCourtBoardStatusCounts(items){
  const rows=Array.isArray(items)?items:[];
  let live=0;
  let waiting=0;
  let empty=0;

  rows.forEach(item=>{
    if(item?.current) live++;
    waiting += Array.isArray(item?.waiting)?item.waiting.length:0;
    if(!item?.current && !(item?.waiting||[]).length) empty++;
  });

  return {
    total:rows.length,
    live,
    waiting,
    empty
  };
}


export function sortCourtWaitingByPriority(waiting){
  return [...(waiting||[])].sort((a,b)=>{
    const ap=Number(a?.queuePriority ?? a?.priority ?? 999999);
    const bp=Number(b?.queuePriority ?? b?.priority ?? 999999);
    if(ap!==bp) return ap-bp;
    const at=String(a?.courtAssignedAt||a?.waitingFirstAt||a?.queuedAt||a?.createdAt||'');
    const bt=String(b?.courtAssignedAt||b?.waitingFirstAt||b?.queuedAt||b?.createdAt||'');
    return at.localeCompare(bt);
  });
}

export function getCourtQueueDisplayState(waiting){
  const sorted=sortCourtWaitingByPriority(waiting);
  const split=splitCourtWaitingByDisplayLimit(sorted);
  return {
    sorted,
    visible:split.visible,
    overflow:split.overflow,
    visibleCount:split.visible.length,
    overflowCount:split.overflow.length
  };
}

export function getCourtBoardItemState(item){
  const waitingState=getCourtQueueDisplayState(item?.waiting||[]);
  return {
    court:String(item?.court||''),
    hasCurrent:!!item?.current,
    current:item?.current||null,
    waiting:waitingState.sorted,
    visibleWaiting:waitingState.visible,
    overflowWaiting:waitingState.overflow,
    waitingCount:waitingState.sorted.length,
    overflowCount:waitingState.overflowCount,
    isEmpty:!item?.current && waitingState.sorted.length===0
  };
}
