import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';

test('actual Cloudflare runtime authenticates with manual redirects, then rejects a redirect',async()=>{
 const bundle=await build({stdin:{contents:`
 import {createClient,crunchyDiagnostic} from './lib/crunchyroll-client.ts';
 export default {async fetch(){try{
 const client=createClient();
 const session=await client.authenticateWithRtCookie({cookie:'etp_rt=fixture-session-only'});
 return Response.json({authenticated:!!session.accessToken});
 }catch(error){return Response.json({diagnostic:crunchyDiagnostic(error)});}}};`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',target:'es2022'});
 let redirect=false;let calls=0;
 const mf=new Miniflare({modules:true,compatibilityDate:'2026-05-15',script:bundle.outputFiles[0].text,outboundService:async request=>{
  calls++;assert.equal(new URL(request.url).origin,'https://beta-api.crunchyroll.com');assert.equal(request.headers.get('cookie'),'etp_rt=fixture-session-only');
  if(redirect)return new Response(null,{status:302,headers:{location:'https://example.test/never-follow'}});
  assert.equal(new URLSearchParams(await request.text()).get('grant_type'),'etp_rt_cookie');
  return Response.json({access_token:'fixture-access-only',token_type:'Bearer',expires_in:3600,account_id:'fixture-account'});
 }});
 try{
  assert.deepEqual(await (await mf.dispatchFetch('http://local.test')).json(),{authenticated:true});
  redirect=true;
  const result=await (await mf.dispatchFetch('http://local.test')).json();
  assert.deepEqual(result.diagnostic,{code:'redirect_blocked',stage:'authentication',upstreamStatus:302});
  assert.equal(calls,2);
 }finally{await mf.dispose();}
});
