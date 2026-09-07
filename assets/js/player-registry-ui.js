'use strict';

/**
 * 김해시테니스협회 선수/공식명단 UI 렌더러 - Phase 4
 * 데이터 저장/수정은 하지 않고 HTML 생성만 담당한다.
 */


function splitSubClubs(raw){
  return [...new Set(
    String(raw||'').split(',').map(s=>String(s||'').trim()).filter(Boolean)
  )];
}

function buildPrimarySubBadges(member, escapeHtml, {compact=false}={}){
  const mainClub=String(member?.club||'').trim();
  const subClubs=splitSubClubs(member?.subClub)
    .filter(c=>c && c!==mainClub);

  // 단일 클럽 회원은 기존 화면 유지: 배지를 추가하지 않는다.
  if(!subClubs.length) return '';

  const fs=compact?'.56rem':'.64rem';
  const pad=compact?'1px 5px':'2px 7px';
  return `<span class="primary-sub-club-badges" style="display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap;min-width:0">
    ${mainClub?`<span class="badge" style="font-size:${fs};padding:${pad};background:#dcfce7;color:#166534;border:1px solid #86efac;white-space:nowrap">주 ${escapeHtml(mainClub)}</span>`:''}
    <span class="badge" style="font-size:${fs};padding:${pad};background:#f3e8ff;color:#7e22ce;border:1px solid #d8b4fe;white-space:nowrap;max-width:130px;overflow:hidden;text-overflow:ellipsis">부 ${subClubs.map(escapeHtml).join(', ')}</span>
  </span>`;
}

export function buildPlayerRecordCard({
  row,
  highlight=false,
  escapeHtml,
  formatRecentLabel
}){
  const summary=row?.summary||{};
  const recent=formatRecentLabel(summary.lastDate)||'-';
  const labelClub=row?.club||'소속 미상';
  const tag = row?.isReg
    ? '<span class="badge bg-green" style="font-size:.68rem">등록선수</span>'
    : '<span class="badge bg-gray" style="font-size:.68rem">현재참가/기록</span>';
  const subTag=buildPrimarySubBadges(row,escapeHtml);
  const bestRank=summary.bestRank?`${summary.bestRank}위`:'기록없음';
  const phone=summary.displayPhone||'전화번호 없음';

  return `<div style="padding:14px 16px;border:1.5px solid ${highlight?'#2563eb':'var(--border)'};border-radius:14px;background:${highlight?'linear-gradient(135deg,#f8fbff,#eef6ff)':'#fff'};box-shadow:${highlight?'0 8px 20px rgba(37,99,235,.08)':'none'}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <div style="min-width:220px;flex:1">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px">
          <div style="font-size:1rem;font-weight:900;color:var(--primary-dark)">${escapeHtml(row?.name||'')}</div>${tag}${subTag}
        </div>
        <div style="font-size:.8rem;color:var(--text2);line-height:1.7">
          📞 ${escapeHtml(phone)}<br>
          🏷 ${escapeHtml(labelClub)}<br>
          📅 최근 참가: <b>${escapeHtml(recent)}</b><br>
          📊 누적 참가: <b>${Number(summary.totalCount||0)}회</b> · 최고 성적: <b>${escapeHtml(bestRank)}</b>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:flex-end">
        <button class="btn btn-outline" style="font-size:.76rem;padding:5px 10px;min-height:34px" onclick="showP('${escapeHtml(row?.name||'')}','${escapeHtml(row?.club||'')}')">기록 보기</button>
      </div>
    </div>
  </div>`;
}

