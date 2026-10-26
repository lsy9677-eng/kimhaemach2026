import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png'};
export function startServer(port=5500){
  const server=http.createServer(async(req,res)=>{
    // Browser SDK traffic can reach loopback emulators only. CDN script imports
    // remain usable, but production Firestore/Storage cannot be contacted.
    res.setHeader('Content-Security-Policy',"connect-src 'self' http://127.0.0.1:8080 http://127.0.0.1:8081 http://127.0.0.1:9199 http://127.0.0.1:9299; img-src 'self' data: blob: http://127.0.0.1:9199 http://127.0.0.1:9299; frame-src 'none'; form-action 'self'; object-src 'none'");
    res.setHeader('Cache-Control','no-store');
    try{
      const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
      const relative=path.relative(root,file);
      if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(p=>p.startsWith('.'))||relative.startsWith('node_modules')){res.writeHead(403).end();return;}
      const body=await readFile(file);
      res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(body);
    }catch{res.writeHead(404).end();}
  });
  return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>resolve(server));});
}
if(process.argv[1]===fileURLToPath(import.meta.url)){await startServer();console.log('개발 서버: http://127.0.0.1:5500 (운영 Firebase 통신 차단)');}
