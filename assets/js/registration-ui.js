'use strict';

/**
 * 김해시테니스협회 등록 현황 UI 렌더러 - Phase 18
 * 데이터 저장/삭제/수정은 하지 않고 등록 팀 카드 HTML 생성만 담당한다.
 */

export function buildRegistrationRosterGrid({
  tid,
  div,
  teams,
  key,
  tournament,
  isIndividual,
  regClub='',
  isAdmin=false,
  isDirector=false,
  deadlinePassed=false,
  baseClub,
  getIndividualDisplayLine,
  teamDisplayName,
  isFirstAppearancePlayer,
  rosterPlayerHTML,
  escapeHtml
}){
  if(!teams?.length){
    return `<div style="font-size:.78rem;color:var(--text3);padding:4px 0">아직 등록된 팀이 없습니다.</div>`;
  }

  const isWomen=(div==='여성부');

  return teams.map((team,i)=>{
    const realIdx=(typeof team._origIdx==='number')?team._origIdx:i;
    const dn=isIndividual
      ? getIndividualDisplayLine(team)
      : ((team.pairLabel||team.entryLabel)
          ? (team.pairLabel||team.entryLabel)
          : teamDisplayName(team,key,realIdx));

    const p=(team.players||[]).filter(Boolean);
    const isWomenTeam=(div==='여성부');
    const isTerineeTeam=(div==='테린이'||div==='terinee');
    const cfgDbl=Number(tournament?.divSettings?.[div]?.doublesCount||0);
    const dbl=Number(team.doublesCount||cfgDbl||((isTerineeTeam||isWomenTeam)?(p.length<=6?3:p.length<=8?4:5):5));
    const savedMainCount=Number.isFinite(Number(team.mainPlayerCount)) && Number(team.mainPlayerCount)>0
      ? Number(team.mainPlayerCount)
      : 0;
    const mainCount=savedMainCount || (isWomenTeam?6:dbl*2);
    const mainPlayers=p.slice(0,mainCount);
    const subPlayers=p.slice(mainCount);

    const myClub=regClub ? baseClub(regClub) : '';
    const teamClub=baseClub(team.club||'')||'';
    const canManageTeam=isIndividual
      ? true
      : (isAdmin || (isDirector && myClub && myClub===teamClub && !deadlinePassed));

    const adminBtns=canManageTeam
      ? `<div class="rr-admin-btns">
          <button class="btn rr-btn-edit" style="background:#f8fafc;color:#0f1e3a;border:1px solid #cbd5e1" onclick="openETeam('${escapeHtml(key)}',${realIdx})">✏️ 수정</button>
          <button class="btn btn-danger rr-btn-del" onclick="delTeam('${escapeHtml(key)}',${realIdx})">🗑 삭제</button>
        </div>`
      : '';

    const womenGroups=[
      {label:'1조 🌸 개나리', players:mainPlayers.slice(0,2), off:0},
      {label:'2조 🌼 국화', players:mainPlayers.slice(2,4), off:2},
      {label:'3조 🌱 테린이 (구력 4년↓)', players:mainPlayers.slice(4,6), off:4}
    ];

    const individualLine=isIndividual ? getIndividualDisplayLine(team) : '';

    const bodyHTML=isIndividual
      ? ``
      : isWomen
        ? `<div style="padding:8px 12px">
            <div style="font-size:.65rem;color:#6b21a8;font-weight:700;letter-spacing:.03em;margin-bottom:6px">👩 여성부 조 편성</div>
            <div style="display:flex;flex-direction:column;gap:5px">
              ${womenGroups.map(g=>`
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <span style="font-size:.65rem;font-weight:700;color:#7c3aed;white-space:nowrap;min-width:fit-content">${g.label}</span>
                  <div style="display:flex;gap:4px;flex-wrap:wrap">
                    ${g.players.length
                      ? g.players.map((n,idx)=>{
                          const isD=isFirstAppearancePlayer(n,team.club||'',tid);
                          return `<div style="display:inline-flex;align-items:center;gap:4px;background:${isD?'linear-gradient(135deg,#fff7ed,#fef3c7)':'var(--panel2)'};border:1px solid ${isD?'#f59e0b':'var(--border)'};border-radius:20px;padding:4px 9px 4px 3px;font-size:.92rem;font-weight:700">
                            <span style="width:20px;height:20px;background:${isD?'#f59e0b':'var(--primary)'};color:#fff;border-radius:50%;font-size:.66rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${g.off+idx+1}</span>
                            ${rosterPlayerHTML(n,team.club||'',tid)}
                          </div>`;
                        }).join('')
                      : '<span style="font-size:.72rem;color:#a78bda">미등록</span>'}
                  </div>
                </div>`).join('')}
            </div>
            ${subPlayers.length
              ? `<div style="margin-top:5px;padding-top:5px;border-top:1px dashed var(--border);font-size:.86rem;font-weight:600;color:var(--text3)">후보: ${subPlayers.map(n=>rosterPlayerHTML(n,team.club||'',tid)).join(', ')}</div>`
              : ''}
          </div>`
        : `<div style="padding:10px 12px">
            <div style="font-size:.74rem;color:var(--text3);font-weight:600;letter-spacing:.02em;margin-bottom:6px">선수 명단 (페어는 경기 때 결정)</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:5px">
              ${mainPlayers.map((n,idx)=>{
                const isD=isFirstAppearancePlayer(n,team.club||'',tid);
                return `<div style="background:${isD?'linear-gradient(135deg,#fff7ed,#fef3c7)':'var(--panel2)'};border:1px solid ${isD?'#f59e0b':'var(--border)'};border-radius:var(--radius);padding:5px 8px;font-size:.92rem;font-weight:700;display:flex;align-items:center;gap:5px">
                  <span style="width:20px;height:20px;background:${isD?'#f59e0b':'var(--primary)'};color:#fff;border-radius:50%;font-size:.66rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${idx+1}</span>
                  ${rosterPlayerHTML(n,team.club||'',tid)}
                </div>`;
              }).join('')}
            </div>
            ${subPlayers.length
              ? `<div style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--border);font-size:.86rem;font-weight:600;color:var(--text3)">후보: ${subPlayers.map(n=>rosterPlayerHTML(n,team.club||'',tid)).join(', ')}</div>`
              : ''}
          </div>`;

    const headerName=isIndividual ? `${individualLine||mainPlayers[0]||dn||'참가자'}` : dn;
    const headerCount=isIndividual ? '' : `${p.length}명`;
    const cardClass=isIndividual ? 'rr-team-card individual-entry-card' : 'rr-team-card';
    const titleClass=isIndividual ? 'rr-team-name individual-entry-title' : 'rr-team-name';

    return `<div class="${cardClass}">
      <div class="rr-team-header">
        <div class="rr-team-info">
          <span class="rr-team-num">${i+1}</span>
          <span class="${titleClass}">${headerName}</span>
          ${headerCount?`<span class="rr-team-count">${headerCount}</span>`:''}
        </div>
        ${adminBtns}
      </div>
      ${bodyHTML}
    </div>`;
  }).join('');
}


export function getRegistrationFormState({
  div='',
  isIndividual=false,
  doublesCount=5
}){
  const isTerinee=(div==='terinee'||div==='테린이');
  const isWomen=(div==='여성부');
  const dbl=isIndividual?1:Number(doublesCount||5);
  const mainCount=isIndividual?2:dbl*2;

  const pairLabels=Array.from({length:5},(_,idx)=>{
    const i=idx+1;
    if(!isIndividual && isWomen && i<=3){
      return {
        show:true,
        text:['1조 🌸 개나리','2조 🌼 국화','3조 🌱 테린이 (구력 4년↓)'][idx],
        color:'#7c3aed'
      };
    }
    return {show:false,text:'',color:''};
  });

  let modeLabel='';
  let playerLabelHtml='';
  if(isIndividual){
    modeLabel='— 개인전 복식 2인 | 후보 없음 | 누구나 접수 가능';
    playerLabelHtml='참가자 명단 <span style="color:var(--text3);font-size:.72rem;font-weight:400">파트너 포함 2명 입력</span>';
  }else if(isWomen){
    modeLabel='— 3복식 고정 | 주전 6명 + 후보 최대 2명';
    playerLabelHtml='선수 명단 <span style="color:var(--text3);font-size:.72rem;font-weight:400">주전 6명 (조별 2명씩) + 후보 최대 2명</span>';
  }else if(isTerinee){
    modeLabel=`— ${dbl}복식 | 주전 ${mainCount}명 + 후보 최대 2명`;
    playerLabelHtml=`선수 명단 <span style="color:var(--text3);font-size:.72rem;font-weight:400">주전 ${mainCount}명 + 후보 최대 2명</span>`;
  }else{
    modeLabel='— 5복식 | 주전 10명 + 후보 최대 2명';
    playerLabelHtml='선수 명단 <span style="color:var(--text3);font-size:.72rem;font-weight:400">주전 10명 + 후보 최대 2명</span>';
  }

  const visibleSlots=Array.from({length:12},(_,idx)=>{
    const i=idx+1;
    return isIndividual ? i<=2 : (i<=mainCount || i===11 || i===12);
  });

  return {
    isIndividual,
    isTerinee,
    isWomen,
    doublesCount:dbl,
    mainCount,
    showTerineeMode:(!isIndividual && isTerinee && !isWomen),
    showSlot4:(!isIndividual && dbl>=4),
    showSlot5:(!isIndividual && dbl>=5),
    pairLabels,
    subNum1:isIndividual?'':'후1',
    subNum2:isIndividual?'':'후2',
    subPlaceholder1:'후보 1',
    subPlaceholder2:'후보 2',
    modeLabel,
    playerLabelHtml,
    clubLabelHtml:isIndividual?'클럽명/소속<span class="req">*</span>':'클럽<span class="req">*</span>',
    numberLabel:isIndividual?'참가 번호':'팀 번호',
    showWomenNotice:(isWomen && !isIndividual),
    showSubWrap:!isIndividual,
    visibleSlots
  };
}

export function getWomenPairNoticeHtml(){
  return `<div style="margin-bottom:10px;padding:10px 14px;background:linear-gradient(135deg,#fdf4ff,#f3e8ff);border:1.5px solid #c084fc;border-radius:10px;font-size:.78rem;line-height:1.7">
    <div style="font-weight:800;color:#6b21a8;margin-bottom:5px">👩 여성부 페어 고정 조건</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;color:#4a1772">
      <div><span style="font-weight:700;color:#7c3aed">1조 🌸 개나리</span> — 구력 무관</div>
      <div><span style="font-weight:700;color:#7c3aed">2조 🌼 국화</span> — 구력 무관</div>
      <div style="grid-column:1/-1"><span style="font-weight:700;color:#7c3aed">3조 🌱 테린이</span> — 구력 <b>4년 이하</b> 페어 고정</div>
    </div>
    <div style="margin-top:6px;font-size:.7rem;color:#7c3aed;border-top:1px dashed #d8b4fe;padding-top:5px">
      💡 1~2번 → 1조, 3~4번 → 2조, 5~6번 → 3조 순서로 배정됩니다.
    </div>
  </div>`;
}
