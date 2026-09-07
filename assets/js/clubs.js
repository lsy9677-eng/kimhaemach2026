'use strict';

/**
 * 김해시테니스협회 클럽/경기이사 인증 공통 유틸 - Phase 5
 *
 * 이 모듈은 Firebase 쓰기나 화면 제어를 직접 하지 않는다.
 * 클럽별 비밀번호/연락처/세션 판정처럼 부작용 없는 계산만 담당한다.
 */

export function getDirectorSessionVersion(meta){
  return Number(meta?.regSessionVersion || 1);
}

export function isClubPasswordCustomValue(meta, club){
  if(!club) return false;
  return !!((meta?.clubPasswordCustom || {})[club]);
}

export function getClubTemporaryPassword(meta, club){
  if(!club) return '';
  const contacts = meta?.clubContacts || {};
  const phone = String(contacts[club] || '').replace(/[^0-9]/g,'');
  if(phone) return phone.slice(-4);
  return String(meta?.regPw || '');
}

export function getClubStoredPassword(meta, club){
  if(!club) return '';
  return String((meta?.clubPasswords || {})[club] || '');
}

export function getClubLoginPassword(meta, club){
  return getClubStoredPassword(meta, club) || String(meta?.regPw || '202601');
}

export function getClubLoginHint(meta, club){
  if(!club){
    return {text:'', color:''};
  }
  const stored = getClubStoredPassword(meta, club);
  if(stored){
    return {
      text:'✅ 클럽 전용 비밀번호로 로그인하세요.',
      color:'var(--success)'
    };
  }
  return {
    text:`공용 비밀번호(${meta?.regPw || '202601'})로 로그인하세요.`,
    color:'#e67e22'
  };
}

export function shouldPromptClubPasswordChange(meta, club, skippedAt=0, now=Date.now()){
  if(!club) return false;
  if(isClubPasswordCustomValue(meta, club)) return false;

  const skipTime = Number(skippedAt || 0);
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  if(skipTime && now - skipTime < threeDays) return false;
  return true;
}

export function isDirectorSessionVersionValid(meta, localVersion){
  const localVer = Number(localVersion || 1);
  const remoteVer = getDirectorSessionVersion(meta);
  return localVer === remoteVer;
}

export function getClubContact(meta, club){
  if(!club) return '';
  return String((meta?.clubContacts || {})[club] || '');
}

export function hasClubContact(meta, club){
  const digits = getClubContact(meta, club).replace(/[^0-9]/g,'');
  return digits.length >= 9;
}

export function derivePasswordFromPhone(phone){
  const digits = String(phone || '').replace(/[^0-9]/g,'');
  return digits.slice(-4);
}


export function ensureClubAuthMaps(meta){
  if(!meta.clubContacts || typeof meta.clubContacts!=='object') meta.clubContacts={};
  if(!meta.clubEmails || typeof meta.clubEmails!=='object') meta.clubEmails={};
  if(!meta.clubPasswords || typeof meta.clubPasswords!=='object') meta.clubPasswords={};
  if(!meta.clubPasswordCustom || typeof meta.clubPasswordCustom!=='object') meta.clubPasswordCustom={};
  return meta;
}

export function setClubPassword(meta, club, password, {custom=true}={}){
  ensureClubAuthMaps(meta);
  meta.clubPasswords[club]=String(password||'');
  meta.clubPasswordCustom[club]=!!custom;
  return {
    password:meta.clubPasswords[club],
    custom:meta.clubPasswordCustom[club]
  };
}

export function resetClubPasswordToTemporary(meta, club){
  ensureClubAuthMaps(meta);
  const tempPassword=getClubTemporaryPassword(meta,club);
  meta.clubPasswords[club]=tempPassword;
  meta.clubPasswordCustom[club]=false;
  return {password:tempPassword,custom:false};
}

export function saveClubContact(meta, club, phone, {
  setPasswordIfMissing=true
}={}){
  ensureClubAuthMaps(meta);
  const normalized=String(phone||'').replace(/[^0-9-]/g,'');
  meta.clubContacts[club]=normalized;

  let derived='';
  if(normalized){
    derived=derivePasswordFromPhone(normalized);
    if(setPasswordIfMissing && derived.length===4 && !meta.clubPasswords[club]){
      meta.clubPasswords[club]=derived;
      meta.clubPasswordCustom[club]=false;
    }
  }
  return {phone:normalized,derivedPassword:derived};
}

export function saveClubDirectorContact(meta, club, phone, email=''){
  const result=saveClubContact(meta,club,phone,{setPasswordIfMissing:true});
  ensureClubAuthMaps(meta);
  const normalizedEmail=String(email||'').trim().toLowerCase();
  if(normalizedEmail) meta.clubEmails[club]=normalizedEmail;
  return {...result,email:normalizedEmail};
}

export function registerFirstLoginContact(meta, club, phone){
  ensureClubAuthMaps(meta);
  const normalized=String(phone||'').replace(/[^0-9-]/g,'');
  const last4=derivePasswordFromPhone(normalized);
  meta.clubContacts[club]=normalized;
  meta.clubPasswords[club]=last4;
  meta.clubPasswordCustom[club]=false;
  return {phone:normalized,password:last4,custom:false};
}


export function ensureClubDefaultRegions(meta){
  if(!meta.clubDefaultRegions || typeof meta.clubDefaultRegions!=='object'){
    meta.clubDefaultRegions={};
  }
  return meta.clubDefaultRegions;
}

export function getClubDefaultRegion(meta, club){
  if(!club) return '';
  const map=ensureClubDefaultRegions(meta);
  return String(map[club]||'').trim();
}

export function setClubDefaultRegion(meta, club, region){
  if(!club) return '';
  const map=ensureClubDefaultRegions(meta);
  const value=String(region||'').trim();
  if(value) map[club]=value;
  else delete map[club];
  return value;
}

export function applyClubDefaultRegion(meta, member){
  if(!member || member.region) return {...member};
  const region=getClubDefaultRegion(meta,member.club);
  return region ? {...member,region} : {...member};
}

export function applyClubDefaultRegions(meta, members, {onlyMissing=true}={}){
  let changed=0;
  const next=(members||[]).map(member=>{
    if(!member) return member;
    if(onlyMissing && String(member.region||'').trim()) return {...member};
    const region=getClubDefaultRegion(meta,member.club);
    if(!region) return {...member};
    if(String(member.region||'').trim()!==region) changed++;
    return {...member,region};
  });
  return {members:next,changed};
}
