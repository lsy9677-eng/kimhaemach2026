'use strict';

/**
 * 김해시테니스협회 경기결과 계산 유틸 - Phase 33
 *
 * DOM/Firebase/선수기록을 직접 변경하지 않는다.
 * 복식별 점수 판정과 전체 경기 승패 확정 계산만 담당한다.
 */

export function analyzeRubberScore(score1Raw, score2Raw){
  const s1=String(score1Raw ?? '');
  const s2=String(score2Raw ?? '');

  if(s1==='' && s2===''){
    return {kind:'empty',score1:null,score2:null,winner:null,error:''};
  }

  if(s1==='0' && s2==='0'){
    return {kind:'zero_zero',score1:0,score2:0,winner:null,error:''};
  }

  const n1=parseInt(s1,10);
  const n2=parseInt(s2,10);

  if(Number.isNaN(n1) || Number.isNaN(n2)){
    return {kind:'invalid',score1:n1,score2:n2,winner:null,error:'invalid_number'};
  }

  if(n1===n2){
    return {kind:'tie',score1:n1,score2:n2,winner:null,error:'tie_not_allowed'};
  }

  return {
    kind:'scored',
    score1:n1,
    score2:n2,
    winner:n1>n2?0:1,
    error:''
  };
}

export function getRubberScoreErrorMessage(result, rubberNumber){
  const no=Number(rubberNumber||0);
  if(result?.error==='invalid_number'){
    return `${no}복식 점수를 확인하세요`;
  }
  if(result?.error==='tie_not_allowed'){
    return `${no}복식: 동점(${result.score1}:${result.score2})은 불가 — 스코어를 다르게 입력하세요`;
  }
  return '';
}

export function countRubberWins(rubbers){
  let score1=0;
  let score2=0;
  let validScoreCount=0;

  for(const r of (rubbers||[])){
    if(!r || r.winner==null) continue;
    if(r.winner===0) score1++;
    else if(r.winner===1) score2++;
    validScoreCount++;
  }

  return {score1,score2,validScoreCount};
}

export function getTeamMatchOutcome({
  score1=0,
  score2=0,
  totalRubbers=0
}={}){
  const s1=Number(score1||0);
  const s2=Number(score2||0);
  const total=Math.max(1,Number(totalRubbers||0));
  const needWins=Math.floor(total/2)+1;
  const isTieState=s1===s2;
  const hasFinalWinner=!isTieState && (s1>=needWins || s2>=needWins);
  const winnerSide=hasFinalWinner ? (s1>s2?1:2) : 0;

  return {
    score1:s1,
    score2:s2,
    totalRubbers:total,
    needWins,
    isTieState,
    hasFinalWinner,
    winnerSide
  };
}

export function resolveWinnerTeamIndex({
  team1Index=null,
  team2Index=null,
  outcome=null
}={}){
  if(!outcome?.hasFinalWinner) return null;
  return outcome.winnerSide===1 ? team1Index : team2Index;
}

export function buildResultSaveLabel(outcome){
  if(outcome?.hasFinalWinner) return '결과 저장 ✅';
  if(outcome?.isTieState) return '동점 상태로 실시간 스코어 저장 ✅';
  return '실시간 스코어 저장 ✅';
}
