'use strict';

/**
 * 김해시테니스협회 팀/개인전 등록 검증 유틸 - Phase 7
 *
 * Firebase / DOM / 전역 상태를 직접 변경하지 않는다.
 * 등록 전 입력값 검증과 중복 판정만 담당한다.
 */

export function validateRegistrationCapacity({
  currentCount=0,
  maxTeams=0,
  isIndividual=false
}){
  const max=Number(maxTeams||0);
  if(max>0 && Number(currentCount||0)>=max){
    return {
      ok:false,
      error:`이 부서는 정원(${max}${isIndividual?'조':'팀'})이 마감되었습니다`
    };
  }
  return {ok:true,error:''};
}

export function validateIndividualRegistration({
  names=[],
  player1Club='',
  player2Club='',
  editPin='',
  player1Phone='',
  player2Phone='',
  smsFlags=[],
  existingTeams=[]
}){
  const cleanNames=(names||[]).filter(Boolean);

  if(cleanNames.length!==2){
    return {ok:false,error:'개인전은 참가자 2명을 모두 입력해야 합니다'};
  }

  if(new Set(cleanNames).size!==2){
    return {ok:false,error:'참가자 이름이 중복됩니다'};
  }

  if(!String(player1Club||'').trim() || !String(player2Club||'').trim()){
    return {ok:false,error:'각 참가자 클럽을 입력해 주세요'};
  }

  if(!/^\d{4}$/.test(String(editPin||''))){
    return {ok:false,error:'수정/삭제 비밀번호는 숫자 4자리로 입력해 주세요'};
  }

  if(!player1Phone || !player2Phone){
    return {ok:false,error:'개인전은 참가자 2명의 휴대폰 번호를 모두 입력해야 합니다'};
  }

  const p1digits=String(player1Phone||'').replace(/[^0-9]/g,'');
  const p2digits=String(player2Phone||'').replace(/[^0-9]/g,'');
  if(p1digits.length<9 || p2digits.length<9){
    return {ok:false,error:'전화번호를 확인해 주세요'};
  }

  if(!(smsFlags||[]).some(Boolean)){
    return {ok:false,error:'최소 1명은 문자 수신 대상으로 선택해 주세요'};
  }

  const pairKey=[...cleanNames].sort().join('|');
  const duplicate=(existingTeams||[]).some(tm=>
    ((tm.players||[]).slice().sort().join('|'))===pairKey
  );
  if(duplicate){
    return {ok:false,error:'같은 페어가 이미 접수되어 있습니다'};
  }

  return {ok:true,error:''};
}

export function validateTeamRegistration({
  names=[],
  club='',
  maxPlayers=0,
  existingTeams=[],
  makePlayerKey
}){
  if(!String(club||'').trim()){
    return {ok:false,error:'클럽 선택'};
  }

  const cleanNames=(names||[]).filter(Boolean);
  if(cleanNames.length<1){
    return {ok:false,error:'선수를 1명 이상 입력해주세요'};
  }

  const max=Number(maxPlayers||0);
  if(max>0 && cleanNames.length>max){
    return {ok:false,error:`최대 ${max}명까지 등록할 수 있습니다`};
  }

  if(new Set(cleanNames).size!==cleanNames.length){
    return {ok:false,error:'이름 중복 있음'};
  }

  if(typeof makePlayerKey==='function'){
    const newKeys=new Set(cleanNames.map(n=>makePlayerKey(n,club)));
    const duplicate=(existingTeams||[]).some(tm=>
      (tm.players||[]).some(p=>newKeys.has(makePlayerKey(p,tm.club||club)))
    );
    if(duplicate){
      return {ok:false,error:'이미 등록된 선수 포함(같은 클럽 기준)'};
    }
  }

  return {ok:true,error:''};
}
