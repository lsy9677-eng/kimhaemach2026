import test from 'node:test';
import assert from 'node:assert/strict';
import {selectLowestEliminatedTeam as select} from '../assets/js/jangyu-silver-eligibility.js';
const row=(id,setDiff,gameDiff,extra={})=>({id,club:id,players:[id+'선수'],w:0,setDiff,gameDiff,setsReady:true,gamesReady:true,...extra});
test('only one team qualifies by wins then set differential then score differential',()=>{
 assert.equal(select([row('a',-2,-5),row('b',-4,-3)]).team.id,'b');
 assert.equal(select([row('a',-4,-5),row('b',-4,-8)]).team.id,'b');
 assert.equal(select([row('a',-2,-5),row('b',-4,-3,{w:1})]).team.id,'a');
});
test('exact ties need an administrator selection bound to unchanged results',()=>{
 const rows=[row('a',-4,-8),row('b',-4,-8)];const initial=select(rows);assert.equal(initial.status,'tie');
 const decision={teamId:'b',fingerprint:initial.fingerprint};assert.equal(select(rows,decision).team.id,'b');
 assert.equal(select(rows,{...decision,teamId:'outsider'}).status,'tie');
 assert.equal(select(rows.map(r=>({...r,players:[r.id+'다른선수']})),decision).status,'tie');
});
test('missing results never create an arbitrary qualification',()=>{
 assert.equal(select([row('a',0,0,{setsReady:false})]).status,'missing');
 assert.equal(select([row('a',-4,0,{gamesReady:false}),row('b',-4,-1)]).status,'missing');
 assert.equal(select([]).status,'none');
});
