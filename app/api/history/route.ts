import {z} from 'zod';
import {getCurrentUser} from '../../../lib/auth';
import {sameOrigin} from '../../../lib/request-security';
import {env} from 'cloudflare:workers';
const input=z.object({items:z.array(z.object({id:z.number().int().positive(),watched:z.number().int().min(0).max(10000)})).min(1).max(100)});
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return Response.json({error:'Sign in to import your history.'},{status:401});if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});try{const data=input.parse(await request.json());await env.DB!.batch(data.items.map(item=>env.DB!.prepare('UPDATE follows SET watched = MAX(watched, ?) WHERE user_id = ? AND media_id = ?').bind(item.watched,user.userId,item.id)));return Response.json({ok:true,count:data.items.length});}catch{return Response.json({error:'Could not import this history. Check the file and try again.'},{status:400});}}
