export function withGuideDeadline(promise,ms,label){
  let timer;
  return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label)),ms);})]).finally(()=>clearTimeout(timer));
}
export function uploadGuideWithProgress({start,getURL,onProgress=()=>{},totalMs=180000,stallMs=30000,urlMs=15000}){
  return new Promise((resolve,reject)=>{
    let task,unsubscribe,stall,total,settled=false,lastBytes=-1;
    const clear=()=>{clearTimeout(stall);clearTimeout(total);unsubscribe?.();};
    const fail=(error,cancel=false)=>{
      if(settled)return;settled=true;clear();if(cancel)try{task?.cancel();}catch{}
      if(error?.code?.startsWith('storage/')){
        const code=error.code;
        error=new Error(code==='storage/unauthorized'?'이미지 업로드 권한이 없습니다. 파일 저장소 설정을 확인해 주세요.':code==='storage/bucket-not-found'||code==='storage/project-not-found'?'대회 이미지 저장소를 찾을 수 없습니다. 운영자가 Firebase Storage 설정을 확인해야 합니다.':'이미지 업로드에 실패했습니다. 파일은 유지되므로 다시 저장해 주세요.');
        error.code=code;
      }
      reject(error instanceof Error?error:new Error(String(error?.message||error)));
    };
    const stalled=()=>{clearTimeout(stall);stall=setTimeout(()=>fail(new Error('이미지 업로드가 진행되지 않습니다. 연결 상태를 확인한 뒤 다시 저장해 주세요.'),true),stallMs);};
    try{
      task=start();stalled();total=setTimeout(()=>fail(new Error('이미지 업로드 시간이 초과되었습니다. 파일은 유지되므로 다시 저장할 수 있습니다.'),true),totalMs);
      unsubscribe=task.on('state_changed',snapshot=>{
        if(settled)return;
        if(snapshot.bytesTransferred>lastBytes){lastBytes=snapshot.bytesTransferred;stalled();}
        onProgress(snapshot.totalBytes?Math.round(snapshot.bytesTransferred*100/snapshot.totalBytes):0);
      },error=>fail(error),()=>{
        clear();
        withGuideDeadline(Promise.resolve().then(getURL),urlMs,'업로드된 이미지 주소를 확인하지 못했습니다. 다시 저장해 주세요.').then(url=>{
          if(settled)return;settled=true;resolve(url);
        },error=>fail(error));
      });
    }catch(error){fail(error);}
  });
}
export function guideAssetsForSave(assets){
  return assets.map(({_pending,_uploadId,...asset})=>{
    if(_pending)throw new Error('업로드가 끝나지 않은 첨부 파일이 있습니다. 다시 저장해 주세요.');
    return asset;
  });
}
