'use strict';

export function buildResultModalTitle({
  divisionLabel='',
  team1='',
  team2='',
  isIndividual=false,
  useOnlineOrder=false,
  bothSubmitted=false,
  mySubmitted=false
}={}){
  const div=String(divisionLabel||'');
  const dn1=String(team1||'TBD');
  const dn2=String(team2||'TBD');
  if(isIndividual) return `⚡ ${div} · ${dn1} vs ${dn2} — 결과입력`;
  if(useOnlineOrder){
    if(bothSubmitted || mySubmitted) return `📝 ${div} · ${dn1} vs ${dn2} — 오더/기록확인입력`;
    return `📝 ${div} · ${dn1} vs ${dn2} — 오더 입력·제출`;
  }
  return `⚡ ${div} · ${dn1} vs ${dn2}`;
}

export function getResultFooterButtonState({
  isIndividual=false,
  useOnlineOrder=false,
  isAdmin=false,
  isOperator=false,
  mySide=0,
  bothSubmitted=false,
  mySubmitted=false,
  side1Submitted=false,
  side2Submitted=false
}={}){
  const state={
    save:{show:true,disabled:false,text:'💾 임시저장',title:'현재 선택한 명단과 페어를 임시저장합니다'},
    unlock:{show:true,disabled:true,text:'🔓 초기화',title:'오더 제출 상태와 제출 내용을 초기화합니다'},
    submit:{show:false,disabled:false,text:'',title:''},
    saveResult:{show:true,disabled:false,text:'💾 결과저장',title:'현재 경기 결과를 저장합니다'},
    submitHome:{show:false,disabled:false,text:'',title:''},
    submitAway:{show:false,disabled:false,text:'',title:''},
    opSubmitHome:{show:false,disabled:false,text:'',title:''},
    opSubmitAway:{show:false,disabled:false,text:'',title:''}
  };

  if(isIndividual){
    state.save.show=false;
    state.unlock.show=false;
    return state;
  }

  if(!useOnlineOrder){
    state.unlock.disabled=!(isAdmin||isOperator);
    return state;
  }

  if(isAdmin){
    state.submit.show=true;
    state.submit.text=bothSubmitted?'📤 관리자 재제출(양팀)':'📤 관리자 제출(양팀)';
    state.submitHome.show=true;
    state.submitAway.show=true;
    state.unlock.disabled=false;
    state.unlock.title='오더 제출 상태와 제출 내용을 초기화하고 대진표 명단을 원래대로 돌립니다';
    return state;
  }

  if(isOperator){
    state.unlock.disabled=false;
    state.unlock.title='진행자도 오더 제출 상태와 제출 내용을 초기화할 수 있습니다';
    if(!bothSubmitted){
      if(!side1Submitted) state.opSubmitHome.show=true;
      if(!side2Submitted) state.opSubmitAway.show=true;
      if(!side1Submitted && !side2Submitted){
        state.submit.show=true;
        state.submit.text='📤 양팀 모두 대리제출';
        state.submit.title='양팀을 한 번에 대신 제출합니다';
      }
    }
    return state;
  }

  if(mySide){
    state.unlock.disabled=true;
    state.unlock.title='초기화는 관리자 또는 진행자만 가능합니다';
    if(bothSubmitted){
      state.save.disabled=true;
      state.save.title='양팀 제출 완료 후에는 임시저장할 수 없습니다';
    }else if(mySubmitted){
      state.submit.show=true;
      state.submit.text='📤 오더 수정제출';
      state.submit.title='상대 제출 전까지 다시 제출할 수 있습니다';
    }else{
      state.submit.show=true;
      state.submit.text='📤 오더 제출';
      state.submit.title='제출 후 내 오더가 저장됩니다';
    }
    return state;
  }

  state.save.disabled=true;
  state.save.title='관리자/진행자/해당 클럽 경기이사만 임시저장할 수 있습니다';
  state.saveResult.disabled=true;
  state.saveResult.title='관리자/진행자/해당 클럽 경기이사만 결과저장할 수 있습니다';
  state.unlock.disabled=true;
  state.unlock.title='초기화는 관리자 또는 진행자만 가능합니다';
  return state;
}

