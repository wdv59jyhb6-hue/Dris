import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard, Truck, DoorOpen, ClipboardCheck, Wrench, BarChart3,
  Users as UsersIcon, Settings as SettingsIcon, Bell, Search, LogOut,
  CheckCircle2, XCircle, AlertTriangle, Clock, Nfc, Activity, Plus,
  Calendar, ShieldCheck, X, ChevronRight, ChevronLeft, MessageSquare,
  Send, Menu, FileText, Filter, Building2, Lock, Command, ChevronsUpDown,
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight, MoreVertical,
  Download, History, MapPin, Timer, Battery, LayoutGrid, List, Check,
  Circle, Info, RefreshCw, CornerDownLeft,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { api, getToken, setToken, clearToken } from "./api.js";

/* ═══ TOKENS ═══ */
const C = {
  paper:"#FFFFFF", canvas:"#F4F7FB", sunken:"#EDF2F8", line:"#E2E9F2", lineStrong:"#CEDAE8",
  ink:"#0D1F33", ink2:"#35506B", muted:"#64798F", faint:"#8FA2B5",
  rail:"#072F55", railTop:"#0A3D6B",
  blue:"#0A66C2", blueDeep:"#0857A6", blue50:"#EBF3FC", blue100:"#D4E6F9",
  green:"#13804A", green50:"#E6F4EC", amber:"#B15C09", amber50:"#FDF2E3",
  red:"#B42318", red50:"#FDECEA", grey:"#7C8EA0", grey50:"#EEF2F6",
};
const E = {
  e1:"0 1px 2px rgba(13,31,51,.06)",
  e2:"0 2px 6px rgba(13,31,51,.07), 0 1px 2px rgba(13,31,51,.04)",
  e3:"0 10px 28px rgba(13,31,51,.13), 0 2px 6px rgba(13,31,51,.06)",
  e4:"0 24px 60px rgba(13,31,51,.22), 0 4px 12px rgba(13,31,51,.08)",
};
const EASE = "cubic-bezier(.16,1,.3,1)";
const sans = "'IBM Plex Sans', system-ui, sans-serif";
const mono = "'IBM Plex Mono', ui-monospace, monospace";
const STATUS = {
  Available:{fg:C.green,bg:C.green50,dot:C.green}, "In Use":{fg:C.blue,bg:C.blue50,dot:C.blue},
  Reserved:{fg:C.amber,bg:C.amber50,dot:C.amber}, Maintenance:{fg:C.red,bg:C.red50,dot:C.red},
  Offline:{fg:C.grey,bg:C.grey50,dot:C.grey},
};
const LEVEL = { Technologist:1, Supervisor:2, Manager:3, Operations:4 };
const atLeast = (u,r) => LEVEL[u.role] >= LEVEL[r];
const ROLES = ["Technologist","Supervisor","Manager","Operations"];
const PORTABLE_Q = ["Is the equipment functioning properly?","Is the detector charged?","Are cleaning and disinfection supplies available?"];
const ROOM_Q = ["Is the X-Ray room functioning properly?","Is the room free from any technical issues?","Are cleaning and disinfection supplies available?"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const todayStr = () => new Date().toISOString().slice(0,10);
const fmtDate = (d)=>{ if(!d) return "—"; const [y,m,dd]=d.split("-"); return `${Number(dd)} ${MONTHS[Number(m)-1]} ${y}`; };
const fmtShort = (d)=>{ if(!d) return "—"; const [,m,dd]=d.split("-"); return `${Number(dd)} ${MONTHS[Number(m)-1]}`; };
const daysUntil = (d)=> Math.round((new Date(d).getTime()-new Date(todayStr()).getTime())/86400000);
const initials = (n)=> (n||"?").split(" ").map(p=>p[0]).slice(0,2).join("");

function useCountUp(target,duration=800){
  const [v,setV]=useState(0);
  useEffect(()=>{ let raf,start=null;
    const tick=(t)=>{ if(start===null)start=t; const p=Math.min(1,(t-start)/duration);
      setV(target*(1-Math.pow(1-p,3))); if(p<1)raf=requestAnimationFrame(tick); };
    raf=requestAnimationFrame(tick); return ()=>cancelAnimationFrame(raf);
  },[target,duration]); return v;
}

/* ═══ PRIMITIVES ═══ */
function Card({children,className="",style={},hover=false,...rest}){
  const [h,setH]=useState(false);
  return <div className={`rounded-xl ${className}`}
    onMouseEnter={()=>hover&&setH(true)} onMouseLeave={()=>hover&&setH(false)}
    style={{background:C.paper,border:`1px solid ${h?C.lineStrong:C.line}`,boxShadow:h?E.e2:E.e1,
      transform:h?"translateY(-2px)":"none",transition:`all .28s ${EASE}`,...style}} {...rest}>{children}</div>;
}
function Tag({children,tone}){
  return <span className="inline-flex items-center px-1.5 py-0.5 rounded"
    style={{fontFamily:mono,fontSize:11,letterSpacing:".02em",
      background:tone==="blue"?C.blue50:C.sunken,color:tone==="blue"?C.blueDeep:C.muted,
      border:`1px solid ${tone==="blue"?C.blue100:C.line}`}}>{children}</span>;
}
function StatusBadge({status}){
  const s=STATUS[status]||STATUS.Offline; const live=status==="In Use";
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1"
    style={{background:s.bg,color:s.fg,fontSize:11.5,fontWeight:600,whiteSpace:"nowrap"}}>
    {live?<span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-70" style={{background:s.dot,animation:"ping 1.6s cubic-bezier(0,0,.2,1) infinite"}}/>
      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{background:s.dot}}/></span>
      :<span className="h-1.5 w-1.5 rounded-full" style={{background:s.dot}}/>}{status}</span>;
}
function Priority({value}){
  const m={Critical:[C.red,C.red50],High:[C.amber,C.amber50],Medium:[C.blue,C.blue50],Low:[C.muted,C.grey50]};
  const [fg,bg]=m[value]||m.Low;
  return <span className="px-1.5 py-0.5 rounded" style={{background:bg,color:fg,fontSize:11,fontWeight:600}}>{value}</span>;
}
function Button({children,variant="primary",size="md",icon:Icon,iconRight:IconR,disabled,onClick,className="",full}){
  const [h,setH]=useState(false);
  const sizes={xs:"px-2 py-1 gap-1",sm:"px-2.5 py-1.5 gap-1.5",md:"px-3.5 py-2 gap-2",lg:"px-5 py-2.5 gap-2"};
  const fs={xs:12,sm:13,md:13.5,lg:15};
  const V={
    primary:{background:h?C.blueDeep:C.blue,color:"#fff",border:"1px solid transparent",boxShadow:h?E.e2:E.e1},
    secondary:{background:h?C.canvas:C.paper,color:C.ink,border:`1px solid ${h?C.lineStrong:C.line}`,boxShadow:E.e1},
    quiet:{background:h?C.sunken:"transparent",color:C.ink2,border:"1px solid transparent"},
    ghost:{background:h?C.sunken:"transparent",color:C.muted,border:"1px solid transparent"},
    danger:{background:h?"#9E1F14":C.red,color:"#fff",border:"1px solid transparent"},
  };
  return <button onClick={disabled?undefined:onClick} disabled={disabled}
    onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    className={`inline-flex items-center justify-center rounded-lg font-semibold ${sizes[size]} ${full?"w-full":""} ${className}`}
    style={{...V[variant],fontSize:fs[size],fontFamily:sans,opacity:disabled?.5:1,cursor:disabled?"not-allowed":"pointer",
      transition:`all .18s ${EASE}`,transform:h&&!disabled?"translateY(-1px)":"none"}}>
    {Icon&&<Icon size={size==="lg"?17:15} strokeWidth={2.2}/>}{children}{IconR&&<IconR size={size==="lg"?17:15} strokeWidth={2.2}/>}
  </button>;
}
function Tip({label,children,side="top"}){
  const [on,setOn]=useState(false);
  const pos=side==="top"?"bottom-full mb-1.5 left-1/2 -translate-x-1/2":"left-full ml-2 top-1/2 -translate-y-1/2";
  return <span className="relative inline-flex" onMouseEnter={()=>setOn(true)} onMouseLeave={()=>setOn(false)}>
    {children}
    {on&&<span className={`absolute z-50 px-2 py-1 rounded whitespace-nowrap pointer-events-none ${pos}`}
      style={{background:C.ink,color:"#fff",fontSize:11.5,fontWeight:500,boxShadow:E.e3,animation:`fadeIn .14s ${EASE}`}}>{label}</span>}
  </span>;
}
const inputStyle={fontFamily:sans,background:C.paper,border:`1px solid ${C.line}`,color:C.ink,borderRadius:8,
  padding:"9px 11px",width:"100%",fontSize:13.5,outline:"none",transition:`all .18s ${EASE}`};
function Field({label,children,hint,required}){
  return <label className="block">
    <span className="flex items-center gap-1 mb-1.5" style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:".07em",textTransform:"uppercase"}}>
      {label}{required&&<span style={{color:C.red}}>*</span>}</span>
    {children}{hint&&<span className="block mt-1.5" style={{fontSize:12,color:C.faint}}>{hint}</span>}
  </label>;
}
function Segmented({options,value,onChange,size="md"}){
  return <div className="inline-flex p-0.5 rounded-lg" style={{background:C.sunken,border:`1px solid ${C.line}`}}>
    {options.map(o=>{ const val=o.value??o; const label=o.label??o; const on=value===val;
      return <button key={val} onClick={()=>onChange(val)}
        className={`rounded-md font-semibold ${size==="sm"?"px-2.5 py-1":"px-3 py-1.5"}`}
        style={{fontSize:size==="sm"?12:13,background:on?C.paper:"transparent",color:on?C.ink:C.muted,
          boxShadow:on?E.e1:"none",transition:`all .2s ${EASE}`}}>
        {o.icon&&<o.icon size={13} className="inline mr-1.5 -mt-0.5"/>}{label}
        {o.count!==undefined&&<span className="ml-1.5" style={{fontFamily:mono,opacity:.65,fontSize:11}}>{o.count}</span>}
      </button>; })}
  </div>;
}
function Skeleton({w="100%",h=14,r=6,className=""}){
  return <div className={className} style={{width:w,height:h,borderRadius:r,
    background:`linear-gradient(90deg, ${C.sunken} 25%, #F7FAFD 50%, ${C.sunken} 75%)`,
    backgroundSize:"200% 100%",animation:"shimmer 1.4s ease-in-out infinite"}}/>;
}
function Progress({value,tone=C.blue,height=5}){
  const v=useCountUp(value,900);
  return <div className="w-full rounded-full overflow-hidden" style={{height,background:C.sunken}}>
    <div className="h-full rounded-full" style={{width:`${v}%`,background:tone,transition:`background .3s ${EASE}`}}/></div>;
}
function Sparkline({data,color=C.blue,w=68,h=24}){
  if(!data||!data.length) return null;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1;
  const pts=data.map((d,i)=>[(i/(data.length-1))*w,h-2-((d-min)/range)*(h-4)]);
  const line=pts.map(p=>p.join(",")).join(" "); const area=`${line} ${w},${h} 0,${h}`;
  const id=`sp${color.replace("#","")}`;
  return <svg width={w} height={h} style={{overflow:"visible"}}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity=".22"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    <polygon points={area} fill={`url(#${id})`}/>
    <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.4" fill={color}/>
  </svg>;
}
function Avatar({name,size=32,tone}){
  return <div className="rounded-full flex items-center justify-center font-bold shrink-0"
    style={{width:size,height:size,background:tone||C.blue50,color:tone?"#fff":C.blueDeep,fontSize:size*0.34}}>{initials(name)}</div>;
}
function Modal({open,onClose,title,subtitle,children,footer,width="max-w-lg",icon:Icon}){
  useEffect(()=>{ if(!open) return; const h=(e)=>e.key==="Escape"&&onClose();
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h); },[open,onClose]);
  if(!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{background:"rgba(13,31,51,.5)",backdropFilter:"blur(3px)",animation:`fadeIn .2s ${EASE}`}} onClick={onClose}>
    <div className={`w-full ${width} rounded-2xl overflow-hidden`} style={{background:C.paper,boxShadow:E.e4,animation:`modalIn .32s ${EASE}`}} onClick={e=>e.stopPropagation()}>
      <div className="flex items-start gap-3 px-6 py-4" style={{borderBottom:`1px solid ${C.line}`}}>
        {Icon&&<div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:C.blue50}}><Icon size={18} style={{color:C.blue}}/></div>}
        <div className="flex-1 min-w-0">
          <h3 style={{fontSize:15.5,fontWeight:700,color:C.ink,letterSpacing:"-.01em"}}>{title}</h3>
          {subtitle&&<p className="mt-0.5" style={{fontSize:13,color:C.muted}}>{subtitle}</p>}
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg shrink-0" style={{color:C.faint}}><X size={17}/></button>
      </div>
      <div className="px-6 py-5 overflow-y-auto" style={{maxHeight:"60vh"}}>{children}</div>
      {footer&&<div className="px-6 py-3.5 flex justify-end gap-2" style={{borderTop:`1px solid ${C.line}`,background:C.canvas}}>{footer}</div>}
    </div>
  </div>;
}
function Empty({icon:Icon,title,body,action}){
  return <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{background:C.canvas,border:`1px solid ${C.line}`}}>
      <Icon size={24} style={{color:C.faint}} strokeWidth={1.8}/></div>
    <p style={{fontSize:14.5,fontWeight:600,color:C.ink}}>{title}</p>
    <p className="mt-1.5 max-w-sm" style={{fontSize:13,color:C.muted,lineHeight:1.6}}>{body}</p>
    {action&&<div className="mt-5">{action}</div>}
  </div>;
}
function PageHead({eyebrow,title,desc,action,crumbs}){
  return <div className="mb-6">
    {crumbs&&<div className="flex items-center gap-1.5 mb-2.5" style={{fontSize:12,color:C.faint}}>
      {crumbs.map((c,i)=><React.Fragment key={c}>{i>0&&<ChevronRight size={12}/>}
        <span style={{color:i===crumbs.length-1?C.muted:C.faint}}>{c}</span></React.Fragment>)}</div>}
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>{eyebrow&&<div style={{fontFamily:mono,fontSize:11,fontWeight:600,color:C.blue,letterSpacing:".12em",textTransform:"uppercase",marginBottom:5}}>{eyebrow}</div>}
        <h1 style={{fontSize:22,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.2}}>{title}</h1>
        {desc&&<p className="mt-1.5" style={{fontSize:13.5,color:C.muted}}>{desc}</p>}</div>
      {action}
    </div>
  </div>;
}
function SubHead({title,desc,action}){
  return <div className="flex items-end justify-between gap-3 mb-4">
    <div><h2 style={{fontSize:15,fontWeight:700,color:C.ink,letterSpacing:"-.01em"}}>{title}</h2>
      {desc&&<p className="mt-0.5" style={{fontSize:12.5,color:C.muted}}>{desc}</p>}</div>{action}
  </div>;
}
function DataTable({columns,rows,empty,dense,onRowClick}){
  const [sort,setSort]=useState({key:null,dir:"asc"});
  const sorted=useMemo(()=>{ if(!sort.key) return rows;
    const col=columns.find(c=>c.key===sort.key);
    return [...rows].sort((a,b)=>{ const av=col.sortVal?col.sortVal(a):a[sort.key]; const bv=col.sortVal?col.sortVal(b):b[sort.key];
      if(av===bv) return 0; return (av>bv?1:-1)*(sort.dir==="asc"?1:-1); });
  },[rows,sort,columns]);
  const pad=dense?"px-4 py-2":"px-4 py-3";
  if(!rows.length) return empty||null;
  return <div className="overflow-x-auto"><table className="w-full" style={{borderCollapse:"separate",borderSpacing:0}}>
    <thead><tr>{columns.map(c=>{ const on=sort.key===c.key;
      return <th key={c.key} className={`${pad} text-left sticky top-0 z-10`}
        style={{background:C.canvas,borderBottom:`1px solid ${C.line}`,fontSize:11,fontWeight:700,color:C.muted,
          letterSpacing:".06em",textTransform:"uppercase",width:c.width,whiteSpace:"nowrap",cursor:c.sortable?"pointer":"default"}}
        onClick={()=>c.sortable&&setSort({key:c.key,dir:on&&sort.dir==="asc"?"desc":"asc"})}>
        <span className="inline-flex items-center gap-1.5">{c.label}
          {c.sortable&&(on?(sort.dir==="asc"?<ChevronUp size={12} style={{color:C.blue}}/>:<ChevronDown size={12} style={{color:C.blue}}/>):<ChevronsUpDown size={12} style={{color:C.faint,opacity:.6}}/>)}</span>
      </th>; })}</tr></thead>
    <tbody>{sorted.map((r,i)=><tr key={r.id||i} onClick={()=>onRowClick&&onRowClick(r)}
      style={{cursor:onRowClick?"pointer":"default",transition:`background .15s ${EASE}`,
        animation:`fadeRise .4s ${EASE} both`,animationDelay:`${Math.min(i*22,260)}ms`}}
      onMouseEnter={e=>e.currentTarget.style.background=C.canvas} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      {columns.map(c=><td key={c.key} className={pad} style={{borderBottom:`1px solid ${C.line}`,fontSize:13.5,color:C.ink,verticalAlign:"middle"}}>
        {c.render?c.render(r):r[c.key]}</td>)}
    </tr>)}</tbody>
  </table></div>;
}
function ChartTip({active,payload,label,unit="",name}){
  if(!active||!payload?.length) return null;
  return <div className="px-3 py-2 rounded-lg" style={{background:C.ink,boxShadow:E.e3,minWidth:110}}>
    <div style={{fontSize:11,color:"rgba(255,255,255,.6)",fontFamily:mono}}>{label}</div>
    <div className="mt-0.5 flex items-baseline gap-1">
      <span style={{fontSize:17,fontWeight:700,color:"#fff",fontFamily:mono}}>{payload[0].value}</span>
      <span style={{fontSize:11.5,color:"rgba(255,255,255,.65)"}}>{unit}</span></div>
    {name&&<div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginTop:2}}>{name}</div>}
  </div>;
}
function Logo({size=36,light=false}){
  return <div className="rounded-xl flex items-center justify-center shrink-0"
    style={{width:size,height:size,background:light?"rgba(255,255,255,.13)":C.blue50,border:`1px solid ${light?"rgba(255,255,255,.2)":C.blue100}`}}>
    <svg width={size*.56} height={size*.56} viewBox="0 0 24 24" fill="none">
      <path d="M12 2.5 3.5 6v6.2c0 5.1 3.6 8.6 8.5 9.8 4.9-1.2 8.5-4.7 8.5-9.8V6L12 2.5Z" stroke={light?"#fff":C.blue} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M12 8.2v7.4M8.3 11.9h7.4" stroke={light?"#fff":C.blue} strokeWidth="1.7" strokeLinecap="round"/></svg>
  </div>;
}

