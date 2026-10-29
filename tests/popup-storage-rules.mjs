import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:9299',bucket='demo-jangyu-dev.appspot.com';
async function rules(content){const r=await fetch(origin+'/internal/setRules',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules:{files:[{name:'storage.rules',content}]}})});assert.equal(r.status,200,await r.text());}
function token(email,verified=true,provider='google.com'){
 const now=Math.floor(Date.now()/1000);return Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')+'.'+Buffer.from(JSON.stringify({iss:'https://securetoken.google.com/demo-jangyu-dev',aud:'demo-jangyu-dev',sub:'synthetic-popup-admin',user_id:'synthetic-popup-admin',iat:now,exp:now+3600,email,email_verified:verified,firebase:{sign_in_provider:provider,identities:{}}})).toString('base64url')+'.';
}
async function upload(path,{email,verified=true,provider='google.com',type='image/png',size=20}={}){return fetch(origin+'/v0/b/'+bucket+'/o?uploadType=media&name='+encodeURIComponent(path),{method:'POST',headers:{'Content-Type':type,...(email?{Authorization:'Bearer '+token(email,verified,provider)}:{})},body:Buffer.alloc(size)});}
try{
 for(const org of ['kimhae','jangyu']){
  await rules(await fs.readFile(new URL('../firebase/'+org+'.storage.rules',import.meta.url),'utf8'));
  const path='notices/popup/synthetic-'+org+'.png';
  for(const options of [{},{email:'stranger@example.invalid'},{email:'lsy9677@gmail.com',verified:false},{email:'lsy9677@gmail.com',provider:'password'},{email:'lsy9677@gmail.com',type:'text/html'},{email:'lsy9677@gmail.com',size:8*1024*1024+1}])assert.equal((await upload(path,options)).status,403,JSON.stringify({...options,size:options.size}));
  assert.equal((await upload(path,{email:'lsy9677@gmail.com'})).status,200);
  const file=origin+'/v0/b/'+bucket+'/o/'+encodeURIComponent(path);
  assert.equal((await fetch(file+'?alt=media')).status,200);
  assert.equal((await fetch(file,{method:'DELETE'})).status,403);
  assert.equal((await fetch(file,{method:'DELETE',headers:{Authorization:'Bearer '+token('lsy9677@gmail.com')}})).status,204);
  if(org==='kimhae'){
   assert.equal((await upload('guides/legacy/test.png')).status,200);
   assert.equal((await upload('orderPhotos/legacy/test.png')).status,200);
  }
  console.log(org+': popup image administrator access, public read, anonymous/other/unverified/wrong-provider/wrong-type/oversize denial passed');
 }
}finally{await rules(await fs.readFile(new URL('../dev/storage.rules',import.meta.url),'utf8'));}
