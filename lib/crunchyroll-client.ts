import {CrunchyrollClient,CrunchyrollApiError,CrunchyrollAuthError} from 'crunchy-api';

type ProviderStage='authentication'|'watchlist'|'history'|'library';
export class CrunchyrollRequestError extends CrunchyrollApiError {
 code:string;
 stage:ProviderStage;
 constructor(code:string,stage:ProviderStage,status?:number){super('Crunchyroll request failed',status);this.code=code;this.stage=stage;}
}
export function crunchyDiagnostic(error:unknown){
 if(error instanceof CrunchyrollRequestError)return {code:error.code,stage:error.stage,...(error.status?{upstreamStatus:error.status}:{})};
 if(error instanceof CrunchyrollApiError)return {code:'invalid_provider_response',stage:'library',...(error.status?{upstreamStatus:error.status}:{})};
 return undefined;
}
// Keep provider credentials on the package's default host; never follow redirects.
export function createClient(transport:typeof fetch=fetch){
 return new CrunchyrollClient({timeoutMs:12000,fetchImpl:async(input,init)=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
  const stage:ProviderStage=url.pathname==='/auth/v1/token'?'authentication':url.pathname.endsWith('/watchlist')?'watchlist':url.pathname.endsWith('/watch-history')?'history':'library';
  if(url.origin!=='https://beta-api.crunchyroll.com')throw new CrunchyrollRequestError('invalid_provider_host',stage);
  let response:Response;
  try{response=await transport(input,{...init,redirect:'manual'});}
  catch(error){
   const timeout=init?.signal?.aborted||(error instanceof Error&&['AbortError','TimeoutError'].includes(error.name));
   throw new CrunchyrollRequestError(timeout?'timeout':'network_error',stage);
  }
  if(response.status>=300&&response.status<400)throw new CrunchyrollRequestError('redirect_blocked',stage,response.status);
  // Inspect only protocol fields. Never expose/log provider bodies or credentials.
  let payload:Record<string,unknown>|null=null;
  try{const value:unknown=await response.clone().json();if(value&&typeof value==='object'&&!Array.isArray(value))payload=value as Record<string,unknown>;}catch{/* HTML/invalid JSON is classified below. */}
  if(!response.ok){
   const oauth=payload?.error;
   const code=oauth==='invalid_grant'?'invalid_grant':oauth==='invalid_client'?'invalid_client':response.status===400?'bad_request':response.status===401?'unauthorized':response.status===403?'blocked':response.status===429?'rate_limited':response.status>=500?'provider_unavailable':'provider_error';
   throw new CrunchyrollRequestError(code,stage,response.status);
  }
  if(!payload)throw new CrunchyrollRequestError('invalid_response',stage,response.status);
  if(stage==='authentication'&&(typeof payload.access_token!=='string'||!payload.access_token||typeof payload.token_type!=='string'||typeof payload.expires_in!=='number'))throw new CrunchyrollRequestError('invalid_token_response',stage,response.status);
  return response;
 }});
}
export function safeCrunchyError(error:unknown){
 if(error instanceof CrunchyrollRequestError){
  const context=error.stage==='authentication'?'Authentication':error.stage==='watchlist'?'Watchlist sync':error.stage==='history'?'History sync':'Library sync';
  if(error.code==='invalid_grant')return 'Crunchyroll rejected the etp_rt cookie (invalid_grant). Sign in there again and copy the current etp_rt value.';
  if(error.code==='invalid_client')return 'Crunchyroll rejected crunchy-api’s client authentication (invalid_client). The package’s client credentials need updating; replacing your cookie will not fix this.';
  if(error.code==='redirect_blocked')return `${context} was redirected by Crunchyroll. The redirect was blocked to protect your session.`;
  if(error.code==='bad_request')return `${context} was rejected by Crunchyroll (HTTP 400). The provider did not identify a supported OAuth error.`;
  if(error.code==='timeout')return `${context} timed out after 12 seconds. Try again shortly.`;
  if(error.code==='network_error')return `${context} could not reach Crunchyroll. Check the server’s network, DNS, TLS, or proxy connection.`;
  if(error.code==='invalid_response'||error.code==='invalid_token_response')return `${context} received an unexpected response from Crunchyroll (HTTP ${error.status}). The provider may be blocking requests or its response format has changed.`;
  if(error.code==='provider_unavailable')return `${context} failed because Crunchyroll is unavailable (HTTP ${error.status}). Try again later.`;
  if(error.code==='provider_error')return `${context} failed at Crunchyroll (HTTP ${error.status}).`;
 }
 if(error instanceof CrunchyrollApiError){
  if(error.status===401)return 'Crunchyroll rejected this session. Sign in there again and copy a fresh etp_rt cookie.';
  if(error.status===403)return 'Crunchyroll blocked this request. A valid cookie may still be blocked from this server; try again later.';
  if(error.status===429)return 'Crunchyroll is rate limiting requests. Wait a few minutes before syncing again.';
  if(error instanceof CrunchyrollAuthError)return 'The Crunchyroll session is missing account or profile details. Reconnect with a fresh etp_rt cookie.';
  return 'Crunchyroll could not complete the request. Please try again shortly.';
 }
 if(error instanceof Error&&['Enter a valid etp_rt session cookie.','Connect your Crunchyroll account first.','Connection storage is not configured.','Your connection expired. Reconnect with a fresh session cookie.','Crunchyroll did not return an account profile.'].includes(error.message))return error.message;
 return 'The Crunchyroll connection could not be completed. Please try again.';
}
