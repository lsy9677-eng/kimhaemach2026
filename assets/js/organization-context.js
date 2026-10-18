/* Shared interface, independent organization databases and browser state. */
(function(){
  'use strict';
  const profiles={"kimhae":{"id":"kimhae","name":"김해시테니스협회","requiresAssociationRegistration":true,"firebase":{"apiKey":"AIzaSyB7gqyDoFhujrBB_h4StvHkn_Y0VoUCPgE","authDomain":"kimheatennis2026.firebaseapp.com","projectId":"kimheatennis2026","storageBucket":"kimheatennis2026.firebasestorage.app","messagingSenderId":"243465970482","appId":"1:243465970482:web:ceafbd39de51837d49ed2b"}},"jangyu":{"id":"jangyu","name":"장유테니스연합회","requiresAssociationRegistration":false,"firebase":{"apiKey":"AIzaSyBCohLbcWMSBkkk_6rhcqxi2WSejtIaaCw","authDomain":"jangyumach2026.firebaseapp.com","projectId":"jangyumach2026","storageBucket":"jangyumach2026.firebasestorage.app","messagingSenderId":"594638304093","appId":"1:594638304093:web:c0c40d684d17a021d92eb4"}}};
  const url=new URL(location.href);
  const id=url.searchParams.get('org')||'kimhae';
  if(!Object.prototype.hasOwnProperty.call(profiles,id)){
    document.documentElement.textContent='지원하지 않는 단체입니다. 주소의 org 값을 확인해 주세요.';
    throw new Error('Unsupported organization');
  }
  const selected=profiles[id];
  Object.freeze(selected.firebase);Object.freeze(selected);
  Object.defineProperty(window,'MATCH_ORGANIZATION',{value:selected,writable:false,configurable:false});
  const prefix=id==='kimhae'?'':'OAI_ORG_'+id+':';
  function scope(storage){
    const matches=k=>prefix?k.startsWith(prefix):!k.startsWith('OAI_ORG_');
    const keys=()=>Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(k=>k!==null&&matches(k));
    return Object.freeze({
      getItem:key=>storage.getItem(prefix+String(key)),
      setItem:(key,value)=>storage.setItem(prefix+String(key),String(value)),
      removeItem:key=>storage.removeItem(prefix+String(key)),
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
    const host=document.querySelector('.app-header');if(!host)return;
    const bar=document.createElement('div');bar.id='organizationNavigation';
    bar.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 14px;background:#eaf2ff;color:#10213d;border-bottom:1px solid #cbdaf2';
    const label=document.createElement('label');label.htmlFor='organizationSelect';label.textContent='운영 단체';label.style.fontWeight='800';
    const select=document.createElement('select');select.id='organizationSelect';select.setAttribute('aria-label','운영 단체 선택');select.style.cssText='flex:1;min-width:170px;max-width:340px;padding:8px;border:1px solid #9ab5dc;border-radius:8px;background:#fff;color:#10213d;font-weight:800';
    Object.values(profiles).forEach(p=>{const opt=document.createElement('option');opt.value=p.id;opt.textContent=p.name;select.appendChild(opt);});select.value=id;
    select.addEventListener('change',()=>switchOrganization(select.value));
    const note=document.createElement('span');note.textContent=id==='kimhae'?'김해시협회 전용 자료':'장유연합회 전용 자료 · 협회 미등록 선수 접수 가능';note.style.cssText='font-size:12px;font-weight:700';
    bar.append(label,select,note);host.prepend(bar);
    const title=host.querySelector('.logo-text h1');if(title)title.textContent=selected.name;
    document.title=selected.name+' 대회관리';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
