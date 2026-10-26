// Decode in memory so connect-src can remain restricted to local emulators.
export function imageDataUrlToBlob(url){
  const match=/^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(String(url));
  if(!match)throw new Error('이미지 data URL 형식이 올바르지 않습니다');
  const bytes=match[2]?Uint8Array.from(atob(match[3]),character=>character.charCodeAt(0)):new TextEncoder().encode(decodeURIComponent(match[3]));
  return new Blob([bytes],{type:match[1]||'application/octet-stream'});
}
