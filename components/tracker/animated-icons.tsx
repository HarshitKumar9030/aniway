'use client';
import {motion,useReducedMotion} from 'framer-motion';
export function AnimatedSpark({className=''}:{className?:string}){
 const reduced=useReducedMotion();
 return <motion.svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" whileHover={reduced?undefined:{rotate:45}} transition={{type:'spring',stiffness:160,damping:16}}>{Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return <motion.path key={i} d={`M ${20+5*Math.cos(a)} ${20+5*Math.sin(a)} L ${20+16*Math.cos(a)} ${20+16*Math.sin(a)}`} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" initial={{pathLength:reduced?1:0,opacity:reduced?1:0}} animate={{pathLength:1,opacity:1}} transition={{duration:reduced?0:.5,delay:reduced?0:i*.04,ease:'easeOut'}}/>;})}</motion.svg>;
}
export function AnimatedBell(){
 const reduced=useReducedMotion();
 return <motion.svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" whileHover={reduced?undefined:{rotate:[0,-14,14,-8,8,0]}} transition={{duration:.5}}><motion.path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" initial={{pathLength:reduced?1:0}} animate={{pathLength:1}} transition={{duration:reduced?0:.6}}/><motion.path d="M10 21h4" initial={{pathLength:reduced?1:0}} animate={{pathLength:1}} transition={{duration:reduced?0:.3,delay:reduced?0:.3}}/></motion.svg>;
}
export function OrbitIllustration(){
 const reduced=useReducedMotion();
 return <svg className="orbit-illustration" width="124" height="94" viewBox="0 0 124 94" fill="none" aria-hidden="true"><motion.g animate={reduced?undefined:{y:[0,-4,0]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}><circle cx="62" cy="46" r="22" fill="#e5e9dc"/><motion.path d="M61 24a22 22 0 1 0 22 22" stroke="#a6b296" strokeWidth="1.4" strokeLinecap="round" initial={{pathLength:reduced?1:0}} animate={{pathLength:1}} transition={{duration:reduced?0:1}}/><motion.ellipse cx="62" cy="47" rx="47" ry="12" transform="rotate(-23 62 47)" stroke="#d5a58a" strokeWidth="1.3" initial={{pathLength:reduced?1:0,opacity:0}} animate={{pathLength:1,opacity:1}} transition={{duration:reduced?0:1.2}}/><circle cx="52" cy="41" r="3" fill="#d4dcc9"/><circle cx="66" cy="55" r="5" fill="#d9e0ce"/></motion.g><motion.path d="M102 13v8m-4-4h8M20 69v6m-3-3h6" stroke="#d6aa90" strokeWidth="1.5" strokeLinecap="round" animate={reduced?undefined:{opacity:[.4,1,.4]}} transition={{duration:3,repeat:Infinity}}/><circle cx="20" cy="23" r="2" fill="#c1c8b5"/><circle cx="99" cy="76" r="1.5" fill="#c1c8b5"/></svg>;
}
