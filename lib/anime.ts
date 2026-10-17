export type Anime = { id:number; title:{english:string|null;romaji:string}; coverImage:{extraLarge:string;large:string}; bannerImage:string|null; genres:string[]; episodes:number|null; season:string|null;seasonYear:number|null; status:string;averageScore:number|null;description:string|null;nextAiringEpisode:{episode:number;airingAt:number}|null;siteUrl:string;externalLinks?:{site:string;url:string}[] };
export type Airing = { id:number;episode:number;airingAt:number;media:Anime };
export type Notice = {id:string;title:string;body:string;createdAt:number;read:boolean};
export function title(a:Anime){return a.title.english || a.title.romaji;}
export function dateKey(date:Date,timezone:string){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function time(timestamp:number,timezone:string){return new Intl.DateTimeFormat('en-US',{timeZone:timezone,hour:'numeric',minute:'2-digit'}).format(new Date(timestamp*1000));}
export const fields = 'id title { english romaji } coverImage { extraLarge large } bannerImage genres episodes season seasonYear status averageScore description(asHtml:false) nextAiringEpisode { episode airingAt } siteUrl externalLinks { site url }';
export function crunchyrollLink(anime:Anime){const official=anime.externalLinks?.find(link=>{try{const url=new URL(link.url);return link.site.toLowerCase().includes('crunchyroll')&&url.protocol==='https:'&&(url.hostname==='crunchyroll.com'||url.hostname.endsWith('.crunchyroll.com'));}catch{return false;}});return {url:official?.url||`https://www.crunchyroll.com/search?q=${encodeURIComponent(title(anime))}`,verified:!!official};}
export async function anilist(query:string,variables:Record<string,unknown>={}){
 const r=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new Error('Schedule provider is temporarily unavailable. Please try again.');
 const result=await r.json() as {data:any;errors?:{message:string}[]};
 if(result.errors)throw new Error('The schedule provider could not complete this request.');return result.data;
}
