import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
test('Jangyu tournament list includes legacy records with no createdAt',async()=>{
 const records=[{id:'old',name:'옛 장유 대회',date:'2024-05-01',status:'finished'},{id:'recent',name:'최근 대회',date:'2026-03-29',status:'finished',createdAt:1}];
 let pending;const c={MATCH_ORGANIZATION:{id:'jangyu'},db:{},G:{},_tournamentsUnsub:null,stopTournamentListSync:()=>{},
 collection:()=>({ordered:false}),orderBy:()=>({}),query:()=>({ordered:true}),
 onSnapshot:(request,callback)=>{const selected=request.ordered?records.filter(r=>r.createdAt):records;pending=callback({docs:selected.map(r=>({id:r.id,data:()=>r}))});return ()=>{};},
 sortTournamentsLatest:rows=>rows.sort((a,b)=>b.date.localeCompare(a.date)),hydratePastArchives:()=>{},getRealtimeTargetTournamentId:()=>null,
 syncTournamentDataForPage:async()=>{},getCurrentPageName:()=>'ranking',onDU:()=>{},logSnapshotError:()=>{},console};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function startTournamentListSync()'),source.indexOf('let _firestoreLastHiddenAt')),c);
 c.startTournamentListSync();await pending;assert.deepEqual(Array.from(c.G.tournaments,t=>t.id),['recent','old']);assert.equal(records[0].createdAt,undefined);
});
