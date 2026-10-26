import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {access,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {suites,startSuite,stopSuite} from '../scripts/emulators.mjs';
const running=[];const runId=randomUUID();
async function upload(suite){
  const port=suite.org==='kimhae'?9199:9299;
  const name=`isolation/${runId}/${suite.org}.txt`;
  const content=`synthetic-${suite.org}-${runId}`;
  const url=`http://127.0.0.1:${port}/v0/b/${suite.project}.appspot.com/o`;
  const response=await fetch(`${url}?name=${encodeURIComponent(name)}`,{method:'POST',headers:{'Content-Type':'text/plain'},body:content});
  assert.ok(response.ok,await response.text().then(text=>`upload ${response.status}: ${text}`));
  return {url:`${url}/${encodeURIComponent(name)}?alt=media`,content};
}
async function verify(file){const response=await fetch(file.url);assert.ok(response.ok);assert.equal(await response.text(),file.content);}
async function verifyCleanup(instance){
  assert.equal(instance.child.exitCode,0,'Emulator must exit gracefully, not be force-killed');
  await assert.rejects(access(path.join(instance.temporary,'firebase/storage/blobs')),error=>error.code==='ENOENT');
}
try{
  for(const suite of suites)running.push(await startSuite(suite));
  assert.notEqual(running[0].temporary,running[1].temporary);
  const kimhaeFile=await upload(suites[0]),jangyuFile=await upload(suites[1]);
  await verify(kimhaeFile);await verify(jangyuFile);
  await stopSuite(running[0]);await verifyCleanup(running[0]);await verify(jangyuFile);
  running[0]=await startSuite(suites[0]);
  const restartedFile=await upload(suites[0]);
  await stopSuite(running[1]);await verifyCleanup(running[1]);await verify(restartedFile);
  const result={runId,separateTemporaryDirectories:true,kimhaeGracefulStopPreservesJangyu:true,jangyuGracefulStopPreservesKimhae:true};
  await mkdir('test-results',{recursive:true});await writeFile('test-results/storage-isolation.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
}finally{await Promise.all(running.map(stopSuite));}