export function buildScoreButtonsHtml({
  inputId='',
  current=null,
  values=[0,1,2,3,4,5,6],
  escapeAttr=(x)=>String(x||'')
}={}){
  const id=escapeAttr(inputId);
  const hasCurrent=current!==null && current!=='' && current!==undefined;
  return (values||[]).map(n=>{
    const selected=hasCurrent && Number(current)===Number(n);
    return `<button type="button" onclick="setRbSc('${id}',${n})" style="width:32px;height:32px;border-radius:6px;border:1.5px solid ${selected?'var(--primary)':'var(--border)'};background:${selected?'var(--primary)':'white'};color:${selected?'white':'var(--text)'};font-weight:700;font-size:.85rem;cursor:pointer;transition:.15s" id="${id}_btn${n}">${n}</button>`;
  }).join('');
}


export function buildResultTeamsHeaderHtml({
  team1='',
  team2='',
  club1='',
  club2='',
  isIndividual=false,
  escapeHtml=(x)=>String(x||'')
}={}){
  return `<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin-bottom:12px">
    <div style="min-width:0;padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px">
      <div style="font-size:.72rem;color:#1d4ed8;font-weight:700">${isIndividual?'참가자 A':'홈팀'}</div>
      <div style="font-size:.96rem;font-weight:900;color:#1e3a8a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(team1||'TBD')}</div>
      ${club1?`<div style="font-size:.68rem;color:#64748b;margin-top:2px">${escapeHtml(club1)}</div>`:''}
    </div>
    <div style="font-size:.76rem;font-weight:900;color:var(--text3)">VS</div>
    <div style="min-width:0;padding:10px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;text-align:right">
      <div style="font-size:.72rem;color:#c2410c;font-weight:700">${isIndividual?'참가자 B':'원정팀'}</div>
      <div style="font-size:.96rem;font-weight:900;color:#9a3412;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(team2||'TBD')}</div>
      ${club2?`<div style="font-size:.68rem;color:#64748b;margin-top:2px">${escapeHtml(club2)}</div>`:''}
    </div>
  </div>`;
}

export function buildRubberResultCardHtml({
  rubberNo=1,
  pair1Html='',
  pair2Html='',
  score1Html='',
  score2Html='',
  noteHtml='',
  locked=false
}={}){
  return `<div class="match-result-rubber-card" style="border:1px solid var(--border);border-radius:12px;background:#fff;padding:10px 12px;margin-bottom:8px;opacity:${locked?'.72':'1'}">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
      <div style="font-size:.8rem;font-weight:900;color:var(--primary-dark)">${Number(rubberNo||1)}복식</div>
      ${locked?'<span class="badge bg-gray" style="font-size:.62rem">잠금</span>':''}
    </div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center">
      <div>${pair1Html||''}</div>
      <div style="font-size:.72rem;color:var(--text3);font-weight:800">VS</div>
      <div>${pair2Html||''}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px">
      <div>${score1Html||''}</div>
      <div>${score2Html||''}</div>
    </div>
    ${noteHtml?`<div style="margin-top:7px">${noteHtml}</div>`:''}
  </div>`;
}

export function buildResultSectionHtml({
  heading='',
  description='',
  bodyHtml='',
  tone='default'
}={}){
  const tones={
    default:{bg:'#fff',bd:'var(--border)',fg:'var(--primary-dark)'},
    info:{bg:'#eff6ff',bd:'#bfdbfe',fg:'#1d4ed8'},
    warning:{bg:'#fff7ed',bd:'#fed7aa',fg:'#9a3412'}
  };
  const t=tones[tone]||tones.default;
  return `<section style="margin-bottom:12px;padding:11px 12px;background:${t.bg};border:1px solid ${t.bd};border-radius:12px">
    ${heading?`<div style="font-size:.82rem;font-weight:900;color:${t.fg};margin-bottom:${description?'3px':'8px'}">${heading}</div>`:''}
    ${description?`<div style="font-size:.7rem;color:var(--text3);line-height:1.5;margin-bottom:8px">${description}</div>`:''}
    ${bodyHtml||''}
  </section>`;
}

export function buildResultMemoHtml({
  memo='',
  escapeHtml=(x)=>String(x||'')
}={}){
  return `<div style="margin-top:10px">
    <div style="font-size:.74rem;font-weight:800;color:var(--primary-dark);margin-bottom:5px">메모</div>
    <textarea id="mM3Memo" class="form-input" rows="2" style="width:100%;resize:vertical;font-size:.78rem" placeholder="경기 메모">${escapeHtml(memo||'')}</textarea>
  </div>`;
}


