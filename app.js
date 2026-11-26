/* PAUteca · lógica de la aplicación. Los contenidos están en /datos (ver datos/LEEME.md). */
const LEG='<div class="legend"><button class="tg" data-a="all">💬 Mostrar / ocultar todas las explicaciones</button><span class="hint">Toca un número para ver su bocadillo</span></div>';
const att={};const $=id=>document.getElementById(id);
/* ---------- Carga de datos (catálogo, temarios, índices y exámenes bajo demanda) ---------- */
let CAT={anios:{desde:2001,hasta:2027},asignaturas:[]},SUBJ=[];
const DB={},FULL={},LOAD={};
const SI=id=>Math.max(0,CAT.asignaturas.findIndex(a=>a.id===id));
const getJ0=u=>fetch(u).then(q=>{if(!q.ok)throw new Error(u+" → "+q.status);return q.json()});
/* window.PAQ: los exámenes se leen de paquetes por año (datos/<asig>/paquetes/AAAA.json), para el artefacto de claude.ai */
const PQ={},getJ=u=>{const m=window.PAQ&&String(u).match(/^(datos\/[^/]+\/)examenes\/((\d{4})[^/]*)\.json$/);if(!m)return getJ0(u);const b=m[1]+"paquetes/"+m[3]+".json";return(PQ[b]||(PQ[b]=getJ0(b).catch(e=>{delete PQ[b];throw e}))).then(P=>{if(!P[m[2]])throw new Error(u+" no está en "+b);return P[m[2]]})};
const clsT=L=>{const T={};(L||[]).forEach(c=>(T[c.tema]=T[c.tema]||[]).push([c.tipo,c.apartados]));return T};
function loadSubj(id){if(LOAD[id])return LOAD[id];const a=CAT.asignaturas.find(z=>z.id===id);if(!a)return Promise.reject(new Error("Asignatura desconocida: "+id));const d=a.carpeta;
 return LOAD[id]=Promise.all([getJ(d+"temario.json"),getJ(d+"formatos.json"),getJ(d+"indice.json")]).then(([tm,fm,ix])=>{
  const tys={};tm.temas.forEach(t=>{if(t.tipos&&t.tipos.length)tys[t.id]=t.tipos.map(y=>[y.id,y.nombre])});
  DB[id]={dir:d,tops:tm.temas.map(t=>({k:t.id,n:t.nombre,i:t.icono,c:t.color})),tys,fmt:fm.reglas||[],
   X:ix.examenes.map(e=>({id:e.id,year:e.anio,conv:e.convocatoria,file:d+e.archivo,ex:e.ejercicios.map(x=>({id:x.id,n:x.n,T:clsT(x.clasificacion)}))}))}}).catch(err=>{delete LOAD[id];throw err})}
function loadExam(e){const k="E:"+e.id;if(LOAD[k])return LOAD[k];
 return LOAD[k]=getJ(e.file).then(d=>{const M={};d.ejercicios.forEach(x=>{const o={id:x.id,n:x.n,b:x.bloque,pts:x.puntos,intro:x.enunciado.intro,parts:x.enunciado.apartados,sol:x.solucion.map(z=>[z.titulo,z.html]),T:clsT(x.clasificacion)};if(x.num!==undefined)o.on=x.num;M[x.id]=o});FULL[e.id]=M}).catch(err=>{delete LOAD[k];throw err})}
const fmt=e=>{const q=((DB[S.sj]||{}).fmt||[]).find(z=>z.activo!==false&&(z.convocatoria===undefined||z.convocatoria===e.conv)&&(z.desde===undefined||e.year>=z.desde)&&(z.hasta===undefined||e.year<=z.hasta));return q?`<p class="mut">${q.texto}</p>`:""};
function need(){if(S.s!=="home"&&S.sj&&!DB[S.sj])return loadSubj(S.sj);
 if(S.s==="ex"){const X=exams();if(X.length){const e=X[Math.min(S.k||0,X.length-1)];if(!FULL[e.id])return loadExam(e)}}return null}
