'use strict';

export const MATCH_OPERATION_MODE_ONLINE='online_order';
export const MATCH_OPERATION_MODE_SIMPLE='simple_result';

export function normalizeMatchOperationMode(meta={}){
  const raw=String(meta?.matchOperationMode||'').trim();
  if(raw===MATCH_OPERATION_MODE_ONLINE || raw===MATCH_OPERATION_MODE_SIMPLE) return raw;
  return meta?.onlineOrderEnabled ? MATCH_OPERATION_MODE_ONLINE : MATCH_OPERATION_MODE_SIMPLE;
}

export function isOnlineOrderMode(meta={}){
  return normalizeMatchOperationMode(meta)===MATCH_OPERATION_MODE_ONLINE;
}

export function isSimpleResultMode(meta={}){
  return normalizeMatchOperationMode(meta)===MATCH_OPERATION_MODE_SIMPLE;
}

export function applyMatchOperationMode(meta={},mode){
  const normalized=mode===MATCH_OPERATION_MODE_ONLINE ? MATCH_OPERATION_MODE_ONLINE : MATCH_OPERATION_MODE_SIMPLE;
  meta.matchOperationMode=normalized;
  // 기존 코드/데이터와의 완전 호환을 위해 legacy boolean도 함께 유지한다.
  meta.onlineOrderEnabled=normalized===MATCH_OPERATION_MODE_ONLINE;
  return normalized;
}

export function getMatchOperationModeLabel(meta={}){
  return isOnlineOrderMode(meta) ? '온라인 오더 제출' : '현장 수기 · 결과만 입력';
}