export function buildMatchMemoFieldHtml({
  memo='',
  escapeHtml=(x)=>String(x||'')
}={}){
  return `<div class="form-group" style="margin:12px 0">
    <label class="form-label">📢 경기 공지</label>
    <textarea class="form-textarea" id="mM3MatchMemo" placeholder="예: 2번 코트 대기 / 5분 뒤 입장 / 운영 메모 등">${escapeHtml(memo||'')}</textarea>
  </div>`;
}

export function buildTeamResultIntroHtml({
  useOnlineOrder=false,
  bothSubmitted=false,
  isOperator=false
}={}){
  return `<div style="margin-bottom:12px;padding:10px 12px;border-radius:12px;border:1px solid #dbeafe;background:linear-gradient(135deg,#f8fbff,#eef6ff);font-size:.78rem;font-weight:800;color:#1d4ed8;line-height:1.6">
    📌 오더는 각 복식에서 선수 2명을 선택한 뒤 하단의 제출 버튼으로 제출합니다. 진행자/관리자는 한 팀만 대리제출도 가능합니다.
  </div>
  <div style="font-size:.9rem;color:var(--text2);margin-bottom:12px;padding:10px 12px;background:var(--panel2);border-radius:var(--radius);border:1px solid var(--border);font-weight:700">
    💡 선수 2명 클릭 선택 후 스코어 버튼으로 입력 (동점 불가) · 점수를 아직 안 넣어도 페어만 먼저 저장할 수 있습니다.
    ${useOnlineOrder && !bothSubmitted
      ? `<span style="display:block;margin-top:4px;color:#b45309">제출 전에는 자유 수정 가능 · 제출 후에는 내 오더가 저장되며 · 양팀 제출 완료 후에는 완전 잠금됩니다.${isOperator?'<br><span style="color:#1d4ed8">경기진행자는 제출 전에도 양팀 명단은 볼 수 있지만, 제출 완료된 팀의 오더 선택은 양팀 모두 제출될 때까지 숨겨집니다.</span>':''}</span>`
      : ''}
  </div>`;
}

export function buildOrderSubmitStatusHtml({
  show=false,
  bothSubmitted=false,
  mySubmitted=false,
  side1Submitted=false,
  side2Submitted=false,
  team1='',
  team2='',
  statusText='',
  escapeHtml=(x)=>String(x||'')
}={}){
  if(!show) return '';
  const border=bothSubmitted?'#16a34a':(mySubmitted?'#d4a017':'#93c5fd');
  const bg=bothSubmitted
    ? 'linear-gradient(135deg,#ecfdf5,#dcfce7)'
    : (mySubmitted?'linear-gradient(135deg,#fff7dd,#ffefb0)':'linear-gradient(135deg,#eff6ff,#f8fbff)');
  const fg=bothSubmitted?'#166534':(mySubmitted?'#8a6412':'#1d4ed8');

  const teamChip=(name,submitted)=>`<span style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:999px;font-size:.74rem;font-weight:800;border:1.5px solid ${submitted?'#16a34a':'#cbd5e1'};background:${submitted?'#dcfce7':'#f8fafc'};color:${submitted?'#166534':'#475569'}">${escapeHtml(name)} · ${submitted?'✅ 제출완료':'⏳ 미제출'}</span>`;

  return `<div id="mM3SubmitStatusCard" style="margin-bottom:12px;padding:12px 13px;border-radius:14px;border:2px solid ${border};background:${bg}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap">
      <div style="font-size:.82rem;line-height:1.6;color:var(--text2)">
        <div style="font-size:.9rem;font-weight:900;color:${fg}">${bothSubmitted?'🔒 제출 완료 상태':(mySubmitted?'📤 내팀 제출 완료':'✍️ 제출 전 상태')}</div>
        <div style="margin-top:4px">${escapeHtml(statusText)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
          ${teamChip(team1,side1Submitted)}
          ${teamChip(team2,side2Submitted)}
          ${bothSubmitted?'<span style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:999px;font-size:.74rem;font-weight:800;border:1.5px solid #16a34a;background:#bbf7d0;color:#166534">🔓 양팀 공개됨</span>':''}
        </div>
      </div>
      <div style="padding:6px 10px;border-radius:999px;font-size:.72rem;font-weight:900;background:${fg};color:#fff">${bothSubmitted?'수정 불가':(mySubmitted?'상대 제출 대기':'작성 가능')}</div>
    </div>
  </div>`;
}