let DT=0;
function draw(){const t=++DT;const go=()=>{if(t!==DT)return;const p=need();if(p)return p.then(go,fail);render()};return go()}
function fail(err){console.error(err);$("app").innerHTML=`<div class="top">${S.s!=="home"?'<button class="sq" data-a="back" aria-label="Volver">‹</button>':""}<div class="logo">PAU<span>teca</span></div></div><p class="mut">No se han podido cargar los datos de Pauteca. Comprueba la conexión y vuelve a intentarlo.</p>`}
function boot(){getJ("datos/catalogo.json").then(c=>{CAT=c;SUBJ=c.asignaturas.map(a=>[a.nombre,a.icono,a.color,a.activa?1:0]);draw()}).catch(fail)}

const ky=(e,x)=>x.id;
const EX=()=>(DB[S.sj]||{X:[]}).X;const SB=()=>SUBJ[SI(S.sj)];const TOPS=()=>(DB[S.sj]||{}).tops||[];const TYS=()=>(DB[S.sj]||{}).tys||{};
const typs=(e,x,t)=>((x.T||{})[t]||[]).map(z=>z[0]);
const tyAp=(e,x,t,k)=>((x.T||{})[t]||[]).filter(z=>z[0]===k).map(z=>z[1]).join(", ");
const tg=(e,x)=>Object.keys(x.T||{});
let S={s:"home"},stack=[];
function items(){return EX().filter(e=>S.m==="type"||e.year===S.y).flatMap(e=>e.ex.map(x=>({e,x}))).filter(q=>S.m==="year"||(S.m==="type"?typs(q.e,q.x,S.t).includes(S.ty):tg(q.e,q.x).includes(S.t)))}
function hasYear(y){return EX().some(e=>e.year===y&&e.ex.some(x=>S.m==="year"||tg(e,x).includes(S.t)))}
function count(k){return EX().reduce((n,e)=>n+e.ex.filter(x=>tg(e,x).includes(k)).length,0)}
function countT(t,k){return EX().reduce((n,e)=>n+e.ex.filter(x=>typs(e,x,t).includes(k)).length,0)}
const lab=(z,it)=>{const m=new Set(it.map(w=>w.e.year+w.e.conv)).size>1;return (S.m==="type"?z.e.year+" ":"")+(m||S.m==="type"?z.e.conv.replace("Reserva ","R")+" · ":"")+z.x.n};
const mt=(a,b)=>a===b||(a.length<b.length&&b.startsWith(a)&&/[-\d]/.test(b[a.length]))||(b.length<a.length&&a.startsWith(b)&&/[-\d]/.test(a[b.length]));
function toks(e,x){if(S.m==="year")return null;const L=(x.T||{})[S.t]||[],arr=S.m==="type"?L.filter(z=>z[0]===S.ty):L;const T=arr.flatMap(z=>z[1].split(/[ ,]+/)).filter(w=>/^[a-z][\w-]*$/.test(w)&&w!=="alternativa");return T.length?T:null}
const cord=c=>c==="Junio"?0:c==="Julio"?1:/^Sept/.test(c)?2:/^Modelo/.test(c)?100:/^Ponencia/.test(c)?110:10+(parseInt(c.replace(/\D/g,""))||50);
const inc=(e,x)=>S.m==="year"||(S.m==="topic"?tg(e,x).includes(S.t):typs(e,x,S.t).includes(S.ty));
function exams(){return EX().filter(e=>(S.m==="type"||e.year===S.y)&&e.ex.some(x=>inc(e,x))).sort((a,b)=>b.year-a.year||cord(a.conv)-cord(b.conv))}
const OPEN={};
function tiles(){return `<div class="tiles">`+SUBJ.map((u,i)=>`<${u[3]?'button data-a="subj" data-s="'+i+'"':'div'} class="tile${u[3]?"":" off"}" style="--c:${u[2]};--i:${i}"><span class="ti1">${u[1]}</span><b>${u[0]}</b>${u[3]?"":"<small>Próximamente</small>"}</${u[3]?"button":"div"}>`).join("")+`</div>`}
function wheel(){const cx=170,cy=170,ro=162,ri=56,R=Math.PI/180,f=v=>v.toFixed(1);
 const pt=(r,a)=>f(cx+r*Math.cos(a*R))+" "+f(cy+r*Math.sin(a*R));
 return `<svg class="wheel" viewBox="0 0 340 340" width="100%" style="max-width:380px;display:block;margin:6px auto 0">`+SUBJ.map((u,i)=>{const a0=-90+72*i+1,a1=a0+70,m=a0+35,tx=cx+108*Math.cos(m*R),ty=cy+108*Math.sin(m*R),nm=u[0].split(" ");
  return `<g ${u[3]?'data-a="subj" data-s="'+i+'"':'class="off"'}><path d="M${pt(ro,a0)} A${ro} ${ro} 0 0 1 ${pt(ro,a1)} L${pt(ri,a1)} A${ri} ${ri} 0 0 0 ${pt(ri,a0)} Z" fill="${u[2]}"/><text x="${f(tx)}" y="${f(ty-10)}" text-anchor="middle" font-size="${u[1].length>2?22:26}" fill="#fff">${u[1]}</text><text text-anchor="middle" font-size="12" font-weight="700" fill="#fff"><tspan x="${f(tx)}" y="${f(ty+12)}">${nm[0]}</tspan>${nm[1]?`<tspan x="${f(tx)}" dy="14">${nm.slice(1).join(" ")}</tspan>`:""}</text>${u[3]?"":`<text x="${f(tx)}" y="${f(ty+44)}" text-anchor="middle" font-size="9" fill="#fff" opacity=".9">Próximamente</text>`}</g>`}).join("")+`<circle cx="170" cy="170" r="52" fill="var(--card)"/><text x="170" y="166" text-anchor="middle" font-size="13" font-weight="800" fill="var(--ink)">Elige</text><text x="170" y="182" text-anchor="middle" font-size="11" fill="var(--mut)">asignatura</text></svg>`}
