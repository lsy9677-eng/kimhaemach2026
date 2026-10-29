// Share approved eligibility, never annual entry requirements or application documents.
export function projectSharedRegistry(rows=[]){
  return rows.map(r=>({name:r.name||'',club:r.club||'',subClub:r.subClub||'',playerId:r.playerId||'',identityTag:r.identityTag||(String(r.name||'').match(/[([]([A-Z0-9]{1,8})[)\]]\s*$/i)||[])[1]||'',age65Certified:r.age65Certified===true}));
}
export function projectSharedCertificates(rows=[]){
  return rows.map(r=>({name:r.name||r.nameNorm||'',club:r.clubAtApproval||r.club||'',playerId:r.playerId||'',identityTag:r.identityTag||'',certified:r.certified===true}));
}
export function resolveSharedAge65(person,registry=[],certificates=[],normalize={}){
  const nameKey=normalize.name||((v)=>String(v||'').replace(/\s/g,''));
  const clubKey=normalize.club||((v)=>String(v||'').replace(/\s/g,''));
  const name=nameKey(person.name),club=clubKey(person.club),tag=String(person.identityTag||'').toUpperCase();
  if(!name||!club)return {approved:false,reason:'missing-identity'};
  const clubs=r=>[r.club,...String(r.subClub||'').split(/[,，]/)].map(clubKey).filter(Boolean);
  const matching=registry.filter(r=>nameKey(r.name)===name&&clubs(r).includes(club));
  let candidates=matching;
  if(person.playerId&&matching.some(r=>r.playerId===person.playerId))candidates=matching.filter(r=>r.playerId===person.playerId);
  if(tag)candidates=candidates.filter(r=>String(r.identityTag||'').toUpperCase()===tag);
  if(candidates.length!==1)return {approved:false,reason:candidates.length?'ambiguous':'not-matched'};
  const row=candidates[0];
  if(row.age65Certified===true)return {approved:true,reason:'registry-approved'};
  const approved=certificates.some(cert=>{
    if(cert.certified!==true||nameKey(cert.name)!==name)return false;
    if(cert.playerId)return !!row.playerId&&cert.playerId===row.playerId;
    if(cert.identityTag)return !!row.identityTag&&String(cert.identityTag).toUpperCase()===String(row.identityTag).toUpperCase()&&clubs(row).includes(clubKey(cert.club));
    const approvalClub=clubKey(cert.club);
    if(!approvalClub||!clubs(row).includes(approvalClub))return false;
    // A name-only legacy approval cannot distinguish namesakes within the approval club.
    return registry.filter(r=>nameKey(r.name)===name&&clubs(r).includes(approvalClub)).length===1;
  });
  return {approved,reason:approved?'certificate-approved':'not-certified'};
}
