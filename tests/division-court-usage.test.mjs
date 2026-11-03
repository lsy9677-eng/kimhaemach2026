import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
function setup(){
 const gold=['능동1','능동2','능동3','능동4'];
 const c={G:{tournaments:[{id:'t',divisions:['금','은','동'],divSettings:{금:{prelimAllowedCourts:gold},은:{prelimAllowedCourts:['능동5']},동:{prelimAllowedCourts:[]}}},{id:'other',divisions:['금'],divSettings:{금:{prelimAllowedCourts:['다른대회코트']}}}],draws:{t_동:{allowedCourts:['old']}}},
 _k2td:key=>({tid:key.split('_')[0],div:key.split('_')[1]}),getDivisionConfiguredCourts:()=>[],getTournamentCourtList:()=>['능동1','능동2','능동3','능동4','능동5'],resolveAllowedCourts:args=>args.tournamentCourts,
 dl:div=>div+'배부',esc:value=>String(value),escAttr:value=>String(value),DEFAULT_COURT_GROUPS:[]};
 vm.createContext(c);vm.runInContext(src.slice(src.indexOf('function getTournamentDivisionCourtAllocations('),src.indexOf('function updateDrawAllowedCourtsSummary(')),c);
 vm.runInContext(src.slice(src.indexOf('function renderCourtAccordionSelector('),src.indexOf('function toggleCourtAccordion(')),c);return c;
}
test('silver sees gold saved court allocation with four labeled courts, excluding itself and other tournaments',()=>{
 const c=setup(),usage=c.getOtherDivisionCourtUsage('t_은');
 assert.equal(Object.keys(usage).length,4);assert.equal(usage['능동1'][0],'금배부 사용');assert.equal(usage['능동5'],undefined);assert.equal(usage['old'],undefined);
 const html=c.renderDrawAllowedCourtSelector('t_은',['능동5']);
 assert.match(html,/금배부<\/b> · 4면/);assert.match(html,/⚠️ 금배부 사용/);assert.match(html,/은배부 \(현재 부서\)/);
 assert.doesNotMatch(html,/다른대회코트/);assert.doesNotMatch(html,/savePrelimDrawSettings/);
});
test('overlapping selections show both owner and court count without changing saved allocations',()=>{
 const c=setup();const summary={innerHTML:''};c.DW={key:'t_은'};
 c.ge=id=>id==='drawAllowedCourtsWrap'?{querySelectorAll:()=>[{value:'능동1'},{value:'능동5'}]}:summary;
 vm.runInContext(src.slice(src.indexOf('function updateDrawAllowedCourtsSummary('),src.indexOf('function bindDrawAllowedCourtInputs(')),c);
 c.updateDrawAllowedCourtsSummary();assert.match(summary.innerHTML,/1면 중복/);assert.match(summary.innerHTML,/능동1 \(금배부 사용\)/);assert.equal(c.G.tournaments[0].divSettings.금.prelimAllowedCourts.length,4);
});
