import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(new URL('../assets/js/app.js',import.meta.url),'utf8');
const helpers=source.slice(source.indexOf('function popupNoticeDayKey('),source.indexOf('function previewPopupNotice(){'));
test('today suppression survives reload, separates organizations and expires at Korean midnight',()=>{
 const data=new Map();let org='kimhae',now=Date.parse('2026-10-29T14:59:59Z'),closed=0;
 const context=vm.createContext({window:{},Date:class extends Date{static now(){return now;}},organizationLocalStorage:{getItem:key=>data.get(org+key),setItem:(key,value)=>data.set(org+key,value)},closePopupNoticeView:()=>closed++,toast:()=>{}});
 vm.runInContext(helpers,context);
 context.hidePopupNoticeToday();assert.equal(closed,1);assert.equal(context.isPopupNoticeHiddenToday(),true);
 vm.runInContext(helpers,context);assert.equal(context.isPopupNoticeHiddenToday(),true);
 org='jangyu';assert.equal(context.isPopupNoticeHiddenToday(),false);
 org='kimhae';now=Date.parse('2026-10-29T15:00:00Z');assert.equal(context.isPopupNoticeHiddenToday(),false);
});
test('blocked browser storage reports failure without falsely claiming suppression',()=>{
 let error='',closed=false;
 const context=vm.createContext({window:{},Date,organizationLocalStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},closePopupNoticeView:()=>closed=true,toast:message=>error=message});
 vm.runInContext(helpers,context);assert.equal(context.isPopupNoticeHiddenToday(),false);context.hidePopupNoticeToday();assert.match(error,/저장하지 못/);assert.equal(closed,false);
});
