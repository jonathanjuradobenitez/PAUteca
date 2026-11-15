/* PAUteca · lógica de la aplicación. Los contenidos están en /datos (ver datos/LEEME.md). */
const LEG='<div class="legend"><button class="tg" data-a="all">💬 Mostrar / ocultar todas las explicaciones</button><span class="hint">Toca un número para ver su bocadillo</span></div>';
const att={};const $=id=>document.getElementById(id);
/* ---------- Carga de datos (catálogo, temarios, índices y exámenes bajo demanda) ---------- */
let CAT={anios:{desde:2001,hasta:2027},asignaturas:[]},SUBJ=[];
const DB={},FULL={},LOAD={};
const SI=id=>Math.max(0,CAT.asignaturas.findIndex(a=>a.id===id));
const getJ=u=>fetch(u).then(q=>{if(!q.ok)throw new Error(u+" → "+q.status);return q.json()});
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
 return `<h1>${SB()[0]}</h1><p class="mut">${S.m==="type"?tp.n+" · "+tn:S.m==="topic"?tp.n+" · "+S.y:"Examen "+S.y}</p>${S.m==="year"?fmt(e):""}<div class="chips" style="--c:${c0}">${X.map((q,n)=>`<button class="ch${n===k?" on":""}" data-a="tab" data-i="${n}">${S.m==="type"?q.year+" "+q.conv:q.conv}</button>`).join("")}</div>${its.map(x=>block(e,FULL[e.id][x.id])).join("")}<p class="note">Resoluciones elaboradas paso a paso; conviene revisarlas antes de usarlas en clase.</p>`}
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
function render(){$("app").innerHTML=`<div class="top">${S.s!=="home"?'<button class="sq" data-a="back" aria-label="Volver">‹</button>':""}<div class="logo">PAU<span>teca</span></div></div>`+crumbs()+view();document.querySelectorAll(".sol").forEach((so,i)=>notes(so,"s"+i));smooth();rxFix();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(rxFix);{const cn=document.querySelector(".crumbs");if(cn)cn.scrollLeft=cn.scrollWidth}if(window.mjOk)MathJax.typesetPromise([$("app")])}
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
boot();
