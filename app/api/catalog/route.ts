import {anilist,fields} from '../../../lib/anime';
export async function GET(request:Request){try {
 const params=new URL(request.url).searchParams;const now=new Date();const year=Number(params.get('year')||now.getUTCFullYear());
 const season=params.get('season')||['WINTER','SPRING','SUMMER','FALL'][Math.floor(now.getUTCMonth()/3)];
 if(!['WINTER','SPRING','SUMMER','FALL'].includes(season)||!Number.isInteger(year)||year<1940||year>2100)return Response.json({error:'Invalid season'},{status:400});
 const data=await anilist(`query($season:MediaSeason,$year:Int){Page(perPage:50){media(type:ANIME,isAdult:false,season:$season,seasonYear:$year,sort:POPULARITY_DESC){${fields}}}}`,{season,year});
 return Response.json({media:data.Page.media,season,year},{headers:{'Cache-Control':'public,max-age=300'}});
 }catch(e){return Response.json({error:(e as Error).message},{status:502});}}