/* ═══ SESSION CAPSULE ═══ */
function CountRing({value,total,size=52}){
  const r=(size-5)/2,c=2*Math.PI*r; const pct=Math.max(0,Math.min(1,value/total)); const urgent=value<=15;
  return <svg width={size} height={size}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.sunken} strokeWidth="3.5"/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={urgent?C.red:C.blue} strokeWidth="3.5" strokeLinecap="round"
      strokeDasharray={c} strokeDashoffset={c*(1-pct)} transform={`rotate(-90 ${size/2} ${size/2})`}
      style={{transition:"stroke-dashoffset 1s linear, stroke .3s"}}/></svg>;
}
function SessionCapsule({session,equipment,onEnd}){
  const [el,setEl]=useState(0);
  useEffect(()=>{ if(!session) return; setEl(0);
    const t=setInterval(()=>setEl(e=>e+1),1000); return ()=>clearInterval(t); },[session?.equipId]);
  if(!session) return <Tip label="Tap an available asset to begin">
    <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{background:C.canvas,border:`1px dashed ${C.lineStrong}`}}>
      <Nfc size={14} style={{color:C.faint}}/><span style={{fontSize:12,color:C.muted,fontWeight:500}}>No active session</span></div></Tip>;
  const eq=equipment.find(e=>e.id===session.equipId);
  const mm=String(Math.floor(el/60)).padStart(2,"0"),ss=String(el%60).padStart(2,"0");
  return <div className="flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-lg"
    style={{background:`linear-gradient(135deg, ${C.blue}, ${C.blueDeep})`,boxShadow:`0 2px 10px ${C.blue}40`,animation:`fadeRise .4s ${EASE}`}}>
    <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-70" style={{animation:"ping 1.6s cubic-bezier(0,0,.2,1) infinite"}}/>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"/></span>
    <div className="leading-tight hidden sm:block"><div style={{fontSize:12,fontWeight:700,color:"#fff"}}>{eq?.name}</div>
      <div style={{fontSize:11,fontFamily:mono,color:"rgba(255,255,255,.75)"}}>{mm}:{ss} · {eq?.dept}</div></div>
    <button onClick={onEnd} className="px-2.5 py-1 rounded-md font-semibold" style={{background:"rgba(255,255,255,.18)",color:"#fff",fontSize:12}}>End</button>
  </div>;
}

/* ═══ COMMAND PALETTE ═══ */
function CommandPalette({open,onClose,equipment,tickets,onGo,onOpenEquip,nav}){
  const [q,setQ]=useState(""); const [idx,setIdx]=useState(0); const inputRef=React.useRef(null);
  useEffect(()=>{ if(open){ setQ(""); setIdx(0); setTimeout(()=>inputRef.current?.focus(),40); } },[open]);
  const items=useMemo(()=>{
    const pages=nav.map(n=>({type:"Page",label:n.label,icon:n.icon,act:()=>onGo(n.key)}));
    const eqs=equipment.map(e=>({type:"Equipment",label:e.name,sub:`${e.tag} · ${e.dept}`,icon:e.kind==="Portable"?Truck:DoorOpen,act:()=>onOpenEquip(e)}));
    const tks=tickets.map(t=>({type:"Ticket",label:t.problem,sub:`${t.id} · ${t.status}`,icon:Wrench,act:()=>onGo("tickets")}));
    const all=[...pages,...eqs,...tks];
    if(!q.trim()) return all.slice(0,8);
    const s=q.toLowerCase();
    return all.filter(i=>i.label.toLowerCase().includes(s)||i.sub?.toLowerCase().includes(s)).slice(0,10);
  },[q,equipment,tickets,onGo,onOpenEquip,nav]);
  useEffect(()=>{ if(!open) return;
    const h=(e)=>{ if(e.key==="Escape")onClose();
      if(e.key==="ArrowDown"){e.preventDefault();setIdx(i=>Math.min(i+1,items.length-1));}
      if(e.key==="ArrowUp"){e.preventDefault();setIdx(i=>Math.max(i-1,0));}
      if(e.key==="Enter"&&items[idx]){items[idx].act();onClose();} };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[open,items,idx,onClose]);
  if(!open) return null; let lastType=null;
  return <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
    style={{background:"rgba(13,31,51,.5)",backdropFilter:"blur(3px)",animation:`fadeIn .18s ${EASE}`}} onClick={onClose}>
    <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{background:C.paper,boxShadow:E.e4,animation:`modalIn .28s ${EASE}`}} onClick={e=>e.stopPropagation()}>
      <div className="flex items-center gap-3 px-4 py-3.5" style={{borderBottom:`1px solid ${C.line}`}}>
        <Search size={17} style={{color:C.faint}}/>
        <input ref={inputRef} value={q} onChange={e=>{setQ(e.target.value);setIdx(0);}} placeholder="Search equipment, tickets and pages"
          style={{flex:1,border:"none",outline:"none",fontSize:14.5,fontFamily:sans,color:C.ink,background:"transparent"}}/>
        <kbd style={{fontFamily:mono,fontSize:10.5,color:C.faint,background:C.sunken,padding:"3px 6px",borderRadius:5,border:`1px solid ${C.line}`}}>ESC</kbd>
      </div>
      <div className="py-2 overflow-y-auto" style={{maxHeight:330}}>
        {items.length===0&&<div className="px-4 py-10 text-center">
          <p style={{fontSize:13.5,color:C.ink,fontWeight:600}}>No matches</p>
          <p className="mt-1" style={{fontSize:12.5,color:C.muted}}>Try an asset tag such as PX-03, or a ticket number.</p></div>}
        {items.map((it,i)=>{ const showHead=it.type!==lastType; lastType=it.type; const on=i===idx;
          return <React.Fragment key={i}>
            {showHead&&<div className="px-4 pt-2.5 pb-1" style={{fontSize:10.5,fontWeight:700,color:C.faint,letterSpacing:".08em",textTransform:"uppercase"}}>{it.type}</div>}
            <button onMouseEnter={()=>setIdx(i)} onClick={()=>{it.act();onClose();}} className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
              style={{background:on?C.blue50:"transparent",transition:`background .12s ${EASE}`}}>
              <it.icon size={16} style={{color:on?C.blue:C.faint}}/>
              <span className="flex-1 min-w-0"><span className="block truncate" style={{fontSize:13.5,fontWeight:on?600:500,color:C.ink}}>{it.label}</span>
                {it.sub&&<span className="block truncate" style={{fontSize:12,color:C.muted}}>{it.sub}</span>}</span>
              {on&&<CornerDownLeft size={13} style={{color:C.blue}}/>}
            </button></React.Fragment>; })}
      </div>
    </div>
  </div>;
}

