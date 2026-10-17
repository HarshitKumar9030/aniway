import type {AuthSession,CrunchyItem} from 'crunchy-api';
import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import type {Anime} from './anime';
export type ProviderRow={id:string;title:string;seriesTitle:string;seasonTitle:string;episode:number|null;season:number|null;completed:boolean;progress:number|null;url:string};
export type CrunchyCache={watchlist:ProviderRow[];history:ProviderRow[];partial:boolean;matched:number;updated:number};
export function encryptSession(session:AuthSession,keyHex:string){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',Buffer.from(keyHex,'hex'),iv);const body=Buffer.concat([cipher.update(JSON.stringify(session),'utf8'),cipher.final()]);return ['v1',iv.toString('hex'),cipher.getAuthTag().toString('hex'),body.toString('hex')].join(':');}
export function decryptSession(value:string,keyHex:string):AuthSession{const [version,iv,tag,body]=value.split(':');if(version!=='v1'||!iv||!tag||!body)throw new Error('Invalid encrypted session');const cipher=createDecipheriv('aes-256-gcm',Buffer.from(keyHex,'hex'),Buffer.from(iv,'hex'));cipher.setAuthTag(Buffer.from(tag,'hex'));return JSON.parse(Buffer.concat([cipher.update(Buffer.from(body,'hex')),cipher.final()]).toString('utf8'));}
export function normalizeCookie(value:string){const raw=value.trim();if(/[\r\n]/.test(raw))throw new Error('Enter a valid etp_rt session cookie.');const match=raw.match(/(?:^|;\s*)etp_rt=([^;\r\n]+)/);const token=match?match[1].trim():raw;if(token.length<10||token.length>3500||!/^[A-Za-z0-9._~%+/=-]+$/.test(token))throw new Error('Enter a valid etp_rt session cookie.');return 'etp_rt='+token;}
const record=(v:unknown):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
export function providerRow(entry:CrunchyItem):ProviderRow{
 const panel=record(entry.panel);const meta=record(panel.episode_metadata||entry.episode_metadata);const seriesMeta=record(panel.series_metadata);const id=String(panel.id||entry.id||'');
 const seriesTitle=String(meta.series_title||entry.series_title||seriesMeta.title||panel.title||entry.title||'Untitled anime');
 const episode=Number(meta.episode_number??panel.episode_number??entry.episode_number);const season=Number(meta.season_number??entry.season_number);
 const progress=Number(entry.progress??panel.progress);const playheadMs=entry.playhead_ms??panel.playhead_ms;const durationMs=entry.duration_ms??meta.duration_ms??panel.duration_ms;const playhead=playheadMs!==undefined?Number(playheadMs)/1000:Number(entry.playhead??panel.playhead);const duration=durationMs!==undefined?Number(durationMs)/1000:Number(entry.duration??panel.duration);
 const explicit=entry.fully_watched??entry.is_completed??panel.fully_watched??panel.is_completed;
 const completed=explicit===true||(explicit!==false&&((progress>=.99&&progress<=1)||(duration>0&&playhead/duration>=.99)));
 const url=/^[A-Za-z0-9_-]{6,30}$/.test(id)?`https://www.crunchyroll.com/${panel.type==='series'||entry.type==='series'?'series':'watch'}/${id}`:`https://www.crunchyroll.com/search?q=${encodeURIComponent(seriesTitle)}`;
 return {id,title:String(panel.title||entry.title||seriesTitle).slice(0,250),seriesTitle:seriesTitle.slice(0,250),seasonTitle:String(meta.season_title||entry.season_title||'').slice(0,250),episode:Number.isInteger(episode)&&episode>0?episode:null,season:Number.isInteger(season)&&season>0?season:null,completed,progress:Number.isFinite(progress)&&progress>=0&&progress<=1?progress:duration>0&&Number.isFinite(playhead)?Math.min(1,playhead/duration):null,url};
}
const normalize=(v:string)=>v.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function matchesHistory(media:Anime,row:ProviderRow){
 const aliases=[media.title.english,media.title.romaji].filter(Boolean) as string[];
 if(row.seasonTitle&&aliases.some(a=>normalize(a)===normalize(row.seasonTitle)))return true;
 if((row.season||1)===1&&aliases.some(a=>normalize(a)===normalize(row.seriesTitle)))return true;
 return aliases.some(alias=>{const match=alias.match(/(?:season\s*(\d+)|(\d+)(?:nd|rd|th)\s+season)/i);if(!match||Number(match[1]||match[2])!==row.season)return false;return normalize(alias.replace(match[0],''))===normalize(row.seriesTitle);});
}
