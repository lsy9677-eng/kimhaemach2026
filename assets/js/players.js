'use strict';

/**
 * 김해시테니스협회 선수 모듈 - Phase 2
 * 현재 단계에서는 데이터 구조를 바꾸지 않고,
 * 선수 식별/이름/클럽/전화번호 정규화처럼 부작용이 없는 공통 유틸만 분리한다.
 */

export function normalizePhoneDigits(raw=''){
  return String(raw||'').replace(/[^0-9]/g,'');
}

// 동명이인 구분 키: "이름__클럽"
export function pKey(name,club){
  return (name&&club)?name+'__'+club:(name||'');
}

// "하모니A"→"하모니", "남산B"→"남산", "UP A"→"UP"
export function baseClub(club){
  if(!club) return '';
  let m=club.match(/^(.+?)\s+([A-D])$/);
  if(m && m[1].trim().length>=2) return m[1].trim();

  m=club.match(/^(.+?)([A-D])$/);
  if(m && /[가-힣]/.test(m[1]) && m[1].trim().length>=2) return m[1].trim();
  return club;
}

export function pKeyParse(key){
  const i=(key||'').lastIndexOf('__');
  return i>0
    ? {name:key.slice(0,i),club:key.slice(i+2)}
    : {name:key,club:''};
}

export function normName(s){
  return (s||'').replace(/\s+/g,'').trim();
}

// "강민지(010-2574-4391)" → "강민지"
export function cleanName(s){
  if(!s) return '';
  return s.replace(/\s*\(0\d{1,2}[-\d]+\)/g,'').trim();
}

export function splitKeyNameClub(raw){
  const pk=pKeyParse(raw||'');
  const name=cleanName(pk.name||raw||'');
  const club=(pk.club||'').trim();
  return {name,club};
}

const CLUB_NORMALIZE_MAP={
  'ltc':'LTC','LtC':'LTC','Ltc':'LTC',
  't-one':'T-ONE','t-One':'T-ONE','T-One':'T-ONE','tOne':'T-ONE','tone':'T-ONE','T-one':'T-ONE',
  'up테니스':'UP테니스','UP 테니스':'UP테니스','up 테니스':'UP테니스','Up테니스':'UP테니스','up':'UP테니스',
  'udt':'UDT','Udt':'UDT',
  '김해시시니어 클럽':'김해시니어','김해시시니어클럽':'김해시니어','김해시 시니어 클럽':'김해시니어','김해시 시니어클럽':'김해시니어','시니어클럽':'김해시니어',
};

export function normalizeClub(club){
  if(!club) return '';
  const t=club.trim().replace(/\s+/g,' ');
  if(CLUB_NORMALIZE_MAP[t]) return CLUB_NORMALIZE_MAP[t];
  const lo=t.toLowerCase();
  for(const [k,v] of Object.entries(CLUB_NORMALIZE_MAP)){
    if(k.toLowerCase()===lo) return v;
  }
  return t;
}

export function formatRecentLabel(lastDate){
  if(!lastDate) return '-';
  const d=new Date(lastDate);
  if(Number.isNaN(d.getTime())) return lastDate;
  const yy=d.getFullYear();
  const mm=String(d.getMonth()+1).padStart(2,'0');
  const dd=String(d.getDate()).padStart(2,'0');
  return `${yy}.${mm}.${dd}`;
}