/* ═══ NAV ═══ */
const NAV=[
  {key:"dashboard",label:"Dashboard",icon:LayoutDashboard,min:"Technologist",group:"Overview"},
  {key:"portable",label:"Portable X-Ray",icon:Truck,min:"Technologist",group:"Assets"},
  {key:"rooms",label:"X-Ray Rooms",icon:DoorOpen,min:"Technologist",group:"Assets"},
  {key:"inspection",label:"Daily Inspection",icon:ClipboardCheck,min:"Technologist",group:"Operations"},
  {key:"tickets",label:"Maintenance",icon:Wrench,min:"Technologist",group:"Operations"},
  {key:"reports",label:"Reports",icon:BarChart3,min:"Supervisor",group:"Insights"},
  {key:"users",label:"Users",icon:UsersIcon,min:"Manager",group:"Administration"},
  {key:"settings",label:"Settings",icon:SettingsIcon,min:"Technologist",group:"Administration"},
];
function Sidebar({page,setPage,user,open,setOpen,counts,collapsed,setCollapsed}){
  const items=NAV.filter(n=>atLeast(user,n.min)); const groups=[...new Set(items.map(i=>i.group))];
  const W=collapsed?68:248;
  return <>
    {open&&<div className="fixed inset-0 z-30 lg:hidden" style={{background:"rgba(13,31,51,.5)",animation:`fadeIn .2s ${EASE}`}} onClick={()=>setOpen(false)}/>}
    <aside className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col ${open?"translate-x-0":"-translate-x-full lg:translate-x-0"}`}
      style={{width:W,background:`linear-gradient(180deg, ${C.railTop}, ${C.rail})`,transition:`all .3s ${EASE}`}}>
      <div className="flex items-center gap-2.5 px-4 shrink-0" style={{height:61,borderBottom:"1px solid rgba(255,255,255,.08)"}}>
        <Logo size={34} light/>
        {!collapsed&&<div className="leading-tight min-w-0" style={{animation:`fadeIn .3s ${EASE}`}}>
          <div style={{fontFamily:mono,fontSize:17,fontWeight:700,color:"#fff",letterSpacing:".1em"}}>DRIS</div>
          <div style={{fontSize:9.5,color:"rgba(255,255,255,.55)",letterSpacing:".03em"}}>RADIOLOGY OPS</div></div>}
      </div>
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
        {groups.map(g=><div key={g} className="mb-3">
          {!collapsed&&<div className="px-2.5 pb-1.5" style={{fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,.38)",letterSpacing:".12em",textTransform:"uppercase"}}>{g}</div>}
          {items.filter(i=>i.group===g).map(n=>{ const active=page===n.key; const badge=counts[n.key];
            const btn=<button key={n.key} onClick={()=>{setPage(n.key);setOpen(false);}}
              className="w-full flex items-center gap-2.5 px-2.5 rounded-lg mb-0.5 relative"
              style={{height:38,background:active?"rgba(255,255,255,.14)":"transparent",color:active?"#fff":"rgba(255,255,255,.68)",
                transition:`all .2s ${EASE}`,justifyContent:collapsed?"center":"flex-start"}}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.background="rgba(255,255,255,.07)";}}
              onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
              {active&&<span className="absolute left-0 rounded-r-full" style={{width:3,height:18,background:"#5FA8F5"}}/>}
              <n.icon size={17} strokeWidth={active?2.4:2}/>
              {!collapsed&&<><span className="flex-1 text-left truncate" style={{fontSize:13.5,fontWeight:active?600:500}}>{n.label}</span>
                {badge>0&&<span className="px-1.5 rounded" style={{fontFamily:mono,fontSize:10.5,fontWeight:600,background:active?"rgba(255,255,255,.22)":"rgba(255,255,255,.12)",color:"#fff",padding:"1px 5px"}}>{badge}</span>}</>}
              {collapsed&&badge>0&&<span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{background:"#5FA8F5"}}/>}
            </button>;
            return collapsed?<Tip key={n.key} label={n.label} side="right">{btn}</Tip>:btn; })}
        </div>)}
      </nav>
      <div className="px-2.5 py-3 shrink-0" style={{borderTop:"1px solid rgba(255,255,255,.08)"}}>
        {!collapsed&&<div className="px-2 pb-2.5">
          <div className="flex items-center gap-1.5 mb-1"><Building2 size={11} style={{color:"rgba(255,255,255,.45)"}}/>
            <span style={{fontSize:11,color:"rgba(255,255,255,.55)"}}>King Abdulaziz Medical City</span></div>
          <div style={{fontFamily:mono,fontSize:10,color:"rgba(255,255,255,.32)"}}>dris.health · v2.4.1</div></div>}
        <button onClick={()=>setCollapsed(!collapsed)} className="hidden lg:flex w-full items-center justify-center gap-2 rounded-lg"
          style={{height:32,background:"rgba(255,255,255,.07)",color:"rgba(255,255,255,.7)",fontSize:12,fontWeight:600}}>
          {collapsed?<ChevronRight size={15}/>:<><ChevronLeft size={15}/> Collapse</>}</button>
      </div>
    </aside>
  </>;
}
function Topbar({user,setUser,session,equipment,onEndSession,onMenu,page,onSearch,onLogout}){
  const [menu,setMenu]=useState(false); const nav=NAV.find(n=>n.key===page);
  return <header className="sticky top-0 z-20 flex items-center gap-2 px-3 lg:px-5 shrink-0"
    style={{height:61,background:"rgba(255,255,255,.86)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.line}`}}>
    <button className="lg:hidden p-2 rounded-lg" onClick={onMenu} style={{color:C.ink}}><Menu size={19}/></button>
    <div className="hidden md:block min-w-0"><div style={{fontSize:11,color:C.faint}}>{nav?.group}</div>
      <div style={{fontSize:14.5,fontWeight:700,color:C.ink,letterSpacing:"-.01em"}}>{nav?.label}</div></div>
    <button onClick={onSearch} className="flex-1 max-w-sm mx-auto hidden md:flex items-center gap-2.5 px-3 rounded-lg"
      style={{height:36,background:C.canvas,border:`1px solid ${C.line}`,transition:`all .2s ${EASE}`}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.lineStrong;e.currentTarget.style.background=C.paper;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.line;e.currentTarget.style.background=C.canvas;}}>
      <Search size={15} style={{color:C.faint}}/><span className="flex-1 text-left" style={{fontSize:13,color:C.faint}}>Search…</span>
      <kbd className="flex items-center gap-0.5" style={{fontFamily:mono,fontSize:10.5,color:C.muted,background:C.paper,padding:"2px 5px",borderRadius:4,border:`1px solid ${C.line}`}}><Command size={9}/>K</kbd>
    </button>
    <div className="flex-1 md:hidden"/>
    <SessionCapsule session={session} equipment={equipment} onEnd={onEndSession}/>
    <button className="relative p-2 rounded-lg" style={{color:C.muted}}><Bell size={18}/>
      <span className="absolute top-1.5 right-1.5 rounded-full flex items-center justify-center" style={{width:14,height:14,background:C.red,color:"#fff",fontSize:9,fontWeight:700,fontFamily:mono,border:`2px solid ${C.paper}`}}>2</span></button>
    <div className="relative">
      <button onClick={()=>setMenu(!menu)} className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-lg"
        onMouseEnter={e=>e.currentTarget.style.background=C.sunken} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <Avatar name={user.name} size={30}/>
        <div className="hidden sm:block text-left leading-tight"><div style={{fontSize:12.5,fontWeight:600,color:C.ink}}>{user.name.split(" ")[0]}</div>
          <div style={{fontSize:11,color:C.muted}}>{user.role}</div></div><ChevronDown size={13} style={{color:C.faint}}/>
      </button>
      {menu&&<><div className="fixed inset-0 z-30" onClick={()=>setMenu(false)}/>
        <div className="absolute right-0 mt-2 w-64 rounded-xl overflow-hidden z-40" style={{background:C.paper,border:`1px solid ${C.line}`,boxShadow:E.e3,animation:`popIn .22s ${EASE}`}}>
          <div className="flex items-center gap-3 px-4 py-3.5" style={{borderBottom:`1px solid ${C.line}`,background:C.canvas}}>
            <Avatar name={user.name} size={38}/><div className="min-w-0">
              <div style={{fontSize:13.5,fontWeight:700,color:C.ink}}>{user.name}</div>
              <div style={{fontSize:12,color:C.muted}}>{user.department}</div>
              <div style={{fontSize:11,fontFamily:mono,color:C.faint,marginTop:1}}>Badge {user.badge}</div></div></div>
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-4 py-3" style={{color:C.red,fontSize:13,fontWeight:600}}>
            <LogOut size={15}/> Sign out</button>
        </div></>}
    </div>
  </header>;
}

/* ═══ LOGIN (real auth) ═══ */



function LoginPage({onSignIn}){
  const [username,setUsername]=useState("omar.harbi");
  const [password,setPassword]=useState("password");
  const [busy,setBusy]=useState(false); const [error,setError]=useState(null);
  const go=async()=>{ setBusy(true); setError(null);
    try{ await onSignIn(username.trim(),password); }
    catch(e){ setError(e.message||"Sign in failed"); setBusy(false); } };
  return <div className="min-h-screen flex" style={{background:C.canvas,fontFamily:sans}}>
    <div className="hidden lg:flex flex-col justify-between w-1/2 p-14 relative overflow-hidden"
      style={{backgroundImage:`linear-gradient(150deg, rgba(7,47,85,0.92) 0%, rgba(3,50,95,0.88) 55%, rgba(4,31,59,0.96) 100%), url(/hospital.jpg)`,
        backgroundSize:"cover",backgroundPosition:"center"}}>
      <div className="absolute rounded-full" style={{width:500,height:500,right:-180,top:-180,background:"radial-gradient(circle, rgba(95,168,245,.12), transparent 70%)"}}/>
      <div className="relative" style={{animation:`fadeRise .6s ${EASE} both`}}>
<div className="flex items-center gap-3">
  <img src="/logo.png" alt="RadVision" style={{height:70,objectFit:"contain"}}/>
  <div>
    <div style={{fontFamily:mono,fontSize:22,fontWeight:700,color:"#fff",letterSpacing:".04em"}}>RadVision</div>
    <div style={{fontSize:12,color:"rgba(255,255,255,.6)",letterSpacing:".12em",textTransform:"uppercase"}}>Inspect · Track · Improve</div>
  </div>
</div>



      </div>
      <div className="relative" style={{animation:`fadeRise .7s ${EASE} .1s both`}}>
        <div style={{fontFamily:mono,fontSize:11,fontWeight:600,color:"rgba(255,255,255,.45)",letterSpacing:".16em",textTransform:"uppercase",marginBottom:20}}>Smart Radiology Inspection &amp; Asset Management Platform</div>
        <h1 style={{fontSize:40,fontWeight:700,color:"#fff",lineHeight:1.14,letterSpacing:"-.028em"}}>Every machine<br/>accounted for,<br/>every shift.</h1>
        <p className="mt-5 max-w-md" style={{fontSize:15,color:"rgba(255,255,255,.68)",lineHeight:1.65}}>
          Daily inspections, NFC session control and maintenance escalation for portable and fixed radiology equipment across MNGHA facilities.</p>
        <div className="flex gap-8 mt-10 pt-8" style={{borderTop:"1px solid rgba(255,255,255,.12)"}}>
          {[["16","Assets tracked"],["94%","Inspection rate"],["3","Open tickets"]].map(([v,l])=>
            <div key={l}><div style={{fontFamily:mono,fontSize:26,fontWeight:700,color:"#fff"}}>{v}</div>
              <div style={{fontSize:11.5,color:"rgba(255,255,255,.5)",marginTop:2}}>{l}</div></div>)}
        </div>
      </div>
      <div className="relative flex items-center gap-3">
        <img src="/mngha.png" alt="MNGHA" style={{height:34,objectFit:"contain",opacity:.55}}/>
        <div style={{fontSize:11.5,color:"rgba(255,255,255,.38)"}}>Ministry of National Guard Health Affairs</div>
      </div>
    </div>
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm" style={{animation:`fadeRise .6s ${EASE} both`}}>
        <img src="/logo.png" alt="RadVision" style={{height:90,objectFit:"contain"}}/>

        <h2 style={{fontSize:25,fontWeight:700,color:C.ink,letterSpacing:"-.022em"}}>Sign in</h2>
        <p className="mt-2 mb-8" style={{fontSize:13.5,color:C.muted,lineHeight:1.6}}>Smart Radiology Inspection &amp; Asset Management Platform</p>
        <div className="space-y-4">
          <Field label="Username"><input value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={inputStyle}/></Field>
          <Field label="Password"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={inputStyle}/></Field>
          {error&&<div className="flex items-center gap-2 p-3 rounded-lg" style={{background:C.red50,border:`1px solid #F5C6C0`}}>
            <XCircle size={15} style={{color:C.red}}/><span style={{fontSize:12.5,color:"#8A1C13"}}>{error}</span></div>}
          <Button size="lg" full onClick={go} disabled={busy} icon={busy?RefreshCw:undefined}>{busy?"Signing in…":"Sign in"}</Button>
          <div className="flex items-center justify-between pt-1">
            <button style={{fontSize:13,color:C.blue,fontWeight:600}}>Forgot password</button>
            <span className="flex items-center gap-1.5" style={{fontSize:11.5,color:C.faint}}><Lock size={11}/> SSO enabled</span></div>
        </div>
        <div className="mt-10 pt-5 flex items-center gap-3" style={{borderTop:`1px solid ${C.line}`}}>
          <img src="/mngha.png" alt="MNGHA" style={{height:28,objectFit:"contain",opacity:.45}}/>
          <span style={{fontSize:11,color:C.faint}}>Ministry of National Guard Health Affairs</span>
        </div>
      </div>
    </div>
  </div>;
}

/* ═══ STAT CARD ═══ */


/* ═══ STAT CARD ═══ */
function StatCard({label,value,suffix="",tone=C.ink,spark,trend,sub,delay=0,loading}){
  const n=useCountUp(loading?0:value);
  if(loading) return <Card className="p-4"><Skeleton w="52%" h={10}/><Skeleton w="38%" h={26} className="mt-3"/><Skeleton w="70%" h={9} className="mt-3"/></Card>;
  const up=trend>0;
  return <Card hover className="p-4" style={{animation:`fadeRise .5s ${EASE} both`,animationDelay:`${delay}ms`}}>
    <div style={{fontSize:10.5,fontWeight:700,color:C.muted,letterSpacing:".07em",textTransform:"uppercase"}}>{label}</div>
    <div className="flex items-end justify-between mt-2.5 gap-2">
      <div className="flex items-baseline gap-0.5">
        <span style={{fontFamily:mono,fontSize:27,fontWeight:700,color:tone,letterSpacing:"-.03em",lineHeight:1}}>{Math.round(n)}</span>
        {suffix&&<span style={{fontFamily:mono,fontSize:15,fontWeight:600,color:tone,opacity:.65}}>{suffix}</span>}</div>
      {spark&&<Sparkline data={spark} color={tone}/>}</div>
    <div className="flex items-center gap-1.5 mt-2.5">
      {trend!==undefined&&trend!==0&&<span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded"
        style={{background:up?C.green50:C.red50,color:up?C.green:C.red,fontSize:10.5,fontWeight:700}}>
        {up?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{Math.abs(trend)}%</span>}
      {sub&&<span style={{fontSize:11.5,color:C.faint}}>{sub}</span>}</div>
  </Card>;
}

/* ═══ EQUIPMENT CARD ═══ */
function EquipmentCard({eq,onOpen,onStart,canStart,delay=0}){
  const s=STATUS[eq.status]; const ppmDays=eq.nextPPM?daysUntil(eq.nextPPM):999; const ok=eq.lastInspection===todayStr();
  const lowBat=eq.battery!==null&&eq.battery<25;
  return <Card hover className="overflow-hidden" style={{animation:`fadeRise .5s ${EASE} both`,animationDelay:`${delay}ms`}}>
    <div style={{height:3,background:s.dot}}/>
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:s.bg,border:`1px solid ${s.dot}22`}}>
            {eq.kind==="Portable"?<Truck size={18} style={{color:s.fg}}/>:<DoorOpen size={18} style={{color:s.fg}}/>}</div>
          <div className="min-w-0"><div className="truncate" style={{fontSize:14,fontWeight:700,color:C.ink,letterSpacing:"-.01em"}}>{eq.name}</div>
            <div className="flex items-center gap-1.5 mt-1"><Tag>{eq.tag}</Tag><span className="truncate" style={{fontSize:11,color:C.faint}}>{eq.model}</span></div></div></div>
        <StatusBadge status={eq.status}/></div>
      <div className="space-y-2 mb-3.5">
        {[[MapPin,"Location",eq.dept,C.ink2],[UsersIcon,"Operator",eq.user||"Unassigned",eq.user?C.ink2:C.faint]].map(([Icon,k,v,col])=>
          <div key={k} className="flex items-center gap-2" style={{fontSize:12.5}}><Icon size={13} style={{color:C.faint}} className="shrink-0"/>
            <span style={{color:C.faint,width:62}}>{k}</span><span className="truncate flex-1" style={{color:col,fontWeight:500}}>{v}</span></div>)}
        <div className="flex items-center gap-2" style={{fontSize:12.5}}><ClipboardCheck size={13} style={{color:C.faint}} className="shrink-0"/>
          <span style={{color:C.faint,width:62}}>Checked</span>
          <span className="flex items-center gap-1 flex-1" style={{color:ok?C.green:C.amber,fontWeight:600}}>
            {ok?<CheckCircle2 size={12}/>:<AlertTriangle size={12}/>}{ok?"Today":fmtShort(eq.lastInspection)}</span></div>
        <div className="flex items-center gap-2" style={{fontSize:12.5}}><Calendar size={13} style={{color:C.faint}} className="shrink-0"/>
          <span style={{color:C.faint,width:62}}>Next PPM</span>
          <span className="flex-1" style={{color:ppmDays<=7?C.amber:C.ink2,fontWeight:500}}>{fmtShort(eq.nextPPM)}{ppmDays<=14&&ppmDays>=0&&<span style={{fontFamily:mono,fontSize:11,opacity:.75}}> · {ppmDays}d</span>}</span></div>
      </div>
      {eq.battery!==null&&<div className="mb-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5" style={{fontSize:11.5,color:C.faint}}><Battery size={12}/> Detector charge</span>
          <span style={{fontFamily:mono,fontSize:11.5,fontWeight:700,color:lowBat?C.red:C.ink2}}>{eq.battery}%</span></div>
        <Progress value={eq.battery} tone={lowBat?C.red:eq.battery<50?C.amber:C.green} height={4}/></div>}
      <div className="flex gap-2 pt-3.5" style={{borderTop:`1px solid ${C.line}`}}>
        <Button variant="secondary" size="sm" className="flex-1" onClick={()=>onOpen(eq)}>Details</Button>
        {eq.status==="Available"?<Tip label={canStart?"Tap NFC to begin":"End your active session first"}>
          <Button size="sm" icon={Nfc} disabled={!canStart} onClick={()=>onStart(eq)}>Start</Button></Tip>
          :<Button variant="quiet" size="sm" disabled>Unavailable</Button>}</div>
    </div>
  </Card>;
}