export function buildPhotoAssistHtml({
  show=false,
  team1='',
  team2='',
  side1Editable=false,
  side2Editable=false,
  side1Saved=false,
  side2Saved=false,
  escapeHtml=(x)=>String(x||'')
}={}){
  if(!show) return '';
  const sideCard=(side,name,editable,saved)=>`<div style="padding:10px;border:1px solid var(--border);border-radius:12px;background:#fff">
    <div style="font-size:.8rem;font-weight:800;color:var(--primary-dark);margin-bottom:6px">${escapeHtml(name)}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${editable?`<button type="button" class="btn btn-outline" style="font-size:.74rem;padding:6px 10px" onclick="triggerOrderPhoto(${side},'camera')">📷 사진찍기</button><button type="button" class="btn btn-outline" style="font-size:.74rem;padding:6px 10px" onclick="triggerOrderPhoto(${side},'upload')">🖼️ 사진불러오기</button>`:''}
    </div>
    <div id="orderPhotoStatus${side}" style="font-size:.74rem;color:var(--text2);margin-top:7px;line-height:1.45">${saved?'사진 저장됨 · OCR 보조입력 완료':'대기중'}</div>
  </div>`;

  return `<div id="mM3PhotoAssistCard" style="margin-bottom:12px;padding:12px 13px;border-radius:14px;border:1.5px solid #bfdbfe;background:linear-gradient(135deg,#f8fbff,#eef4ff)">
    <div style="font-size:.84rem;font-weight:900;color:#1d4ed8;margin-bottom:8px">📷 사진으로 오더 보조입력</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${sideCard(1,team1,side1Editable,side1Saved)}
      ${sideCard(2,team2,side2Editable,side2Saved)}
    </div>
  </div>`;
}

export function buildIndividualResultBodyHtml({
  divisionLabel='',
  divisionClass='',
  roundLabel='',
  roundTheme={},
  phase='',
  groupIndex=null,
  groupCourts=[],
  matchId='',
  matchCourts=[],
  memo='',
  sideLabel1='1번',
  sideLabel2='2번',
  players1=[],
  players2=[],
  score1='',
  score2='',
  scoreButtons1Html='',
  scoreButtons2Html='',
  key='',
  escapeHtml=(x)=>String(x||''),
  escapeAttr=(x)=>String(x||'')
}={}){
  const p1=Array.isArray(players1)?players1:[];
  const p2=Array.isArray(players2)?players2:[];
  const k=escapeAttr(key);
  const mid=escapeAttr(matchId);
  const hasGroup=phase==='group' && groupIndex!=null;

  return `<div style="margin-bottom:10px;padding:12px 14px;border-radius:14px;background:linear-gradient(135deg,#f8fbff,#eef4ff);border:1.5px solid #bfdbfe;font-size:.8rem;font-weight:800;color:#1d4ed8;line-height:1.6">📌 개인전은 오더 제출이 없습니다. 점수만 입력하면 됩니다.</div>
  <div class="m3card" style="border:1.5px solid var(--border);box-shadow:none">
    <div class="m3hdr ${divisionClass}" style="justify-content:flex-start;gap:8px;flex-wrap:wrap">
      <span class="m3badge">${escapeHtml(divisionLabel)}</span>
      <span class="m3badge" style="background:${roundTheme?.chipBg||'#f8fafc'};color:${roundTheme?.chipFg||'var(--text)'};border:1px solid ${roundTheme?.bd||'var(--border)'}">${escapeHtml(roundLabel)}</span>
    </div>
    <div class="m3body" style="padding:12px 12px 14px">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:12px">
        ${hasGroup?`<button type="button" onclick="openGroupCourtModal('${k}',${Number(groupIndex)})" style="padding:5px 12px;font-size:.78rem;white-space:nowrap;background:#fff;color:var(--primary-dark);border:1.5px solid var(--border);border-radius:999px;font-weight:800">🎾 조코트 ${groupCourts.length?groupCourts.map(escapeHtml).join('/'):'미배정'}</button>`:''}
        <button type="button" onclick="openMatchCourtModal('${k}','${mid}')" style="padding:5px 12px;font-size:.78rem;white-space:nowrap;background:#fff;color:var(--primary-dark);border:1.5px solid var(--border);border-radius:999px;font-weight:800">🎾 경기코트 ${matchCourts.length?matchCourts.map(escapeHtml).join('/'):'미배정'}</button>
      </div>
      ${buildMatchMemoFieldHtml({memo,escapeHtml})}
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch;margin-bottom:12px">
        <div style="padding:10px;border-radius:12px;border:1.5px solid var(--border);background:#fff">
          <div style="font-size:.74rem;font-weight:800;color:var(--primary);margin-bottom:6px">${escapeHtml(sideLabel1)}</div>
          <div id="rp1_0" style="display:none" data-selected="${encodeURIComponent(JSON.stringify(p1))}"></div>
          <div style="padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:#f8fafc;font-size:.92rem;color:var(--text);font-weight:900;line-height:1.5;text-align:center">${p1.length?p1.map(escapeHtml).join(' / '):'선수 정보 없음'}</div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;font-size:1.15rem;font-weight:900;color:var(--text3)">VS</div>
        <div style="padding:10px;border-radius:12px;border:1.5px solid var(--border);background:#fff">
          <div style="font-size:.74rem;font-weight:800;color:var(--primary);margin-bottom:6px">${escapeHtml(sideLabel2)}</div>
          <div id="rp2_0" style="display:none" data-selected="${encodeURIComponent(JSON.stringify(p2))}"></div>
          <div style="padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:#f8fafc;font-size:.92rem;color:var(--text);font-weight:900;line-height:1.5;text-align:center">${p2.length?p2.map(escapeHtml).join(' / '):'선수 정보 없음'}</div>
        </div>
      </div>
      <div style="padding:12px;border-radius:12px;background:#fff;border:1.5px solid var(--border)">
        <div style="font-size:.92rem;font-weight:900;color:var(--primary-dark);margin-bottom:10px">${escapeHtml(roundLabel)}</div>
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center">
          <div>
            <div style="font-size:.78rem;font-weight:800;color:var(--text2);margin-bottom:6px;text-align:center">${escapeHtml(sideLabel1)}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">${scoreButtons1Html}</div>
            <input type="hidden" id="rs1_0" value="${escapeAttr(score1)}">
          </div>
          <div style="font-size:1.3rem;font-weight:900;color:var(--text3);text-align:center">:</div>
          <div>
            <div style="font-size:.78rem;font-weight:800;color:var(--text2);margin-bottom:6px;text-align:center">${escapeHtml(sideLabel2)}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">${scoreButtons2Html}</div>
            <input type="hidden" id="rs2_0" value="${escapeAttr(score2)}">
          </div>
        </div>
      </div>
    </div>
  </div>`;
}


