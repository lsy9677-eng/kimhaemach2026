import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveSharedAge65,projectSharedRegistry,projectSharedCertificates} from '../assets/js/shared-age65.js';
const person={name:'가상인증선수',club:'가상클럽'};
const row={...person,age65Certified:true,playerId:'p1'};
test('confirmed association member matches by name and club',()=>assert.equal(resolveSharedAge65(person,[row]).approved,true));
test('a namesake at another club receives no shared approval',()=>assert.equal(resolveSharedAge65({...person,club:'다른클럽'},[row]).approved,false));
test('sub-club membership can establish the match',()=>assert.equal(resolveSharedAge65({...person,club:'부클럽'},[{...row,subClub:'부클럽,제삼클럽'}]).approved,true));
test('ambiguous namesakes fail closed unless a stable identity distinguishes them',()=>{
 const rows=[row,{...row,playerId:'p2',identityTag:'B',age65Certified:false}];
 assert.equal(resolveSharedAge65(person,rows).approved,false);
 assert.equal(resolveSharedAge65({...person,playerId:'p1'},rows).approved,true);
 assert.equal(resolveSharedAge65({...person,identityTag:'B'},rows).approved,false);
});
test('legacy certification must be approved and tied to the matched club',()=>{
 const member={...row,age65Certified:false};
 assert.equal(resolveSharedAge65(person,[member],[{...person,certified:true}]).approved,true);
 assert.equal(resolveSharedAge65(person,[member],[{...person,club:'다른클럽',certified:true}]).approved,false);
 assert.equal(resolveSharedAge65(person,[member],[{...person,certified:false}]).approved,false);
 assert.equal(resolveSharedAge65(person,[member],[{...person,status:'pending'}]).approved,false);
});
test('a name-only legacy certificate cannot distinguish same-club namesakes',()=>{
 const rows=[{...row,identityTag:'A',age65Certified:false},{...row,playerId:'p2',identityTag:'B',age65Certified:false}];
 assert.equal(resolveSharedAge65({...person,identityTag:'A'},rows,[{...person,certified:true}]).approved,false);
 assert.equal(resolveSharedAge65({...person,identityTag:'A'},rows,[{...person,certified:true,playerId:'p1'}]).approved,true);
});
test('withdrawn approval and an unknown member receive no approval',()=>{
 assert.equal(resolveSharedAge65(person,[{...row,age65Certified:false}],[]).approved,false);
 assert.equal(resolveSharedAge65(person,[],[{...person,certified:true}]).approved,false);
});
test('projected source data excludes private contacts and application documents',()=>{
 const input={...row,phone:'private',address:'private',birthDate:'private',photoURL:'private',gender:'F'};
 for(const projected of [projectSharedRegistry([input])[0],projectSharedCertificates([input])[0]]){
  for(const key of ['phone','address','birthDate','photoURL','gender'])assert.equal(key in projected,false);
 }
});
