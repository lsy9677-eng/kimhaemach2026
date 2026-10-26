import {test} from 'node:test';
import assert from 'node:assert/strict';
import {imageDataUrlToBlob} from '../assets/js/image-data.js';
test('image data is decoded byte-for-byte without a network request',async()=>{
  const bytes=Uint8Array.from([0,1,127,128,255]);
  const blob=imageDataUrlToBlob('data:image/png;base64,'+Buffer.from(bytes).toString('base64'));
  assert.equal(blob.type,'image/png');assert.deepEqual(new Uint8Array(await blob.arrayBuffer()),bytes);
});
test('percent encoded data and invalid URLs are handled explicitly',async()=>{
  assert.equal(await imageDataUrlToBlob('data:text/plain,hello%20world').text(),'hello world');
  assert.throws(()=>imageDataUrlToBlob('https://example.org/image.png'),/data URL/);
});
