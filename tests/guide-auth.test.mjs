import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=(await fs.readFile(new URL('../assets/js/guide-auth.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
function fixture({user=null,org='jangyu',emulator=false}={}){
 const auth={currentUser:user,authStateReady:async()=>{}},state={popup:0,signedOut:0};
 class Provider{setCustomParameters(){}}
 const ctx=vm.createContext({window:{MATCH_RUNTIME:{emulator},MATCH_ORGANIZATION:{id:org}},app:{},getAuth:()=>auth,GoogleAuthProvider:Provider,signInWithPopup:async()=>{state.popup++;return {user};},signOut:async()=>{state.signedOut++;auth.currentUser=null;}});
 vm.runInContext(source,ctx);return {ctx,auth,state};
}
test('Jangyu image upload rejects unauthenticated and unverified accounts',async()=>{
 for(const user of [null,{email:'lsy9677@gmail.com',emailVerified:false},{email:'stranger@example.invalid',emailVerified:true}]){
  const {ctx}=fixture({user});await assert.rejects(ctx.requireGuideUploadAdministrator(),/관리자 인증/);
 }
});
test('approved upload owner refreshes Firebase credentials before storage write',async()=>{
 let refreshed=0;const {ctx}=fixture({user:{email:'lsy9677@gmail.com',emailVerified:true,getIdToken:async()=>refreshed++}});
 await ctx.requireGuideUploadAdministrator();assert.equal(refreshed,1);
});
test('wrong Google account is signed out rather than silently granted upload access',async()=>{
 const {ctx,state}=fixture({user:{email:'stranger@example.invalid',emailVerified:true}});
 await assert.rejects(ctx.authenticateGuideUpload(),/등록된 업로드 관리자/);assert.equal(state.signedOut,1);
});
test('Kimhae and isolated demo uploads retain their existing flows',async()=>{
 for(const config of [{org:'kimhae'},{emulator:true}]){const {ctx,state}=fixture(config);await ctx.requireGuideUploadAdministrator();await ctx.authenticateGuideUpload();assert.equal(state.popup,0);}
});
test('Kimhae popup images require upload authentication without changing legacy guide behavior',async()=>{
 const {ctx}=fixture({org:'kimhae'});await ctx.requireGuideUploadAdministrator();
 await assert.rejects(ctx.requireGuideUploadAdministrator('notice'),/관리자 인증/);
});