export function buildRegistryManagerTable({
  members,
  clubs,
  year,
  escapeHtml
}){
  if(!members?.length){
    return '<div style="padding:16px;text-align:center;color:var(--text3)">등록된 선수가 없습니다</div>';
  }

  const rows=members.map((m,idx)=>`<tr style="border-bottom:1px solid var(--border)">
    <td style="padding:5px 8px">
      <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
        <input class="form-input" style="padding:3px 6px;font-size:.78rem;width:70px" value="${escapeHtml(m.name||'')}" id="rmgr_n_${idx}">
        ${buildPrimarySubBadges(m,escapeHtml,{compact:true})}
      </div>
    </td>
    <td style="padding:5px 8px">
      <select class="form-select" style="padding:3px 6px;font-size:.78rem" id="rmgr_c_${idx}">
        ${(clubs||[]).map(c=>`<option ${c===m.club?'selected':''}>${escapeHtml(c)}</option>`).join('')}
      </select>
    </td>
    <td style="padding:5px 8px"><input class="form-input" style="padding:3px 6px;font-size:.78rem;width:70px" value="${escapeHtml(m.region||'')}" id="rmgr_r_${idx}"></td>
    <td style="padding:5px 8px"><input class="form-input" style="padding:3px 6px;font-size:.78rem;width:80px" placeholder="없으면 빈칸" value="${escapeHtml(m.subClub||'')}" id="rmgr_s_${idx}"></td>
    <td style="padding:5px 8px;white-space:nowrap">
      <button class="btn btn-outline" style="padding:2px 7px;font-size:.72rem" onclick="saveRegistryRow(${year},${idx})">💾</button>
      <button class="btn btn-danger" style="padding:2px 7px;font-size:.72rem" onclick="deleteRegistryRow(${year},${idx})">🗑</button>
    </td>
  </tr>`).join('');

  return `<table style="width:100%;border-collapse:collapse;font-size:.8rem">
    <thead><tr style="background:var(--panel2);position:sticky;top:0">
      <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border)">이름</th>
      <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border)">주클럽</th>
      <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border)">지역</th>
      <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border)">부클럽</th>
      <th style="padding:6px 8px;border-bottom:1px solid var(--border)">관리</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function buildRegistryEmptyState(year){
  return `<div class="empty-state card" style="padding:24px;text-align:center">
    <p style="font-size:1rem;font-weight:600;margin-bottom:8px">📋 표시할 등록 선수가 없습니다</p>
    <p style="font-size:.82rem;color:var(--text3);line-height:1.6">${year}년 공식 등록명단을 찾지 못했습니다. 관리자 명단 관리에서 업로드/추가해 주세요.</p>
  </div>`;
}

export function buildRegistryRegionSections({
  members,
  year,
  admin,
  escapeHtml,
  escapeAttr
}){
  const regionGroups=new Map();

  (members||[]).forEach(m=>{
    const regionKey=m.region||'소속 코트 미지정';
    const clubKey=m.club||'소속 미상';
    if(!regionGroups.has(regionKey)) regionGroups.set(regionKey,new Map());
    const clubMap=regionGroups.get(regionKey);
    if(!clubMap.has(clubKey)) clubMap.set(clubKey,[]);
    clubMap.get(clubKey).push(m);
  });

  const sections=[...regionGroups.entries()].map(([region,clubMap])=>{
    const regionRows=[...clubMap.values()].flat();
    const regionSubCount=regionRows.filter(x=>x.subClub).length;

    const clubCards=[...clubMap.entries()].map(([club,rows])=>{
      const subClubRows=rows.filter(x=>x.subClub).length;
      const subBadge=subClubRows
        ? `<span class="badge" style="font-size:.68rem;background:#f5f3ff;color:#6d28d9;border:1px solid #c4b5fd">부클럽 ${subClubRows}</span>`
        : '';

      const chips=rows.map(m=>{
        const sub=buildPrimarySubBadges(m,escapeHtml,{compact:true});
        const adminBtns=admin
          ? `<span style="display:inline-flex;gap:3px;margin-left:auto;flex:0 0 auto"><button class="btn btn-outline" style="font-size:.58rem;padding:1px 5px;min-height:22px" onclick="event.stopPropagation();quickEditRegistryMember(${year},${m.__idx})">수정</button><button class="btn btn-danger" style="font-size:.58rem;padding:1px 5px;min-height:22px" onclick="event.stopPropagation();quickDeleteRegistryMember(${year},${m.__idx})">삭제</button></span>`
          : '';

        return `<div class="reg-member-chip" style="display:flex;align-items:center;gap:4px;min-height:30px;background:#fff;border:1px solid var(--border);border-radius:10px;padding:4px 6px;font-size:.82rem;font-weight:800;cursor:pointer;min-width:0" onclick="openPD('${escapeAttr(m.name)}','${escapeAttr(m.club)}')">
          <span style="flex:0 0 auto;min-width:max-content;overflow:visible;text-overflow:clip;white-space:nowrap">${escapeHtml(m.name)}</span>${sub}${adminBtns}
        </div>`;
      }).join('');

      return `<div class="reg-club-card" style="background:#fff;border:1.5px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:0 1px 6px rgba(15,30,58,.08)">
        <div class="reg-club-header" style="background:linear-gradient(90deg,#091225,#0f1e3a);color:#fff;padding:8px 12px;cursor:default">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0">
            <span style="font-size:.96rem;font-weight:900;letter-spacing:-.01em">🏟 ${escapeHtml(club)}</span>
            ${subBadge}
          </div>
          <span style="flex:0 0 auto;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.24);border-radius:999px;padding:3px 9px;font-size:.74rem;font-weight:900">${rows.length}명</span>
        </div>
        <div class="reg-club-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:5px;padding:8px;background:linear-gradient(135deg,#fff,#f8fbff)">
          ${chips}
        </div>
      </div>`;
    }).join('');

    return `<section class="reg-region-section" style="background:linear-gradient(135deg,#eef4ff,#fffdf5);border:2px solid #dbe7ff;border-radius:16px;padding:8px;box-shadow:0 1px 6px rgba(15,30,58,.08)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-bottom:7px;padding:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:1rem;font-weight:900;color:var(--primary-dark)">🎾 ${escapeHtml(region)}</span>
          <span class="badge bg-blue" style="font-size:.72rem">${clubMap.size}클럽</span>
          ${regionSubCount?`<span class="badge" style="font-size:.72rem;background:#f5f3ff;color:#6d28d9;border:1px solid #c4b5fd">부클럽 ${regionSubCount}</span>`:''}
        </div>
        <span style="background:#0f1e3a;color:#fff;border-radius:999px;padding:4px 10px;font-size:.76rem;font-weight:900">${regionRows.length}명</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px">${clubCards}</div>
    </section>`;
  }).join('');

  return `<div style="display:flex;flex-direction:column;gap:10px">${sections}</div>`;
}
