import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CrunchyrollApiError,CrunchyrollAuthError} from 'crunchy-api';
import {createClient,safeCrunchyError} from '../lib/crunchyroll-client.ts';
import {normalizeCookie} from '../lib/crunchyroll-core.ts';
const cookie='etp_rt=fixture-session-12345';

test('accepts cookie values, quoted values and Cookie headers; forwards only etp_rt',()=>{
 for(const input of ['fixture-session-12345',cookie,'"fixture-session-12345"',`Cookie: other=secret; ${cookie}; third=secret`,`etp_rt="fixture-session-12345"`])assert.equal(normalizeCookie(input),cookie);
 for(const input of ['other=fixture-session-12345','short',`${cookie}\r\nX-Header: bad`])assert.throws(()=>normalizeCookie(input));
});
test('actual npm client sends cookie grant, then authenticated profile/account library requests',async()=>{
 const calls=[];
 const client=createClient(async(input,init)=>{
  const url=new URL(input);const headers=new Headers(init.headers);calls.push(url.pathname);
  assert.equal(url.origin,'https://beta-api.crunchyroll.com');assert.equal(init.redirect,'manual');assert.equal(headers.get('cookie'),cookie);
  if(url.pathname==='/auth/v1/token'){
   assert.equal(init.method,'POST');assert.equal(new URLSearchParams(init.body).get('grant_type'),'etp_rt_cookie');assert.ok(headers.get('authorization').startsWith('Basic '));
   return Response.json({access_token:'fixture-access',token_type:'Bearer',expires_in:3600,profile_id:'profile123',account_id:'account123'});
  }
  assert.equal(headers.get('authorization'),'Bearer fixture-access');
  return Response.json({data:[],total:0});
 });
 const session=await client.authenticateWithRtCookie({cookie});assert.equal(session.cookie,cookie);
 await client.getWatchlist();await client.getWatchHistory();
 assert.deepEqual(calls,['/auth/v1/token','/content/v2/discover/profile123/watchlist','/content/v2/account123/watch-history']);
});
test('account-only token supports history but package rejects watchlist without profile',async()=>{
 const client=createClient(async(input)=>new URL(input).pathname==='/auth/v1/token'?Response.json({access_token:'fixture',token_type:'Bearer',expires_in:3600,account_id:'account123'}):Response.json({data:[],total:0}));
 await client.authenticateWithRtCookie({cookie});await client.getWatchHistory();await assert.rejects(()=>client.getWatchlist(),CrunchyrollAuthError);
});
test('errors distinguish invalid session, blocked server and rate limiting without leaking payloads',async()=>{
 for(const [status,expected] of [[401,/rejected this session/],[403,/blocked this request/],[429,/rate limiting/]]){
  const client=createClient(async()=>new Response('private-provider-payload',{status,headers:{'content-type':status===403?'text/html':'text/plain'}}));
  await assert.rejects(()=>client.authenticateWithRtCookie({cookie}),error=>{const message=safeCrunchyError(error);assert.match(message,expected);assert.ok(!message.includes('private-provider-payload'));return true;});
 }
 assert.match(safeCrunchyError(new CrunchyrollApiError('timeout')),/try again/);
});

test('OAuth errors identify rejected cookies versus broken client credentials safely',async()=>{
 for(const [error,expected] of [['invalid_grant',/rejected the etp_rt cookie/],['invalid_client',/client credentials need updating/],['unknown_secret_value',/HTTP 400/]]){
  const client=createClient(async()=>Response.json({error,description:'private-cookie-and-token'},{status:400}));
  await assert.rejects(()=>client.authenticateWithRtCookie({cookie}),failure=>{assert.match(safeCrunchyError(failure),expected);assert.ok(!safeCrunchyError(failure).includes('private-cookie-and-token'));return true;});
 }
});
test('network, timeout, malformed success and provider outage have distinct diagnostics',async()=>{
 const {crunchyDiagnostic}=await import('../lib/crunchyroll-client.ts');
 const fixtures=[
  [async()=>{throw new TypeError('private-network-message')},'network_error'],
  [async()=>{throw new DOMException('private-message','AbortError')},'timeout'],
  [async()=>new Response('<html>private-provider-body</html>'),'invalid_response'],
  [async()=>Response.json({access_token:'private-token'}),'invalid_token_response'],
  [async()=>Response.json({message:'private-body'},{status:503}),'provider_unavailable'],
 ];
 for(const [transport,code] of fixtures){
  const client=createClient(transport);
  await assert.rejects(()=>client.authenticateWithRtCookie({cookie}),failure=>{
   assert.equal(crunchyDiagnostic(failure).code,code);assert.equal(crunchyDiagnostic(failure).stage,'authentication');assert.ok(!JSON.stringify(crunchyDiagnostic(failure)).includes('private'));assert.ok(!safeCrunchyError(failure).includes('private'));return true;
  });
 }
});


test('redirects are rejected without following the Location or exposing credentials',async()=>{
 let calls=0;
 const client=createClient(async(_input,init)=>{calls++;assert.equal(init.redirect,'manual');return new Response(null,{status:302,headers:{location:'https://example.test/steal-cookie'}});});
 await assert.rejects(()=>client.authenticateWithRtCookie({cookie}),error=>{assert.match(safeCrunchyError(error),/redirect was blocked/);return true;});
 assert.equal(calls,1);
});
