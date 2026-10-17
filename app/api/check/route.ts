import {getCurrentUser} from '../../../lib/auth';
import {getDb} from '../../../db';
import {follows,preferences,notices,snapshots} from '../../../db/schema';
import {eq,and,desc} from 'drizzle-orm';
import {anilist,fields,title,type Anime,type Notice} from '../../../lib/anime';
export async function GET(){
 const user=await getCurrentUser();if(!user)return Response.json({error:'Sign in required'},{status:401});
 try {
 const db=getDb();const saved=await db.select().from(follows).where(eq(follows.userId,user.userId));
 const prefs=(await db.select().from(preferences).where(eq(preferences.userId,user.userId)))[0];
 const newNotices:Notice[]=[];
 for(let offset=0;offset<saved.length;offset+=50){
  const batch=saved.slice(offset,offset+50);
  const data=await anilist(`query($ids:[Int]){Page(perPage:50){media(id_in:$ids,type:ANIME){${fields}}}}`,{ids:batch.map(x=>x.mediaId)});
  for(const media of data.Page.media as Anime[]){
   const old=batch.find(x=>x.mediaId===media.id)!;const previous=JSON.parse(old.media) as Anime;
   const prev=previous.nextAiringEpisode;const next=media.nextAiringEpisode;const now=Math.floor(Date.now()/1000);
   const add=async(id:string,heading:string,body:string)=>{
    const notice={id:`${user.userId}:${id}`,userId:user.userId,title:heading,body,createdAt:Date.now(),read:false};
    const inserted=await db.insert(notices).values(notice).onConflictDoNothing().returning();if(inserted.length)newNotices.push(notice);
   };
   if(media.status==='HIATUS'&&previous.status!=='HIATUS'&&prefs?.changes!==false)await add(`hiatus:${media.id}:${prev?.episode||0}`,`${title(media)} — on hiatus`,'The provider now lists this anime as on hiatus. A new release date has not been confirmed.');
   if(next&&prev&&next.episode===prev.episode&&next.airingAt!==prev.airingAt&&prefs?.changes!==false){
    const delayed=next.airingAt>prev.airingAt;const date=new Date(next.airingAt*1000).toLocaleString('en-US',{timeZone:prefs?.timezone||'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'});
    await add(`change:${media.id}:${next.episode}:${next.airingAt}`,`${title(media)} — ${delayed?'release moved later':'schedule updated'}`,`Episode ${next.episode} is now scheduled for ${date} (${prefs?.timezone||'Asia/Kolkata'}). The provider has not supplied an official reason.`);
   }
   if(prev&&prev.airingAt<=now&&prev.airingAt>=now-7*86400&&prefs?.releases!==false&&(!next||next.episode>prev.episode||next.airingAt<=now))await add(`release:${media.id}:${prev.episode}`,`${title(media)} — episode ${prev.episode}`,`Episode ${prev.episode} has reached its scheduled Japanese broadcast time. Streaming availability may differ.`);
   await db.update(follows).set({media:JSON.stringify(media)}).where(and(eq(follows.userId,user.userId),eq(follows.mediaId,media.id)));
  }
 }
 const inbox=await db.select().from(notices).where(eq(notices.userId,user.userId)).orderBy(desc(notices.createdAt)).limit(100);
 return Response.json({notices:inbox,newNotices},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Could not check updates. We will try again shortly.'},{status:502});}
}


