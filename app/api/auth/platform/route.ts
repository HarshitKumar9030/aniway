import {SESSION_COOKIE} from '../../../../lib/auth';
export function GET(request:Request){return new Response(null,{status:302,headers:{Location:'/signin-with-chatgpt?return_to=%2F','Set-Cookie':`${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${request.url.startsWith('https:')?'; Secure':''}`,'Cache-Control':'no-store'}});}