function block(e,x){const t0=TOPS().find(t=>t.k===tg(e,x)[0]),tp=TOPS().find(t=>t.k===S.t),c=(tp||t0||{c:SB()[2]}).c,key=ky(e,x),T=toks(e,x),op=OPEN[key];let L=0;
 const parts=x.parts.map(p=>{const m=p.match(/^([a-z][\d-][\w-]*)\)/),lb=m?m[1]:"abcdefgh"[L++];return {lb,h:m?`<p>${p}</p>`:`<p><b>${lb})</b> ${p}</p>`}}).filter(o=>!T||T.some(t=>mt(o.lb,t))).map(o=>o.h).join("");
 const sol=x.sol.filter(([a])=>{const m=a.match(/^Apartado ([a-z][\w-]*)/);return !T||!m||T.some(t=>mt(m[1],t))}).map(([a,h])=>`<h4>${a}</h4>${h}`).join("");
 return `<section class="exb"><div class="card" style="--c:${c}"><h2 class="ti">Ejercicio ${x.on||x.n}<small>${e.year} ${e.conv} · ${x.pts} p.${x.b?(/^Opci/.test(x.b)?" · "+x.b:" · Bloque "+x.b):""}</small></h2>${S.m!=="year"?`<p class="mut" style="margin:0 0 6px">🧩 En este ${S.m==="type"?"tipo":"tema"}: <b>${T?"apartados "+[...new Set(T)].join(", "):"todo el ejercicio"}</b></p>`:""}${x.intro?`<p>${x.intro}</p>`:""}${parts}</div><div class="card" style="--c:${c}"><button class="cta" data-a="open" data-k="${key}">${op?"Ocultar resolución":"Ver resolución desarrollada"}</button>${op?`<div class="sol">${LEG}${sol}</div>`:""}</div></section>`}
