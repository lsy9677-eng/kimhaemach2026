import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {prioritizeSameClubMatches,sameClubMatch} from '../assets/js/round-robin-order.js';
const src=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
const tokens=team=>team.club?[team.club]:[];
test('full league permits same-club teams without weakening ordinary group separation',()=>{
 const c={getTeamClubTokens:tokens,shuffle:ids=>ids.reverse()};vm.createContext(c);
 vm.runInContext(src.slice(src.indexOf('function getPrelimSeedDistributedGroups('),src.indexOf('function buildGreedyBalancedGroups(')),c);
 for(const n of [3,4,5]){const teams=Array.from({length:n},(_,i)=>({club:i===0||i===2?'능동':'클럽'+i}));const ids=teams.map((_,i)=>i);
 const groups=c.getPrelimSeedDistributedGroups(ids,teams,[n],{},'roundrobin');assert.equal(groups.length,1);assert.equal(groups[0].teams.length,n);
 assert.throws(()=>c.getPrelimSeedDistributedGroups(ids,teams,[n],{},'group_knockout'),/같은 클럽/);
 }
});
test('automatic and rebuilt league schedules put same-club encounters before every cross-club match',()=>{
 for(const n of [3,4,5]){
 const teams=Array.from({length:n},(_,i)=>({club:i===0||i===2?'능동':'클럽'+i}));
 const c={G:{tournaments:[{id:'t'}],teams:{t_은:teams},draws:{t_은:{groups:[{teams:teams.map((_,i)=>i).reverse()}]}}},_k2td:()=>({tid:'t',div:'은'}),gDS:()=>({format:'roundrobin'}),getTeamClubTokens:tokens,prioritizeSameClubMatches};
 vm.createContext(c);vm.runInContext(src.slice(src.indexOf('function buildFreshGroupMatchesFromDraw('),src.indexOf('async function resetPrelimDrawOnly(')),c);
 const matches=c.buildFreshGroupMatchesFromDraw('t_은');assert.equal(matches.length,n*(n-1)/2);assert.equal(sameClubMatch(matches[0],teams,tokens),true);
 assert.equal(new Set(matches.map(m=>[m.t1,m.t2].sort().join('|'))).size,matches.length);
 assert.ok(matches.slice(1).every(m=>!sameClubMatch(m,teams,tokens)));assert.equal(matches[0].leagueOrder,0);
 }
});
test('all same-club pairs are first when several clubs enter multiple teams, with results preserved',()=>{
 const teams=[{club:'A'},{club:'B'},{club:'A'},{club:'B'}],matches=[];
 for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)matches.push({id:`${a}-${b}`,t1:a,t2:b,winner:a});
 const before=JSON.stringify(matches),ordered=prioritizeSameClubMatches(matches,teams,tokens);
 assert.equal(sameClubMatch(ordered[0],teams,tokens),true);assert.equal(sameClubMatch(ordered[1],teams,tokens),true);assert.ok(ordered.slice(2).every(m=>!sameClubMatch(m,teams,tokens)));
 assert.equal(JSON.stringify(matches),before);assert.ok(ordered.every(m=>m.winner===m.t1));
});

test('four-team league begins with clubmates then the remaining two teams, in three complementary rounds',()=>{
 const teams=[{club:'모던'},{club:'다른클럽'},{club:'모던'},{club:'네번째'}],matches=[];
 for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)matches.push({id:`${a}-${b}`,t1:a,t2:b,winner:a===0&&b===2?0:null});
 const ordered=prioritizeSameClubMatches(matches,teams,tokens);
 assert.deepEqual(ordered.map(m=>m.id),['0-2','1-3','0-1','2-3','0-3','1-2']);
 for(let i=0;i<6;i+=2)assert.equal(new Set(ordered.slice(i,i+2).flatMap(m=>[m.t1,m.t2])).size,4);
 assert.equal(ordered[0].winner,0);
});
