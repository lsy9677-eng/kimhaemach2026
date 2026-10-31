import test from 'node:test';
import assert from 'node:assert/strict';
import {teamRegistrationLabels,planTeamLabelEdit} from '../assets/js/team-labels.js';
const teams=[{_id:'a',club:'클럽',division:'금',players:['가']},{_id:'other',club:'다른클럽',division:'금'},{_id:'b',club:'클럽',division:'금',players:['나']},{_id:'silver',club:'클럽',division:'은'}];
test('automatic team designations are scoped to club and division',()=>{
 const labels=teamRegistrationLabels(teams);assert.equal(labels.get('a'),'A');assert.equal(labels.get('b'),'B');assert.equal(labels.get('silver'),'A');
});
test('editing a roster freezes the existing team designations',()=>{
 const labels=planTeamLabelEdit(teams,'a','A');const saved=teams.map(t=>({...t,...(labels.has(t._id)?{teamLabel:labels.get(t._id)}:{})}));
 const reloaded=teamRegistrationLabels(saved.slice().reverse());assert.equal(reloaded.get('a'),'A');assert.equal(reloaded.get('b'),'B');
});
test('explicitly choosing another team designation swaps only the labels',()=>{
 const labels=planTeamLabelEdit(teams,'a','B');assert.deepEqual([...labels],[['a','B'],['b','A']]);assert.deepEqual(teams[0].players,['가']);assert.deepEqual(teams[2].players,['나']);
});
test('new teams avoid designations already assigned by the director',()=>{
 const labels=teamRegistrationLabels([{_id:'b',club:'클럽',teamLabel:'B'},{_id:'new',club:'클럽'},{_id:'third',club:'클럽'}]);assert.equal(labels.get('new'),'A');assert.equal(labels.get('third'),'C');
});
test('custom Korean designation is accepted and unsafe labels are rejected',()=>{
 assert.equal(planTeamLabelEdit(teams,'a','청').get('a'),'청');assert.throws(()=>planTeamLabelEdit(teams,'a','<script>'),/팀 구분/);
});
