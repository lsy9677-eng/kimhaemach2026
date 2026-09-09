'use strict';

/**
 * 김해시테니스협회 오더 선수선택/복식순서 순수 계산 - Phase 43
 * DOM/Firebase를 직접 건드리지 않는다.
 */

export const GHOST_ORDER='__GHOST__';

export function normalizePair(arr){
  const a=Array.isArray(arr)?arr.filter(Boolean):[];
  if(a[0]===GHOST_ORDER) return [GHOST_ORDER];
  return a.slice(0,2);
}

export function normalizeTapSlots(slots,doublesCount){
  const dbl=Math.max(0,Number(doublesCount||0));
  return Array.from({length:dbl},(_,i)=>normalizePair(slots?.[i]||[]));
}

export function findNextTapCursor(slots,startIndex=0){
  const list=Array.isArray(slots)?slots:[];
  let idx=Math.max(0,Number(startIndex||0));
  while(idx<list.length){
    const pair=normalizePair(list[idx]);
    if(pair[0]!==GHOST_ORDER && pair.length<2) return idx;
    idx++;
  }
  return Math.max(0,list.length-1);
}

export function getTapUsedPlayers(slots){
  const out=[];
  (slots||[]).forEach(arr=>{
    normalizePair(arr).forEach(p=>{
      if(p && p!==GHOST_ORDER && !out.includes(p)) out.push(p);
    });
  });
  return out;
}

export function toggleTapPlayer(slots,cursor,player){
  const next=normalizeTapSlots(slots,slots?.length||0);
  const idx=Math.max(0,Math.min(next.length-1,Number(cursor||0)));
  if(!next.length) return {slots:next,cursor:0};

  let pair=normalizePair(next[idx]);
  if(pair[0]===GHOST_ORDER) pair=[];

  if(pair.includes(player)){
    pair=pair.filter(x=>x!==player);
  }else if(pair.length<2){
    pair=[...pair,player];
  }
  next[idx]=normalizePair(pair);

  let nextCursor=idx;
  if(next[idx].length>=2){
    const candidate=findNextTapCursor(next,idx+1);
    if(candidate>idx && candidate<next.length) nextCursor=candidate;
  }
  return {slots:next,cursor:nextCursor};
}

export function setTapGhost(slots,cursor){
  const next=normalizeTapSlots(slots,slots?.length||0);
  const idx=Math.max(0,Math.min(next.length-1,Number(cursor||0)));
  if(!next.length) return {slots:next,cursor:0};
  next[idx]=[GHOST_ORDER];

  const candidate=findNextTapCursor(next,idx+1);
  return {
    slots:next,
    cursor:(candidate>idx && candidate<next.length)?candidate:idx
  };
}

export function backspaceTapSlot(slots,cursor){
  const next=normalizeTapSlots(slots,slots?.length||0);
  let idx=Math.max(0,Math.min(next.length-1,Number(cursor||0)));
  if(!next.length) return {slots:next,cursor:0};

  if(next[idx].length){
    next[idx]=next[idx].slice(0,-1);
    return {slots:next,cursor:idx};
  }
  while(idx>0){
    idx--;
    if(next[idx].length){
      next[idx]=next[idx].slice(0,-1);
      break;
    }
  }
  return {slots:next,cursor:idx};
}

export function resetTapSlots(doublesCount){
  return Array.from({length:Math.max(0,Number(doublesCount||0))},()=>[]);
}

export function buildReorderSlots(side1Slots,side2Slots,doublesCount){
  const dbl=Math.max(0,Number(doublesCount||0));
  return Array.from({length:dbl},(_,r)=>({
    r,
    p1:normalizePair(side1Slots?.[r]||[]),
    p2:normalizePair(side2Slots?.[r]||[]),
    label:`${r+1}복식`
  }));
}

export function toggleReorderPick(picked,index,total){
  const max=Math.max(0,Number(total||0));
  const idx=Number(index);
  const next=[...(picked||[])];
  const pos=next.indexOf(idx);
  if(pos>=0) next.splice(pos,1);
  else if(idx>=0 && idx<max && next.length<max) next.push(idx);
  return next;
}

export function applyReorderPlan(side1Slots,side2Slots,picked,side=0){
  const s1=(side1Slots||[]).map(normalizePair);
  const s2=(side2Slots||[]).map(normalizePair);
  const order=[...(picked||[])];
  if(order.length!==Math.max(s1.length,s2.length)){
    return {ok:false,side1:s1,side2:s2};
  }

  const out1=s1.map(x=>[...x]);
  const out2=s2.map(x=>[...x]);
  order.forEach((origIdx,newR)=>{
    if(!side || Number(side)===1) out1[newR]=normalizePair(s1[origIdx]||[]);
    if(!side || Number(side)===2) out2[newR]=normalizePair(s2[origIdx]||[]);
  });
  return {ok:true,side1:out1,side2:out2};
}

export function getGhostScorePlan(pair1,pair2,previousRubber={},currentScore1='',currentScore2=''){
  const p1=normalizePair(pair1);
  const p2=normalizePair(pair2);
  const ghost1=p1[0]===GHOST_ORDER;
  const ghost2=p2[0]===GHOST_ORDER;

  if(ghost1 && !ghost2) return {action:'set',score1:0,score2:6};
  if(!ghost1 && ghost2) return {action:'set',score1:6,score2:0};
  if(ghost1 && ghost2) return {action:'clear'};

  const prevGhost1=!!previousRubber?.blankOrder1;
  const prevGhost2=!!previousRubber?.blankOrder2;
  const looksAutoScore=(String(currentScore1)==='0'&&String(currentScore2)==='6') ||
                       (String(currentScore1)==='6'&&String(currentScore2)==='0');
  if(prevGhost1 || prevGhost2 || looksAutoScore) return {action:'clear'};
  return {action:'keep'};
}
