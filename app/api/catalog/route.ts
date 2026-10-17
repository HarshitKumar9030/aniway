import {anilist,fields} from '../../../lib/anime';
export async function GET(request:Request){try {
 const params=new URL(request.url).searchParams;const now=new Date();const year=Number(params.get('year')||now.getUTCFullYear());
 const season=params.get('season')||['WINTER','SPRING','SUMMER','FALL'][Math.floor(now.getUTCMonth()/3)];
 if(!['WINTER','SPRING','SUMMER','FALL'].includes(season)||!Number.isInteger(year)||year<1940||year>2100)return Response.json({error:'Invalid season'},{status:400});
 let media:unknown[]=[];let page=1;let more=true;const maxPages=params.get('all')==='1'?8:1;
 while(more&&page<=maxPages){const data=await anilist(`query($season:MediaSeason,$year:Int,$page:Int){Page(page:$page,perPage:50){pageInfo{hasNextPage} media(type:ANIME,isAdult:false,season:$season,seasonYear:$year,sort:POPULARITY_DESC){${fields}}}}`,{season,year,page});media.push(...data.Page.media);more=data.Page.pageInfo.hasNextPage;page++;}
 return Response.json({media,season,year,partial:more},{headers:{'Cache-Control':'public,max-age=300'}});
 }catch(e){return Response.json({error:(e as Error).message},{status:502});}}

