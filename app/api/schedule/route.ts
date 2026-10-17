import {anilist,fields} from '../../../lib/anime';
export async function GET(request:Request){try {
 const params=new URL(request.url).searchParams;const start=Number(params.get('start'));const end=Number(params.get('end'));
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>10*86400)return Response.json({error:'Invalid date range'},{status:400});
 let items:any[]=[];let page=1;let more=true;
 while(more&&page<=8){const data=await anilist(`query($start:Int,$end:Int,$page:Int){Page(page:$page,perPage:50){pageInfo{hasNextPage} airingSchedules(airingAt_greater:$start,airingAt_lesser:$end,sort:TIME){id episode airingAt media{${fields}}}}}`,{start,end,page});items.push(...data.Page.airingSchedules);more=data.Page.pageInfo.hasNextPage;page++;}
 return Response.json({airings:items.filter(a=>a.media),partial:more},{headers:{'Cache-Control':'public,max-age=120'}});
 }catch(e){return Response.json({error:(e as Error).message},{status:502});}}
