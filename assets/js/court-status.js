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