function hero(ic,c,t,sub,ctr){return `<div class="hero${ctr?" center":""}" style="--c:${c}"><div class="circ">${ic}</div><div><h1>${t}</h1><p>${sub}</p></div></div>`}
function view(){
 if(S.s==="home")return `<h1 class="big">Elige una asignatura</h1><p class="mut">¿Qué quieres estudiar hoy?</p>${wheel()}${tiles()}`;
 if(S.s==="subj")return hero(SB()[1],SB()[2],SB()[0],"Elige qué quieres hacer",1)+`<div class="grid2"><button class="opt" data-a="mode" data-m="year" style="--c:#6d4ae0"><span class="ic">📄</span><b>Exámenes completos por año</b><small>Todos los exámenes PAU por año y convocatoria</small></button><button class="opt" data-a="mode" data-m="topic" style="--c:#17a673"><span class="ic">📖</span><b>Ejercicios por temas</b><small>Practica ejercicios organizados por temas</small></button></div>`;
 if(S.s==="topics")return hero(SB()[1],SB()[2],SB()[0],"Ejercicios por temas · Selecciona el bloque")+TOPS().map((t,i)=>{const n=count(t.k);return `<button class="row" data-a="topic" data-k="${t.k}" style="--c:${t.c}"><div class="circ">${t.i}</div><b>${i+1}. ${t.n}<small>${n?n+" ejercicio"+(n>1?"s":""):"Próximamente"}</small></b><span class="ar">›</span></button>`}).join("");
 const tp=TOPS().find(t=>t.k===S.t);
 if(S.s==="tsel"){const n=count(S.t),T=TYS()[S.t]||[],nt=T.filter(z=>countT(S.t,z[0])).length;return hero(tp.i,tp.c,tp.n,"Elige cómo quieres practicar")+`<div class="grid2"><button class="opt" data-a="tby" style="--c:${tp.c}"><span class="ic">🗓</span><b>Por año</b><small>${n} ejercicio${n==1?"":"s"} de este tema</small></button><button class="opt" data-a="tty" style="--c:${tp.c}"><span class="ic">🧩</span><b>Por tipo de ejercicio</b><small>${nt} de ${T.length} tipos con ejercicios</small></button></div>`}
 if(S.s==="types")return hero(tp.i,tp.c,tp.n,"Ejercicios por tipo")+(TYS()[S.t]||[]).map((z,i)=>{const n=countT(S.t,z[0]);return `<button class="row${n?"":" off"}" ${n?`data-a="type" data-k="${z[0]}"`:""} style="--c:${tp.c}"><div class="circ">${i+1}</div><b>${z[1]}<small>${n?n+" ejercicio"+(n>1?"s":""):"Próximamente"}</small></b>${n?'<span class="ar">›</span>':""}</button>`}).join("");
 if(S.s==="years"){let ys="";for(let y=CAT.anios.hasta;y>=CAT.anios.desde;y--)ys+=`<button class="y${hasYear(y)?"":" off"}" data-a="year" data-y="${y}"><i>🗓</i>${y}</button>`;
  return (tp?hero(tp.i,tp.c,SB()[0],tp.n+" · Elige el año"):hero("📄",SB()[2],SB()[0],"Exámenes completos · Elige el año"))+`<div class="card ygrid">${ys}</div>`}
 const X=exams(),k=Math.min(S.k||0,X.length-1),e=X[k],its=e.ex.filter(x=>inc(e,x)),c0=(tp||{}).c||SB()[2],tn=S.m==="type"?TYS()[S.t].find(z=>z[0]===S.ty)[1]:"";
 return `<h1>${SB()[0]}</h1><p class="mut">${S.m==="type"?tp.n+" · "+tn:S.m==="topic"?tp.n+" · "+S.y:"Examen "+S.y}</p><div class="chips" style="--c:${c0}">${X.map((q,n)=>`<button class="ch${n===k?" on":""}" data-a="tab" data-i="${n}">${S.m==="type"?q.year+" "+q.conv:q.conv}</button>`).join("")}</div>${its.map(x=>block(e,FULL[e.id][x.id])).join("")}<p class="note">Resoluciones elaboradas paso a paso; conviene revisarlas antes de usarlas en clase.</p>`}
