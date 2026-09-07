'use strict';

/**
 * 김해시테니스협회 코트 현황판 UI 렌더러 - Phase 23
 * DOM/Firebase를 직접 건드리지 않고 카드/상태 HTML만 생성한다.
 */

export function buildCourtStatusSummaryHtml({
  total=0,
  live=0,
  waiting=0,
  empty=0
}){
  return `<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:10px">
    <div style="padding:8px 10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;text-align:center">
      <div style="font-size:.66rem;color:#1d4ed8;font-weight:700">전체 코트</div>
      <div style="font-size:1.05rem;font-weight:900;color:#1e3a8a">${total}</div>
    </div>
    <div style="padding:8px 10px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:9px;text-align:center">
      <div style="font-size:.66rem;color:#047857;font-weight:700">경기중</div>
      <div style="font-size:1.05rem;font-weight:900;color:#065f46">${live}</div>
    </div>
    <div style="padding:8px 10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:9px;text-align:center">
      <div style="font-size:.66rem;color:#c2410c;font-weight:700">대기</div>
      <div style="font-size:1.05rem;font-weight:900;color:#9a3412">${waiting}</div>
    </div>
    <div style="padding:8px 10px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:9px;text-align:center">
      <div style="font-size:.66rem;color:#475569;font-weight:700">빈 코트</div>
      <div style="font-size:1.05rem;font-weight:900;color:#334155">${empty}</div>
    </div>
  </div>`;
}

export function buildCourtWaitingBadgeHtml(match,{escapeHtml=(x)=>String(x||'')}={}){
  if(!match) return '';
  const phase=String(match.phase||'');
  const round=match.roundLabel||match.round||'';
  const a=match.teamAName||match.teamA||match.a||'';
  const b=match.teamBName||match.teamB||match.b||'';
  const phaseLabel=(phase==='main'||phase==='playin')?'본선':'예선';

  return `<div style="padding:6px 8px;background:#fff;border:1px solid var(--border);border-radius:8px;font-size:.72rem;line-height:1.45">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
      <span style="font-weight:800;color:var(--primary-dark)">${phaseLabel}${round?` · ${escapeHtml(round)}`:''}</span>
      <span style="font-size:.62rem;color:var(--text3)">대기</span>
    </div>
    <div style="margin-top:3px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
      ${escapeHtml(a)} <span style="color:var(--text3);font-weight:500">vs</span> ${escapeHtml(b)}
    </div>
  </div>`;
}

export function buildCourtCardShellHtml({
  court='',
  currentHtml='',
  waitingHtml='',
  overflowCount=0,
  sharedBadgeHtml=''
}){
  return `<div class="court-status-card" data-court="${court}" style="border:1px solid var(--border);border-radius:12px;background:#fff;overflow:hidden;box-shadow:0 1px 6px rgba(15,30,58,.06)">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;background:linear-gradient(90deg,#0f1e3a,#162a4d);color:#fff">
      <div style="font-size:.86rem;font-weight:900">${court}</div>
      <div>${sharedBadgeHtml||''}</div>
    </div>
    <div style="padding:8px 10px">
      ${currentHtml||'<div style="padding:10px;text-align:center;color:var(--text3);font-size:.74rem">현재 경기 없음</div>'}
      ${waitingHtml?`<div style="margin-top:7px;display:flex;flex-direction:column;gap:5px">${waitingHtml}</div>`:''}
      ${overflowCount>0?`<div style="margin-top:6px;padding:5px 7px;background:#f8fafc;border:1px dashed var(--border);border-radius:7px;font-size:.68rem;color:var(--text3);text-align:center">대기 ${overflowCount}경기 더 있음</div>`:''}
    </div>
  </div>`;
}


export function buildCourtBoardHiddenHtml({key='',escapeAttr=(x)=>String(x||'')}={}){
  return `<div style="margin:10px 0 12px;display:flex;justify-content:flex-end">
    <button class="btn btn-outline" style="font-size:.78rem;padding:6px 12px" onclick="toggleCourtBoardHidden('${escapeAttr(key)}')">🎾 코트 현황판 열기</button>
  </div>`;
}

export function buildCourtBoardFrameHtml({
  key='',
  divisionLabel='',
  courtCount=0,
  liveCount=0,
  waitingCount=0,
  sharedWaitingCount=0,
  emptyCount=0,
  collapsed=false,
  sharedWaitingHtml='',
  cardsHtml='',
  escapeAttr=(x)=>String(x||'')
}={}){
  return `<div style="margin:10px 0 12px;border:2px solid #bfdbfe;border-radius:16px;background:linear-gradient(135deg,#f8fbff,#eef6ff);overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:12px 14px;background:rgba(255,255,255,.72);border-bottom:${collapsed?'none':'1px solid #dbe7ff'}">
      <div>
        <div style="font-size:.96rem;font-weight:900;color:var(--primary-dark)">🎾 코트 사용 현황판</div>
        <div style="font-size:.74rem;color:var(--text2);margin-top:4px">${divisionLabel} · 사용 코트 ${courtCount}면 · 진행 ${liveCount} · 코트대기 ${waitingCount} · 공용대기 ${sharedWaitingCount} · 빈코트 ${emptyCount}</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-outline" style="font-size:.74rem;padding:5px 10px;min-height:32px" onclick="toggleCourtBoardCollapsed('${escapeAttr(key)}')">${collapsed?'📂 펼치기':'📁 접기'}</button>
        <button class="btn btn-gray" style="font-size:.74rem;padding:5px 10px;min-height:32px" onclick="toggleCourtBoardHidden('${escapeAttr(key)}')">✕ 닫기</button>
      </div>
    </div>
    <div style="display:${collapsed?'none':'block'};padding:12px 14px">
      ${sharedWaitingHtml||''}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px">${cardsHtml||''}</div>
    </div>
  </div>`;
}
