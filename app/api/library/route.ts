import {getCurrentUser} from '../../../lib/auth';
import {getDb} from '../../../db';
import {follows,preferences,notices,crunchyConnections} from '../../../db/schema';
import {and,eq,desc} from 'drizzle-orm';
import {z} from 'zod';
import {sameOrigin} from '../../../lib/request-security';
const mediaSchema=z.object({id:z.number().int().positive(),title:z.object({english:z.string().nullable(),romaji:z.string()}),coverImage:z.object({extraLarge:z.string().url(),large:z.string().url()}),bannerImage:z.string().url().nullable(),genres:z.array(z.string()).max(30),episodes:z.number().int().nullable(),season:z.string().nullable(),seasonYear:z.number().int().nullable(),status:z.string(),averageScore:z.number().nullable(),description:z.string().nullable(),nextAiringEpisode:z.object({episode:z.number().int(),airingAt:z.number().int()}).nullable(),siteUrl:z.string().url(),externalLinks:z.array(z.object({site:z.string(),url:z.string().url()})).max(50).optional()});
const payload=z.discriminatedUnion('action',[
 z.object({action:z.literal('follow'),media:mediaSchema}),
 z.object({action:z.literal('unfollow'),id:z.number().int().positive()}),
 z.object({action:z.literal('watched'),id:z.number().int().positive(),watched:z.number().int().min(0).max(10000)}),
 z.object({action:z.literal('preferences'),timezone:z.string().max(100),releases:z.boolean(),changes:z.boolean()}),
 z.object({action:z.literal('read')})
]);
export async function GET(){const user=await getCurrentUser();if(!user)return Response.json({error:'Sign in to sync your watchlist.'},{status:401});
 const db=getDb();const [saved,prefs,inbox,connections]=await Promise.all([db.select().from(follows).where(eq(follows.userId,user.userId)),db.select().from(preferences).where(eq(preferences.userId,user.userId)),db.select().from(notices).where(eq(notices.userId,user.userId)).orderBy(desc(notices.createdAt)).limit(100),db.select({cache:crunchyConnections.cache}).from(crunchyConnections).where(eq(crunchyConnections.userId,user.userId)).limit(1)]);
 return Response.json({follows:saved.map(x=>({media:JSON.parse(x.media),watched:x.watched})),preferences:prefs[0]||null,notices:inbox,crunchyroll:{connected:connections.length>0,watchlist:connections[0]?.cache?JSON.parse(connections[0].cache).watchlist||[]:[],history:connections[0]?.cache?JSON.parse(connections[0].cache).history||[]:[]}},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return Response.json({error:'Sign in to save changes.'},{status:401});if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});try{
 const input=payload.parse(await request.json());const db=getDb();
 if(input.action==='follow'){if(!Number.isInteger(input.media?.id)||JSON.stringify(input.media).length>30000)return Response.json({error:'Invalid anime'},{status:400});await db.insert(follows).values({userId:user.userId,mediaId:input.media!.id,media:JSON.stringify(input.media)}).onConflictDoNothing();}
 else if(input.action==='unfollow')await db.delete(follows).where(and(eq(follows.userId,user.userId),eq(follows.mediaId,input.id!)));
 else if(input.action==='watched'){if(!Number.isInteger(input.watched)||input.watched!<0||input.watched!>10000)return Response.json({error:'Invalid progress'},{status:400});await db.update(follows).set({watched:input.watched}).where(and(eq(follows.userId,user.userId),eq(follows.mediaId,input.id!)));}
 else if(input.action==='preferences'){new Intl.DateTimeFormat('en',{timeZone:input.timezone!});const values={userId:user.userId,timezone:input.timezone!,releases:!!input.releases,changes:!!input.changes};await db.insert(preferences).values(values).onConflictDoUpdate({target:preferences.userId,set:values});}
 else if(input.action==='read')await db.update(notices).set({read:true}).where(eq(notices.userId,user.userId));
 else return Response.json({error:'Unknown action'},{status:400});return Response.json({ok:true});
 }catch(error){return Response.json({error:error instanceof z.ZodError?'Please check the supplied values.':'Could not save changes. Please try again.'},{status:error instanceof z.ZodError?400:500});}}



