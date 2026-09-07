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


export function buildCourtCurrentSectionHtml({
  titleHtml='',
  phaseHtml='',
  metaHtml='',
  actionsHtml='',
  empty=false
}={}){
  if(empty){
    return `<div style="font-size:.84rem;font-weight:800;color:#64748b;line-height:1.45">배정된 진행 경기 없음</div>
      <div style="font-size:.74rem;color:var(--text3);margin-top:4px">경기 코트 배정을 하면 이 코트에 표시됩니다.</div>`;
  }
  return `${titleHtml||''}${phaseHtml||''}${metaHtml||''}${actionsHtml||''}`;
}

export function buildCourtWaitingSectionHtml({
  count=0,
  cardsHtml='',
  emptyText='대기중 경기 없음'
}={}){
  if(!count){
    return `<div style="margin-top:10px;padding-top:10px;border-top:1px dashed rgba(148,163,184,.35);font-size:.74rem;color:#64748b">${emptyText}</div>`;
  }
  return `<div style="margin-top:10px;padding-top:10px;border-top:1px dashed #f2c46d">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-bottom:6px">
      <div style="font-size:.76rem;font-weight:900;color:#9a6400">⏳ 코트 대기 ${count}경기</div>
      <div style="font-size:.68rem;color:#9a6400">맨 위 카드가 우선대기</div>
    </div>
    <div class="court-wait-stack">${cardsHtml||''}</div>
  </div>`;
}

export function buildCourtDropZoneHtml({
  key='',
  court='',
  headerBadgeHtml='',
  currentSectionHtml='',
  waitingSectionHtml='',
  borderColor='var(--border)',
  background='#fff',
  escapeAttr=(x)=>String(x||'')
}={}){
  const k=escapeAttr(key);
  const c=escapeAttr(court);
  return `<div class="court-drop-zone" ondragover="onCourtDropOver(event)" ondragleave="onCourtDropLeave(event)" ondrop="onCourtDrop(event,'${k}','${c}')" style="border:1.5px solid ${borderColor};border-radius:14px;padding:12px;background:${background}">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <div style="font-size:.92rem;font-weight:900;color:var(--primary-dark)">🎾 ${court}</div>
      ${headerBadgeHtml||''}
    </div>
    ${currentSectionHtml||''}
    ${waitingSectionHtml||''}
    <div class="court-drop-hint">카드를 이 코트로 드래그하면 현재 경기 뒤 대기열로 들어갑니다.</div>
  </div>`;
}

export function buildNoCourtAssignedHtml(){
  return `<div style="padding:18px 14px;border:1px dashed #bfdbfe;border-radius:14px;background:#fff">
    <div style="font-size:.9rem;font-weight:900;color:var(--primary-dark);margin-bottom:6px">아직 경기 코트 배정이 없습니다</div>
    <div style="font-size:.78rem;color:var(--text2);line-height:1.7">조 코트 배정은 표시용입니다. 실제 코트 현황판은 경기 코트 배정 후 자동 반영됩니다.</div>
  </div>`;
}


export function buildSharedWaitingCardHtml({
  key='',
  matchId='',
  headline='경기 대기',
  detail='공용 대기',
  metaHtml='',
  priority=0,
  theme={},
  elapsedBadgeHtml='',
  manual=false,
  canManage=false,
  targetCourt='',
  escapeHtml=(x)=>String(x||''),
  escapeAttr=(x)=>String(x||'')
}={}){
  const k=escapeAttr(key);
  const id=escapeAttr(matchId);
  const tc=escapeAttr(targetCourt);
  const smsType=targetCourt?'court_changed':'queue_registered';
  const bg=theme?.bg||'#fff';
  const bd=theme?.bd||'var(--border)';
  const fg=theme?.fg||'var(--primary-dark)';

  return `<div class="court-wait-card" draggable="${canManage?'true':'false'}" ondragstart="onCourtCardDragStart(event,'${k}','${id}')" ondragend="onCourtCardDragEnd(event)" style="padding:8px 10px;border-radius:10px;background:${bg};border:2px solid ${bd}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
      <div style="min-width:0;flex:1">
        <div style="font-size:.78rem;font-weight:900;color:${fg};line-height:1.35;word-break:keep-all;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escapeHtml(headline)}</div>
        <div style="font-size:.72rem;color:${fg};margin-top:3px">${escapeHtml(detail)}</div>
        ${metaHtml||''}
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">
          ${canManage?`<button class="btn btn-outline" type="button" style="font-size:.66rem;padding:4px 8px;min-height:28px;white-space:nowrap" onclick="sendCourtCardSms('${k}','${id}','${smsType}','${tc}',${Number(priority||0)})">📨 문자</button>`:''}
          <button class="btn btn-outline" type="button" style="font-size:.66rem;padding:4px 8px;min-height:28px;white-space:nowrap" onclick="showCourtMovePicker('${k}','${id}')">코트 선택</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
        <span class="court-wait-priority">${Number(priority||0)}</span>
        ${elapsedBadgeHtml||''}
        ${manual?'<span class="badge bg-blue" style="font-size:.66rem;padding:3px 7px">수동</span>':''}
      </div>
    </div>
  </div>`;
}