/* ═══ ACTIVITY FEED ═══ */
function ActivityFeed({items,loading}){
  const icons={inspection:ClipboardCheck,session:Nfc,ticket:Wrench,qc:ShieldCheck,biomed:Activity};
  const colors={inspection:C.green,session:C.blue,ticket:C.amber,qc:C.blue,biomed:C.muted};
  const bgs={inspection:C.green50,session:C.blue50,ticket:C.amber50,qc:C.blue50,biomed:C.grey50};
  return <Card className="p-5"><SubHead title="Activity" desc="Live department feed"/>
    {loading?<div className="space-y-4">{[0,1,2,3].map(i=><div key={i} className="flex gap-3">
      <Skeleton w={28} h={28} r={14}/><div className="flex-1"><Skeleton w="88%" h={11}/><Skeleton w="30%" h={9} className="mt-1.5"/></div></div>)}</div>
    :items.length===0?<Empty icon={Activity} title="No activity yet" body="Actions across the department will appear here."/>
    :<div>{items.slice(0,6).map((a,i)=>{ const Icon=icons[a.type]||Activity; const last=i===Math.min(items.length,6)-1;
      return <div key={a.id} className="flex gap-3" style={{animation:`fadeRise .45s ${EASE} both`,animationDelay:`${i*55}ms`}}>
        <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{background:bgs[a.type]||C.grey50}}>
          <Icon size={13} style={{color:colors[a.type]||C.muted}} strokeWidth={2.2}/></div>
          {!last&&<div className="w-px flex-1 my-1" style={{background:C.line}}/>}</div>
        <div className={`min-w-0 ${last?"":"pb-4"}`}><p style={{fontSize:13,color:C.ink2,lineHeight:1.5}}>
          <span style={{fontWeight:600,color:C.ink}}>{a.who}</span> {a.what}</p>
          <span style={{fontFamily:mono,fontSize:11,color:C.faint}}>{a.at}</span></div>
      </div>; })}</div>}
  </Card>;
}

const COMPLIANCE=[{week:"W22",pct:88},{week:"W23",pct:91},{week:"W24",pct:87},{week:"W25",pct:94},{week:"W26",pct:96},{week:"W27",pct:93},{week:"W28",pct:97},{week:"W29",pct:94}];
const UTILISATION=[{name:"PX-02",hours:31},{name:"PX-03",hours:27},{name:"PX-05",hours:19},{name:"PX-06",hours:34},{name:"PX-08",hours:22},{name:"RM-01",hours:41},{name:"RM-02",hours:38},{name:"RM-05",hours:33}];
const DOWNTIME=[{month:"Feb",hours:41},{month:"Mar",hours:28},{month:"Apr",hours:52},{month:"May",hours:34},{month:"Jun",hours:22},{month:"Jul",hours:47}];

/* ═══ DASHBOARD ═══ */
function Dashboard({equipment,tickets,activity,user,session,onOpen,onStart,loading,setPage}){
  const [view,setView]=useState("grid");
  const s=useMemo(()=>{ const by=st=>equipment.filter(e=>e.status===st).length;
    return {total:equipment.length,available:by("Available"),inUse:by("In Use"),maintenance:by("Maintenance"),
      pending:equipment.filter(e=>e.lastInspection!==todayStr()).length,open:tickets.filter(t=>t.status!=="Closed").length,
      ppm:equipment.filter(e=>e.nextPPM&&daysUntil(e.nextPPM)<=14&&daysUntil(e.nextPPM)>=0).length,
      qc:equipment.filter(e=>e.nextQC&&daysUntil(e.nextQC)<=14&&daysUntil(e.nextQC)>=0).length};
  },[equipment,tickets]);
  const attention=equipment.filter(e=>e.status==="Maintenance"||e.lastInspection!==todayStr());
  const compliance=equipment.length?Math.round(((equipment.length-s.pending)/equipment.length)*100):0;
  const cards=[
    {label:"Total assets",value:s.total,tone:C.ink,sub:"Registered"},
    {label:"Available",value:s.available,tone:C.green,trend:12,sub:"Ready now"},
    {label:"In use",value:s.inUse,tone:C.blue,trend:-8,sub:"Active"},
    {label:"Maintenance",value:s.maintenance,tone:C.red,trend:4,sub:"Out of service"},
    {label:"Pending checks",value:s.pending,tone:C.amber,trend:-22,sub:"Due today"},
    {label:"Open tickets",value:s.open,tone:C.amber,sub:"Unresolved"},
    {label:"Upcoming PPM",value:s.ppm,tone:C.ink,sub:"Next 14 days"},
    {label:"Upcoming QC",value:s.qc,tone:C.ink,sub:"Next 14 days"},
  ];
  return <div>
    <PageHead eyebrow={fmtDate(todayStr())} title={`Good morning, ${user.name.split(" ")[0]}`}
      desc={s.pending>0?`${s.pending} ${s.pending===1?"asset needs":"assets need"} a daily inspection before use.`:"Every asset has been inspected for this shift."}
      action={<div className="flex gap-2"><Button variant="secondary" size="sm" icon={Download}>Export</Button>
        <Button size="sm" icon={ClipboardCheck} onClick={()=>setPage("inspection")}>Start inspection</Button></div>}/>
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
      {cards.map((c,i)=><StatCard key={c.label} {...c} delay={i*45} loading={loading}/>)}</div>
    {!loading&&attention.length>0&&<Card className="p-4 mb-6" style={{background:`linear-gradient(90deg, ${C.amber50}, ${C.paper} 65%)`,borderColor:"#F0D6B0",animation:`fadeRise .5s ${EASE} .1s both`}}>
      <div className="flex items-start gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:"#FBE3C4"}}>
        <AlertTriangle size={17} style={{color:C.amber}}/></div>
        <div className="flex-1 min-w-0"><p style={{fontSize:13.5,fontWeight:700,color:"#7A4206"}}>Needs attention before the next shift</p>
          <p className="mt-0.5" style={{fontSize:13,color:"#8A5312"}}>{attention.slice(0,4).map(e=>e.name).join(", ")}{attention.length>4?` and ${attention.length-4} more`:""}.</p></div>
        <Button variant="secondary" size="sm" iconRight={ChevronRight} onClick={()=>setPage("inspection")}>Review</Button></div></Card>}
    <div className="grid xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 space-y-5"><div>
        <SubHead title="Equipment register" desc="Live status across portable and fixed assets"
          action={<Segmented size="sm" value={view} onChange={setView} options={[{value:"grid",label:"Grid",icon:LayoutGrid},{value:"list",label:"List",icon:List}]}/>}/>
        {loading?<div className="grid sm:grid-cols-2 gap-4">{[0,1,2,3].map(i=><Card key={i} className="p-4">
          <Skeleton w="60%" h={15}/><Skeleton w="40%" h={11} className="mt-2"/><Skeleton h={9} className="mt-4"/><Skeleton h={9} className="mt-2"/><Skeleton h={30} r={8} className="mt-4"/></Card>)}</div>
        :view==="grid"?<div className="grid sm:grid-cols-2 gap-4">{equipment.slice(0,6).map((eq,i)=><EquipmentCard key={eq.id} eq={eq} onOpen={onOpen} onStart={onStart} canStart={!session} delay={i*45}/>)}</div>
        :<Card className="overflow-hidden"><DataTable dense onRowClick={onOpen} rows={equipment} columns={[
          {key:"name",label:"Asset",sortable:true,render:r=><div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:STATUS[r.status].bg}}>{r.kind==="Portable"?<Truck size={13} style={{color:STATUS[r.status].fg}}/>:<DoorOpen size={13} style={{color:STATUS[r.status].fg}}/>}</div>
            <div><div style={{fontWeight:600}}>{r.name}</div><Tag>{r.tag}</Tag></div></div>},
          {key:"status",label:"Status",sortable:true,render:r=><StatusBadge status={r.status}/>},
          {key:"dept",label:"Location",sortable:true,render:r=><span style={{color:C.muted}}>{r.dept}</span>},
          {key:"lastInspection",label:"Checked",sortable:true,render:r=><span style={{color:r.lastInspection===todayStr()?C.green:C.amber,fontWeight:600,fontSize:12.5}}>{r.lastInspection===todayStr()?"Today":fmtShort(r.lastInspection)}</span>},
        ]}/></Card>}
      </div></div>
      <div className="space-y-5">
        <Card className="p-5"><SubHead title="Shift readiness" desc="Inspection completion"/>
          <div className="flex items-end gap-3 mb-3"><span style={{fontFamily:mono,fontSize:34,fontWeight:700,color:compliance>=90?C.green:C.amber,letterSpacing:"-.03em",lineHeight:1}}>{Math.round(useCountUp(loading?0:compliance))}%</span>
            <span className="mb-1" style={{fontSize:12.5,color:C.muted}}>{equipment.length-s.pending} of {equipment.length} assets</span></div>
          <Progress value={loading?0:compliance} tone={compliance>=90?C.green:C.amber} height={6}/>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{borderTop:`1px solid ${C.line}`}}>
            {[["Passed",equipment.length-s.pending,C.green],["Pending",s.pending,C.amber],["Faults",tickets.filter(t=>t.status!=="Closed").length,C.red]].map(([l,v,col])=>
              <div key={l}><div style={{fontFamily:mono,fontSize:17,fontWeight:700,color:col}}>{v}</div><div style={{fontSize:11,color:C.faint}}>{l}</div></div>)}</div>
        </Card>
        <ActivityFeed items={activity} loading={loading}/>
        <Card className="p-5"><SubHead title="Compliance trend" desc="Last 8 weeks"/>
          <div style={{height:132}}><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={COMPLIANCE} margin={{top:4,right:2,left:-26,bottom:0}}>
              <defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={.25}/><stop offset="100%" stopColor={C.blue} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false}/>
              <XAxis dataKey="week" tick={{fontSize:10,fill:C.faint,fontFamily:mono}} axisLine={false} tickLine={false}/>
              <YAxis domain={[80,100]} tick={{fontSize:10,fill:C.faint,fontFamily:mono}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip unit="%" name="Inspection compliance"/>} cursor={{stroke:C.lineStrong,strokeDasharray:"3 3"}}/>
              <Area type="monotone" dataKey="pct" stroke={C.blue} strokeWidth={2.2} fill="url(#gc)" animationDuration={900}/>
            </AreaChart></ResponsiveContainer></div></Card>
      </div>
    </div>
  </div>;
}

/* ═══ EQUIPMENT PAGE ═══ */
function EquipmentPage({kind,equipment,session,onOpen,onStart,loading}){
  const [filter,setFilter]=useState("All"); const [view,setView]=useState("grid"); const [q,setQ]=useState("");
  const list=equipment.filter(e=>e.kind===kind);
  let shown=filter==="All"?list:list.filter(e=>e.status===filter);
  if(q.trim()){ const s=q.toLowerCase(); shown=shown.filter(e=>e.name.toLowerCase().includes(s)||e.tag.toLowerCase().includes(s)||e.dept.toLowerCase().includes(s)); }
  const opts=["All","Available","In Use","Reserved","Maintenance","Offline"].map(f=>({value:f,label:f,count:f==="All"?list.length:list.filter(e=>e.status===f).length})).filter(o=>o.count>0||o.value==="All");
  return <div>
    <PageHead crumbs={["Assets",kind==="Portable"?"Portable X-Ray":"X-Ray Rooms"]}
      eyebrow={kind==="Portable"?"Mobile fleet":"Fixed installations"} title={kind==="Portable"?"Portable X-Ray machines":"X-Ray rooms"}
      desc={`${list.length} registered assets · ${list.filter(e=>e.status==="Available").length} available now`}
      action={<Button variant="secondary" size="sm" icon={Download}>Export register</Button>}/>
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <div className="relative flex-1 min-w-0" style={{maxWidth:280}}><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.faint}}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filter by name, tag or ward" style={{...inputStyle,paddingLeft:33,height:36}}/></div>
      <div className="overflow-x-auto"><Segmented options={opts} value={filter} onChange={setFilter} size="sm"/></div>
      <div className="ml-auto"><Segmented size="sm" value={view} onChange={setView} options={[{value:"grid",label:"",icon:LayoutGrid},{value:"list",label:"",icon:List}]}/></div>
    </div>
    {loading?<div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{[0,1,2,3,4,5].map(i=><Card key={i} className="p-4">
      <Skeleton w="55%" h={15}/><Skeleton w="35%" h={11} className="mt-2"/><Skeleton h={9} className="mt-4"/><Skeleton h={9} className="mt-2"/><Skeleton h={30} r={8} className="mt-4"/></Card>)}</div>
    :shown.length===0?<Card><Empty icon={Filter} title="Nothing matches these filters"
      body={`No ${kind.toLowerCase()} assets match your current search and status filter.`}
      action={<Button variant="secondary" size="sm" onClick={()=>{setFilter("All");setQ("");}}>Clear filters</Button>}/></Card>
    :view==="grid"?<div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{shown.map((eq,i)=><EquipmentCard key={eq.id} eq={eq} onOpen={onOpen} onStart={onStart} canStart={!session} delay={i*40}/>)}</div>
    :<Card className="overflow-hidden"><DataTable onRowClick={onOpen} rows={shown} columns={[
      {key:"name",label:"Asset",sortable:true,render:r=><div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:STATUS[r.status].bg}}>{r.kind==="Portable"?<Truck size={14} style={{color:STATUS[r.status].fg}}/>:<DoorOpen size={14} style={{color:STATUS[r.status].fg}}/>}</div>
        <div><div style={{fontWeight:600}}>{r.name}</div><div className="flex gap-1.5 mt-0.5"><Tag>{r.tag}</Tag><span style={{fontSize:11,color:C.faint}}>{r.model}</span></div></div></div>},
      {key:"status",label:"Status",sortable:true,render:r=><StatusBadge status={r.status}/>},
      {key:"dept",label:"Location",sortable:true,render:r=><span style={{color:C.muted}}>{r.dept}</span>},
      {key:"user",label:"Operator",sortable:true,render:r=>r.user?<div className="flex items-center gap-2"><Avatar name={r.user} size={24}/><span style={{fontSize:12.5}}>{r.user}</span></div>:<span style={{color:C.faint,fontSize:12.5}}>Unassigned</span>},
      {key:"lastInspection",label:"Checked",sortable:true,render:r=><span className="inline-flex items-center gap-1" style={{color:r.lastInspection===todayStr()?C.green:C.amber,fontWeight:600,fontSize:12.5}}>{r.lastInspection===todayStr()?<CheckCircle2 size={12}/>:<AlertTriangle size={12}/>}{r.lastInspection===todayStr()?"Today":fmtShort(r.lastInspection)}</span>},
      {key:"act",label:"",width:40,render:()=><ChevronRight size={15} style={{color:C.faint}}/>},
    ]}/></Card>}
  </div>;
}

