'use strict';

/**
 * 김해시테니스협회 코트 공통 유틸 - Phase 20
 *
 * 현재 단계에서는 Firebase/DOM/전역상태를 직접 건드리지 않고
 * 코트군 정규화·확장·목록 생성 같은 부작용 없는 로직만 담당한다.
 */

export function normalizeCourtGroups(raw){
  return (Array.isArray(raw)?raw:[]).map(g=>{
    const name=String(g?.name||g?.title||'').trim();
    const count=Math.max(1, parseInt(g?.count||g?.courts?.length||0)||0);
    if(!name || !count) return null;
    return {name,count};
  }).filter(Boolean);
}

export function expandCourtGroups(groups){
  return normalizeCourtGroups(groups).map(g=>({
    title:g.name,
    courts:Array.from({length:g.count},(_,i)=>`${g.name}${i+1}`)
  }));
}

export function buildCourtList(groups){
  return expandCourtGroups(groups)
    .flatMap(g=>g.courts||[])
    .map(String)
    .filter(Boolean);
}

export function uniqueCourtList(list){
  return [...new Set((list||[]).map(String).filter(Boolean))];
}

export function getCourtGroupCount(groups){
  return normalizeCourtGroups(groups).reduce((sum,g)=>sum+g.count,0);
}


export function resolveAllowedCourts({
  divisionCourts=[],
  drawCourts=[],
  tournamentCourts=[]
}){
  const div=uniqueCourtList(divisionCourts);
  if(div.length) return div;

  const draw=uniqueCourtList(drawCourts);
  if(draw.length) return draw;

  return uniqueCourtList(tournamentCourts);
}

export function buildCourtShareMap(groups){
  const out={};
  (Array.isArray(groups)?groups:[]).forEach((grp,gi)=>{
    (Array.isArray(grp?.courts)?grp.courts:[]).forEach(c=>{
      const cc=String(c||'').trim();
      if(!cc) return;
      if(!out[cc]) out[cc]=[];
      out[cc].push(gi);
    });
  });
  return out;
}

export function getCourtShareLevel(count){
  const n=Number(count||0);
  if(n>=3) return 'danger';
  if(n===2) return 'warning';
  if(n===1) return 'normal';
  return 'none';
}

export function getCourtShareSummary(groups){
  const map=buildCourtShareMap(groups);
  const rows=Object.entries(map).map(([court,groupIndexes])=>({
    court,
    groupIndexes:[...groupIndexes],
    count:groupIndexes.length,
    level:getCourtShareLevel(groupIndexes.length)
  }));

  rows.sort((a,b)=>{
    if(b.count!==a.count) return b.count-a.count;
    return a.court.localeCompare(b.court,'ko',{numeric:true});
  });

  return {
    rows,
    shared:rows.filter(x=>x.count>=2),
    overloaded:rows.filter(x=>x.count>=3),
    totalCourts:rows.length
  };
}
