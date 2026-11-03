import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {selectLowestEliminatedTeam} from '../assets/js/jangyu-silver-eligibility.js';
const src=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
test('gold selection compares all eliminated teams and excludes main entrants',()=>{
 const eliminated=(id)=>({_id:id,club:id,players:[id+'선수'],_pastOutcome:{confirmed:true,result:'예선 탈락'}});
 const c={selectLowestEliminatedTeam,G:{tournaments:[{id:'past',divisions:['금']}],teams:{past_금:[eliminated('a'),eliminated('b'),{_id:'main',_pastOutcome:{confirmed:true,result:'우승'}}]},matches:{past_금:[
 {phase:'group',t1:0,t2:2,winner:2,sc1:1,sc2:2,rubbers:[{score1:6,score2:4},{score1:2,score2:6},{score1:3,score2:6}]},
 {phase:'group',t1:1,t2:2,winner:2,sc1:0,sc2:3,rubbers:[{score1:1,score2:6},{score1:2,score2:6},{score1:3,score2:6}]}]}},
 tdn:team=>team.club,_ruleDivKey:()=> 'gold',getMatchResultState:(key,m)=>({...m,done:true}),getMatchDoublesCount:()=>3,getRubberScoreErrorMessage:()=>'',analyzeRubberScore:()=>({})};
 vm.createContext(c);vm.runInContext(src.slice(src.indexOf('function jangyuSilverSelection('),src.indexOf('async function openJangyuSilverSelection')),c);
 const result=c.jangyuSilverSelection('past');assert.equal(result.team.id,'b');assert.equal(result.team.setDiff,-3);assert.equal(result.team.gameDiff,-12);
 assert.equal(result.team.players[0],'b선수');assert.equal(result.candidates.length,1);
});
