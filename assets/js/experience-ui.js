// Presentation only: registration and match writes remain in app.js.
export const TOURNAMENT_STATUS=Object.freeze({
  open:{label:'접수 중',symbol:'＋',tone:'open',action:'참가 접수'},
  closed:{label:'접수 마감',symbol:'✓',tone:'closed',action:'대진표 보기'},
  ongoing:{label:'경기 진행 중',symbol:'●',tone:'ongoing',action:'대진표 보기'},
  finished:{label:'대회 종료',symbol:'■',tone:'finished',action:'결과 보기'}
});
export function tournamentStatus(status){return TOURNAMENT_STATUS[status]||{label:'준비 중',symbol:'○',tone:'draft',action:'대회 안내'};}
export function selectHomeTournament(tournaments=[],selectedId=''){
  return tournaments.find(t=>t.id===selectedId)||tournaments[0]||null;
}
export function tournamentDeadline(t){
  if(t?.regDeadlineDt){
    const date=new Date(t.regDeadlineDt);
    if(!Number.isNaN(date.getTime()))return '경기이사 등록 마감 · '+new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
  }
  return t?.deadline?'접수 마감 · '+t.deadline:'접수 마감일은 대회 요강을 확인해 주세요';
}
export function receiptText({tournament='',division='',team='',players=[],updated=false}){
  return [`${updated?'명단 수정':'참가 접수'} 완료`,tournament,`부서: ${division}`,`팀: ${team}`,`등록 선수 ${players.length}명`,...players.map((name,i)=>`${i+1}. ${name}`)].join('\n');
}
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function button(label,action,primary=false){const b=node('button','btn '+(primary?'btn-primary':'btn-outline'),label);b.type='button';b.addEventListener('click',action);return b;}
export function statusBadge(status){const s=tournamentStatus(status);return node('span','experience-status status-'+s.tone,s.symbol+' '+s.label);}

export function renderHomeExperience({tournament:t,tournaments=[],onSelect,onNavigate,onGuide,onMyClub,club=''}){
  const hero=document.querySelector('#page-home .hero'),host=document.getElementById('homeTournInfo');
  if(!hero||!host)return;
  const sectionTitle=host.previousElementSibling;
  if(sectionTitle)sectionTitle.textContent=t?.status==='finished'?'최근 대회 · 결과 확인':'대회 이용 안내';
  let details=document.getElementById('heroExperience');
  if(!details){details=node('div','hero-experience');details.id='heroExperience';hero.append(details);}
  details.replaceChildren();
  const status=document.getElementById('heroStatus');
  if(status){status.replaceChildren(statusBadge(t?.status));}
  const row=node('div','hero-experience-details');
  row.append(node('span','',t?.date?'대회일 · '+t.date:'새로운 대회를 준비하고 있습니다'));
  if(t?.venue)row.append(node('span','','장소 · '+t.venue));
  if(t)row.append(node('span','',tournamentDeadline(t)));
  details.append(row);
  const actions=node('div','experience-actions');
  if(t){
    const s=tournamentStatus(t.status);
    const page=t.status==='open'?'register':t.status==='finished'?'ranking':['ongoing','closed'].includes(t.status)?'bracket':'tournament';
    actions.append(button(s.action,()=>onNavigate(page,t.id),true),button('대회 요강',()=>onGuide(t.id)));
  }else actions.append(button('전체 대회 보기',()=>onNavigate('tournament'),true));
  actions.append(button(club?'내 클럽 · '+club:'내 클럽 경기 보기',onMyClub));
  details.append(actions);
  host.replaceChildren();
  if(!t){host.append(node('p','experience-empty','현재 접수하거나 진행 중인 대회가 없습니다. 전체 대회에서 지난 일정과 결과를 확인할 수 있습니다.'));return;}
  if(tournaments.length>1){
    const label=node('label','experience-picker','살펴볼 대회');
    const select=node('select','form-select');select.setAttribute('aria-label','홈에서 살펴볼 대회');
    tournaments.forEach(item=>{const option=node('option','',item.name);option.value=item.id;option.selected=item.id===t.id;select.append(option);});
    select.addEventListener('change',()=>onSelect(select.value));label.append(select);host.append(label);
  }
  const steps=node('div','experience-steps');steps.setAttribute('aria-label','대회 이용 순서');
  const items=[['register','01','참가 접수','신청 및 등록 명단'],['bracket','02','대진표','경기 편성과 배정 코트'],['ranking','03','경기 결과','부서별 시합 결과']];
  items.forEach(([page,num,title,description])=>{
    const action=button('',()=>onNavigate(page,t.id));action.className='experience-step';
    action.append(node('span','experience-step-number',num));const text=node('span');text.append(node('strong','',title),node('small','',description));action.append(text,node('span','experience-arrow','→'));
    if((page==='register'&&t.status==='open')||(page==='bracket'&&['closed','ongoing'].includes(t.status))||(page==='ranking'&&t.status==='finished'))action.dataset.current='true';
    steps.append(action);
  });host.append(steps);
  if(t.status!=='open')host.append(node('p','experience-hint','접수 기간이 끝난 대회는 등록 명단을 확인할 수 있습니다. 변경 가능 여부는 기존 대회 권한과 등록 기한을 따릅니다.'));
  if(t.notice){const notice=node('div','experience-notice');notice.append(node('strong','','대회 공지'),node('p','',t.notice));host.append(notice);}
}