/* ═══ INSPECTION PAGE (Part 2 fix surfaced) ═══ */
function InspectionPage({equipment,inspections,user,onInspect,loading}){
  const [tab,setTab]=useState("due");
  const due=equipment.filter(e=>e.lastInspection!==todayStr()&&e.status!=="Offline");
  const done=equipment.filter(e=>e.lastInspection===todayStr());
  const flagged=inspections.filter(i=>i.flagged);
  const pct=equipment.length?Math.round((done.length/equipment.length)*100):0;
  const canSeeAll=atLeast(user,"Supervisor");
  return <div>
    <PageHead crumbs={["Operations","Daily Inspection"]} eyebrow="Shift readiness" title="Daily inspection"
      desc="Every asset requires a three-point check before clinical use."
      action={due.length>0&&<Button size="sm" icon={ClipboardCheck} onClick={()=>onInspect(due[0])}>Inspect next asset</Button>}/>

    {/* PART 2 FIX — visible role scope banner */}
    <Card className="p-3.5 mb-5" style={{background:canSeeAll?C.blue50:C.canvas,borderColor:canSeeAll?C.blue100:C.line}}>
      <div className="flex items-center gap-3">
        {canSeeAll?<ShieldCheck size={16} style={{color:C.blue}}/>:<Info size={16} style={{color:C.muted}}/>}
        <p style={{fontSize:12.5,color:canSeeAll?"#0B4C90":C.muted}}>
          {canSeeAll
            ? <>As a <strong>{user.role}</strong> you can see reports from <strong>every technologist</strong> in the department.</>
            : <>As a <strong>Technologist</strong> you see the reports you submitted. Supervisors can see all reports.</>}
        </p>
      </div>
    </Card>

    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <StatCard label="Due today" value={due.length} tone={C.amber} sub="Not yet checked" loading={loading} delay={0}/>
      <StatCard label="Completed" value={done.length} tone={C.green} sub="Signed off" trend={18} loading={loading} delay={45}/>
      <StatCard label="Reported faults" value={flagged.length} tone={C.red} sub="Awaiting review" loading={loading} delay={90}/>
      <StatCard label="Compliance" value={pct} suffix="%" tone={pct>=90?C.green:C.amber} sub="This shift" loading={loading} delay={135}/>
    </div>
    <div className="mb-5"><Segmented value={tab} onChange={setTab} options={[
      {value:"due",label:"Due",count:due.length},{value:"done",label:"Completed",count:done.length},
      {value:"flagged",label:"Reported faults",count:flagged.length}]}/></div>

    {tab==="due"&&(due.length===0
      ?<Card><Empty icon={CheckCircle2} title="Every asset has been inspected" body="The full register is signed off for this shift."/></Card>
      :<div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {due.map((eq,i)=><Card key={eq.id} hover className="p-4" style={{animation:`fadeRise .45s ${EASE} both`,animationDelay:`${i*45}ms`}}>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:C.amber50}}><Timer size={16} style={{color:C.amber}}/></div>
              <div className="min-w-0"><div className="truncate" style={{fontSize:13.5,fontWeight:700,color:C.ink}}>{eq.name}</div><Tag>{eq.tag}</Tag></div></div>
            <StatusBadge status={eq.status}/></div>
          <p className="mb-3.5" style={{fontSize:12.5,color:C.muted}}>Last checked {fmtShort(eq.lastInspection)} · {eq.dept}</p>
          <Button size="sm" icon={ClipboardCheck} full onClick={()=>onInspect(eq)}>Start inspection</Button>
        </Card>)}
      </div>)}

    {tab==="done"&&<Card className="overflow-hidden"><DataTable rows={done} columns={[
      {key:"name",label:"Asset",sortable:true,render:r=><div><div style={{fontWeight:600}}>{r.name}</div><Tag>{r.tag}</Tag></div>},
      {key:"dept",label:"Location",sortable:true,render:r=><span style={{color:C.muted}}>{r.dept}</span>},
      {key:"by",label:"Inspected by",render:r=>{const rec=inspections.filter(i=>i.equipId===r.id).slice(-1)[0];const nm=rec?.by||user.name;
        return <div className="flex items-center gap-2"><Avatar name={nm} size={24}/><span style={{fontSize:12.5}}>{nm}</span></div>;}},
      {key:"res",label:"Result",render:r=>{const rec=inspections.filter(i=>i.equipId===r.id).slice(-1)[0];const pass=rec?rec.answers.every(Boolean):true;
        return pass?<span className="inline-flex items-center gap-1.5" style={{color:C.green,fontWeight:600,fontSize:12.5}}><CheckCircle2 size={14}/> All checks passed</span>
          :<span className="inline-flex items-center gap-1.5" style={{color:C.red,fontWeight:600,fontSize:12.5}}><XCircle size={14}/> Fault reported</span>;}},
      {key:"date",label:"Date",render:()=><span style={{fontFamily:mono,fontSize:12.5,color:C.muted}}>{fmtShort(todayStr())}</span>},
    ]}/></Card>}

    {tab==="flagged"&&<div className="space-y-3">
      {flagged.length===0&&<Card><Empty icon={ShieldCheck} title="No faults reported" body="Every completed inspection passed all three checks."/></Card>}
      {flagged.map((i,idx)=>{ const eq=equipment.find(e=>e.id===i.equipId); const qs=eq?.kind==="Portable"?PORTABLE_Q:ROOM_Q;
        return <Card key={i.id} className="p-4" style={{animation:`fadeRise .45s ${EASE} both`,animationDelay:`${idx*55}ms`}}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:C.red50}}><AlertTriangle size={18} style={{color:C.red}}/></div>
              <div><div className="flex items-center gap-2"><span style={{fontSize:14,fontWeight:700,color:C.ink}}>{eq?.name}</span><Tag>{i.id.slice(0,8)}</Tag></div>
                <p className="mt-0.5" style={{fontSize:12,color:C.muted}}>Reported by {i.by} · {fmtDate(i.date)}</p></div></div>
            <StatusBadge status={eq?.status||"Offline"}/></div>
          <div className="space-y-1.5 mb-3.5 pl-1">
            {i.answers.map((a,ix)=><div key={ix} className="flex items-start gap-2" style={{fontSize:12.5}}>
              {a?<CheckCircle2 size={14} style={{color:C.green}} className="mt-0.5 shrink-0"/>:<XCircle size={14} style={{color:C.red}} className="mt-0.5 shrink-0"/>}
              <span style={{color:a?C.faint:C.ink,fontWeight:a?400:600}}>{qs[ix]}</span></div>)}</div>
          {i.comment&&<div className="flex gap-2 p-3 rounded-lg" style={{background:C.canvas,border:`1px solid ${C.line}`}}>
            <MessageSquare size={13} style={{color:C.faint}} className="mt-0.5 shrink-0"/><p style={{fontSize:12.5,color:C.ink2,lineHeight:1.55}}>{i.comment}</p></div>}
        </Card>; })}
    </div>}
  </div>;
}

