import {CrunchyrollClient,CrunchyrollApiError,CrunchyrollAuthError,type AuthSession,type CrunchyItem} from 'crunchy-api';
import {env} from 'cloudflare:workers';
import {getDb} from '../db';
import {crunchyConnections,follows} from '../db/schema';
import {eq,and} from 'drizzle-orm';
import type {Anime} from './anime';
import {encryptSession,decryptSession,normalizeCookie,providerRow,matchesHistory,type CrunchyCache,type ProviderRow} from './crunchyroll-core';
export type {CrunchyCache,ProviderRow} from './crunchyroll-core';
function createClient(){return new CrunchyrollClient({timeoutMs:12000,fetchImpl:(input,init)=>{const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);if(url.origin!=='https://beta-api.crunchyroll.com')throw new Error('Invalid provider host');return fetch(input,{...init,redirect:'error'});}});}
function encryptionKey(){const key=env.CRUNCHYROLL_ENCRYPTION_KEY;if(!key||!/^[a-f0-9]{64}$/.test(key))throw new Error('Connection storage is not configured.');return key;}
export async function connectCrunchyroll(userId:string,rawCookie:string){const cookie=normalizeCookie(rawCookie);const key=encryptionKey();const client=createClient();const session=await client.authenticateWithRtCookie({cookie});if(!session.accountId&&!session.profileId)throw new Error('Crunchyroll did not return an account profile.');const values={userId,encryptedSession:encryptSession(session,key),connectedAt:Date.now(),lastSyncedAt:null,lastError:null,cache:null};await getDb().insert(crunchyConnections).values(values).onConflictDoUpdate({target:crunchyConnections.userId,set:values});return syncCrunchyroll(userId);}
export async function getCrunchyStatus(userId:string){const row=(await getDb().select().from(crunchyConnections).where(eq(crunchyConnections.userId,userId)))[0];return {configured:!!env.CRUNCHYROLL_ENCRYPTION_KEY,connected:!!row,connectedAt:row?.connectedAt||null,lastSyncedAt:row?.lastSyncedAt||null,error:row?.lastError||null,data:row?.cache?JSON.parse(row.cache) as CrunchyCache:null};}
export async function disconnectCrunchyroll(userId:string){await getDb().delete(crunchyConnections).where(eq(crunchyConnections.userId,userId));}
export async function syncCrunchyroll(userId:string){
 const db=getDb();const row=(await db.select().from(crunchyConnections).where(eq(crunchyConnections.userId,userId)))[0];if(!row)throw new Error('Connect your Crunchyroll account first.');
 const key=encryptionKey();let session=decryptSession(row.encryptedSession,key);const client=createClient();
 if(!session.expiresAt||session.expiresAt<=Date.now()+60000){if(!session.cookie)throw new Error('Your connection expired. Reconnect with a fresh session cookie.');session=await client.authenticateWithRtCookie({cookie:session.cookie});}
 client.setSession(session);
 let watchlist:ProviderRow[]=[];let history:ProviderRow[]=[];let partial=false;
 for(let start=0;start<200;start+=100){const response=await client.getWatchlist({n:100,start,order:'desc'});watchlist.push(...response.data.map(providerRow));if(response.data.length<100)break;if(start===100&&(response.total===undefined||response.total>200))partial=true;}
 for(let page=1;page<=3;page++){const response=await client.getWatchHistory({page_size:100,page});history.push(...response.data.map(providerRow));if(response.data.length<100)break;if(page===3&&(response.total===undefined||response.total>300))partial=true;}
 const saved=await db.select().from(follows).where(eq(follows.userId,userId));let matched=0;let updated=0;
 for(const item of saved){const media=JSON.parse(item.media) as Anime;const hits=history.filter(h=>matchesHistory(media,h)&&h.completed&&h.episode!==null);if(!hits.length)continue;matched++;const watched=Math.min(media.episodes||10000,Math.max(...hits.map(h=>h.episode!)));if(watched>item.watched){await db.update(follows).set({watched}).where(and(eq(follows.userId,userId),eq(follows.mediaId,item.mediaId)));updated++;}}
 const data:CrunchyCache={watchlist,history,partial,matched,updated};await db.update(crunchyConnections).set({encryptedSession:encryptSession(session,key),cache:JSON.stringify(data),lastSyncedAt:Date.now(),lastError:null}).where(eq(crunchyConnections.userId,userId));return {connected:true,lastSyncedAt:Date.now(),data};
}
export function safeCrunchyError(error:unknown){if(error instanceof CrunchyrollAuthError||(error instanceof CrunchyrollApiError&&[401,403].includes(error.status||0)))return 'Crunchyroll rejected this session. Reconnect with a fresh etp_rt cookie, or try again later.';if(error instanceof CrunchyrollApiError)return 'Crunchyroll could not complete the request. Please try again shortly.';if(error instanceof Error&&['Enter a valid etp_rt session cookie.','Connect your Crunchyroll account first.','Connection storage is not configured.','Your connection expired. Reconnect with a fresh session cookie.','Crunchyroll did not return an account profile.'].includes(error.message))return error.message;return 'The Crunchyroll connection could not be completed. Please try again.';}


