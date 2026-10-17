/* global chrome */
export async function readCookie(){
 for(const url of ['https://www.crunchyroll.com/','https://beta-api.crunchyroll.com/']){
  const cookie=await chrome.cookies.get({url,name:'etp_rt'});
  if(cookie?.value)return cookie;
 }
 return null;
}
export function expiryState(expiresAt,now=Date.now()){
 if(!expiresAt)return 'unknown';
 if(expiresAt<=now)return 'expired';
 if(expiresAt-now<=24*60*60*1000)return 'soon';
 return 'valid';
}
export function reminder(previous,cookie,now=Date.now()){
 const expiresAt=cookie?.expirationDate?cookie.expirationDate*1000:null;
 const stage=cookie?expiryState(expiresAt,now):previous?.seen?'missing':'absent';
 const next={seen:!!cookie||!!previous?.seen,expiresAt:cookie?expiresAt:previous?.expiresAt||null,stage,notified:previous?.notified||null};
 const key=`${stage}:${expiresAt||previous?.expiresAt||'session'}`;
 const shouldNotify=['soon','expired','missing'].includes(stage)&&previous?.notified!==key;
 if(shouldNotify)next.notified=key;
 if(stage==='valid'||stage==='unknown')next.notified=null;
 return {next,notify:shouldNotify?stage:null};
}
