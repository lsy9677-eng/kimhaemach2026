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