function notes(root,pre){const L={why:"💡",th:"📘",err:"⚠️",tp:"⭐"},T=["why","th","err","tp"];
 const find=(el,dir)=>{let h=el[dir];while(h&&h.tagName!=="H4"){if(h.matches(".ex"))return h;h=h[dir]}return null};
 let id=0;
 root.querySelectorAll("i.n,.tip").forEach(el=>{id++;const note=el.matches("i.n"),t=note?(el.dataset.t||"why"):(T.find(c=>el.classList.contains(c))||"why");
  const b=document.createElement("button");b.className="mk "+t;b.dataset.a="mk";b.dataset.n=pre+"_"+id;b.textContent=id;
  const d=document.createElement("div");d.className="bub "+t;d.dataset.n=pre+"_"+id;d.innerHTML=`<span class="mk s ${t}">${id}</span>${L[t]} ${el.innerHTML}`;
  if(note){const p=el.closest("p")||el.closest(".ex");el.replaceWith(b);(p._l||p).after(d);p._l=d}
  else{const h=find(el,"previousElementSibling")||find(el,"nextElementSibling");
   if(h){const p=h.querySelector("p");p?p.append(b):h.prepend(b);(h._l||h).after(d);h._l=d;el.remove()}else el.replaceWith(b,d)}});
 root.querySelectorAll("button.mk").forEach((b,i)=>{const o=b.dataset.n,d=root.querySelector('.bub[data-n="'+o+'"]'),n=i+1;b.textContent=n;b.dataset.n=pre+"x"+n;if(d){d.dataset.n=pre+"x"+n;d.querySelector(".s").textContent=n}})}
