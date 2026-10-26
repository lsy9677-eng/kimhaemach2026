/* Shared interface, independent organization databases and browser state. */
(function(){
  'use strict';
  const profiles={"kimhae":{"id":"kimhae","name":"김해시테니스협회","requiresAssociationRegistration":true,"firebase":{"apiKey":"AIzaSyB7gqyDoFhujrBB_h4StvHkn_Y0VoUCPgE","authDomain":"kimheatennis2026.firebaseapp.com","projectId":"kimheatennis2026","storageBucket":"kimheatennis2026.firebasestorage.app","messagingSenderId":"243465970482","appId":"1:243465970482:web:ceafbd39de51837d49ed2b"}},"jangyu":{"id":"jangyu","name":"장유테니스연합회","requiresAssociationRegistration":false,"firebase":{"apiKey":"AIzaSyBCohLbcWMSBkkk_6rhcqxi2WSejtIaaCw","authDomain":"jangyumach2026.firebaseapp.com","projectId":"jangyumach2026","storageBucket":"jangyumach2026.firebasestorage.app","messagingSenderId":"594638304093","appId":"1:594638304093:web:c0c40d684d17a021d92eb4"}}};
  const url=new URL(location.href);
  // Loopback, LAN addresses and file previews can never select production.
  const host=location.hostname.toLowerCase();
  const development=location.protocol==='file:' || host==='localhost' || host.endsWith('.localhost') || host==='[::1]' || host==='::1' || !host.includes('.') || /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.endsWith('.local') || host.endsWith('.test');
  const productionHosts=window.MATCH_PRODUCTION_HOSTS;
  if(!development && !(Array.isArray(productionHosts)&&productionHosts.includes(host)&&location.protocol==='https:')){
    const message='확인되지 않은 실행 주소입니다. 운영 호스트 등록을 확인하거나 http://127.0.0.1:5500/에서 개발 환경을 실행해 주세요.';
    if(document.documentElement)document.documentElement.textContent=message;
    throw new Error(message);
  }
  const runtime=Object.freeze({environment:development?'development':'production',emulator:development,cachePrefix:development?'OAI_DEV:':'',
    kimhae:Object.freeze({host:'127.0.0.1',firestore:8080,storage:9199}),jangyu:Object.freeze({host:'127.0.0.1',firestore:8081,storage:9299})});
  Object.defineProperty(window,'MATCH_RUNTIME',{value:runtime,writable:false,configurable:false});
  if(development){
    for(const [key,profile] of Object.entries(profiles))profile.firebase={apiKey:'demo-local-key',projectId:'demo-'+key+'-dev',authDomain:'demo-'+key+'-dev.localhost',storageBucket:'demo-'+key+'-dev.appspot.com',appId:'demo-'+key+'-dev'};
  }
  const id=url.searchParams.get('org')||'kimhae';
  if(!Object.prototype.hasOwnProperty.call(profiles,id)){
    document.documentElement.textContent='지원하지 않는 단체입니다. 주소의 org 값을 확인해 주세요.';
    throw new Error('Unsupported organization');
  }
  const selected=profiles[id];
  Object.freeze(selected.firebase);Object.freeze(selected);
  Object.defineProperty(window,'MATCH_ORGANIZATION',{value:selected,writable:false,configurable:false});
  Object.freeze(profiles.kimhae.firebase);
  Object.defineProperty(window,'MATCH_IDENTITY_FIREBASE',{value:profiles.kimhae.firebase,writable:false,configurable:false});
  const sharedKeys=new Set(['adm','reg','reg_club','reg_session_version','club_member']);
  const environmentPrefix=runtime.cachePrefix;
  const prefix=environmentPrefix+(id==='kimhae'?'':'OAI_ORG_'+id+':');
  function scope(storage){
    const physical=key=>sharedKeys.has(String(key))?environmentPrefix+String(key):prefix+String(key);
    const matches=k=>{
      if(!k.startsWith(environmentPrefix)||(!development&&k.startsWith('OAI_DEV:')))return false;
      const logical=k.slice(environmentPrefix.length);
      return id==='kimhae'?!logical.startsWith('OAI_ORG_'):k.startsWith(prefix);
    };
    const keys=()=>Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(k=>k!==null&&matches(k));
    return Object.freeze({
      getItem:key=>storage.getItem(physical(key)),
      setItem:(key,value)=>storage.setItem(physical(key),String(value)),
      removeItem:key=>storage.removeItem(physical(key)),
      key:index=>{const k=keys()[index];return k===undefined?null:k.slice(prefix.length);},
      clear:()=>keys().forEach(k=>storage.removeItem(k)),
      get length(){return keys().length;}
    });
  }
  window.organizationLocalStorage=scope(window.localStorage);
  window.organizationSessionStorage=scope(window.sessionStorage);
  function switchOrganization(next){
    if(!Object.prototype.hasOwnProperty.call(profiles,next)||next===id)return;
    if(!confirm(profiles[next].name+' 화면으로 이동합니다. 작성 중 저장하지 않은 내용은 사라집니다. 이동할까요?')){
      const select=document.getElementById('organizationSelect');if(select)select.value=id;return;
    }
    const target=new URL(location.href);target.searchParams.set('org',next);target.hash='home';
    location.assign(target.toString());
  }
  window.switchMatchOrganization=switchOrganization;
  function mount(){
    document.documentElement.dataset.organization=id;
    document.documentElement.dataset.environment=runtime.environment;
    const host=document.querySelector('.app-header');if(!host)return;
    const bar=document.createElement('div');bar.id='organizationNavigation';
    bar.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:nowrap;box-sizing:border-box;height:44px;padding:5px 12px;background:#eaf2ff;color:#10213d;border-bottom:1px solid #cbdaf2';
    bar.title='김해시테니스협회 산하: 장유·동부·중부연합회. 김해시협회 공통 로그인, 자료는 단체별 독립 관리.';
    const label=document.createElement('label');label.htmlFor='organizationSelect';label.textContent='단체';label.style.cssText='flex:none;font-size:12px;font-weight:800;white-space:nowrap;margin:0';
    const select=document.createElement('select');select.id='organizationSelect';select.setAttribute('aria-label','운영 단체 선택');select.style.cssText='flex:1;min-width:0;max-width:340px;width:100%;height:32px;min-height:32px;box-sizing:border-box;margin:0;padding:3px 28px 3px 9px;border:1px solid #9ab5dc;border-radius:7px;background:#fff;color:#10213d;font-size:13px;font-weight:800;line-height:normal';
    const parent=document.createElement('option');parent.value='kimhae';parent.textContent='김해시테니스협회 · 상위단체';select.appendChild(parent);
    const children=document.createElement('optgroup');children.label='김해시협회 산하 연합회';
    [['jangyu','장유연합회',false],['dongbu','동부연합회 · 준비 중',true],['jungbu','중부연합회 · 준비 중',true]].forEach(([value,name,disabled])=>{const opt=document.createElement('option');opt.value=value;opt.textContent=name;opt.disabled=disabled;children.appendChild(opt);});
    select.appendChild(children);select.value=id;
    select.addEventListener('change',()=>switchOrganization(select.value));
    bar.append(label,select);host.prepend(bar);
    if(development){const badge=document.createElement('span');badge.textContent='개발 · Emulator';badge.style.cssText='font-size:12px;color:#9a3412;font-weight:bold';bar.append(badge);}
    const title=host.querySelector('.logo-text h1');if(title)title.textContent=selected.name;
    document.title=selected.name+' 대회관리';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
