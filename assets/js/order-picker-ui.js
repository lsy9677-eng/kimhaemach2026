'use strict';

export function buildTapOrderSummaryHtml({slots=[],cursor=0,escapeHtml=(x)=>String(x||'')}={}){
  return (slots||[]).map((arr,r)=>{
    const pair=Array.isArray(arr)?arr:[];
    const active=r===Number(cursor||0);
    const ghost=pair[0]==='__GHOST__';
    const label=ghost?'공오더':(pair.length?pair.map(escapeHtml).join(' / '):'<span style="color:var(--text3);font-weight:600">미선택</span>');
    return `<div onclick="tapOrderFocus(${r})" style="cursor:pointer;padding:10px 12px;border-radius:12px;border:${active?'2px solid #2563eb':'1px solid var(--border)'};background:${active?'#eff6ff':'#fff'}"><div style="font-size:.76rem;font-weight:900;color:${active?'#1d4ed8':'var(--text2)'};margin-bottom:4px">${r+1}복식</div><div style="font-size:.86rem;font-weight:800;line-height:1.6;color:${ghost?'#9a3412':'var(--primary-dark)'}">${label}</div></div>`;
  }).join('');
}

export function buildTapOrderCurrentText({cursor=0,doublesCount=0,pair=[]}={}){
  const dbl=Math.max(0,Number(doublesCount||0)), cur=Math.min(Number(cursor||0)+1,dbl), arr=Array.isArray(pair)?pair:[];
  return arr[0]==='__GHOST__'?`현재 ${cur}복식 · 공오더 선택됨`:`현재 ${cur}복식 · ${arr.length}/2명 선택`;
}

export function buildTapOrderPlayerListHtml({players=[],currentPair=[],usedPlayers=[],escapeHtml=(x)=>String(x||''),escapeAttr=(x)=>String(x||'')}={}){
  const cur=Array.isArray(currentPair)?currentPair:[], used=Array.isArray(usedPlayers)?usedPlayers:[], ghost=cur[0]==='__GHOST__';
  const g=`<button type="button" onclick="tapOrderGhost()" style="padding:10px 14px;border-radius:12px;border:1.5px dashed #d97706;background:${ghost?'#d97706':'#fff7ed'};color:${ghost?'#fff':'#9a3412'};font-size:.9rem;font-weight:900;cursor:pointer;margin-right:6px">⚠️ 공오더</button>`;
  return g+(players||[]).map(p=>{ const name=String(p||''), on=cur.includes(name), dis=used.includes(name)&&!on; return `<button type="button" onclick="tapOrderPick('${escapeAttr(name)}')" ${dis?'disabled':''} style="padding:10px 14px;border-radius:999px;border:1.5px solid ${on?'#2563eb':(dis?'#d1d5db':'var(--border)')};background:${on?'#dbeafe':(dis?'#f3f4f6':'#fff')};color:${on?'#1d4ed8':(dis?'#9ca3af':'var(--text)')};font-size:.92rem;font-weight:800;cursor:${dis?'not-allowed':'pointer'}">${escapeHtml(name)}</button>`; }).join('');
}