function f3d(){document.querySelectorAll(".f3d:not([data-ok])").forEach(box=>{box.dataset.ok=1;let D;try{D=JSON.parse(box.dataset.f)}catch(e){return}
 const svg=box.querySelector("svg");if(!svg)return;let az=D.az,el=D.el;const A0=az,E0=el;const C={n:"#dc2626",d:"#16a34a",g:"#64748b",r:"#2563eb"};const key=c=>({"#dc2626":"n","#16a34a":"d","#64748b":"g","#2563eb":"r"}[c]||"g");
 const pts=[];D.p.forEach(q=>{if(q[0]==="poly")q[1].forEach(P=>pts.push(P));else if(q[0]==="line"||q[0]==="vec"){pts.push(q[1],q[2])}else pts.push(q[1])});
 const cen=[0,1,2].map(i=>(Math.min(...pts.map(p=>p[i]))+Math.max(...pts.map(p=>p[i])))/2);const R=Math.max(...pts.map(p=>Math.hypot(p[0]-cen[0],p[1]-cen[1],p[2]-cen[2])))||1;
 const W=340,H=300,s=(Math.min(W,H-50)/2-6)/R,uid="f"+Math.random().toString(36).slice(2,7),f=v=>v.toFixed(1);
 const LEY={"plano":`<rect x='0' y='-8' width='12' height='9' fill='#8b5cf6' fill-opacity='.4' stroke='#7c3aed'/>`,"recta":`<line x1='0' y1='-4' x2='14' y2='-4' stroke='#2563eb' stroke-width='2'/>`,"vector normal":`<line x1='0' y1='-4' x2='14' y2='-4' stroke='#dc2626' stroke-width='2.4'/>`,"vector director":`<line x1='0' y1='-4' x2='14' y2='-4' stroke='#16a34a' stroke-width='2.4'/>`,"puntos":`<circle cx='6' cy='-4' r='3.8' fill='#e8487a'/>`};
 function draw(){const a=az*Math.PI/180,e=el*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),ce=Math.cos(e),se=Math.sin(e);
  const pr=P=>{const x=P[0]-cen[0],y=P[1]-cen[1],z=P[2]-cen[2];const u=y*ca-x*sa,d=y*sa+x*ca,v=z*ce-d*se;return[W/2+u*s,(H-50)/2+8-v*s]};
  const o=[],top=[];D.p.forEach(q=>{const k=q[0];
   if(k==="poly")o.push(`<polygon points='${q[1].map(P=>pr(P).map(f).join(",")).join(" ")}' fill='${q[2]}' fill-opacity='.26' stroke='${q[3]}' stroke-width='1.2'/>`);
   else if(k==="line"){const[a1,b1]=pr(q[1]),[a2,b2]=pr(q[2]);o.push(`<line x1='${f(a1)}' y1='${f(b1)}' x2='${f(a2)}' y2='${f(b2)}' stroke='${q[3]}' stroke-width='${q[4]}'${q[5]?" stroke-dasharray='4 3'":""}/>`)}
   else if(k==="vec"){const[a1,b1]=pr(q[1]),[a2,b2]=pr(q[2]);o.push(`<line x1='${f(a1)}' y1='${f(b1)}' x2='${f(a2)}' y2='${f(b2)}' stroke='${q[3]}' stroke-width='2.4' marker-end='url(#${uid}${key(q[3])})'/>`);if(q[4])o.push(`<text x='${f(a2+q[5])}' y='${f(b2+q[6])}' fill='${q[3]}' font-weight='700'>${q[4]}</text>`)}
   else if(k==="pt"){const[x,y]=pr(q[1]);top.push(`<circle cx='${f(x)}' cy='${f(y)}' r='3.8' fill='#e8487a'/><text x='${f(x+q[3])}' y='${f(y+q[4])}' font-weight='700'>${q[2]}</text>`)}
   else if(k==="txt"){const[x,y]=pr(q[1]);o.push(`<text x='${f(x+q[4])}' y='${f(y+q[5])}' fill='${q[3]}' font-weight='700' font-style='italic'>${q[2]}</text>`)}});
  const defs="<defs>"+Object.entries(C).map(([k,c])=>`<marker id='${uid}${k}' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='7' markerHeight='7' orient='auto'><path d='M0 0L10 5L0 10z' fill='${c}'/></marker>`).join("")+"</defs>";
  const ox=24,oy=H-30;let ej="";[[1,0,0,"x"],[0,1,0,"y"],[0,0,1,"z"]].forEach(([x,y,z,n])=>{const u=y*ca-x*sa,d=y*sa+x*ca,v=z*ce-d*se,x2=ox+u*16,y2=oy-v*16;ej+=`<line x1='${ox}' y1='${oy}' x2='${f(x2)}' y2='${f(y2)}' stroke='#64748b' stroke-width='1.2'/><text x='${f(x2+(x2-ox)*.35-3)}' y='${f(y2+(y2-oy)*.35+4)}' fill='#64748b' font-size='10'>${n}</text>`});
  let lx=56,ly="";(D.ley||[]).forEach(k=>{ly+=`<g transform='translate(${f(lx)},${H-8})'>${LEY[k]||""}<text x='18' y='0' font-size='10'>${k}</text></g>`;lx+=24+5.3*k.length});
  const WW=Math.max(W,Math.round(lx));svg.setAttribute("viewBox",`0 0 ${WW} ${H}`);
  svg.innerHTML=defs+o.join("")+top.join("")+ej+ly+`<g data-r='1' style='cursor:pointer'><rect x='${WW-58}' y='4' width='54' height='20' rx='10' fill='#ede9fe'/><text x='${WW-31}' y='18' text-anchor='middle' font-size='11' fill='#6d28d9' font-weight='700'>Reiniciar</text></g>`}
 draw();svg.style.touchAction="none";svg.style.cursor="grab";svg.style.userSelect="none";svg.style.webkitUserSelect="none";let dr=null;
 svg.addEventListener("pointerdown",ev=>{if(ev.target.closest("[data-r]")){az=A0;el=E0;draw();return}dr=[ev.clientX,ev.clientY];svg.setPointerCapture(ev.pointerId)});
 svg.addEventListener("pointermove",ev=>{if(!dr)return;const dx=ev.clientX-dr[0],dy=ev.clientY-dr[1];dr=[ev.clientX,ev.clientY];az-=dx*.6;el=Math.max(-85,Math.min(85,el+dy*.5));draw()});
 const fin=()=>{dr=null};svg.addEventListener("pointerup",fin);svg.addEventListener("pointercancel",fin)})}

