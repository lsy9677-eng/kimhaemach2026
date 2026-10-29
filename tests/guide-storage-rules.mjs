import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:9299',bucket='demo-jangyu-dev.appspot.com';
async function rules(content){const r=await fetch(origin+'/internal/setRules',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules:{files:[{name:'storage.rules',content}]}})});assert.equal(r.status,200,await r.text());}
function token(email,verified=true,provider='google.com'){
 const now=Math.floor(Date.now()/1000),payload={iss:'https://securetoken.google.com/demo-jangyu-dev',aud:'demo-jangyu-dev',sub:'synthetic-upload-admin',user_id:'synthetic-upload-admin',iat:now,exp:now+3600,email,email_verified:verified,firebase:{sign_in_provider:provider,identities:{}}};
 return Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')+'.'+Buffer.from(JSON.stringify(payload)).toString('base64url')+'.';
}
async function upload(path,{email,verified=true,provider='google.com',type='image/png'}={}){
 return fetch(origin+'/v0/b/'+bucket+'/o?uploadType=media&name='+encodeURIComponent(path),{method:'POST',headers:{'Content-Type':type,...(email?{Authorization:'Bearer '+token(email,verified,provider)}:{})},body:Buffer.from('synthetic-file')});
}
try{
 await rules(await fs.readFile(new URL('../firebase/jangyu.storage.rules',import.meta.url),'utf8'));
 assert.equal((await upload('guides/security-test/anonymous.png')).status,403);
 assert.equal((await upload('guides/security-test/stranger.png',{email:'stranger@example.invalid'})).status,403);
 assert.equal((await upload('guides/security-test/unverified.png',{email:'lsy9677@gmail.com',verified:false})).status,403);
 assert.equal((await upload('guides/security-test/provider.png',{email:'lsy9677@gmail.com',provider:'password'})).status,403);
 assert.equal((await upload('guides/security-test/invalid.html',{email:'lsy9677@gmail.com',type:'text/html'})).status,403);
 assert.equal((await upload('private/security-test.png',{email:'lsy9677@gmail.com'})).status,403);
 const saved=await upload('guides/security-test/allowed.png',{email:'lsy9677@gmail.com'});assert.equal(saved.status,200,await saved.text());
 assert.equal((await upload('guides/security-test/second.png',{email:'canyone2@korea.com'})).status,200);
 const file=origin+'/v0/b/'+bucket+'/o/'+encodeURIComponent('guides/security-test/allowed.png');
 assert.equal((await fetch(file+'?alt=media')).status,200);
 assert.equal((await fetch(file,{method:'DELETE'})).status,403);
 assert.equal((await fetch(file,{method:'DELETE',headers:{Authorization:'Bearer '+token('lsy9677@gmail.com')}})).status,204);
 console.log('Guide storage rules: allowed administrator image uploads/read/delete and denied anonymous/other/unverified/wrong-provider/wrong-MIME/out-of-path writes passed.');
}finally{await rules(await fs.readFile(new URL('../dev/storage.rules',import.meta.url),'utf8'));}
