import {scrypt,timingSafeEqual,randomBytes,createHash} from 'node:crypto';
const settings={N:32768,r:8,p:3,maxmem:64*1024*1024};
function derive(password:string,salt:string):Promise<Buffer>{return new Promise((resolve,reject)=>scrypt(password,salt,64,settings,(error,key)=>error?reject(error):resolve(key)));}
export async function hashPassword(password:string){const salt=randomBytes(24).toString('hex');return `scrypt-32768-8-3$${salt}$${(await derive(password,salt)).toString('hex')}`;}
export async function verifyPassword(password:string,encoded:string){const [algorithm,salt,digest]=encoded.split('$');if(algorithm!=='scrypt-32768-8-3'||!salt||!digest)return false;const actual=await derive(password,salt);const expected=Buffer.from(digest,'hex');return expected.length===actual.length&&timingSafeEqual(expected,actual);}
export function tokenHash(value:string){return createHash('sha256').update(value).digest('hex');}
export function createToken(){return randomBytes(32).toString('hex');}