export function buildSharedWaitingSectionHtml({
  key='',
  total=0,
  visibleCount=0,
  hiddenCount=0,
  expanded=false,
  defaultVisibleCount=10,
  cardsHtml='',
  escapeAttr=(x)=>String(x||'')
}={}){
  const k=escapeAttr(key);
  const hasItems=Number(visibleCount||0)>0;
  const showToggle=Number(total||0)>Number(defaultVisibleCount||10);

  return `<div class="court-drop-zone" ondragover="onCourtDropOver(event)" ondragleave="onCourtDropLeave(event)" ondrop="onCourtDrop(event,'${k}','')" style="margin-bottom:12px;padding:12px 14px;border:1px solid #f6d28b;border-radius:14px;background:#fff8e8">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <div style="font-size:.84rem;font-weight:900;color:#9a6400">⏳ 공용대기 ${Number(total||0)}경기</div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <div style="font-size:.7rem;color:#9a6400">위 카드가 우선순위 1번</div>
        ${showToggle?`<button class="btn btn-outline" type="button" style="font-size:.68rem;padding:4px 9px;min-height:28px;border-color:#e8b353;color:#9a6400;background:#fff7df" onclick="toggleCourtBoardSharedExpanded('${k}')">${expanded?`접기 (${Number(total||0)})`:`더보기 +${Number(hiddenCount||0)}`}</button>`:''}
      </div>
    </div>
    ${hasItems
      ? `<div class="shared-wait-stack">${cardsHtml||''}</div>${Number(hiddenCount||0)>0?`<div style="margin-top:8px;font-size:.74rem;color:#9a6400;font-weight:700">아래 더보기로 나머지 ${Number(hiddenCount||0)}경기 확인</div>`:''}`
      : `<div style="padding:10px 12px;border:1px dashed #f6d28b;border-radius:10px;background:#fff;font-size:.78rem;color:#9a6400">여기로 카드를 옮기면 공용 대기 상태로 유지됩니다.</div>`}
    <div class="court-drop-hint">카드를 각 코트로 드래그하거나, 코트 선택 버튼으로 수동 배정할 수 있습니다. 코트에서 다시 이 영역으로 드래그하거나 공용 대기를 선택하면 복귀합니다.</div>
  </div>`;
}


export function buildCourtWaitingItemHtml({
  key='',
  matchId='',
  title='경기 대기',
  label='',
  metaHtml='',
  priority=0,
  theme={},
  elapsedBadgeHtml='',
  manual=false,
  canManage=false,
  targetCourt='',
  escapeHtml=(x)=>String(x||''),
  escapeAttr=(x)=>String(x||'')
}={}){
  const k=escapeAttr(key);
  const id=escapeAttr(matchId);
  const tc=escapeAttr(targetCourt);
  const bg=theme?.bg||'#fff';
  const bd=theme?.bd||'var(--border)';
  const fg=theme?.fg||'var(--primary-dark)';

  return `<div class="court-wait-card" draggable="${canManage?'true':'false'}" ondragstart="onCourtCardDragStart(event,'${k}','${id}')" ondragend="onCourtCardDragEnd(event)" style="padding:8px 10px;border-radius:10px;background:${bg};border:2px solid ${bd}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
      <div style="min-width:0;flex:1">
        <div style="font-size:.78rem;font-weight:900;color:${fg};line-height:1.35;word-break:keep-all;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escapeHtml(title)}</div>
        ${label?`<div style="font-size:.72rem;color:${fg};margin-top:3px">${escapeHtml(label)}</div>`:''}
        ${metaHtml||''}
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">
          ${canManage?`<button class="btn btn-outline" type="button" style="font-size:.66rem;padding:4px 8px;min-height:28px;white-space:nowrap" onclick="sendCourtCardSms('${k}','${id}','court_changed','${tc}',${Number(priority||0)})">📨 문자</button>`:''}
          <button class="btn btn-outline" type="button" style="font-size:.66rem;padding:4px 8px;min-height:28px;white-space:nowrap" onclick="showCourtMovePicker('${k}','${id}')">코트 선택</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
        <span class="court-wait-priority">${Number(priority||0)}</span>
        ${elapsedBadgeHtml||''}
        ${manual?'<span class="badge bg-blue" style="font-size:.66rem;padding:3px 7px">수동</span>':''}
      </div>
    </div>
  </div>`;
}
