// Synthetic fixtures only. Targets are literal loopback demo projects.
import {fileURLToPath} from 'node:url';
export const targets=[{org:'kimhae',project:'demo-kimhae-dev',port:8080},{org:'jangyu',project:'demo-jangyu-dev',port:8081}];
function value(x){
  if(x===null)return {nullValue:null};
  if(Array.isArray(x))return {arrayValue:{values:x.map(value)}};
  if(typeof x==='object')return {mapValue:{fields:fields(x)}};
  if(typeof x==='boolean')return {booleanValue:x};
  if(typeof x==='number')return {integerValue:String(x)};
  return {stringValue:x};
}
const fields=x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,value(v)]));
export async function seed(){
  for(const {org,project,port} of targets){
    const base=`http://127.0.0.1:${port}/v1/projects/${project}/databases/(default)/documents`;
    const fixtures={
      'meta/config':{pw:'demo-admin-2026',regPw:'demo-only',clubs:['가상테스트클럽','가상상대클럽'],regSessionVersion:1,usePlayerRegistry:false,showAssociationDashboard:false,appTitle:`개발 ${org} 대회관리`,adminPhone:'',clubContacts:{},clubPasswords:{'가상테스트클럽':'demo-club-2026'},clubPasswordCustom:{'가상테스트클럽':true},directorPasswords:{'가상테스트클럽':'demo-club-2026'},directorPasswordCustom:{'가상테스트클럽':true}},
      'memberRegistries/2026':{members:[{name:'가상선수하나',club:'가상테스트클럽',region:'가상지역'}]},
      'tournaments/demo-cup':{name:`가상 ${org} 테스트 대회`,date:'2099-01-01',status:'ongoing',createdAt:'2026-01-01T00:00:00.000Z',type:'team',divisions:['금'],divSettings:{'금':{format:'tournament',doublesCount:1,thirdPlaceMode:'none'}}},
      'registrations/demo-home':{tournamentId:'demo-cup',division:'금',club:'가상테스트클럽',teamName:'가상홈팀',players:['가상선수하나','가상선수둘'],createdAt:'2026-01-01T00:00:00.000Z'},
      'registrations/demo-away':{tournamentId:'demo-cup',division:'금',club:'가상상대클럽',teamName:'가상원정팀',players:['가상선수셋','가상선수넷'],createdAt:'2026-01-01T00:00:01.000Z'},
      'matches/demo-match':{id:'demo-match',tournamentId:'demo-cup',division:'금',phase:'main',round:1,slot:0,t1:0,t2:1,winner:null,rubbers:[{players1:[],players2:[],s1:0,s2:0}],court:''}
    };
    for(const [document,data] of Object.entries(fixtures)){
      const response=await fetch(`${base}/${document}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:fields(data)}),signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error(`가상 데이터 생성 실패: ${org}/${document} ${response.status}`);
    }
    console.log(`${org}: 가상 데이터 준비 완료`);
  }
}
if(process.argv[1]===fileURLToPath(import.meta.url))await seed();
