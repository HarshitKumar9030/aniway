import {cookies} from 'next/headers';
import {getDb} from '../db';
import {accounts,sessions} from '../db/schema';
import {and,eq,gt} from 'drizzle-orm';
import {tokenHash} from './passwords';
export const SESSION_COOKIE='aniway_session';
export async function getCurrentUser(){
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(token==='signed-out')return null;
 if(token&&/^[a-f0-9]{64}$/.test(token)){
  const found=await getDb().select({id:accounts.id,email:accounts.email,name:accounts.name}).from(sessions).innerJoin(accounts,eq(sessions.accountId,accounts.id)).where(and(eq(sessions.tokenHash,tokenHash(token)),gt(sessions.expiresAt,Date.now()))).limit(1);
  if(found[0])return {userId:found[0].id,email:found[0].email,fullName:found[0].name,displayName:found[0].name,provider:'credentials' as const};
  return null;
 }
 return null;
}
