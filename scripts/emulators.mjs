import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {root} from './server.mjs';
export const suites=[{org:'kimhae',project:'demo-kimhae-dev',hub:4400},{org:'jangyu',project:'demo-jangyu-dev',hub:4401}];
export function emulatorEnvironment(org){
  const env={...process.env,CI:'true',XDG_CONFIG_HOME:path.join(root,'.local/config'),FIREBASE_EMULATORS_PATH:path.join(root,'.local/emulators')};
  delete env.FIREBASE_TOKEN;delete env.GOOGLE_APPLICATION_CREDENTIALS;
  const temporary=path.join(root,'.local/tmp',org);
  mkdirSync(temporary,{recursive:true});
  env.TEMP=temporary;env.TMP=temporary;env.TMPDIR=temporary;
  const javaRoot=path.join(root,'.local/java');
  if(existsSync(javaRoot)){
    const jdk=readdirSync(javaRoot,{withFileTypes:true}).find(x=>x.isDirectory());
    if(jdk){env.JAVA_HOME=path.join(javaRoot,jdk.name);env.PATH=path.join(env.JAVA_HOME,'bin')+path.delimiter+env.PATH;}
  }
  return env;
}
export async function startSuite(suite,{onSpawn}={}){
  const env=emulatorEnvironment(suite.org);
  const child=spawn(process.execPath,['scripts/emulator-process.cjs','emulators:start','--only','firestore,storage','--project',suite.project,'--config',`dev/firebase.${suite.org}.json`],{cwd:root,env,stdio:['ignore','inherit','inherit','ipc'],windowsHide:true});
  const instance={child,suite,temporary:env.TEMP};
  onSpawn?.(instance);
  let failure;child.once('error',error=>{failure=error;});
  for(let attempt=0;attempt<180;attempt++){
    if(failure||child.exitCode!==null)throw failure||new Error(`${suite.project} Emulator 시작 실패 (${child.exitCode})`);
    try{
      const locator=await (await fetch(`http://127.0.0.1:${suite.hub}/`,{signal:AbortSignal.timeout(1000)})).json();
      if(locator.pid!==child.pid)throw new Error('Another emulator owns this hub');
      const response=await fetch(`http://127.0.0.1:${suite.hub}/emulators`,{signal:AbortSignal.timeout(1000)});
      const running=await response.json();
      if(running.firestore&&running.storage){
        // Hub registration precedes listen(); verify both actual HTTP listeners.
        await Promise.all([running.firestore.port,running.storage.port].map(port=>fetch(`http://127.0.0.1:${port}/`,{signal:AbortSignal.timeout(1000)})));
        return instance;
      }
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  await stopSuite({child});throw new Error(`${suite.project} Emulator 준비 시간 초과`);
}
export async function stopSuite({child}){
  if(child.exitCode!==null||child.signalCode!==null)return;
  const exited=new Promise(resolve=>child.once('exit',resolve));
  if(child.connected)child.send('shutdown');else child.kill('SIGINT');
  let timer;
  const forced=new Promise(resolve=>{timer=setTimeout(()=>{
    if(process.platform==='win32')spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else child.kill('SIGKILL');resolve();
  },15000);});
  await Promise.race([exited,forced]);clearTimeout(timer);
}
