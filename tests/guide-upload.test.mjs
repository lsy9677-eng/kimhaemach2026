import test from 'node:test';
import assert from 'node:assert/strict';
import {withGuideDeadline,uploadGuideWithProgress,guideAssetsForSave} from '../assets/js/guide-upload.js';
function task(run){
 const t={cancelled:false,on(_event,next,error,complete){queueMicrotask(()=>run?.({next,error,complete}));return ()=>{};},cancel(){t.cancelled=true;}};return t;
}
test('guide upload reports progress and waits for a permanent URL',async()=>{
 const progress=[],t=task(({next,complete})=>{next({bytesTransferred:5,totalBytes:10});complete();});
 const url=await uploadGuideWithProgress({start:()=>t,getURL:async()=>'https://example.invalid/image.png',onProgress:p=>progress.push(p)});
 assert.equal(url,'https://example.invalid/image.png');assert.deepEqual(progress,[50]);assert.equal(t.cancelled,false);
});
test('a stalled upload is cancelled rather than left saving indefinitely',async()=>{
 const t=task();await assert.rejects(uploadGuideWithProgress({start:()=>t,getURL:async()=>'unused',stallMs:15,totalMs:1000}),/진행되지/);assert.equal(t.cancelled,true);
});
test('constant repeated progress does not indefinitely extend the stall limit',async()=>{
 let timer;const t=task(({next})=>{timer=setInterval(()=>next({bytesTransferred:5,totalBytes:10}),3);});
 try{await assert.rejects(uploadGuideWithProgress({start:()=>t,getURL:async()=>'unused',stallMs:15,totalMs:1000}),/진행되지/);assert.equal(t.cancelled,true);}finally{clearInterval(timer);}
});
test('an upload permission failure is propagated with actionable guidance',async()=>{
 const t=task(({error})=>error(Object.assign(new Error('denied'),{code:'storage/unauthorized'})));
 await assert.rejects(uploadGuideWithProgress({start:()=>t,getURL:async()=>'unused'}),e=>e.code==='storage/unauthorized'&&/권한/.test(e.message));
});
test('URL lookup cannot leave a completed upload saving indefinitely',async()=>{
 const t=task(({complete})=>complete());
 await assert.rejects(uploadGuideWithProgress({start:()=>t,getURL:()=>new Promise(()=>{}),urlMs:15}),/주소/);
});
test('unuploaded preview data cannot be sent as saved guide metadata',()=>{
 assert.throws(()=>guideAssetsForSave([{name:'pending.png',dataUrl:'data:image/png;base64,a',_pending:true}]),/업로드/);
 const result=guideAssetsForSave([{name:'saved.png',dataUrl:'https://example.invalid/a',isStorage:true,_uploadId:'id',_pending:false}]);
 assert.deepEqual(result,[{name:'saved.png',dataUrl:'https://example.invalid/a',isStorage:true}]);
});
test('read deadlines also release a failed edit metadata load',async()=>{
 await assert.rejects(withGuideDeadline(new Promise(()=>{}),10,'read timeout'),/read timeout/);
 assert.equal(await withGuideDeadline(Promise.resolve('ok'),100,'unused'),'ok');
});