/* ═══ TICKETS PAGE ═══ */
function TicketsPage({tickets,equipment,user,onCreate,onComment,loading}){
  const [sel,setSel]=useState(null); const [draft,setDraft]=useState(""); const [tab,setTab]=useState("All");
  const canCreate=atLeast(user,"Supervisor");
  const tone={Open:C.amber,"In Progress":C.blue,"With Biomedical":C.blue,Closed:C.muted};
  const bg={Open:C.amber50,"In Progress":C.blue50,"With Biomedical":C.blue50,Closed:C.grey50};
  const shown=tab==="All"?tickets:tab==="Active"?tickets.filter(t=>t.status!=="Closed"):tickets.filter(t=>t.status==="Closed");
  return <div>
    <PageHead crumbs={["Operations","Maintenance"]} eyebrow="Fault escalation" title="Maintenance tickets"
      desc="Raised by supervisors and routed to Biomedical Engineering."
      action={canCreate?<Button size="sm" icon={Plus} onClick={onCreate}>New ticket</Button>
        :<span className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{background:C.canvas,border:`1px solid ${C.line}`,fontSize:12,color:C.muted}}><Lock size={12}/> Supervisors raise tickets</span>}/>
    {!canCreate&&<Card className="p-4 mb-5" style={{background:C.blue50,borderColor:C.blue100}}>
      <div className="flex gap-3"><Info size={17} style={{color:C.blue}} className="mt-0.5 shrink-0"/>
        <p style={{fontSize:13,color:"#0B4C90",lineHeight:1.6}}>Report faults through the daily inspection. A supervisor reviews every failed check and raises the maintenance ticket from there.</p></div></Card>}
    <div className="mb-5"><Segmented value={tab} onChange={setTab} options={[
      {value:"All",label:"All",count:tickets.length},{value:"Active",label:"Active",count:tickets.filter(t=>t.status!=="Closed").length},
      {value:"Closed",label:"Closed",count:tickets.filter(t=>t.status==="Closed").length}]}/></div>
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 space-y-3">
        {loading?[0,1,2].map(i=><Card key={i} className="p-4"><Skeleton w="30%" h={11}/><Skeleton w="70%" h={15} className="mt-2.5"/><Skeleton h={10} className="mt-3"/></Card>)
        :shown.map((t,i)=>{ const eq=equipment.find(e=>e.id===t.equipId); const on=sel?.id===t.id;
          return <Card key={t.id} hover className="p-4 cursor-pointer" style={{borderColor:on?C.blue:undefined,boxShadow:on?`0 0 0 3px ${C.blue50}`:undefined,animation:`fadeRise .45s ${EASE} both`,animationDelay:`${i*45}ms`}} onClick={()=>setSel(t)}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap mb-1.5"><Tag tone="blue">{t.id}</Tag><Priority value={t.priority}/></div>
                <h3 style={{fontSize:14,fontWeight:700,color:C.ink,letterSpacing:"-.01em"}}>{t.problem}</h3>
                <p className="mt-1 flex items-center gap-1.5 flex-wrap" style={{fontSize:12,color:C.muted}}>
                  <span style={{fontWeight:600}}>{eq?.name}</span><span style={{color:C.faint}}>·</span>{t.createdBy}<span style={{color:C.faint}}>·</span><span style={{fontFamily:mono}}>{fmtShort(t.date)}</span></p></div>
              <span className="px-2 py-1 rounded shrink-0" style={{background:bg[t.status],color:tone[t.status],fontSize:11.5,fontWeight:600}}>{t.status}</span></div>
            <p style={{fontSize:12.5,color:C.muted,lineHeight:1.55,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{t.description}</p>
            {t.comments.length>0&&<div className="flex items-center gap-1.5 mt-2.5 pt-2.5" style={{borderTop:`1px solid ${C.line}`,fontSize:11.5,color:C.faint}}>
              <MessageSquare size={12}/> {t.comments.length} {t.comments.length===1?"comment":"comments"}</div>}
          </Card>; })}
      </div>
      <div className="lg:col-span-2">
        {sel?<Card className="p-5 sticky top-20" style={{animation:`fadeRise .35s ${EASE}`}}>
          <div className="flex items-center justify-between mb-3"><Tag tone="blue">{sel.id}</Tag>
            <button onClick={()=>setSel(null)} className="p-1 rounded" style={{color:C.faint}}><X size={16}/></button></div>
          <h3 style={{fontSize:16,fontWeight:700,color:C.ink,letterSpacing:"-.015em"}}>{sel.problem}</h3>
          <div className="flex gap-2 mt-2.5 mb-4"><Priority value={sel.priority}/>
            <span className="px-2 py-0.5 rounded" style={{background:bg[sel.status],color:tone[sel.status],fontSize:11.5,fontWeight:600}}>{sel.status}</span></div>
          <dl className="space-y-2.5 mb-4 pb-4" style={{borderBottom:`1px solid ${C.line}`}}>
            {[["Equipment",equipment.find(e=>e.id===sel.equipId)?.name],["Raised by",sel.createdBy],["Date",fmtDate(sel.date)]].map(([k,v])=>
              <div key={k} className="flex justify-between gap-2" style={{fontSize:12.5}}><dt style={{color:C.faint}}>{k}</dt><dd style={{color:C.ink,fontWeight:500}}>{v}</dd></div>)}</dl>
          <p className="mb-5" style={{fontSize:13,color:C.ink2,lineHeight:1.65}}>{sel.description}</p>
          <div className="mb-2.5" style={{fontSize:10.5,fontWeight:700,color:C.muted,letterSpacing:".07em",textTransform:"uppercase"}}>Activity ({sel.comments.length})</div>
          <div className="space-y-2.5 mb-4">
            {sel.comments.length===0&&<p style={{fontSize:12.5,color:C.faint}}>No comments yet.</p>}
            {sel.comments.map((c,i)=><div key={i} className="flex gap-2.5"><Avatar name={c.by} size={26}/>
              <div className="flex-1 min-w-0 p-2.5 rounded-lg" style={{background:C.canvas}}>
                <div className="flex justify-between items-baseline gap-2 mb-1"><span style={{fontSize:12,fontWeight:700,color:C.ink}}>{c.by}</span><span style={{fontFamily:mono,fontSize:10.5,color:C.faint}}>{c.at}</span></div>
                <p style={{fontSize:12.5,color:C.ink2,lineHeight:1.5}}>{c.text}</p></div></div>)}</div>
          {atLeast(user,"Supervisor")?<div className="flex gap-2">
            <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Add a comment" style={{...inputStyle,height:36}}/>
            <Button size="sm" icon={Send} disabled={!draft.trim()} onClick={()=>{onComment(sel.id,draft);setSel({...sel,comments:[...sel.comments,{by:user.name,at:"now",text:draft}]});setDraft("");}}/>
          </div>:<p style={{fontSize:11.5,color:C.faint}}>Comments are restricted to supervisors and above.</p>}
        </Card>
        :<Card><Empty icon={FileText} title="Select a ticket" body="Choose a ticket to read the full description, repair history and comments."/></Card>}
      </div>
    </div>
  </div>;
}

/* ═══ REPORTS PAGE ═══ */
function ReportsPage({equipment,tickets,user,loading}){
  const [range,setRange]=useState("30d");
  const byStatus=["Available","In Use","Reserved","Maintenance","Offline"]
    .map(s=>({name:s,value:equipment.filter(e=>e.status===s).length,fill:STATUS[s].dot})).filter(d=>d.value>0);
  const pct=equipment.length?Math.round((equipment.filter(e=>e.lastInspection===todayStr()).length/equipment.length)*100):0;
  return <div>
    <PageHead crumbs={["Insights","Reports"]} eyebrow="Department analytics" title="Reports"
      desc="Utilisation, compliance and downtime across the radiology asset register."
      action={<div className="flex gap-2">
        <Segmented size="sm" value={range} onChange={setRange} options={[{value:"7d",label:"7d"},{value:"30d",label:"30d"},{value:"90d",label:"90d"}]}/>
        <Button variant="secondary" size="sm" icon={Download}>Export PDF</Button></div>}/>
    {atLeast(user,"Manager")&&<Card className="p-3.5 mb-5" style={{background:C.blue50,borderColor:C.blue100}}>
      <div className="flex items-center gap-3"><Building2 size={16} style={{color:C.blue}}/>
        <p style={{fontSize:12.5,color:"#0B4C90"}}>Viewing <strong>King Abdulaziz Medical City</strong>. {user.role==="Operations"?"All imaging modalities are in scope.":"Switch facility from Settings to compare sites."}</p></div></Card>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      <StatCard label="Compliance" value={pct} suffix="%" tone={C.green} trend={3} sub="Inspected today" loading={loading} delay={0}/>
      <StatCard label="Downtime" value={47} suffix="h" tone={C.amber} trend={-14} sub="July to date" loading={loading} delay={45}/>
      <StatCard label="Open tickets" value={tickets.filter(t=>t.status!=="Closed").length} tone={C.red} sub="All assets" loading={loading} delay={90}/>
      <StatCard label="Mean repair" value={3} suffix=".2d" tone={C.ink} sub="Last 90 days" trend={-9} loading={loading} delay={135}/>
    </div>
    <div className="grid lg:grid-cols-2 gap-5 mb-5">
      <Card className="p-5"><SubHead title="Equipment utilisation" desc="Active session hours this week"/>
        <div style={{height:250}}><ResponsiveContainer width="100%" height="100%">
          <BarChart data={UTILISATION} margin={{top:4,right:4,left:-22,bottom:0}}>
            <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:C.faint,fontFamily:mono}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:C.faint,fontFamily:mono}} axisLine={false} tickLine={false}/>
            <Tooltip content={<ChartTip unit="hours" name="Session time"/>} cursor={{fill:C.canvas}}/>
            <Bar dataKey="hours" radius={[4,4,0,0]} animationDuration={800}>
              {UTILISATION.map((d,i)=><Cell key={i} fill={d.hours>35?C.blueDeep:C.blue}/>)}</Bar>
          </BarChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><SubHead title="Inspection compliance" desc="Weekly completion rate"/>
        <div style={{height:250}}><ResponsiveContainer width="100%" height="100%">
          <LineChart data={COMPLIANCE} margin={{top:4,right:4,left:-22,bottom:0}}>
            <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false}/>
            <XAxis dataKey="week" tick={{fontSize:10,fill:C.faint,fontFamily:mono}} axisLine={false} tickLine={false}/>
            <YAxis domain={[80,100]} tick={{fontSize:10,fill:C.faint,fontFamily:mono}} axisLine={false} tickLine={false}/>
            <Tooltip content={<ChartTip unit="%" name="Compliance"/>} cursor={{stroke:C.lineStrong,strokeDasharray:"3 3"}}/>
            <Line type="monotone" dataKey="pct" stroke={C.green} strokeWidth={2.5}
              dot={{r:3,fill:C.paper,stroke:C.green,strokeWidth:2}} activeDot={{r:5,fill:C.green,stroke:C.paper,strokeWidth:2}} animationDuration={900}/>
          </LineChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><SubHead title="Downtime" desc="Hours out of service by month"/>
        <div style={{height:230}}><ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DOWNTIME} margin={{top:4,right:4,left:-22,bottom:0}}>
            <defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.amber} stopOpacity={.28}/><stop offset="100%" stopColor={C.amber} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false}/>
            <XAxis dataKey="month" tick={{fontSize:10,fill:C.faint,fontFamily:mono}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:C.faint,fontFamily:mono}} axisLine={false} tickLine={false}/>
            <Tooltip content={<ChartTip unit="hours" name="Downtime"/>} cursor={{stroke:C.lineStrong,strokeDasharray:"3 3"}}/>
            <Area type="monotone" dataKey="hours" stroke={C.amber} strokeWidth={2.2} fill="url(#gd)" animationDuration={900}/>
          </AreaChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><SubHead title="Fleet status" desc="Current distribution across the register"/>
        <div className="flex items-center gap-4">
          <div style={{height:200,flex:1}}><ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3} animationDuration={800}>
              {byStatus.map((d,i)=><Cell key={i} fill={d.fill} stroke={C.paper} strokeWidth={2}/>)}</Pie>
              <Tooltip content={<ChartTip unit="assets"/>}/></PieChart></ResponsiveContainer></div>
          <div className="space-y-2 pr-2">{byStatus.map(d=><div key={d.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{background:d.fill}}/>
            <span className="flex-1" style={{fontSize:12,color:C.muted}}>{d.name}</span>
            <span style={{fontFamily:mono,fontSize:12.5,fontWeight:700,color:C.ink}}>{d.value}</span></div>)}</div>
        </div></Card>
    </div>
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:`1px solid ${C.line}`}}>
        <div><h3 style={{fontSize:14.5,fontWeight:700,color:C.ink}}>Maintenance history</h3>
          <p className="mt-0.5" style={{fontSize:12.5,color:C.muted}}>All tickets raised in the current period</p></div>
        <Button variant="secondary" size="sm" icon={Download}>CSV</Button></div>
      <DataTable rows={tickets} columns={[
        {key:"id",label:"Ticket",sortable:true,render:r=><Tag tone="blue">{r.id}</Tag>},
        {key:"equipId",label:"Asset",sortable:true,render:r=><span style={{fontWeight:500}}>{equipment.find(e=>e.id===r.equipId)?.name}</span>},
        {key:"problem",label:"Problem",sortable:true},
        {key:"priority",label:"Priority",sortable:true,render:r=><Priority value={r.priority}/>},
        {key:"status",label:"Status",sortable:true,render:r=><span style={{color:C.muted,fontSize:12.5}}>{r.status}</span>},
        {key:"date",label:"Raised",sortable:true,render:r=><span style={{fontFamily:mono,fontSize:12.5,color:C.muted}}>{fmtShort(r.date)}</span>},
      ]}/>
    </Card>
  </div>;
}

/* ═══ USERS PAGE ═══ */
function UsersPage({users,current,loading}){
  const [q,setQ]=useState("");
  const shown=q.trim()?users.filter(u=>u.name.toLowerCase().includes(q.toLowerCase())||u.role.toLowerCase().includes(q.toLowerCase())):users;
  const roleTone={Technologist:C.blue,Supervisor:C.green,Manager:C.amber,Operations:C.red};
  return <div>
    <PageHead crumbs={["Administration","Users"]} eyebrow="Access control" title="Users"
      desc={`${users.length} staff with access to this facility.`}
      action={<Button size="sm" icon={Plus}>Add user</Button>}/>
    <div className="mb-4" style={{maxWidth:300}}>
      <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.faint}}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or role" style={{...inputStyle,paddingLeft:33,height:36}}/></div>
    </div>
    <Card className="overflow-hidden">
      {loading?<div className="p-6 space-y-4">{[0,1,2,3,4].map(i=><div key={i} className="flex items-center gap-3">
        <Skeleton w={38} h={38} r={19}/><div className="flex-1"><Skeleton w="40%" h={13}/><Skeleton w="25%" h={10} className="mt-1.5"/></div>
        <Skeleton w={80} h={22} r={6}/></div>)}</div>
      :<DataTable rows={shown} empty={<Empty icon={UsersIcon} title="No users match" body="Try a different name or role."/>} columns={[
        {key:"name",label:"Name",sortable:true,render:u=><div className="flex items-center gap-2.5">
          <Avatar name={u.name} size={34} tone={current&&u.id===current.id?C.blue:undefined}/>
          <div><div className="flex items-center gap-1.5"><span style={{fontWeight:600}}>{u.name}</span>
            {current&&u.id===current.id&&<span className="px-1.5 rounded" style={{background:C.blue50,color:C.blue,fontSize:10,fontWeight:700}}>You</span>}</div>
            <div style={{fontFamily:mono,fontSize:11,color:C.faint}}>{u.id}</div></div></div>},
        {key:"badge",label:"Badge",sortable:true,render:u=><span style={{fontFamily:mono,fontSize:12.5,color:C.muted}}>{u.badge}</span>},
        {key:"role",label:"Role",sortable:true,render:u=><span className="px-2 py-0.5 rounded" style={{background:`${roleTone[u.role]}14`,color:roleTone[u.role],fontSize:11.5,fontWeight:600}}>{u.role}</span>},
        {key:"department",label:"Department",sortable:true,render:u=><span style={{color:C.muted}}>{u.department}</span>},
        {key:"shift",label:"Shift",render:u=><span style={{fontSize:12.5,color:C.muted}}>{u.shift}</span>},
        {key:"status",label:"Status",render:u=><span className="inline-flex items-center gap-1.5" style={{color:C.green,fontSize:12.5,fontWeight:600}}>
          <span className="w-1.5 h-1.5 rounded-full" style={{background:C.green}}/>{u.status}</span>},
        {key:"act",label:"",width:40,render:()=><MoreVertical size={15} style={{color:C.faint}}/>},
      ]}/>}
    </Card>
  </div>;
}

/* ═══ SETTINGS PAGE ═══ */
function SettingsPage({user}){
  const [notif,setNotif]=useState({inspection:true,tickets:true,ppm:true,qc:false});
  const [tab,setTab]=useState("profile");
  const Toggle=({on,onClick})=><button onClick={onClick} className="relative rounded-full shrink-0"
    style={{width:40,height:23,background:on?C.blue:"#C3D0DE",transition:`background .24s ${EASE}`}}>
    <span className="absolute rounded-full bg-white" style={{width:19,height:19,top:2,left:on?19:2,boxShadow:"0 1px 3px rgba(0,0,0,.25)",transition:`left .24s ${EASE}`}}/></button>;
  return <div>
    <PageHead crumbs={["Administration","Settings"]} eyebrow="Preferences" title="Settings" desc="Manage your profile, alerts and session rules."/>
    <div className="mb-5"><Segmented value={tab} onChange={setTab} options={[
      {value:"profile",label:"Profile"},{value:"notifications",label:"Notifications"},{value:"sessions",label:"Sessions"},{value:"about",label:"About"}]}/></div>
    <div className="max-w-3xl space-y-5">
      {tab==="profile"&&<Card className="p-5" style={{animation:`fadeRise .35s ${EASE}`}}>
        <div className="flex items-center gap-4 mb-5 pb-5" style={{borderBottom:`1px solid ${C.line}`}}>
          <Avatar name={user.name} size={56}/><div>
            <div style={{fontSize:16,fontWeight:700,color:C.ink}}>{user.name}</div>
            <div style={{fontSize:13,color:C.muted}}>{user.role} · {user.department}</div></div>
          <Button variant="secondary" size="sm" className="ml-auto">Change photo</Button></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name"><input defaultValue={user.name} style={inputStyle}/></Field>
          <Field label="Badge number"><input defaultValue={user.badge} style={{...inputStyle,fontFamily:mono}}/></Field>
          <Field label="Email"><input defaultValue={user.email} style={inputStyle}/></Field>
          <Field label="Department"><input defaultValue={user.department} style={inputStyle}/></Field>
          <Field label="Shift pattern"><input defaultValue={user.shift} style={inputStyle}/></Field>
          <Field label="Role" hint="Roles are assigned by a manager."><input defaultValue={user.role} disabled style={{...inputStyle,background:C.canvas,color:C.faint}}/></Field>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-5" style={{borderTop:`1px solid ${C.line}`}}>
          <Button variant="secondary" size="sm">Cancel</Button><Button size="sm">Save changes</Button></div>
      </Card>}
      {tab==="notifications"&&<Card className="p-5" style={{animation:`fadeRise .35s ${EASE}`}}>
        <SubHead title="Notifications" desc="Choose what DRIS sends you."/>
        <div>{[["inspection","Inspection due","Alerts when an asset has not been inspected by the start of a shift."],
          ["tickets","Ticket updates","Status changes and comments on tickets you raised."],
          ["ppm","Planned maintenance","Reminders 14 days before a scheduled PPM."],
          ["qc","Quality control","Notices when Medical Physics schedules or completes QC."]].map(([k,t,b],i)=>
          <div key={k} className="flex items-start justify-between gap-5 py-3.5" style={{borderBottom:i<3?`1px solid ${C.line}`:"none"}}>
            <div><div style={{fontSize:13.5,fontWeight:600,color:C.ink}}>{t}</div>
              <div className="mt-0.5" style={{fontSize:12.5,color:C.muted,lineHeight:1.55}}>{b}</div></div>
            <Toggle on={notif[k]} onClick={()=>setNotif({...notif,[k]:!notif[k]})}/></div>)}</div>
      </Card>}
      {tab==="sessions"&&<Card className="p-5" style={{animation:`fadeRise .35s ${EASE}`}}>
        <SubHead title="NFC sessions" desc="Applies to every technologist in this department."/>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Activation window" hint="Time allowed to confirm after tapping a card."><input defaultValue="60 seconds" style={inputStyle}/></Field>
          <Field label="Concurrent sessions" hint="One machine per technologist at a time."><input defaultValue="1 per user" disabled style={{...inputStyle,background:C.canvas,color:C.faint}}/></Field>
          <Field label="Auto end after" hint="Idle sessions close automatically."><input defaultValue="4 hours" style={inputStyle}/></Field>
          <Field label="Reader mode"><select style={inputStyle}><option>NFC card + badge fallback</option><option>NFC card only</option></select></Field>
        </div>
      </Card>}
      {tab==="about"&&<Card className="p-5" style={{animation:`fadeRise .35s ${EASE}`}}>
        <div className="flex items-center gap-3 mb-5 pb-5" style={{borderBottom:`1px solid ${C.line}`}}>
          <Logo size={44}/><div><div style={{fontFamily:mono,fontSize:18,fontWeight:700,color:C.ink,letterSpacing:".08em"}}>DRIS</div>
            <div style={{fontSize:12.5,color:C.muted}}>Improve Safety. Ensure Readiness.</div></div></div>
        <dl className="space-y-3">{[["System","Daily Radiology Inspection & Equipment Management System"],["Version","2.4.1"],
          ["Domain","dris.health"],["Facility","King Abdulaziz Medical City"],
          ["Operator","Ministry of National Guard Health Affairs"],["Support","ext. 4417 · imaging.support@ngha.med.sa"]].map(([k,v])=>
          <div key={k} className="flex justify-between gap-6" style={{fontSize:13}}>
            <dt style={{color:C.faint}}>{k}</dt><dd className="text-right" style={{color:C.ink,fontWeight:500}}>{v}</dd></div>)}</dl>
      </Card>}
    </div>
  </div>;
}

