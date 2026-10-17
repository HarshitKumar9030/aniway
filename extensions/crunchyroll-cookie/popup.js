/* global chrome */
import {readCookie} from './cookie.js';
const get=id=>document.getElementById(id);
async function render(){
 try{
  const cookie=await readCookie();
  get('status').textContent=cookie?'Session cookie found.':'No etp_rt cookie found. Sign in to Crunchyroll in this browser first.';
  get('expiry').textContent=cookie?.expirationDate?`Browser expiry: ${new Date(cookie.expirationDate*1000).toLocaleString()}`:cookie?'Session cookie: the browser supplies no expiry date.':'';
  get('copy-details').disabled=!cookie;get('copy-value').disabled=!cookie;
 }catch{get('status').textContent='Cookie access failed. Check the extension’s Crunchyroll site permissions.';}
}
async function copy(details){
 try{
  const cookie=await readCookie();if(!cookie){await render();return;}
  const value=details?JSON.stringify({cookie:cookie.value,expiresAt:cookie.expirationDate?Math.floor(cookie.expirationDate*1000):null}):cookie.value;
  await navigator.clipboard.writeText(value);get('feedback').textContent='Copied. Paste into aniway’s connection field.';
 }catch{get('feedback').textContent='Could not copy. Reopen this popup and try again.';}
}
get('copy-details').addEventListener('click',()=>void copy(true));get('copy-value').addEventListener('click',()=>void copy(false));
get('alerts').addEventListener('change',async event=>{await chrome.storage.local.set({alerts:event.target.checked});await chrome.runtime.sendMessage({action:'check'});});
chrome.storage.local.get('alerts').then(({alerts})=>{get('alerts').checked=alerts!==false;});
void render();void chrome.runtime.sendMessage({action:'check'}).catch(()=>{});