export function buildReorderOverlayHtml({teamLabel='',escapeHtml=(x)=>String(x||'')}={}){
  return `<div style="background:#fff;border-radius:16px;width:100%;max-width:400px;box-shadow:0 8px 40px rgba(0,0,0,.3);overflow:hidden"><div style="background:var(--primary);color:white;padding:14px 16px;display:flex;align-items:center;justify-content:space-between"><span style="font-weight:800;font-size:.95rem">🔀 ${teamLabel?escapeHtml(teamLabel)+' ':''}복식 순서 변경</span><button onclick="closeReorderPopup()" style="background:none;border:none;color:white;font-size:1.2rem;cursor:pointer;line-height:1">✕</button></div><div style="padding:14px 16px"><div style="font-size:.78rem;color:var(--text2);margin-bottom:12px;line-height:1.6;background:#f8fafc;padding:8px 12px;border-radius:8px;border:1px solid var(--border)">👆 아래 카드를 <b>새 순서대로 탭</b>하세요.<br>탭한 순서대로 1복식 → 2복식 → … 에 배치됩니다.${teamLabel?`<br><span style="font-weight:800;color:var(--primary)">${escapeHtml(teamLabel)}</span> 선수만 순서가 변경됩니다.`:''}</div><div id="reorderCards" style="display:flex;flex-direction:column;gap:8px"></div><div id="reorderPreview" style="margin-top:12px;padding:10px 12px;background:#f0fdf4;border:1.5px solid #16a34a;border-radius:10px;font-size:.78rem;display:none"><div style="font-weight:800;color:#166534;margin-bottom:6px">✅ 확정 순서</div><div id="reorderPreviewList"></div></div></div><div style="padding:10px 16px 16px;display:flex;gap:8px;justify-content:flex-end"><button onclick="reorderReset()" style="padding:8px 16px;border-radius:8px;border:1.5px solid var(--border);background:#fff;font-size:.84rem;cursor:pointer;font-weight:700">↺ 초기화</button><button onclick="closeReorderPopup()" style="padding:8px 16px;border-radius:8px;border:1.5px solid var(--border);background:#fff;font-size:.84rem;cursor:pointer;font-weight:700">취소</button><button id="reorderApplyBtn" onclick="applyReorder()" style="padding:8px 18px;border-radius:8px;border:none;background:var(--primary);color:white;font-size:.84rem;cursor:pointer;font-weight:800" disabled>적용</button></div></div>`;
}

export function buildReorderCardsHtml({slots=[],picked=[],side=0,escapeHtml=(x)=>String(x||'')}={}){
  return (slots||[]).map((slot,idx)=>{ const seq=(picked||[]).indexOf(idx), yes=seq>=0; const p1=(slot.p1||[]).length?slot.p1.map(escapeHtml).join(' / '):'(미선택)'; const p2=(slot.p2||[]).length?slot.p2.map(escapeHtml).join(' / '):'(미선택)'; const line=Number(side)===1?p1:Number(side)===2?p2:`${p1} · ${p2}`; return `<div onclick="reorderTap(${idx})" style="cursor:pointer;padding:10px 14px;border-radius:12px;border:2px solid ${yes?'var(--primary)':'var(--border)'};background:${yes?'linear-gradient(135deg,#eef2ff,#dce8fb)':'#fff'};display:flex;align-items:center;gap:12px;transition:.15s;user-select:none;-webkit-tap-highlight-color:transparent"><div style="width:32px;height:32px;border-radius:50%;background:${yes?'var(--primary)':'var(--border)'};color:${yes?'white':'var(--text2)'};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.9rem;flex-shrink:0">${yes?seq+1:''}</div><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:.82rem;color:var(--primary-dark);margin-bottom:2px">기존 ${escapeHtml(slot.label||`${idx+1}복식`)}</div><div style="font-size:.74rem;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${line}</div></div>${yes?`<div style="font-size:.7rem;font-weight:800;color:var(--primary);white-space:nowrap">→ ${seq+1}복식</div>`:''}</div>`; }).join('');
}

export function buildReorderPreviewHtml({slots=[],picked=[],side=0,escapeHtml=(x)=>String(x||'')}={}){
  return (picked||[]).map((origIdx,newR)=>{ const slot=slots?.[origIdx]||{}; const p1=(slot.p1||[]).map(escapeHtml).join('/')||'미선택'; const p2=(slot.p2||[]).map(escapeHtml).join('/')||'미선택'; const line=Number(side)===1?p1:Number(side)===2?p2:`${p1} · ${p2}`; return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:.78rem"><span style="font-weight:800;color:var(--primary);min-width:40px">${newR+1}복식</span><span style="color:var(--text3)">←</span><span>기존 ${escapeHtml(slot.label||`${origIdx+1}복식`)}</span><span style="color:var(--text2);font-size:.72rem">(${line})</span></div>`; }).join('');
}
