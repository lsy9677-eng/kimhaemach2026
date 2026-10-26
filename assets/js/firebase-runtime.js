import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {getFirestore,connectFirestoreEmulator} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {getStorage,connectStorageEmulator} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const runtime=window.MATCH_RUNTIME;
const organization=window.MATCH_ORGANIZATION;
if(!runtime||!organization)throw new Error('Firebase 환경 설정이 없습니다.');
if(runtime.emulator && (!organization.firebase.projectId.startsWith('demo-') || !window.MATCH_IDENTITY_FIREBASE.projectId.startsWith('demo-')))throw new Error('개발 환경에서 운영 Firebase 설정을 사용할 수 없습니다.');
export const app=initializeApp(organization.firebase, 'association-'+organization.id);
export const db=getFirestore(app);
export const identityDb=organization.id==='kimhae'?db:getFirestore(initializeApp(window.MATCH_IDENTITY_FIREBASE,'association-kimhae-identity'));
export const storage=getStorage(app);
// Connect every instance before any consumer can issue a Firebase operation.
// A stopped emulator stays the target; there is deliberately no fallback.
if(runtime.emulator){
  const target=runtime[organization.id];
  connectFirestoreEmulator(db,target.host,target.firestore);
  if(identityDb!==db)connectFirestoreEmulator(identityDb,runtime.kimhae.host,runtime.kimhae.firestore);
  connectStorageEmulator(storage,target.host,target.storage);
}
