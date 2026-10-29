import {app} from './firebase-runtime.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const uploadEmails=new Set(['lsy9677@gmail.com','canyone2@korea.com']);
export function usesGuideAuthentication(){return !window.MATCH_RUNTIME?.emulator&&window.MATCH_ORGANIZATION?.id==='jangyu';}
function isUploadAdministrator(user){return !!user?.emailVerified&&uploadEmails.has(String(user.email||'').toLowerCase());}
export async function authenticateGuideUpload(){
 if(!usesGuideAuthentication())return;
 const auth=getAuth(app),provider=new GoogleAuthProvider();
 provider.setCustomParameters({prompt:'select_account'});
 try{
  const result=await signInWithPopup(auth,provider);
  if(!isUploadAdministrator(result.user)){await signOut(auth);throw new Error('등록된 업로드 관리자 계정으로 Google 로그인을 해주세요.');}
  return result.user;
 }catch(error){
  const messages={'auth/operation-not-allowed':'Firebase에서 Google 로그인을 활성화해야 합니다.','auth/unauthorized-domain':'Firebase 로그인 허용 도메인을 확인해야 합니다.','auth/popup-blocked':'팝업이 차단됐습니다. 이 사이트의 팝업을 허용한 뒤 다시 눌러주세요.','auth/popup-closed-by-user':'인증 창이 닫혔습니다. 다시 인증해주세요.'};
  throw new Error(messages[error.code]||error.message||'업로드 관리자 인증에 실패했습니다.');
 }
}
export async function requireGuideUploadAdministrator(){
 if(!usesGuideAuthentication())return;
 const auth=getAuth(app);await auth.authStateReady();
 if(!isUploadAdministrator(auth.currentUser))throw new Error('첨부 파일 위의 ‘업로드 관리자 인증’을 먼저 눌러주세요. 선택한 파일은 유지됩니다.');
 await auth.currentUser.getIdToken();
}
