import type {Anime} from './anime';
import type {ProviderRow} from './crunchyroll-core';
export type SavedAnime={media:Anime;watched:number};
export type SeasonalEntry=SavedAnime&{aniway:boolean;crunchyroll:boolean};
const normalize=(value:string)=>value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
function matches(media:Anime,row:ProviderRow){
 const aliases=[media.title.english,media.title.romaji].filter((value):value is string=>!!value).map(normalize);
 // Episode names are not series names. Never infer a sequel from a bare series title.
 if(row.seasonTitle&&aliases.includes(normalize(row.seasonTitle)))return true;
 if(row.season!==null&&row.season>1){
  return [media.title.english,media.title.romaji].some(alias=>{
   const number=alias?.match(/(?:season\s*(\d+)|(\d+)(?:nd|rd|th)\s+season)/i);
   return number&&Number(number[1]||number[2])===row.season&&normalize(alias!.replace(number[0],''))===normalize(row.seriesTitle);
  });
 }
 return aliases.includes(normalize(row.seriesTitle));
}
export function seasonalWatchlist(saved:SavedAnime[],provider:ProviderRow[],catalog:Anime[],season:string,year:number,history:ProviderRow[]=[]){
 const inSeason=(media:Anime)=>season==='UNKNOWN'? !media.season||!media.seasonYear:media.season===season&&media.seasonYear===year;
 const entries=new Map<number,SeasonalEntry>();
 for(const item of saved)if(inSeason(item.media))entries.set(item.media.id,{...item,aniway:true,crunchyroll:false});
 // Match against all known candidates before filtering by season. A title shared
 // by multiple AniList entries is ambiguous even when only one is in this season.
 const candidates=new Map<number,Anime>([...catalog,...saved.map(item=>item.media)].map(media=>[media.id,media]));
 const known=[...candidates.values()];
 const completedProgress=new Map<number,number>();
 for(const item of history){
  if(!item.completed||item.episode===null)continue;
  const hits=known.filter(media=>matches(media,item));
  if(hits.length===1)completedProgress.set(hits[0].id,Math.max(completedProgress.get(hits[0].id)||0,Math.min(hits[0].episodes||10000,item.episode)));
 }
 for(const row of provider){
  const hits=known.filter(media=>matches(media,row));
  if(hits.length!==1||!inSeason(hits[0]))continue;
  const media=hits[0];const existing=entries.get(media.id);
  const watched=Math.max(existing?.watched||0,completedProgress.get(media.id)||0);
  entries.set(media.id,existing?{...existing,watched,crunchyroll:true}:{media,watched,aniway:false,crunchyroll:true});
 }
 return [...entries.values()].sort((a,b)=>(a.media.title.english||a.media.title.romaji).localeCompare(b.media.title.english||b.media.title.romaji));
}