function smooth(){document.querySelectorAll(".sol svg polyline").forEach(pl=>{
 const pts=pl.getAttribute("points").trim().split(/\s+/).map(q=>q.split(",").map(Number));
 if(pts.length<3)return;
 let d="M"+pts[0][0]+" "+pts[0][1];
 for(let i=0;i<pts.length-1;i++){const a=pts[i-1]||pts[i],b=pts[i],c=pts[i+1],e=pts[i+2]||c;
  d+=" C"+(b[0]+(c[0]-a[0])/6).toFixed(1)+" "+(b[1]+(c[1]-a[1])/6).toFixed(1)+","+(c[0]-(e[0]-b[0])/6).toFixed(1)+" "+(c[1]-(e[1]-b[1])/6).toFixed(1)+","+c[0]+" "+c[1]}
 const pa=document.createElementNS("http://www.w3.org/2000/svg","path");
 ["stroke","stroke-width","stroke-opacity","stroke-dasharray"].forEach(k=>{if(pl.hasAttribute(k))pa.setAttribute(k,pl.getAttribute(k))});
 pa.setAttribute("fill","none");pa.setAttribute("stroke-linecap","round");pa.setAttribute("d",d);pl.replaceWith(pa)})}
const CR=st=>{const D=DB[st.sj]||{},tops=D.tops||[],tys=D.tys||{},tp=tops.find(t=>t.k===st.t),sb=SUBJ[SI(st.sj)];
 if(st.s==="home")return "🏠 Inicio";
 if(st.s==="subj")return sb[1]+" "+sb[0];
 if(st.s==="topics")return "Por temas";
 if(st.s==="tsel")return (tp?tp.i+" "+tp.n:"Tema");
 if(st.s==="types")return "Por tipo";
 if(st.s==="years")return st.m==="year"?"Exámenes por año":"Por año";
 if(st.s==="ex")return st.m==="year"?"Examen "+st.y:st.m==="topic"?"Año "+st.y:((tys[st.t]||[]).find(z=>z[0]===st.ty)||[0,"Tipo"])[1];
 return ""};
const crumbs=()=>{if(!stack.length)return "";const all=stack.concat([S]);return `<nav class="crumbs">`+all.map((st,i)=>`<button class="crb${i===all.length-1?" on":""}" data-a="crumb" data-i="${i}">${CR(st)}</button>`).join('<span class="crs">›</span>')+`</nav>`};
function rxFix(){document.querySelectorAll("svg.rxs").forEach(sv=>{try{let x=10;const pos={};
 sv.querySelectorAll("g.rxl > *").forEach(el=>{
  if(el.dataset.t==="sep"){const p=+el.dataset.p;x+=p;el.setAttribute("x",x);x+=el.getComputedTextLength()+p;return}
  const s=el.querySelector(".s"),o=el.querySelector(".o"),b=el.querySelector(".b");s.setAttribute("x",x);const w=s.getComputedTextLength();
  if(o)o.setAttribute("x",x+w/2);if(el.dataset.id)pos[el.dataset.id]=x+w/2;x+=w;
  if(b){b.setAttribute("x",x+.5);x+=b.getComputedTextLength()+1}});
 sv.querySelectorAll("path[data-a]").forEach(p=>{const xa=pos[p.dataset.a],xb=pos[p.dataset.b],y=+p.dataset.y,d=+p.dataset.d;p.setAttribute("d","M"+xa+" "+y+" V"+(y+d)+" H"+xb+" V"+(y+6))});
 sv.setAttribute("viewBox","0 0 "+Math.max(x+12,260)+" "+sv.dataset.h)}catch(e){}})}