/* ═══ NFC MODAL ═══ */
function NfcModal({open,equip,user,onClose,onConfirm}){
  const [phase,setPhase]=useState("tap"); const [left,setLeft]=useState(60);
  useEffect(()=>{ if(!open) return; setPhase("tap"); setLeft(60);
    const t=setTimeout(()=>setPhase("confirm"),1500); return ()=>clearTimeout(t); },[open,equip?.id]);
  useEffect(()=>{ if(phase!=="confirm") return; if(left<=0){setPhase("expired");return;}
    const t=setTimeout(()=>setLeft(l=>l-1),1000); return ()=>clearTimeout(t); },[phase,left]);
  if(!open||!equip) return null;
  return <Modal open={open} onClose={onClose} icon={Nfc} title="Start session" subtitle={`${equip.name} · ${equip.tag}`}
    footer={phase==="confirm"?<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={CheckCircle2} onClick={onConfirm}>Activate session</Button></>
      :phase==="expired"?<><Button variant="secondary" onClick={onClose}>Close</Button><Button icon={RefreshCw} onClick={()=>{setLeft(60);setPhase("confirm");}}>Tap again</Button></>
      :null}>
    {phase==="tap"&&<div className="flex flex-col items-center py-10">
      <div className="relative mb-6">{[0,1,2].map(i=><span key={i} className="absolute inset-0 rounded-full" style={{background:C.blue50,animation:`ping 2s cubic-bezier(0,0,.2,1) ${i*.5}s infinite`}}/>)}
        <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{background:C.blue50,border:`1px solid ${C.blue100}`}}><Nfc size={38} style={{color:C.blue}} strokeWidth={1.8}/></div></div>
      <p style={{fontSize:14.5,fontWeight:600,color:C.ink}}>Hold your card against the reader</p>
      <p className="mt-1.5" style={{fontSize:13,color:C.muted}}>Reading badge…</p></div>}
    {phase==="confirm"&&<div style={{animation:`fadeRise .3s ${EASE}`}}>
      <div className="flex items-center gap-3 p-3.5 rounded-xl mb-4" style={{background:C.green50,border:`1px solid #C8E6D5`}}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:"#CFEBDC"}}><CheckCircle2 size={18} style={{color:C.green}}/></div>
        <div><div style={{fontSize:13.5,fontWeight:700,color:"#0C5C36"}}>Card recognised</div>
          <div style={{fontSize:12.5,color:C.green}}>{user.name} · Badge {user.badge}</div></div></div>
      <div className="flex items-center gap-4 p-4 rounded-xl mb-4" style={{background:C.canvas,border:`1px solid ${C.line}`}}>
        <div className="relative shrink-0"><CountRing value={left} total={60} size={54}/>
          <span className="absolute inset-0 flex items-center justify-center" style={{fontFamily:mono,fontSize:15,fontWeight:700,color:left<=15?C.red:C.ink}}>{left}</span></div>
        <div><div style={{fontSize:13.5,fontWeight:600,color:C.ink}}>Confirm within {left} seconds</div>
          <div className="mt-0.5" style={{fontSize:12.5,color:C.muted,lineHeight:1.5}}>The request expires if it is not activated in time.</div></div></div>
      <dl className="space-y-2.5">{[["Equipment",equip.name],["Asset tag",equip.tag],["Location",equip.dept],["Model",equip.model]].map(([k,v])=>
        <div key={k} className="flex justify-between gap-3" style={{fontSize:13}}><dt style={{color:C.faint}}>{k}</dt>
          <dd style={{color:C.ink,fontWeight:500,fontFamily:k==="Asset tag"?mono:sans}}>{v}</dd></div>)}</dl></div>}
    {phase==="expired"&&<div className="flex flex-col items-center py-10 text-center" style={{animation:`fadeRise .3s ${EASE}`}}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{background:C.red50}}><Clock size={28} style={{color:C.red}}/></div>
      <p style={{fontSize:14.5,fontWeight:600,color:C.ink}}>The activation window closed</p>
      <p className="mt-1.5 max-w-xs" style={{fontSize:13,color:C.muted,lineHeight:1.6}}>Sessions must be confirmed within 60 seconds of the card being read. Tap again to restart.</p></div>}
  </Modal>;
}

/* ═══ INSPECTION MODAL ═══ */
function InspectionModal({open,equip,user,onClose,onSubmit}){
  const qs=equip?.kind==="Portable"?PORTABLE_Q:ROOM_Q;
  const [ans,setAns]=useState([null,null,null]); const [comment,setComment]=useState("");
  useEffect(()=>{ if(open){setAns([null,null,null]);setComment("");} },[open,equip?.id]);
  if(!open||!equip) return null;
  const done=ans.filter(a=>a!==null).length; const complete=done===3; const anyNo=ans.some(a=>a===false);
  return <Modal open={open} onClose={onClose} icon={ClipboardCheck} title="Daily inspection" subtitle={`${equip.name} · ${equip.tag}`} width="max-w-xl"
    footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!complete} onClick={()=>onSubmit(equip,ans,comment)}>Submit inspection</Button></>}>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{background:C.canvas,border:`1px solid ${C.line}`}}>
        <div className="flex items-center gap-2.5"><Avatar name={user.name} size={30}/>
          <div><div style={{fontSize:12.5,fontWeight:600,color:C.ink}}>{user.name}</div><div style={{fontSize:11.5,color:C.muted}}>{fmtDate(todayStr())}</div></div></div>
        <div className="text-right"><div style={{fontFamily:mono,fontSize:13,fontWeight:700,color:complete?C.green:C.muted}}>{done}/3</div><div style={{fontSize:11,color:C.faint}}>answered</div></div>
      </div>
      {qs.map((q,i)=><div key={i} className="p-4 rounded-xl" style={{border:`1px solid ${ans[i]===false?"#F5C6C0":C.line}`,background:ans[i]===false?C.red50:C.paper,transition:`all .25s ${EASE}`}}>
        <div className="flex gap-2.5 mb-3">
          <span className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
            style={{fontFamily:mono,fontSize:11,fontWeight:700,background:ans[i]!==null?C.blue:C.sunken,color:ans[i]!==null?"#fff":C.muted,transition:`all .25s ${EASE}`}}>{i+1}</span>
          <p style={{fontSize:13.5,fontWeight:600,color:C.ink,lineHeight:1.5}}>{q}</p></div>
        <div className="flex gap-2" style={{paddingLeft:34}}>
          {[["Yes",true],["No",false]].map(([label,val])=>{ const on=ans[i]===val; const good=val===true;
            return <button key={label} onClick={()=>{const n=[...ans];n[i]=val;setAns(n);}} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg font-semibold"
              style={{height:38,fontSize:13,background:on?(good?C.green50:C.red50):C.paper,color:on?(good?C.green:C.red):C.muted,border:`1.5px solid ${on?(good?C.green:C.red):C.line}`,transition:`all .2s ${EASE}`}}>
              {on?(good?<CheckCircle2 size={15}/>:<XCircle size={15}/>):<Circle size={15} style={{opacity:.4}}/>}{label}</button>; })}</div>
      </div>)}
      {anyNo&&<div className="p-4 rounded-xl" style={{background:C.red50,border:`1px solid #F5C6C0`,animation:`fadeRise .3s ${EASE}`}}>
        <div className="flex gap-2.5 mb-2.5"><AlertTriangle size={16} style={{color:C.red}} className="mt-0.5 shrink-0"/>
          <div><p style={{fontSize:13,fontWeight:700,color:"#8A1C13"}}>Describe the fault</p>
            <p className="mt-0.5" style={{fontSize:12.5,color:"#A3352B",lineHeight:1.5}}>A supervisor reviews this before raising a maintenance ticket.</p></div></div>
        <textarea rows={3} value={comment} onChange={e=>setComment(e.target.value)}
          placeholder="What is wrong with the equipment?" style={{...inputStyle,resize:"vertical"}}/></div>}
    </div>
  </Modal>;
}

/* ═══ TICKET MODAL ═══ */
function TicketModal({open,equipment,user,onClose,onSubmit}){
  const [f,setF]=useState({equipId:"",problem:"",priority:"Medium",description:""});
  useEffect(()=>{ if(open) setF({equipId:equipment[0]?.id||"",problem:"",priority:"Medium",description:""}); },[open]);
  if(!open) return null;
  const valid=f.equipId&&f.problem.trim()&&f.description.trim();
  return <Modal open={open} onClose={onClose} icon={Wrench} title="New maintenance ticket" subtitle="Routed to Biomedical Engineering" width="max-w-xl"
    footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={Send} disabled={!valid} onClick={()=>onSubmit(f)}>Submit ticket</Button></>}>
    <div className="space-y-4">
      <Field label="Equipment" required><select value={f.equipId} onChange={e=>setF({...f,equipId:e.target.value})} style={inputStyle}>
        {equipment.map(e=><option key={e.id} value={e.id}>{e.name} — {e.tag}</option>)}</select></Field>
      <Field label="Problem" required><input value={f.problem} onChange={e=>setF({...f,problem:e.target.value})} placeholder="Short summary of the fault" style={inputStyle}/></Field>
      <Field label="Priority"><div className="grid grid-cols-4 gap-2">
        {["Low","Medium","High","Critical"].map(p=>{ const on=f.priority===p; const cols={Low:C.muted,Medium:C.blue,High:C.amber,Critical:C.red};
          return <button key={p} onClick={()=>setF({...f,priority:p})} className="rounded-lg font-semibold"
            style={{height:38,fontSize:12.5,background:on?`${cols[p]}12`:C.paper,color:on?cols[p]:C.muted,border:`1.5px solid ${on?cols[p]:C.line}`,transition:`all .2s ${EASE}`}}>{p}</button>; })}</div></Field>
      <Field label="Description" required hint="Include fault codes, when it started and any steps already taken.">
        <textarea rows={4} value={f.description} onChange={e=>setF({...f,description:e.target.value})} placeholder="Describe the fault in detail" style={{...inputStyle,resize:"vertical"}}/></Field>
      <div className="flex items-center justify-between p-3 rounded-xl" style={{background:C.canvas,border:`1px solid ${C.line}`}}>
        <span style={{fontSize:12.5,color:C.faint}}>Raised by</span>
        <span className="flex items-center gap-2"><Avatar name={user.name} size={24}/>
          <span style={{fontSize:12.5,color:C.ink,fontWeight:500}}>{user.name} · {fmtShort(todayStr())}</span></span></div>
    </div>
  </Modal>;
}

