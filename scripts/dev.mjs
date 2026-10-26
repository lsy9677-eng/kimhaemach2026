import {startServer} from './server.mjs';
import {suites,startSuite,stopSuite} from './emulators.mjs';
const running=[];
const server=await startServer();
let stopping=false;
async function stop(code=0){
  if(stopping)return;stopping=true;
  await Promise.all(running.map(stopSuite));
  server.close();process.exitCode=code;
}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
try{
  for(const suite of suites){
    const instance=await startSuite(suite,{onSpawn:instance=>running.push(instance)});
    if(stopping){await stopSuite(instance);break;}
    instance.child.on('exit',code=>{if(!stopping){console.error(suite.project+' Emulator 종료. 운영 연결로 전환하지 않습니다.');stop(code||1);}});
  }
  if(!stopping)console.log('개발 서버: http://127.0.0.1:5500 · 별도 터미널에서 npm.cmd run seed');
}catch(error){console.error(error);await stop(1);}
