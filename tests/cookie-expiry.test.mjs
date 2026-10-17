import {test} from 'node:test';
import assert from 'node:assert/strict';
import {expiryState,reminder} from '../extensions/crunchyroll-cookie/cookie.js';
const now=1800000000000;
test('expiry reminders cover 24h threshold, expiration, missing cookies and renewal without storing values',()=>{
 const cookie={value:'fixture-never-store-me',expirationDate:(now+3600000)/1000};
 const first=reminder(null,cookie,now);assert.equal(first.notify,'soon');assert.ok(!JSON.stringify(first).includes(cookie.value));assert.equal(reminder(first.next,cookie,now).notify,null);
 const expired=reminder(first.next,cookie,now+3600001);assert.equal(expired.notify,'expired');
 const missing=reminder(first.next,null,now);assert.equal(missing.notify,'missing');assert.equal(reminder(missing.next,null,now).notify,null);
 const renewed=reminder(first.next,{...cookie,expirationDate:(now+7*86400000)/1000},now);assert.equal(renewed.notify,null);assert.equal(renewed.next.stage,'valid');
 assert.equal(expiryState(null,now),'unknown');assert.equal(reminder(null,null,now).notify,null);
});
