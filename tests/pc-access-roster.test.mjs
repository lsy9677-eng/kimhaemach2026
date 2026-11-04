import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
test('roster exports use division rules even with legacy team counts or reserves',()=>{
 const c={gDS:()=>({doublesCount:3})};vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function rosterExportDoublesCount('),source.indexOf('async function _buildRegListEl44()')),c);
 for(const team of [{doublesCount:5,players:Array(8).fill('선수')},{players:Array(8).fill('선수')}])assert.equal(c.rosterExportDoublesCount({divSettings:{은:{doublesCount:3}}},'은',team),3);
 assert.equal(c.rosterExportDoublesCount({},'은',{doublesCount:5}),5);
 assert.equal(c.rosterExportDoublesCount({},'테린이',{}),3);
});
test('PC links keep selected organization and omit device-specific query data',()=>{
 const c={URL,MATCH_ORGANIZATION:{id:'jangyu'}};vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function pcAccessUrl()'),source.indexOf('function openPcAccess()')),c);
 assert.equal(c.pcAccessUrl(),'https://kimhaemach2026.pages.dev/?org=jangyu#home');c.MATCH_ORGANIZATION.id='kimhae';assert.match(c.pcAccessUrl(),/org=kimhae#home$/);
});
