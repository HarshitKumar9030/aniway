/* global chrome */
import {readCookie,reminder} from './cookie.js';
let queue=Promise.resolve();
function check(){
 queue=queue.catch(()=>{}).then(async()=>{
  const settings=await chrome.storage.local.get(['alerts','metadata']);
  if(settings.alerts===false)return;
  const cookie=await readCookie();
  const {next,notify}=reminder(settings.metadata,cookie);
  // Only timestamps/state are stored. Cookie values never enter extension storage.
  await chrome.storage.local.set({metadata:next});
  if(notify)await chrome.notifications.create('aniway-cookie',{type:'basic',iconUrl:'icon.png',title:notify==='soon'?'Crunchyroll cookie expires soon':'Refresh your aniway connection',message:notify==='soon'?'Your browser cookie expires within 24 hours. Copy fresh connection details into aniway.':'The monitored cookie expired or disappeared. Sign in to Crunchyroll and reconnect aniway.'});
 });
 return queue;
}
async function setup(){await chrome.alarms.create('expiry-check',{periodInMinutes:30});await check();}
chrome.runtime.onInstalled.addListener(()=>void setup());
chrome.runtime.onStartup.addListener(()=>void setup());
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name==='expiry-check')void check();});
chrome.cookies.onChanged.addListener(({cookie,cause})=>{if(cookie.name==='etp_rt'&&/(^|\.)crunchyroll\.com$/.test(cookie.domain)&&cause!=='overwrite')void check();});
chrome.runtime.onMessage.addListener((message,_sender,reply)=>{if(message?.action==='check'){check().then(()=>reply({ok:true})).catch(()=>reply({ok:false}));return true;}});
// Recreate the alarm after a service-worker restart if Chrome cleared it.
void chrome.alarms.get('expiry-check').then(alarm=>{if(!alarm)return setup();}).catch(()=>{});