export function showRegistrationReceipt(data,{onRoster,onBracket}={}){
  let dialog=document.getElementById('registrationReceipt');
  if(dialog)dialog.remove();
  dialog=node('dialog','experience-receipt');dialog.id='registrationReceipt';dialog.setAttribute('aria-labelledby','receiptTitle');
  const heading=node('div','receipt-heading');
  heading.append(node('span','receipt-check','✓'));
  const title=node('h2','',data.updated?'명단 수정이 완료되었습니다':'참가 접수가 완료되었습니다');title.id='receiptTitle';heading.append(title,node('p','','저장된 명단을 확인해 주세요.'));
  const close=button('닫기',()=>dialog.close());close.className='receipt-close';close.setAttribute('aria-label','접수 확인 닫기');heading.append(close);dialog.append(heading);
  const info=node('dl','receipt-info');
  for(const [label,value] of [['대회',data.tournament],['부서',data.division],['팀',data.team]])info.append(node('dt','',label),node('dd','',value||'-'));
  dialog.append(info,node('h3','',`등록 선수 ${data.players.length}명`));
  const list=node('ol','receipt-players');data.players.forEach(name=>list.append(node('li','',name)));dialog.append(list);
  if(data.warning)dialog.append(node('p','experience-hint',data.warning));
  const feedback=node('p','receipt-feedback');feedback.setAttribute('role','status');dialog.append(feedback);
  const actions=node('div','experience-actions');
  actions.append(button('등록 명단 보기',()=>{dialog.close();onRoster?.();},true),button('대진표 보기',()=>{dialog.close();onBracket?.();}));
  actions.append(button('명단 공유 / 복사',async()=>{
    const text=receiptText(data);
    try{
      if(navigator.share){await navigator.share({title:data.tournament,text});feedback.textContent='공유했습니다.';}
      else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);feedback.textContent='명단을 복사했습니다.';}
      else throw Error('copy unavailable');
    }catch(e){
      if(e.name==='AbortError')return;
      let field=dialog.querySelector('textarea');
      if(!field){field=node('textarea','form-textarea');field.readOnly=true;field.setAttribute('aria-label','복사할 접수 명단');dialog.append(field);}
      field.value=text;field.focus();field.select();feedback.textContent='아래 명단을 선택해 복사할 수 있습니다.';
    }
  }));dialog.append(actions);document.body.append(dialog);dialog.showModal();
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  return dialog;
}

export function installBracketNavigator({onMyMatches,onLogin,hasClub}){
  const host=document.getElementById('page-bracket');if(!host)return;
  let tools=document.getElementById('experienceBracketTools');
  if(!tools){tools=node('div','experience-bracket-tools');tools.id='experienceBracketTools';host.prepend(tools);}
  tools.replaceChildren();
  const feedback=node('span','experience-hint');feedback.setAttribute('role','status');
  tools.append(button('내 경기 모아보기',()=>hasClub()?onMyMatches():onLogin()));
  tools.append(button('내 팀 위치로',()=>{
    if(!hasClub()){onLogin();return;}
    const targets=[...host.querySelectorAll('.own-club-bracket-pulse')].filter(el=>el.getClientRects().length);
    const target=targets.find(el=>el.closest('#bracketContent'))||targets[0];
    if(!target){feedback.textContent='선택한 대회의 공개 대진표에 내 클럽이 없습니다.';return;}
    target.scrollIntoView({block:'center',inline:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    target.setAttribute('tabindex','-1');target.focus({preventScroll:true});feedback.textContent='내 클럽 위치로 이동했습니다.';
  }));
  feedback.textContent='내 클럽을 테두리로 강조합니다. 모바일 대진표에서 확대·전체맞춤을 사용할 수 있습니다.';tools.append(feedback);
}
