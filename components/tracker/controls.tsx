'use client';
import {useState,useRef,useEffect,useLayoutEffect,useId,type RefObject,type KeyboardEvent} from 'react';
import {createPortal} from 'react-dom';
import {motion,AnimatePresence,useReducedMotion} from 'framer-motion';
import {ChevronDown,Check,Search,X,Globe} from 'lucide-react';

export const smooth=[0.22,1,0.36,1] as const;
export type Option={value:string;label:string;hint?:string};
type DropdownProps={label:string;value:string;onChange:(value:string)=>void;options:Option[];className?:string;icon?:boolean;searchable?:boolean};

export function Dropdown({label,value,onChange,options,className='',icon=false,searchable=false}:DropdownProps){
 const [open,setOpen]=useState(false);const [query,setQuery]=useState('');const [active,setActive]=useState(0);
 const [position,setPosition]=useState({top:0,left:0,width:240,maxHeight:320,origin:'top right'});
 const trigger=useRef<HTMLButtonElement>(null);const panel=useRef<HTMLDivElement>(null);const filter=useRef<HTMLInputElement>(null);const id=useId();const reduced=useReducedMotion();const typeahead=useRef('');const typeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const filtered=options.filter(o=>(o.label+' '+o.value+' '+(o.hint||'')).toLowerCase().includes(query.toLowerCase()));
 const selected=options.find(o=>o.value===value);
 function close(restore=false){setOpen(false);setQuery('');if(restore)trigger.current?.focus();}
 function choose(option:Option){onChange(option.value);close(true);}
 useLayoutEffect(()=>{
  if(!open||!trigger.current)return;
  const measure=()=>{const rect=trigger.current!.getBoundingClientRect();const width=Math.min(searchable?286:190,window.innerWidth-32);const roomBelow=window.innerHeight-rect.bottom-20;const above=roomBelow<230&&rect.top>280;const maxHeight=Math.min(340,above?rect.top-24:roomBelow);setPosition({width,maxHeight,top:above?rect.top-8:rect.bottom+8,left:Math.max(16,Math.min(rect.right-width,window.innerWidth-width-16)),origin:above?'bottom right':'top right'});};
  measure();const frame=requestAnimationFrame(()=>{if(searchable)filter.current?.focus();else panel.current?.focus();});window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);};
 },[open,searchable]);
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(!trigger.current?.contains(e.target as Node)&&!panel.current?.contains(e.target as Node))close();};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[open]);
 useEffect(()=>{panel.current?.querySelector(`[data-option-index="${active}"]`)?.scrollIntoView({block:'nearest'});},[active]);
 useEffect(()=>()=>{if(typeTimer.current)clearTimeout(typeTimer.current);},[]);
 function handleKey(e:KeyboardEvent){
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);return;}
  if(e.key==='Tab'){close();return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();if(!open){setOpen(true);setActive(Math.max(0,options.findIndex(o=>o.value===value)));}else setActive(i=>e.key==='Home'?0:e.key==='End'?filtered.length-1:e.key==='ArrowDown'?Math.min(filtered.length-1,i+1):Math.max(0,i-1));}
  if((e.key==='Enter'||e.key===' ')&&e.target!==filter.current){e.preventDefault();if(open&&filtered[active])choose(filtered[active]);else{setActive(Math.max(0,options.findIndex(o=>o.value===value)));setOpen(true);}}
  if(e.key==='Enter'&&e.target===filter.current){e.preventDefault();if(filtered[active])choose(filtered[active]);}
  if(e.key.length===1&&!searchable&&!e.ctrlKey&&!e.metaKey&&e.key!==' '){typeahead.current+=e.key.toLowerCase();if(typeTimer.current)clearTimeout(typeTimer.current);typeTimer.current=setTimeout(()=>{typeahead.current='';},500);const index=filtered.findIndex(o=>o.label.toLowerCase().startsWith(typeahead.current));if(index>=0)setActive(index);}
 }
 return <div className={`custom-select ${className}`}>
  <motion.button type="button" ref={trigger} className={'select-trigger '+(open?'is-open':'')} role="combobox" aria-label={label} aria-expanded={open} aria-haspopup="listbox" aria-controls={id} onKeyDown={handleKey} onClick={()=>{setActive(Math.max(0,options.findIndex(o=>o.value===value)));setOpen(v=>!v);setQuery('');}} whileTap={reduced?undefined:{scale:.98}}>
   {icon?<Globe size={16}/>:null}<span>{selected?.label||value}</span><motion.span className="select-chevron" animate={{rotate:open?180:0}} transition={{duration:reduced?0:.25,ease:smooth}}><ChevronDown size={14}/></motion.span>
  </motion.button>
  {typeof document!=='undefined'?createPortal(<AnimatePresence>{open?<motion.div key={id} ref={panel} className="select-popover" style={{position:'fixed',top:position.top,left:position.left,width:position.width,maxHeight:position.maxHeight,transformOrigin:position.origin,translateY:position.origin.startsWith('bottom')?'-100%':undefined}} initial={{opacity:0,scale:reduced?1:.97,y:reduced?0:-5}} animate={{opacity:1,scale:1,y:0,transition:{duration:reduced?0:.25,ease:smooth}}} exit={{opacity:0,scale:reduced?1:.99,y:reduced?0:-3,transition:{duration:reduced?0:.15,ease:smooth}}} tabIndex={-1} onKeyDown={handleKey}>
   <div className="select-menu-label">{label}</div>
   {searchable?<div className="select-search"><Search size={15}/><input ref={filter} aria-label={`Search ${label.toLowerCase()}`} placeholder="Find a timezone…" value={query} onChange={e=>{setQuery(e.target.value);setActive(0);}}/></div>:null}
   <div className="select-options" id={id} role="listbox" aria-label={label} aria-activedescendant={filtered[active]?`${id}-${active}`:undefined}>{filtered.map((option,i)=><div role="option" aria-selected={option.value===value} id={`${id}-${i}`} key={option.value} data-option-index={i} className={'select-option '+(active===i?'is-active ':'')+(option.value===value?'is-selected':'')} onPointerMove={()=>setActive(i)} onClick={()=>choose(option)}><span>{option.label}{option.hint?<small>{option.hint}</small>:null}</span>{option.value===value?<motion.span initial={{scale:.6,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:.2}}><Check size={15}/></motion.span>:null}</div>)}{!filtered.length?<p className="select-no-results">No matching timezones.</p>:null}</div>
  </motion.div>:null}</AnimatePresence>,document.body):null}
 </div>;
}