export function buildOrderSideBoxHtml({
  teamName='',
  isIndividual=false,
  submitted=false,
  showSide=true,
  operatorHiddenSubmitted=false,
  blankOrder=false,
  pickerHtml='',
  hiddenHtml='',
  fixedPairHtml='',
  escapeHtml=(x)=>String(x||'')
}={}){
  const fg=submitted?'#166534':'var(--primary)';
  const bd=submitted?'#16a34a':'#cbd5e1';
  const bg=submitted?'#f0fdf4':'#fff';
  let body='';
  if(showSide){
    body=isIndividual?fixedPairHtml:pickerHtml;
    if(operatorHiddenSubmitted){
      body+='<div style="margin-top:6px;font-size:.74rem;font-weight:800;color:#475569;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:6px 8px">🔒 이미 제출된 팀 — 오더 배치는 양팀 제출 후 공개</div>';
    }else if(blankOrder){
      body+='<div style="margin-top:6px;font-size:.74rem;font-weight:800;color:#b45309;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:6px 8px">🚫 공오더 제출</div>';
    }
  }else{
    body='<div style="padding:10px 12px;border:1.5px dashed var(--border);border-radius:10px;background:#f8fafc;font-size:.78rem;color:var(--text3);font-weight:700">🔒 상대 클럽 제출 후 자동 공개</div>'+(hiddenHtml||'');
  }
  return `<div style="padding:8px;border-radius:12px;border:1.5px solid ${bd};background:${bg}">
    <div style="font-size:.72rem;font-weight:800;color:${fg};margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap">
      <span>${isIndividual?`${escapeHtml(teamName)} 페어`:`${escapeHtml(teamName)} (2명 선택 또는 공오더)`}</span>
      ${isIndividual?'':`<span style="padding:2px 8px;border-radius:999px;font-size:.68rem;background:${submitted?'#dcfce7':'#f8fafc'};border:1px solid ${bd};color:${submitted?'#166534':'#475569'}">${submitted?'✅ 제출완료':'⏳ 미제출'}</span>`}
    </div>${body}</div>`;
}

