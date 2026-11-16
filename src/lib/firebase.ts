// MVP adapter: the original UI calls these names, but storage is this browser only.
// There is no Firebase initialization, cloud account, network read or shared database.
export interface SyncMessage { id: string; role: 'user' | 'model'; text: string; timestamp: string; citations?: Array<{title:string;uri:string}>; isEncrypted?: boolean; reactions?: string[]; feedback?: 'like'|'dislike'|null; modelUsed?:string; imageAttachment?:any; generatedImage?:{url:string;prompt:string}; }
export interface SyncChatSession { id:string;title:string;timestamp:string;updatedAt?:string;messages:SyncMessage[];mode?:string;userId?:string;lastSyncedAt?:string; }
type User = {id?:string;email?:string}|null|string;
export const ensureFirebaseAuth = async () => ({ uid: getCleanUserId(null), isAnonymous: true });
export const getCleanUserId = (user:User):string => {
  if (typeof user === 'string') return user.replace(/[^a-zA-Z0-9_-]/g,'_');
  if (user?.id) return user.id.replace(/[^a-zA-Z0-9_-]/g,'_');
  let id = localStorage.getItem('best_friend_guest_uid'); if (!id) { id = 'guest_' + crypto.randomUUID(); localStorage.setItem('best_friend_guest_uid',id); } return id;
};
const key = (user:User) => 'karishma_mvp_history_' + getCleanUserId(user);
const read = (user:User):SyncChatSession[] => { try { const value = JSON.parse(localStorage.getItem(key(user)) || '[]'); return Array.isArray(value)?value:[]; } catch { return []; } };
export const mergeSyncMessages = (a:SyncMessage[]=[],b:SyncMessage[]=[]) => Array.from(new Map([...a,...b].map(m=>[m.id,m])).values());
export async function saveConversationToCloud(user:User,session:SyncChatSession,..._args:any[]):Promise<boolean> {
  if (localStorage.getItem('best_friend_retention_policy') === 'session') return true;
  try { const sessions=read(user);const i=sessions.findIndex(s=>s.id===session.id);if(i>=0)sessions[i]=session;else sessions.unshift(session);localStorage.setItem(key(user),JSON.stringify(sessions));return true;}catch{return false;}
}
export async function deleteConversationFromCloud(user:User,id:string,..._args:any[]):Promise<boolean> {
  try {localStorage.setItem(key(user),JSON.stringify(read(user).filter(s=>s.id!==id)));for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('best_friend_saved_chats')){const raw=localStorage.getItem(k)||'[]';try{const list=raw.startsWith('[')?JSON.parse(raw):JSON.parse(decodeURIComponent(atob(raw)));localStorage.setItem(k,btoa(encodeURIComponent(JSON.stringify(list.filter((s:any)=>s.id!==id)))));}catch{}}}return true;}catch{return false;}
}
export function subscribeToUserConversations(user:User,onUpdate:(s:SyncChatSession[])=>void,onError?:(e:Error)=>void):()=>void {
  // Merge with the UI's existing local cache instead of replacing it with an empty store.
  if (localStorage.getItem("best_friend_retention_policy") === "session") { queueMicrotask(()=>onUpdate([])); return ()=>{}; }
  const stored=read(user);const id=getCleanUserId(user);const cacheKey=`best_friend_saved_chats_${user?'user':'guest'}_${id}`;
  try {const raw=localStorage.getItem(cacheKey);const local=raw?(raw.startsWith('[')?JSON.parse(raw):JSON.parse(decodeURIComponent(atob(raw)))):[];const all=Array.from(new Map([...stored,...local].map((s:SyncChatSession)=>[s.id,s])).values());queueMicrotask(()=>onUpdate(all as SyncChatSession[]));}catch{queueMicrotask(()=>onUpdate(stored));}
  return ()=>{};
}
export async function syncAllLocalSessionsToCloud(user:User,sessions:SyncChatSession[]){const results=await Promise.all(sessions.map(s=>saveConversationToCloud(user,s)));return results.every(Boolean);}
export const flushPendingSyncQueue = async (..._args:any[]) => true;