export function SearchField({value,onChange,inputRef}:{value:string;onChange:(value:string)=>void;inputRef:RefObject<HTMLInputElement|null>}){
 const [focused,setFocused]=useState(false);const reduced=useReducedMotion();
 return <motion.div className={'search custom-search '+(focused?'is-focused':'')} animate={{backgroundColor:focused?'#eeede6':'#f3f2ed'}} transition={{duration:reduced?0:.25}}><Search size={16}/><input ref={inputRef} aria-label="Search anime" placeholder="Find your next favorite…" value={value} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/><AnimatePresence initial={false} mode="wait">{value?<motion.button key="clear" className="search-clear" aria-label="Clear search" onClick={()=>{onChange('');inputRef.current?.focus();}} initial={{opacity:0,scale:.7,rotate:-45}} animate={{opacity:1,scale:1,rotate:0}} exit={{opacity:0,scale:.7,rotate:45}} transition={{duration:reduced?0:.15}}><X size={13}/></motion.button>:<motion.kbd key="shortcut" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>/</motion.kbd>}</AnimatePresence></motion.div>;
}

export function Toggle({checked,onChange,label}:{checked:boolean;onChange:(value:boolean)=>void;label:string}){
 const reduced=useReducedMotion();
 return <motion.button type="button" role="switch" aria-label={label} aria-checked={checked} className="custom-toggle" onClick={()=>onChange(!checked)} animate={{backgroundColor:checked?'#de7c65':'#dedfd6'}} transition={{duration:reduced?0:.25}} whileTap={reduced?undefined:{scale:.95}}><motion.span className="toggle-thumb" animate={{x:checked?17:0}} transition={reduced?{duration:0}:{type:'spring',stiffness:500,damping:28}}><motion.span animate={{opacity:checked?1:0,scale:checked?1:.5}} transition={{duration:.15}}><Check size={11}/></motion.span></motion.span></motion.button>;
}