export function buildTeamRubberCardHtml({
  rubberNo=1,
  defaultSlotLabel='',
  winnerLabel='',
  side1BoxHtml='',
  side2BoxHtml='',
  team1='',
  team2='',
  scoreButtons1Html='',
  scoreButtons2Html='',
  score1='',
  score2='',
  escapeHtml=(x)=>String(x||''),
  escapeAttr=(x)=>String(x||'')
}={}){
  const idx=Math.max(0,Number(rubberNo||1)-1);
  return `<div class="rb-blk"><div class="rb-bhdr"><span>${Number(rubberNo||1)}복식 <small style="opacity:.75">(기본: ${escapeHtml(defaultSlotLabel||'')})</small></span>${winnerLabel?`<span style="background:rgba(255,255,255,.25);padding:2px 8px;border-radius:8px;font-size:.7rem">${escapeHtml(winnerLabel)} ✓</span>`:''}</div>
  <div class="rb-bbdy">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">${side1BoxHtml||''}${side2BoxHtml||''}</div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center">
      <div><div style="font-size:.68rem;font-weight:700;color:var(--primary);margin-bottom:5px;text-align:center">${escapeHtml(team1)}</div><div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">${scoreButtons1Html||''}</div><input type="hidden" id="rs1_${idx}" value="${escapeAttr(score1)}"></div>
      <div style="font-size:1.3rem;font-weight:900;color:var(--text3);text-align:center">:</div>
      <div><div style="font-size:.68rem;font-weight:700;color:var(--primary);margin-bottom:5px;text-align:center">${escapeHtml(team2)}</div><div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">${scoreButtons2Html||''}</div><input type="hidden" id="rs2_${idx}" value="${escapeAttr(score2)}"></div>
    </div>
  </div></div>`;
}

export function buildQuickActionPanelHtml({
  doublesCount=0,
  team1='',
  team2='',
  isAdmin=false,
  isOperator=false,
  mySide=0,
  escapeHtml=(x)=>String(x||'')
}={}){
  const dbl=Number(doublesCount||0);
  const elevated=!!(isAdmin||isOperator);
  const myName=mySide===2?team2:team1;
  const inputs=elevated
    ? `<button type="button" class="btn btn-outline" style="flex:1 1 0;font-size:.82rem;padding:9px 12px;min-width:0" onclick="openTapOrderModal(1,${dbl})">${escapeHtml(team1)} 선수 입력</button><button type="button" class="btn btn-outline" style="flex:1 1 0;font-size:.82rem;padding:9px 12px;min-width:0" onclick="openTapOrderModal(2,${dbl})">${escapeHtml(team2)} 선수 입력</button>`
    : (mySide?`<button type="button" class="btn btn-outline" style="flex:1 1 0;font-size:.82rem;padding:9px 12px;min-width:0" onclick="openTapOrderModal(${Number(mySide)},${dbl})">${escapeHtml(myName)} 선수 입력</button>`:'');
  const reorder=elevated
    ? `<button type="button" onclick="openReorderPopup(${dbl},1)" style="flex:1 1 0;padding:9px 12px;border-radius:10px;border:none;background:linear-gradient(135deg,#f57c00,#ef6c00);color:white;font-size:.8rem;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">🔀 ${escapeHtml(team1)} 순서 변경</button><button type="button" onclick="openReorderPopup(${dbl},2)" style="flex:1 1 0;padding:9px 12px;border-radius:10px;border:none;background:linear-gradient(135deg,#f57c00,#ef6c00);color:white;font-size:.8rem;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">🔀 ${escapeHtml(team2)} 순서 변경</button>`
    : (mySide?`<button type="button" onclick="openReorderPopup(${dbl},${Number(mySide)})" style="padding:9px 16px;border-radius:10px;border:none;background:linear-gradient(135deg,#f57c00,#ef6c00);color:white;font-size:.82rem;font-weight:900;cursor:pointer">🔀 복식 순서 변경</button>`:'');
  return `<div style="font-size:.84rem;font-weight:900;color:#c2410c;margin-bottom:8px">✍️ 선수 입력 · 순서 변경</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">${inputs}</div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:${elevated?'stretch':'flex-end'}">${reorder}</div>`;
}