function render(){$("app").innerHTML=`<div class="top">${S.s!=="home"?'<button class="sq" data-a="back" aria-label="Volver">‹</button>':""}<div class="logo">PAU<span>teca</span></div></div>`+crumbs()+view();document.querySelectorAll(".sol").forEach((so,i)=>notes(so,"s"+i));smooth();f3d();if(window.SIMS)SIMS();rxFix();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(rxFix);{const cn=document.querySelector(".crumbs");if(cn)cn.scrollLeft=cn.scrollWidth}if(window.mjOk)MathJax.typesetPromise([$("app")]).then(mjWide)}
function mjWide(){document.querySelectorAll(".sol mjx-container:not([display])").forEach(m=>{m.classList.remove("mjw");const p=m.parentElement;if(!p||!p.clientWidth)return;if(m.getBoundingClientRect().width>p.clientWidth-2)m.classList.add("mjw")})}
window.mjWide=mjWide;addEventListener("resize",()=>{clearTimeout(window._mjt);window._mjt=setTimeout(mjWide,200)});
const nav=n=>{if(n.sj===undefined)n.sj=S.sj;stack.push(S);S=n;draw();scrollTo(0,0)};
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-a]");if(!b)return;const a=b.dataset.a;
 if(a==="back"){S=stack.pop()||{s:"home"};draw();scrollTo(0,0)}
 else if(a==="subj")nav({s:"subj",sj:CAT.asignaturas[+b.dataset.s].id});
 else if(a==="mode")nav(b.dataset.m==="year"?{s:"years",m:"year"}:{s:"topics"});
 else if(a==="topic")nav({s:"tsel",t:b.dataset.k});
 else if(a==="tby")nav({s:"years",m:"topic",t:S.t});
 else if(a==="tty")nav({s:"types",t:S.t});
 else if(a==="type")nav({s:"ex",m:"type",t:S.t,ty:b.dataset.k,k:0});
 else if(a==="year")nav({s:"ex",m:S.m,t:S.t,y:+b.dataset.y,k:0});
 else if(a==="tab"){S.k=+b.dataset.i;draw();scrollTo(0,0)}
 else if(a==="open"){const k=b.dataset.k;OPEN[k]=!OPEN[k];const y=window.scrollY;draw();scrollTo(0,y)}
 else if(a==="mk"){const q=document.querySelector('.bub[data-n="'+b.dataset.n+'"]');if(q){q.classList.toggle("show");b.classList.toggle("on")}}
 else if(a==="crumb"){const i=+b.dataset.i;if(i<stack.length){S=stack[i];stack=stack.slice(0,i);draw();scrollTo(0,0)}}
 else if(a==="all")b.closest(".sol").classList.toggle("all")});
document.addEventListener("input",ev=>{if(ev.target.dataset&&ev.target.dataset.k)att[ev.target.dataset.k]=ev.target.value});
/* rueda para cualquier número de asignaturas (con 5 queda igual que antes) */
wheel=function(){const N=SUBJ.length||5,st=360/N,cx=170,cy=170,ro=162,ri=56,R=Math.PI/180,f=v=>v.toFixed(1);
 const pt=(r,a)=>f(cx+r*Math.cos(a*R))+" "+f(cy+r*Math.sin(a*R));
 return `<svg class="wheel" viewBox="0 0 340 340" width="100%" style="max-width:380px;display:block;margin:6px auto 0">`+SUBJ.map((u,i)=>{const a0=-90+st*i+1,a1=a0+st-2,m=a0+(st-2)/2,tx=cx+108*Math.cos(m*R),ty=cy+108*Math.sin(m*R),nm=u[0].split(" ");
  return `<g ${u[3]?'data-a="subj" data-s="'+i+'"':'class="off"'}><path d="M${pt(ro,a0)} A${ro} ${ro} 0 0 1 ${pt(ro,a1)} L${pt(ri,a1)} A${ri} ${ri} 0 0 0 ${pt(ri,a0)} Z" fill="${u[2]}"/><text x="${f(tx)}" y="${f(ty-10)}" text-anchor="middle" font-size="${u[1].length>2?22:26}" fill="#fff">${u[1]}</text><text text-anchor="middle" font-size="12" font-weight="700" fill="#fff"><tspan x="${f(tx)}" y="${f(ty+12)}">${nm[0]}</tspan>${nm[1]?`<tspan x="${f(tx)}" dy="14">${nm.slice(1).join(" ")}</tspan>`:""}</text>${u[3]?"":`<text x="${f(tx)}" y="${f(ty+44)}" text-anchor="middle" font-size="9" fill="#fff" opacity=".9">Próximamente</text>`}</g>`}).join("")+`<circle cx="170" cy="170" r="52" fill="var(--card)"/><text x="170" y="166" text-anchor="middle" font-size="13" font-weight="800" fill="var(--ink)">Elige</text><text x="170" y="182" text-anchor="middle" font-size="11" fill="var(--mut)">asignatura</text></svg>`};
boot();
