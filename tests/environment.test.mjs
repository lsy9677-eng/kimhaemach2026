import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=readFileSync(new URL('../assets/js/organization-context.js',import.meta.url),'utf8');
const hostsSource=readFileSync(new URL('../assets/js/production-hosts.js',import.meta.url),'utf8');
// Read the original tracked configuration locally; never import Firebase SDKs.
// Pin the pre-isolation baseline so future commits do not change the oracle.
const originalSource=execFileSync('git',['show','dd6e4a4d54a3bef21702d7e5eb23381dd98820de:assets/js/organization-context.js'],{encoding:'utf8'});
const productionOrigin='https://kimhaemach2026.pages.dev';
function storage(){const data=new Map();return {get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
function contextFor(url,local=storage(),session=storage()){
  const location=new URL(url);location.assign=address=>{location.assigned=address;};
  const context={URL,location,confirm:()=>true,document:{readyState:'loading',documentElement:{},addEventListener(){}},localStorage:local,sessionStorage:session};context.window=context;
  return context;
}
function boot(url,local=storage(),session=storage()){
  const context=contextFor(url,local,session);
  vm.runInNewContext(hostsSource,context);vm.runInNewContext(source,context);return context;
}
test('local hosts always select demo projects, even with production query',()=>{
  for(const host of ['localhost','127.0.0.1','192.168.0.5','[::1]','preview.local','test.localhost','kimhae.test'])for(const org of ['kimhae','jangyu']){
    const c=boot(`http://${host}/?org=${org}&env=production`);
    assert.equal(c.MATCH_RUNTIME.emulator,true);assert.equal(c.MATCH_ORGANIZATION.firebase.projectId,`demo-${org}-dev`);assert.equal(c.MATCH_IDENTITY_FIREBASE.projectId,'demo-kimhae-dev');
  }
});
test('only the confirmed host is listed; previews and lookalikes stop before Firebase configuration',()=>{
  const allowed=boot(productionOrigin);
  assert.deepEqual(Array.from(allowed.MATCH_PRODUCTION_HOSTS),['kimhaemach2026.pages.dev']);
  for(const address of ['https://preview.example.org/','https://preview.kimhaemach2026.pages.dev/','https://abc123.kimhaemach2026.pages.dev/','https://kimhaemach2026-preview.pages.dev/','https://kimhaemach2026.pages.dev.evil.example/','https://kimhaemach2027.pages.dev/','https://jangyumach2026.pages.dev/','http://kimhaemach2026.pages.dev/']){
    const context=contextFor(address);vm.runInNewContext(hostsSource,context);
    assert.throws(()=>vm.runInNewContext(source,context),/확인되지 않은 실행 주소/);
    assert.equal(context.MATCH_ORGANIZATION,undefined);assert.equal(context.MATCH_RUNTIME,undefined);
  }
});
test('production retains existing project configuration and legacy keys',()=>{
  for(const org of ['kimhae','jangyu']){
    const address=`${productionOrigin}/?org=${org}`;
    const c=boot(address);
    const original=contextFor(address);vm.runInNewContext(originalSource,original);
    assert.deepEqual(JSON.parse(JSON.stringify(c.MATCH_ORGANIZATION.firebase)),JSON.parse(JSON.stringify(original.MATCH_ORGANIZATION.firebase)));
    assert.deepEqual(JSON.parse(JSON.stringify(c.MATCH_IDENTITY_FIREBASE)),JSON.parse(JSON.stringify(original.MATCH_IDENTITY_FIREBASE)));
    assert.equal(c.MATCH_RUNTIME.emulator,false);assert.equal(c.MATCH_ORGANIZATION.firebase.projectId,org==='kimhae'?'kimheatennis2026':'jangyumach2026');
    c.organizationLocalStorage.setItem('adm','1');assert.equal(c.localStorage.getItem('adm'),'1');
  }
});
test('environment isolation includes shared identity keys, enumeration and clear',()=>{
  const local=storage(),session=storage();const prod=boot(productionOrigin,local,session);
  prod.organizationLocalStorage.setItem('adm','production-session');prod.organizationLocalStorage.setItem('APP_VERSION','production-version');
  const kimhae=boot('http://localhost/',local,session),jangyu=boot('http://localhost/?org=jangyu',local,session);
  assert.equal(kimhae.organizationLocalStorage.getItem('adm'),null);
  kimhae.organizationLocalStorage.setItem('adm','demo-session');kimhae.organizationLocalStorage.setItem('cache','kimhae');jangyu.organizationLocalStorage.setItem('cache','jangyu');
  assert.equal(jangyu.organizationLocalStorage.getItem('adm'),'demo-session');assert.equal(kimhae.organizationLocalStorage.getItem('cache'),'kimhae');
  const keys=Array.from({length:jangyu.organizationLocalStorage.length},(_,i)=>jangyu.organizationLocalStorage.key(i));assert.ok(!keys.includes('adm'));assert.ok(keys.includes('cache'));
  prod.organizationLocalStorage.clear();assert.equal(kimhae.organizationLocalStorage.getItem('adm'),'demo-session');
  prod.organizationLocalStorage.setItem('adm','preserve');jangyu.organizationLocalStorage.clear();assert.equal(prod.organizationLocalStorage.getItem('adm'),'preserve');assert.equal(kimhae.organizationLocalStorage.getItem('cache'),'kimhae');
  kimhae.organizationSessionStorage.setItem('reg','demo');assert.equal(prod.organizationSessionStorage.getItem('reg'),null);
});

const runtimeSource=readFileSync(new URL('../assets/js/firebase-runtime.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replaceAll('export const ','const ');
function initialize(context){
  const connections=[];const apps=[];
  const mocks={window:context,initializeApp:(config,name)=>{const app={config,name};apps.push(app);return app;},getFirestore:app=>({app,kind:'firestore'}),getStorage:app=>({app,kind:'storage'}),connectFirestoreEmulator:(db,host,port)=>connections.push({kind:db.kind,project:db.app.config.projectId,host,port}),connectStorageEmulator:(storage,host,port)=>connections.push({kind:storage.kind,project:storage.app.config.projectId,host,port})};
  vm.runInNewContext(runtimeSource+'\nglobalThis.instances={db,identityDb,storage};',mocks);return {connections,apps,...mocks.instances};
}
test('all development Firebase instances connect to emulators, including shared identity',()=>{
  for(const org of ['kimhae','jangyu']){
    const {connections}=initialize(boot(`http://localhost/?org=${org}`));
    assert.equal(connections.length,org==='kimhae'?2:3);
    assert.ok(connections.every(c=>c.host==='127.0.0.1'&&c.project.startsWith('demo-')));
    assert.ok(connections.some(c=>c.kind==='firestore'&&c.project==='demo-kimhae-dev'&&c.port===8080));
    assert.ok(connections.some(c=>c.kind==='storage'&&c.port===(org==='kimhae'?9199:9299)));
  }
});
test('production initializes original projects and never attaches an emulator',()=>{
  for(const org of ['kimhae','jangyu']){
    const {connections,apps,db,identityDb,storage}=initialize(boot(`${productionOrigin}/?org=${org}`));
    assert.deepEqual(connections,[]);assert.equal(apps[0].config.projectId,org==='kimhae'?'kimheatennis2026':'jangyumach2026');
    if(org==='jangyu')assert.equal(apps[1].config.projectId,'kimheatennis2026');
    assert.equal(identityDb.app.config.projectId,'kimheatennis2026');
    assert.equal(storage.app,db.app);
    if(org==='kimhae')assert.equal(identityDb,db);else assert.notEqual(identityDb,db);
  }
});

test('production organization switches preserve the origin and all existing shared session keys',()=>{
  for(const start of ['kimhae','jangyu']){
    const local=storage(),session=storage();
    const initial=boot(`${productionOrigin}/?org=${start}&v=kept#home`,local,session);
    const shared={adm:'1',reg:'1',reg_club:'가상테스트클럽',reg_session_version:'7',club_member:'1'};
    for(const [key,value] of Object.entries(shared)){
      local.setItem(key,value);session.setItem(key,value);
      assert.equal(initial.organizationLocalStorage.getItem(key),value);
    }
    initial.organizationLocalStorage.setItem('op','1');
    assert.equal(local.getItem(start==='kimhae'?'op':'OAI_ORG_jangyu:op'),'1');
    const next=start==='kimhae'?'jangyu':'kimhae';
    initial.switchMatchOrganization(next);
    const assigned=new URL(initial.location.assigned);
    assert.equal(assigned.origin,productionOrigin);assert.equal(assigned.searchParams.get('org'),next);
    assert.equal(assigned.searchParams.get('v'),'kept');assert.equal(assigned.hash,'#home');
    const switched=boot(assigned.href,local,session);
    for(const [key,value] of Object.entries(shared)){
      assert.equal(switched.organizationLocalStorage.getItem(key),value);
      assert.equal(switched.organizationSessionStorage.getItem(key),value);
      assert.equal(local.getItem(key),value);assert.equal(session.getItem(key),value);
      assert.equal(local.getItem('OAI_DEV:'+key),null);
    }
    switched.switchMatchOrganization(start);
    assert.equal(new URL(switched.location.assigned).searchParams.get('org'),start);
  }
});
test('development rejects accidental production config before creating an app',()=>{
  assert.throws(()=>initialize({MATCH_RUNTIME:{emulator:true},MATCH_ORGANIZATION:{firebase:{projectId:'production'}},MATCH_IDENTITY_FIREBASE:{projectId:'demo-kimhae-dev'}}),/운영 Firebase/);
});
