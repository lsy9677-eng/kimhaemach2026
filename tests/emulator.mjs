import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {randomUUID} from 'node:crypto';
import {seed,targets} from '../scripts/seed.mjs';
import {startServer} from '../scripts/server.mjs';

const offline=process.argv.includes('--offline');
const failUpload=process.argv.includes('--fail-upload');
const runId=randomUUID();
async function readDocument(url){const response=await fetch(url);assert.ok(response.ok);return response.json();}
async function waitDocument(url,predicate){
  for(let i=0;i<60;i++){const document=await readDocument(url);if(predicate(document))return document;await new Promise(resolve=>setTimeout(resolve,150));}
  throw new Error('이번 업로드의 Firestore 메타데이터가 저장되지 않았습니다');
}
function currentUpload(page,port,accept){
  return page.waitForResponse(response=>{
    const url=new URL(response.url());
    return url.hostname==='127.0.0.1'&&url.port===String(port)&&response.request().method()==='POST'&&accept(url.searchParams.get('name')||'');
  },{timeout:8000}).then(async response=>{assert.ok(response.ok(),'이번 업로드 응답이 실패했습니다');const metadata=await response.json();assert.ok(metadata.name);return metadata.name;}).catch(error=>{throw new Error('Current upload failed: '+error.message);});
}
async function roleSession(page,org,role){
  await page.evaluate(()=>{if(document.body.classList.contains('admin-mode'))window.toggleAdmin();});
  await page.evaluate(role=>{window.toggleReg();window.setClubLoginRole(role);document.getElementById('regClubLogin').value='가상테스트클럽';document.getElementById('regPwInput').value='demo-club-2026';window.doRegLogin();},role);
  await page.waitForFunction(expected=>window.getCurrentClubRoleInfo().role===expected,role);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(expected=>window.getCurrentClubRoleInfo?.().role===expected,role);
  const next=org==='kimhae'?'jangyu':'kimhae';
  await Promise.all([page.waitForURL(url=>url.searchParams.get('org')===next),page.evaluate(next=>window.switchMatchOrganization(next),next)]);
  await page.waitForFunction(expected=>window.getCurrentClubRoleInfo?.().role===expected,role);
  assert.equal(await page.evaluate(()=>window.MATCH_ORGANIZATION.firebase.projectId),`demo-${next}-dev`);
  assert.equal(await page.evaluate(()=>window.getCurrentClubRoleInfo().club),'가상테스트클럽');
  await Promise.all([page.waitForURL(url=>url.searchParams.get('org')===org),page.evaluate(org=>window.switchMatchOrganization(org),org)]);
  await page.waitForFunction(expected=>window.getCurrentClubRoleInfo?.().role===expected,role);
  await page.evaluate(()=>window.toggleReg());
  assert.equal(await page.evaluate(()=>window.getCurrentClubRoleInfo().role),'guest');
}
if(offline){
  for(const port of [8080,8081,9199,9299]){
    let listening=false;try{await fetch(`http://127.0.0.1:${port}`,{signal:AbortSignal.timeout(1000)});listening=true;}catch{}
    assert.equal(listening,false,`Emulator ${port} must be stopped for this test`);
  }
}else await seed();
let server;try{server=await startServer();}catch(error){if(error.code!=='EADDRINUSE')throw error;}
const browser=await chromium.launch({channel:'chrome',headless:true});
const forbidden=[];const results=[];
try{
  for(const target of targets){
    const context=await browser.newContext();
    // Keep CSP observations across reloads and organization navigation too.
    await context.exposeBinding('reportBlockedFirebase',(_source,uri)=>{forbidden.push(uri);});
    const requests=[];const errors=[];
    // Block before sending: a regression can never reach production in tests.
    await context.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(failUpload&&url.hostname==='127.0.0.1'&&url.searchParams.get('name')?.startsWith('notices/popup/')&&route.request().method()==='POST')return route.abort();
      if(['127.0.0.1','localhost'].includes(url.hostname)||url.hostname==='www.gstatic.com'||url.hostname==='cdn.jsdelivr.net'||url.hostname==='developers.kakao.com'||url.hostname==='cdnjs.cloudflare.com'||url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com')return route.continue();
      if(/firebase|googleapis|kimheatennis|jangyumach/.test(url.hostname))forbidden.push(url.href);
      return route.abort();
    });
    const page=await context.newPage();
    page.on('request',request=>{requests.push(request.url());if(/firestore\.googleapis\.com|firebasestorage\.googleapis\.com|firebaseio\.com|kimheatennis2026|jangyumach2026/.test(request.url())&&!request.url().startsWith('http://127.0.0.1'))forbidden.push(request.url());});
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')console.error('Browser:',message.text());});
    page.on('dialog',dialog=>dialog.accept());
    await context.addInitScript(()=>{
      window.blockedFirebase=[];
      document.addEventListener('securitypolicyviolation',event=>{
        if(/firestore\.googleapis\.com|firebasestorage\.googleapis\.com|firebaseio\.com|kimheatennis2026|jangyumach2026/.test(event.blockedURI))window.reportBlockedFirebase(event.blockedURI);
      });
    });
    // Pre-populate the version in development only to avoid an intentional reload.
    await context.addInitScript(()=>{localStorage.setItem('OAI_DEV:APP_VERSION','1.0.12-open-tournament-first');localStorage.setItem('OAI_DEV:OAI_ORG_jangyu:APP_VERSION','1.0.12-open-tournament-first');localStorage.setItem('adm','production-session-must-survive');});
    await page.goto('http://127.0.0.1:5500/privacy.html');
    await page.evaluate(async()=>{await caches.open('production-cache-must-survive');await caches.open('OAI_DEV:old-test-cache');});
    await page.goto(`http://127.0.0.1:5500/?org=${target.org}&env=production`,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof window.doLogin==='function',{timeout:30000});
    assert.equal(await page.evaluate(()=>window.MATCH_ORGANIZATION.firebase.projectId),target.project);
    assert.equal(await page.evaluate(()=>window.MATCH_IDENTITY_FIREBASE.projectId),'demo-kimhae-dev');
    assert.equal(await page.evaluate(()=>document.body.classList.contains('admin-mode')),false);
    await page.waitForFunction(async()=>!(await caches.keys()).includes('OAI_DEV:old-test-cache'));
    assert.ok((await page.evaluate(()=>caches.keys())).includes('production-cache-must-survive'));
    const docURL=`http://127.0.0.1:${target.port}/v1/projects/${target.project}/databases/(default)/documents/meta/config`;
    if(offline){
      // Exercise an explicit write and upload as well as startup retry behavior.
      await page.evaluate(async()=>{
        const runtime=await import('/assets/js/firebase-runtime.js');
        const fs=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const st=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js');
        window.offlineWrite=fs.setDoc(fs.doc(runtime.db,'devChecks','offline'),{synthetic:true}).catch(()=>{});
        window.offlineUpload=st.uploadBytes(st.ref(runtime.storage,'dev-checks/offline.txt'),new TextEncoder().encode('synthetic')).catch(()=>{});
      });
      await page.waitForTimeout(12000);
      assert.ok(requests.some(url=>url.startsWith(`http://127.0.0.1:${target.port}/`)));
      assert.ok(requests.some(url=>url.startsWith(`http://127.0.0.1:${target.org==='kimhae'?9199:9299}/`)));
      results.push({org:target.org,emulatorsStopped:true,productionRequests:forbidden.length,pageErrors:errors});
    }else{
      await page.waitForFunction(()=>document.body.innerText.includes('연결 완료'),{timeout:15000});
      await page.evaluate(()=>{document.getElementById('adminPw').value='demo-admin-2026';window.doLogin();window.openPopupNoticeManager();});
      assert.equal(await page.evaluate(()=>document.body.classList.contains('admin-mode')),true);
      await page.locator('#unifiedFloatingNoticeText').fill(`가상 ${target.org} 저장 검증`);
      await page.locator('#unifiedFloatingNoticeEnabled').check();
      await page.evaluate(()=>window.saveUnifiedFloatingNotice());
      let document=await (await fetch(docURL)).json();
      assert.equal(document.fields.adminFloatingNotice.stringValue,`가상 ${target.org} 저장 검증`);
      await page.locator('#popupNoticeTitle').fill(`가상 ${target.org} 업로드 검증`);
      const fixture=await page.evaluate(marker=>{
        const canvas=document.createElement('canvas');canvas.width=200;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,200,80);ctx.fillStyle='#123456';ctx.font='12px sans-serif';ctx.fillText(marker,4,35);
        return {png:canvas.toDataURL('image/png').split(',')[1],jpeg:canvas.toDataURL('image/jpeg',0.78).split(',')[1]};
      },`${target.org}-${runId}`);
      const image=Buffer.from(fixture.png,'base64');
      const filename=`synthetic-${runId}-${target.org}.png`;
      await page.locator('#popupNoticeImageFile').setInputFiles({name:filename,mimeType:'image/png',buffer:image});
      await page.waitForFunction(()=>document.querySelector('#popupNoticeImagePreview img')?.src.startsWith('data:'));
      const popupUpload=currentUpload(page,target.org==='kimhae'?9199:9299,name=>name.startsWith('notices/popup/')&&name.endsWith(filename));
      // Attach handlers immediately so a failed upload cannot be swallowed by UI catches.
      const [popupPath]=await Promise.all([popupUpload,page.evaluate(()=>window.savePopupNotice())]);
      const imageURL=await page.evaluate(async path=>{
        const {storage}=await import('/assets/js/firebase-runtime.js');
        const {ref,getDownloadURL}=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js');
        return getDownloadURL(ref(storage,path));
      },popupPath);
      assert.ok(imageURL.startsWith(`http://127.0.0.1:${target.org==='kimhae'?9199:9299}/`));
      assert.deepEqual(Buffer.from(await (await fetch(imageURL)).arrayBuffer()),image);
      // Drive the real match modal and file picker, not just the Storage SDK.
      await page.evaluate(()=>{window.showPage('bracket');document.getElementById('brTS').value='demo-cup';window.onBrTC();});
      await page.waitForFunction(()=>{window.openM3('demo-cup_금','demo-match',true);return window._m3Ctx?.mid==='demo-match';});
      const chooserPromise=page.waitForEvent('filechooser');
      await page.evaluate(()=>window.triggerOrderPhoto(1,'upload'));
      const chooser=await chooserPromise;
      const orderUpload=currentUpload(page,target.org==='kimhae'?9199:9299,name=>name.startsWith('orderPhotos/demo-cup/')&&name.includes('/demo-match/side1_'));
      await chooser.setFiles({name:`order-${runId}.png`,mimeType:'image/png',buffer:image});
      const orderPath=await orderUpload;
      const matchURL=docURL.replace('meta/config','matches/demo-match');
      const savedMatch=await waitDocument(matchURL,doc=>doc.fields.orderPhotoStore?.mapValue.fields.side1?.mapValue.fields.storagePath?.stringValue===orderPath);
      const savedPhoto=savedMatch.fields.orderPhotoStore.mapValue.fields.side1.mapValue.fields;
      assert.deepEqual(Buffer.from(await (await fetch(savedPhoto.downloadURL.stringValue)).arrayBuffer()),Buffer.from(fixture.jpeg,'base64'));
      const identityURL='http://127.0.0.1:8080/v1/projects/demo-kimhae-dev/databases/(default)/documents/meta/config';
      const before=await (await fetch(identityURL)).json();
      await page.evaluate(()=>window.forceDirectorReLoginAll());
      const after=await (await fetch(identityURL)).json();
      assert.equal(Number(after.fields.regSessionVersion.integerValue),Number(before.fields.regSessionVersion.integerValue)+1);
      assert.equal(await page.evaluate(()=>localStorage.getItem('adm')),'production-session-must-survive');
      await page.reload({waitUntil:'load'});
      await page.waitForFunction(()=>window.getCurrentClubRoleInfo?.().role==='admin');
      await roleSession(page,target.org,'director');
      await roleSession(page,target.org,'member');
      results.push({org:target.org,runId,popupPath,orderPath,appStarted:true,noticeSaved:true,imageUploadedAndDownloaded:true,actualOrderPhotoUploaded:true,adminSessionRestored:true,directorAndMemberLoginReloadSwitch:true,sharedIdentitySavedToKimhaeDemo:true,productionRequests:forbidden.length,pageErrors:errors});
    }
    await context.close();
  }
  assert.deepEqual(forbidden,[],'No production Firebase request may be attempted');
  assert.ok(results.every(x=>x.pageErrors.length===0),JSON.stringify(results));
  await mkdir('test-results',{recursive:true});
  await writeFile(`test-results/${offline?'offline':'online'}.json`,JSON.stringify({results,forbidden},null,2));
  console.log(JSON.stringify(results,null,2));
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
