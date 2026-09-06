'use strict';

/**
 * 김해시테니스협회 공식 선수등록명단 데이터 엔진 - Phase 3
 * UI/권한/전역 상태를 직접 건드리지 않고,
 * memberRegistries 저장/로드와 2026 명단 파싱만 담당한다.
 */

export function buildRegistryVersion(year, currentYear){
  return year===currentYear ? `registry-${currentYear}-v1` : `registry-${year}-v1`;
}

export async function loadRegistryDocument({
  db, doc, getDoc, year
}){
  const snap = await getDoc(doc(db,'memberRegistries',String(year)));
  if(!snap.exists()) return {exists:false, members:[], version:''};
  const data = snap.data() || {};
  return {
    exists:true,
    members:Array.isArray(data.members) ? data.members : [],
    version:String(data.version||'')
  };
}

export async function saveRegistryDocument({
  db, doc, setDoc, serverTimestamp, year, members, version
}){
  await setDoc(doc(db,'memberRegistries',String(year)),{
    members:Array.isArray(members) ? members : [],
    version:String(version||''),
    updatedAt:serverTimestamp()
  });
}

export function normalizeRegistryRows(rows, {
  normalizeClub,
  normalizeName
}){
  const HEADER_WORDS=/회원명|선수명|이름|성명|클럽명|클럽|소속|전화|휴대/;
  const out=[];
  let nameCol=-1, clubCol=-1, phoneCol=-1;
  let dataStartIdx=0;

  if(rows?.length && Array.isArray(rows[0])){
    const firstRow=rows[0].map(c=>(c??'').toString().trim());
    const isHeader=firstRow.some(c=>HEADER_WORDS.test(c));
    if(isHeader){
      firstRow.forEach((c,i)=>{
        if(/회원명|선수명|이름|성명/.test(c)) nameCol=i;
        else if(/클럽명|클럽|소속/.test(c)) clubCol=i;
        else if(/전화|휴대/.test(c)) phoneCol=i;
      });
      dataStartIdx=1;
    }
  }

  (rows||[]).forEach((raw,rowIdx)=>{
    if(rowIdx<dataStartIdx) return;
    let name='', club='', phone='';

    if(Array.isArray(raw)){
      const cols=raw.map(c=>(c??'').toString().trim());
      if(cols.every(c=>!c)) return;
      if(nameCol>=0 && clubCol>=0){
        name=cols[nameCol]||'';
        club=cols[clubCol]||'';
        phone=phoneCol>=0?(cols[phoneCol]||''):'';
      }else{
        name=(cols[0]||'').trim();
        club=(cols[1]||'').trim();
        phone=(cols[2]||'').trim();
        if(/^\d+$/.test(phone)) phone='';
      }
    }else if(raw && typeof raw==='object'){
      const vals=Object.values(raw||{});
      name=(raw.name ?? raw.이름 ?? raw.회원명 ?? raw.선수명 ?? vals[0] ?? '').toString().trim();
      club=(raw.club ?? raw.클럽 ?? raw.클럽명 ?? raw.소속 ?? vals[1] ?? '').toString().trim();
      phone=(raw.phone ?? raw.전화번호 ?? raw.휴대폰 ?? vals[2] ?? '').toString().trim();
    }else{
      const line=(raw||'').toString().trim();
      if(!line) return;
      let parts=line.split(/\t|,|;/).map(x=>x.trim()).filter(Boolean);
      if(parts.length<2) parts=line.split(/\s{2,}/).map(x=>x.trim()).filter(Boolean);
      if(parts.length<2) parts=line.split(/\s+/).map(x=>x.trim()).filter(Boolean);
      name=parts[0]||'';
      club=parts[1]||'';
      phone=parts[2]||'';
      if(/^\d+$/.test(phone)) phone='';
    }

    if(!name || !club) return;
    if(HEADER_WORDS.test(name) || HEADER_WORDS.test(club)) return;

    club=normalizeClub(club);
    name=(normalizeName(name)||'').replace(/\s+/g,' ').trim();
    if(!name || !club) return;

    const key=normalizeName(name)+'__'+normalizeClub(club);
    out.push({key,name,club,phone:String(phone||'').trim()});
  });

  const map=new Map();
  out.forEach(r=>map.set(r.key,r));
  return [...map.values()];
}

export function parseOfficialRegistryExcelRows(rawRows){
  if(!Array.isArray(rawRows) || !rawRows.length){
    return {ok:false,error:'데이터가 없습니다',rows:[]};
  }
  const hdr=rawRows[0].map(c=>(c??'').toString().trim());
  let nameCol=-1,clubCol=-1,regionCol=-1,subCol=-1;
  hdr.forEach((h,i)=>{
    if(/회원명|선수명|이름|성명/.test(h)) nameCol=i;
    else if(/주클럽|등록클럽|클럽/.test(h)) clubCol=i;
    else if(/지역/.test(h)) regionCol=i;
    else if(/부클럽|중복/.test(h)) subCol=i;
  });
  if(nameCol<0 || clubCol<0){
    return {ok:false,error:'회원명/클럽 컬럼을 찾지 못했습니다',rows:[]};
  }
  const rows=[];
  rawRows.slice(1).forEach(row=>{
    const name=(row[nameCol]??'').toString().trim();
    const club=(row[clubCol]??'').toString().trim();
    if(!name || !club) return;
    rows.push({
      name,
      club,
      region:regionCol>=0?(row[regionCol]??'').toString().trim():'',
      subClub:subCol>=0?(row[subCol]??'').toString().trim():''
    });
  });
  if(!rows.length) return {ok:false,error:'유효한 데이터가 없습니다',rows:[]};
  return {ok:true,error:'',rows};
}
