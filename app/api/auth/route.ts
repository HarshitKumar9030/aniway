import {z} from 'zod';
import {getDb} from '../../../db';
import {accounts,sessions,authAttempts} from '../../../db/schema';
import {SESSION_COOKIE,getCurrentUser} from '../../../lib/auth';
import {hashPassword,verifyPassword,createToken,tokenHash} from '../../../lib/passwords';
import {and,eq,lt,sql} from 'drizzle-orm';
import {cookies} from 'next/headers';
const credentials=z.object({action:z.enum(['login','signup','logout']),email:z.string().trim().email().max(254).transform(e=>e.toLowerCase()).optional(),password:z.string().min(1).max(128).optional(),name:z.string().trim().min(1).max(60).optional()});
export async function GET(){const user=await getCurrentUser();return Response.json({user:user?{name:user.displayName,email:user.email,provider:user.provider}:null},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return Response.json({error:'This request must come from aniway.'},{status:403});
 if(Number(request.headers.get('content-length')||0)>4096)return Response.json({error:'Request is too large.'},{status:413});
 try {
  const data=credentials.parse(await request.json());const db=getDb();const secure=new URL(request.url).protocol==='https:';const cookieFlags=`Path=/; HttpOnly; SameSite=Lax${secure?'; Secure':''}`;
  if(data.action==='logout'){const token=(await cookies()).get(SESSION_COOKIE)?.value;if(token)await db.delete(sessions).where(eq(sessions.tokenHash,tokenHash(token)));return Response.json({ok:true},{headers:{'Set-Cookie':`${SESSION_COOKIE}=signed-out; ${cookieFlags}; Max-Age=2592000`,'Cache-Control':'no-store'}});}
  if(!data.email||!data.password)return Response.json({error:'Enter your email and password.'},{status:400});
  const now=Date.now();const window=Math.floor(now/900000);const ip=request.headers.get('cf-connecting-ip')||'local';
  for(const key of [`email:${tokenHash(data.email)}:${window}`,`ip:${tokenHash(ip)}:${window}`]){
   const [attempt]=await db.insert(authAttempts).values({key,count:1,expiresAt:now+900000}).onConflictDoUpdate({target:authAttempts.key,set:{count:sql`${authAttempts.count}+1`}}).returning();
   if(attempt.count>(key.startsWith('ip:')?40:10))return Response.json({error:'Too many attempts. Please try again in 15 minutes.'},{status:429,headers:{'Retry-After':'900'}});
  }
  let account=(await db.select().from(accounts).where(eq(accounts.email,data.email)).limit(1))[0];
  if(data.action==='signup'){
   if(data.password.length<15)return Response.json({error:'Use a password with at least 15 characters.'},{status:400});
   if(!data.name)return Response.json({error:'Tell us what to call you.'},{status:400});
   if(account)return Response.json({error:'This email already has an account. Please sign in.'},{status:409});
   const record={id:'credential:'+crypto.randomUUID(),email:data.email,name:data.name,passwordHash:await hashPassword(data.password),createdAt:now};
   try{await db.insert(accounts).values(record);account=record;}catch{return Response.json({error:'Could not create this account. Please try signing in.'},{status:409});}
  }else{
   const encoded=account?.passwordHash||'scrypt-32768-8-3$000000000000000000000000000000000000000000000000$'+ '00'.repeat(64);
   const valid=await verifyPassword(data.password,encoded);if(!account||!valid)return Response.json({error:'Email or password is incorrect.'},{status:401});
  }
  const existing=(await cookies()).get(SESSION_COOKIE)?.value;if(existing)await db.delete(sessions).where(eq(sessions.tokenHash,tokenHash(existing)));
  const token=createToken();await db.insert(sessions).values({tokenHash:tokenHash(token),accountId:account.id,expiresAt:now+30*86400000});
  await Promise.all([db.delete(sessions).where(lt(sessions.expiresAt,now)),db.delete(authAttempts).where(lt(authAttempts.expiresAt,now))]);
  return Response.json({user:{name:account.name,email:account.email,provider:'credentials'}},{headers:{'Set-Cookie':`${SESSION_COOKIE}=${token}; ${cookieFlags}; Max-Age=2592000`,'Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:error instanceof z.ZodError?'Check your email and password and try again.':'Sign-in is temporarily unavailable. Please try again.'},{status:error instanceof z.ZodError?400:500});}
}


