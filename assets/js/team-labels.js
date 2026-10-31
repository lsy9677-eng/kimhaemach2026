export function teamRegistrationLabels(teams=[]){
 const result=new Map(),groups=new Map();
 for(const team of teams){const key=JSON.stringify([team.division||team.div||'',team.club||'']);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(team);}
 for(const group of groups.values()){
  const used=new Set(group.map(t=>String(t.teamLabel||'').trim()).filter(Boolean));let index=0;
  for(const team of group){let label=String(team.teamLabel||'').trim();if(!label){do{label=alphabeticLabel(index++);}while(used.has(label));used.add(label);}result.set(team._id||team,label);}
 }
 return result;
}
function alphabeticLabel(index){let label='';do{label=String.fromCharCode(65+index%26)+label;index=Math.floor(index/26)-1;}while(index>=0);return label;}
export function planTeamLabelEdit(teams,id,requested){
 const target=teams.find(t=>t._id===id);if(!target)throw new Error('수정할 팀을 찾을 수 없습니다.');
 const label=String(requested||'').trim().toUpperCase();
 if(!/^[A-Z0-9가-힣 ]{1,12}$/.test(label))throw new Error('팀 구분은 한글·영문·숫자 1~12자로 입력해주세요.');
 const group=teams.filter(t=>t.club===target.club&&(t.division||t.div||'')===(target.division||target.div||''));
 const labels=teamRegistrationLabels(group),original=labels.get(id),other=group.find(t=>t._id!==id&&labels.get(t._id)===label);
 labels.set(id,label);if(other)labels.set(other._id,original);
 return labels;
}