/* ═══ EQUIPMENT DRAWER ═══ */
function EquipmentDrawer({equip,inspections,tickets,onClose,onStart,canStart}){
  const [tab,setTab]=useState("overview");
  useEffect(()=>{ if(equip) setTab("overview"); },[equip?.id]);
  if(!equip) return null;
  const history=inspections.filter(i=>i.equipId===equip.id);
  const eqTickets=tickets.filter(t=>t.equipId===equip.id);
  const qs=equip.kind==="Portable"?PORTABLE_Q:ROOM_Q;
  const s=STATUS[equip.status];
  return <div className="fixed inset-0 z-50 flex justify-end" style={{background:"rgba(13,31,51,.45)",backdropFilter:"blur(2px)",animation:`fadeIn .2s ${EASE}`}} onClick={onClose}>
    <div className="w-full max-w-md h-full overflow-y-auto" style={{background:C.paper,boxShadow:E.e4,animation:`slideLeft .34s ${EASE}`}} onClick={e=>e.stopPropagation()}>
      <div style={{height:4,background:s.dot}}/>
      <div className="sticky top-0 z-10 px-5 py-4" style={{background:"rgba(255,255,255,.92)",backdropFilter:"blur(10px)",borderBottom:`1px solid ${C.line}`}}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:s.bg,border:`1px solid ${s.dot}22`}}>
              {equip.kind==="Portable"?<Truck size={20} style={{color:s.fg}}/>:<DoorOpen size={20} style={{color:s.fg}}/>}</div>
            <div className="min-w-0">
              <h3 className="truncate" style={{fontSize:16,fontWeight:700,color:C.ink,letterSpacing:"-.015em"}}>{equip.name}</h3>
              <div className="flex items-center gap-1.5 mt-1"><Tag>{equip.tag}</Tag><StatusBadge status={equip.status}/></div></div></div>
          <button onClick={onClose} className="p-1.5 rounded-lg shrink-0" style={{color:C.faint}}><X size={17}/></button></div>
        <div className="mt-3.5"><Segmented size="sm" value={tab} onChange={setTab} options={[{value:"overview",label:"Overview"},{value:"checks",label:"Checks",count:history.length},{value:"tickets",label:"Tickets",count:eqTickets.length}]}/></div>
      </div>
      <div className="p-5 space-y-5">
        {tab==="overview"&&<div className="space-y-5" style={{animation:`fadeRise .3s ${EASE}`}}>
          <div className="grid grid-cols-2 gap-3">
            {[["Exposures",equip.exposures||"—","this month"],["Uptime",equip.uptime?`${equip.uptime}%`:"—","last 30 days"]].map(([l,v,s2])=>
              <div key={l} className="p-3.5 rounded-xl" style={{background:C.canvas,border:`1px solid ${C.line}`}}>
                <div style={{fontSize:10.5,fontWeight:700,color:C.faint,letterSpacing:".06em",textTransform:"uppercase"}}>{l}</div>
                <div className="mt-1.5" style={{fontFamily:mono,fontSize:20,fontWeight:700,color:C.ink}}>{v}</div>
                <div style={{fontSize:11,color:C.faint}}>{s2}</div></div>)}</div>
          {equip.battery!==null&&<div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5" style={{fontSize:12.5,color:C.muted,fontWeight:500}}><Battery size={14}/> Detector charge</span>
              <span style={{fontFamily:mono,fontSize:13,fontWeight:700,color:equip.battery<25?C.red:C.ink}}>{equip.battery}%</span></div>
            <Progress value={equip.battery} tone={equip.battery<25?C.red:equip.battery<50?C.amber:C.green} height={6}/></div>}
          <div><div className="mb-2.5" style={{fontSize:10.5,fontWeight:700,color:C.muted,letterSpacing:".07em",textTransform:"uppercase"}}>Asset record</div>
            <dl className="space-y-2.5">{[["Model",equip.model],["Serial",equip.serial],["Location",equip.dept],
              ["Operator",equip.user||"Unassigned"],["Last inspection",fmtDate(equip.lastInspection)],
              ["Next PPM",fmtDate(equip.nextPPM)],["Next QC",fmtDate(equip.nextQC)]].map(([k,v])=>
              <div key={k} className="flex justify-between gap-3" style={{fontSize:13}}><dt style={{color:C.faint}}>{k}</dt>
                <dd className="text-right" style={{color:v==="Unassigned"?C.faint:C.ink,fontWeight:500,fontFamily:k==="Serial"?mono:sans}}>{v}</dd></div>)}</dl></div>
          {equip.status==="Available"&&<Button icon={Nfc} full disabled={!canStart} onClick={()=>{onStart(equip);onClose();}}>
            {canStart?"Start session":"Another session is active"}</Button>}
        </div>}
        {tab==="checks"&&<div style={{animation:`fadeRise .3s ${EASE}`}}>
          {history.length===0?<Empty icon={History} title="No inspections yet" body="This asset has not been checked in the current record window."/>
          :<div className="space-y-2.5">{history.slice().reverse().map(h=>{ const pass=h.answers.every(Boolean);
            return <div key={h.id} className="p-3.5 rounded-xl" style={{background:pass?C.canvas:C.red50,border:`1px solid ${pass?C.line:"#F5C6C0"}`}}>
              <div className="flex justify-between items-center mb-1.5"><span style={{fontSize:13,fontWeight:600,color:C.ink}}>{fmtDate(h.date)}</span>
                <span className="inline-flex items-center gap-1" style={{fontSize:11.5,fontWeight:700,color:pass?C.green:C.red}}>{pass?<CheckCircle2 size={12}/>:<XCircle size={12}/>}{pass?"Passed":"Fault"}</span></div>
              <p className="mb-1.5" style={{fontSize:11.5,color:C.faint}}>{h.by}</p>
              {!pass&&h.answers.map((a,i)=>!a&&<p key={i} style={{fontSize:12,color:C.red}}>· {qs[i]}</p>)}
              {h.comment&&<p className="mt-1.5" style={{fontSize:12.5,color:C.ink2,lineHeight:1.5}}>{h.comment}</p>}
            </div>; })}</div>}
        </div>}
        {tab==="tickets"&&<div style={{animation:`fadeRise .3s ${EASE}`}}>
          {eqTickets.length===0?<Empty icon={Wrench} title="No tickets raised" body="This asset has no maintenance history in the current period."/>
          :<div className="space-y-2.5">{eqTickets.map(t=><div key={t.id} className="p-3.5 rounded-xl" style={{border:`1px solid ${C.line}`}}>
            <div className="flex items-center gap-2 mb-1.5"><Tag tone="blue">{t.id}</Tag><Priority value={t.priority}/></div>
            <p style={{fontSize:13.5,fontWeight:600,color:C.ink}}>{t.problem}</p>
            <p className="mt-1" style={{fontSize:12,color:C.muted}}>{t.status} · {fmtDate(t.date)}</p></div>)}</div>}
        </div>}
      </div>
    </div>
  </div>;
}

/* ═══ TOASTS ═══ */
function Toasts({items,onDismiss}){
  const tones={success:[C.green,CheckCircle2],error:[C.red,XCircle],info:[C.blue,Info]};
  return <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
    {items.map(t=>{ const [col,Icon]=tones[t.tone]||tones.info;
      return <div key={t.id} className="flex items-center gap-2.5 pl-3.5 pr-2.5 py-2.5 rounded-xl"
        style={{background:C.ink,boxShadow:E.e4,animation:`toastIn .34s ${EASE}`,minWidth:260}}>
        <Icon size={17} style={{color:col}} className="shrink-0"/>
        <span className="flex-1" style={{fontSize:13,color:"#fff",fontWeight:500}}>{t.msg}</span>
        <button onClick={()=>onDismiss(t.id)} className="p-1 rounded" style={{color:"rgba(255,255,255,.5)"}}><X size={13}/></button>
      </div>; })}
  </div>;
}

/* ═══════════════════════════════════════════════════════════
   ROOT APP — wired to real API
   ═══════════════════════════════════════════════════════════ */
export default function App(){
  const [authed,setAuthed]=useState(!!getToken());
  const [user,setUser]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [navOpen,setNavOpen]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  const [loading,setLoading]=useState(false);
  const [bootstrapping,setBootstrapping]=useState(!!getToken());

  const [equipment,setEquipment]=useState([]);
  const [tickets,setTickets]=useState([]);
  const [inspections,setInspections]=useState([]);
  const [activity,setActivity]=useState([]);
  const [users,setUsers]=useState([]);
  const [session,setSession]=useState(null);

  const [nfcFor,setNfcFor]=useState(null);
  const [inspectFor,setInspectFor]=useState(null);
  const [ticketOpen,setTicketOpen]=useState(false);
  const [drawer,setDrawer]=useState(null);
  const [palette,setPalette]=useState(false);
  const [toasts,setToasts]=useState([]);

  const say=useCallback((msg,tone="success")=>{
    const id=Date.now()+Math.random();
    setToasts(t=>[...t,{id,msg,tone}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3600);
  },[]);
  const dismiss=id=>setToasts(t=>t.filter(x=>x.id!==id));

  // Restore session from token on first load
  useEffect(()=>{
    if(!getToken()){ setBootstrapping(false); return; }
    api.me().then(data=>{ setUser(data.user); setAuthed(true); }).catch(()=>{ clearToken(); setAuthed(false); }).finally(()=>setBootstrapping(false));
  },[]);

  // Load all data whenever page changes or after login
  const loadData=useCallback(async(currentUser)=>{
    if(!currentUser) return;
    setLoading(true);
    try{
      const [eqRes,insRes,tkRes,actRes,sesRes]=await Promise.allSettled([
        api.equipment(),api.inspections(),api.tickets(),api.activity(),api.session()
      ]);
      if(eqRes.status==="fulfilled") setEquipment(eqRes.value.equipment||[]);
      if(insRes.status==="fulfilled") setInspections(insRes.value.inspections||[]);
      if(tkRes.status==="fulfilled") setTickets(tkRes.value.tickets||[]);
      if(actRes.status==="fulfilled") setActivity(actRes.value.activity||[]);
      if(sesRes.status==="fulfilled") setSession(sesRes.value.session||null);
      // Users only for manager+
      if(atLeast(currentUser,"Manager")){
        const uRes=await api.users().catch(()=>null);
        if(uRes) setUsers(uRes.users||[]);
      }
    }finally{ setLoading(false); }
  },[]);

  useEffect(()=>{ if(authed&&user) loadData(user); },[authed,user,page]);

  // Cmd+K palette
  useEffect(()=>{
    const h=e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){ e.preventDefault(); setPalette(true); } };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[]);

  const handleSignIn=async(username,password)=>{
    const data=await api.login(username,password);
    setToken(data.token); setUser(data.user); setAuthed(true);
  };
  const handleLogout=()=>{ clearToken(); setUser(null); setAuthed(false); setEquipment([]); setTickets([]); setInspections([]); setSession(null); };

  const startSession=eq=>{ if(session){say("End your current session before starting another.","error");return;} setNfcFor(eq); };
  const confirmSession=async()=>{
    const eq=nfcFor;
    try{
      await api.startSession(eq.id);
      setSession({equipId:eq.id});
      setEquipment(l=>l.map(e=>e.id===eq.id?{...e,status:"In Use",user:user.name}:e));
      setNfcFor(null); say(`Session started on ${eq.name}.`);
      await api.activity().then(r=>setActivity(r.activity||[]));
    }catch(e){ say(e.message,"error"); }
  };
  const endSession=async()=>{
    if(!session) return;
    const eq=equipment.find(e=>e.id===session.equipId);
    try{
      await api.endSession();
      setEquipment(l=>l.map(e=>e.id===session.equipId?{...e,status:"Available",user:null}:e));
      setSession(null); say(`Session ended on ${eq?.name}.`);
      await api.activity().then(r=>setActivity(r.activity||[]));
    }catch(e){ say(e.message,"error"); }
  };
  const submitInspection=async(eq,answers,comment)=>{
    try{
      const res=await api.submitInspection(eq.id,answers,comment);
      const newInsp=res.inspection;
      setInspections(l=>[newInsp,...l]);
      setEquipment(l=>l.map(e=>e.id===eq.id?{...e,lastInspection:todayStr()}:e));
      setInspectFor(null);
      say(newInsp.flagged?`Fault reported on ${eq.name}. A supervisor will review it.`:`${eq.name} passed all checks.`,newInsp.flagged?"error":"success");
      await api.activity().then(r=>setActivity(r.activity||[]));
    }catch(e){ say(e.message,"error"); }
  };
  const submitTicket=async(f)=>{
    try{
      const res=await api.createTicket(f);
      setTickets(l=>[res.ticket,...l]); setTicketOpen(false);
      say(`Ticket ${res.ticket.id} submitted to Biomedical Engineering.`);
      await api.activity().then(r=>setActivity(r.activity||[]));
    }catch(e){ say(e.message,"error"); }
  };
  const addComment=async(id,body)=>{
    try{
      await api.commentTicket(id,body);
      setTickets(l=>l.map(t=>t.id===id?{...t,comments:[...t.comments,{by:user.name,at:"now",text:body}]}:t));
    }catch(e){ say(e.message,"error"); }
  };

  const counts={
    inspection:equipment.filter(e=>e.lastInspection!==todayStr()&&e.status!=="Offline").length,
    tickets:tickets.filter(t=>t.status!=="Closed").length,
  };
  const visibleNav=NAV.filter(n=>user&&atLeast(user,n.min));

  if(bootstrapping) return <div className="min-h-screen flex items-center justify-center" style={{background:C.canvas,fontFamily:sans}}>
    <div className="flex flex-col items-center gap-4">
      <Logo size={52}/><div style={{fontSize:14,color:C.muted}}>Loading DRIS…</div></div></div>;

  if(!authed||!user) return <LoginPage onSignIn={handleSignIn}/>;

  return <>
    <div className="flex h-screen overflow-hidden" style={{background:C.canvas,fontFamily:sans,color:C.ink}}>
      <Sidebar page={page} setPage={setPage} user={user} open={navOpen} setOpen={setNavOpen}
        counts={counts} collapsed={collapsed} setCollapsed={setCollapsed}/>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} setUser={setUser} session={session} equipment={equipment}
          onEndSession={endSession} onMenu={()=>setNavOpen(true)} page={page}
          onSearch={()=>setPalette(true)} onLogout={handleLogout}/>
        <main key={page} className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 lg:py-6" style={{animation:`fadeRise .38s ${EASE}`}}>
          {page==="dashboard"&&<Dashboard equipment={equipment} tickets={tickets} activity={activity} user={user} session={session} onOpen={setDrawer} onStart={startSession} loading={loading} setPage={setPage}/>}
          {page==="portable"&&<EquipmentPage kind="Portable" equipment={equipment} session={session} onOpen={setDrawer} onStart={startSession} loading={loading}/>}
          {page==="rooms"&&<EquipmentPage kind="Room" equipment={equipment} session={session} onOpen={setDrawer} onStart={startSession} loading={loading}/>}
          {page==="inspection"&&<InspectionPage equipment={equipment} inspections={inspections} user={user} onInspect={setInspectFor} loading={loading}/>}
          {page==="tickets"&&<TicketsPage tickets={tickets} equipment={equipment} user={user} onCreate={()=>setTicketOpen(true)} onComment={addComment} loading={loading}/>}
          {page==="reports"&&<ReportsPage equipment={equipment} tickets={tickets} user={user} loading={loading}/>}
          {page==="users"&&<UsersPage users={users} current={user} loading={loading}/>}
          {page==="settings"&&<SettingsPage user={user}/>}
        </main>
      </div>
    </div>
    <CommandPalette open={palette} onClose={()=>setPalette(false)} equipment={equipment} tickets={tickets} onGo={p=>{setPage(p);setPalette(false);}} onOpenEquip={e=>{setDrawer(e);setPalette(false);}} nav={visibleNav}/>
    <NfcModal open={!!nfcFor} equip={nfcFor} user={user} onClose={()=>setNfcFor(null)} onConfirm={confirmSession}/>
    <InspectionModal open={!!inspectFor} equip={inspectFor} user={user} onClose={()=>setInspectFor(null)} onSubmit={submitInspection}/>
    <TicketModal open={ticketOpen} equipment={equipment} user={user} onClose={()=>setTicketOpen(false)} onSubmit={submitTicket}/>
    <EquipmentDrawer equip={drawer} inspections={inspections} tickets={tickets} onClose={()=>setDrawer(null)} onStart={startSession} canStart={!session}/>
    <Toasts items={toasts} onDismiss={dismiss}/>
  </>;
}
