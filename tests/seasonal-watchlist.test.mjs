import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seasonalWatchlist} from '../lib/seasonal-watchlist.ts';
const anime=(id,name,season='FALL',seasonYear=2026)=>({id,title:{english:name,romaji:name},season,seasonYear,episodes:12});
const row=(seriesTitle,extra={})=>({seriesTitle,seasonTitle:'',season:1,completed:false,episode:null,...extra});
test('merges duplicates and preserves progress in the selected broadcast season',()=>{
 const fall=anime(1,'First Show');const spring=anime(2,'Spring Show','SPRING');const provider=anime(3,'Provider Show');
 const saved=[{media:fall,watched:8},{media:spring,watched:2}];const input=structuredClone(saved);
 const entries=seasonalWatchlist(saved,[row('First Show'),row('Provider Show'),row('Provider Show')],[fall,spring,provider],'FALL',2026,[row('First Show',{completed:true,episode:3}),row('Provider Show',{completed:true,episode:5})]);
 assert.equal(entries.length,2);assert.deepEqual(entries[0],{media:fall,watched:8,aniway:true,crunchyroll:true});assert.equal(entries[1].watched,5);assert.equal(entries[1].aniway,false);assert.equal(entries[1].crunchyroll,true);assert.deepEqual(saved,input);
 assert.equal(seasonalWatchlist(saved,[],[],'SPRING',2026).length,1);assert.equal(seasonalWatchlist(saved,[],[],'FALL',2025).length,0);
});
test('does not merge ambiguous titles or mistake sequel numbers for broadcast seasons',()=>{
 const one=anime(1,'Shared');const two=anime(2,'Shared','SPRING');const sequel=anime(3,'Other Show Season 2');
 assert.equal(seasonalWatchlist([],[row('Shared')],[one,two],'FALL',2026).length,0);
 assert.equal(seasonalWatchlist([],[row('Other Show',{season:2})],[sequel],'FALL',2026)[0].media.id,3);
 assert.equal(seasonalWatchlist([],[row('Other Show',{season:3})],[sequel],'FALL',2026).length,0);
});
test('unknown broadcast dates stay in Season TBA; completed progress is capped',()=>{
 const unknown=anime(1,'Unknown',null,null);assert.equal(seasonalWatchlist([{media:unknown,watched:0}],[],[],'UNKNOWN',2026).length,1);assert.equal(seasonalWatchlist([{media:unknown,watched:0}],[],[],'FALL',2026).length,0);
 const known=anime(2,'Known');const entries=seasonalWatchlist([],[row('Known')],[known],'FALL',2026,[row('Known',{completed:true,episode:20})]);assert.equal(entries[0].watched,12);
});
