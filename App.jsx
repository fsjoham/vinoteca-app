import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, remove } from "firebase/database";

// ── Firebase config ───────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDsdewKabN0oGuAs3pmlNO-ybd1z3S2OUI",
  authDomain: "vinoteca-app-d209f.firebaseapp.com",
  databaseURL: "https://vinoteca-app-d209f-default-rtdb.firebaseio.com",
  projectId: "vinoteca-app-d209f",
  storageBucket: "vinoteca-app-d209f.firebasestorage.app",
  messagingSenderId: "6483036095",
  appId: "1:6483036095:web:56d66fe7f25cda9e65830a"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz3Dge_jOiPR4EEMNfbOqx1Wt34yGm0jFP_B73b0qdc_gmd9OrgexL_h5sGaGaR3gfg5w/exec";

// ── Firebase helpers ──────────────────────────────────────────────
const sGet = async (key) => {
  try {
    const snap = await get(ref(db, key));
    return snap.exists() ? snap.val() : null;
  } catch { return null; }
};
const sSet = async (key, val) => {
  try { await set(ref(db, key), val); } catch(e) { console.error("sSet error", e); }
};
const sDel = async (key) => {
  try { await remove(ref(db, key)); } catch {}
};

const ADMIN_USERS = [
  { user:"admin",     pass:"cepalibre88",  role:"Administradora", initials:"AD" },
  { user:"sommelier", pass:"vinoteca2025", role:"Sommelier",       initials:"SS" },
];

const DISTRITOS   = ["Ancón","Ate","Barranco","Breña","Carabayllo","Chaclacayo","Chorrillos","Cieneguilla","Comas","El Agustino","Independencia","Jesús María","La Molina","La Victoria","Lima (Cercado de Lima)","Lince","Los Olivos","Lurigancho (Chosica)","Lurín","Magdalena del Mar","Miraflores","Pachacámac","Pucusana","Pueblo Libre","Puente Piedra","Punta Hermosa","Punta Negra","Rímac","San Bartolo","San Borja","San Isidro","San Juan de Lurigancho","San Juan de Miraflores","San Luis","San Martín de Porres","San Miguel","Santa Anita","Santa María del Mar","Santa Rosa","Santiago de Surco","Surquillo","Villa El Salvador","Villa María del Triunfo","Callao","Otro"];
const EDADES      = ["18–24","25–34","35–44","45–54","55+"];
const FRECUENCIAS = [{id:"diario",label:"Casi todos los días",icon:"📅"},{id:"semanal",label:"1–2 veces por semana",icon:"🗓️"},{id:"quincenal",label:"Cada 2 semanas",icon:"📆"},{id:"mensual",label:"Una vez al mes",icon:"🌙"},{id:"ocasional",label:"En ocasiones especiales",icon:"🎉"},{id:"nuevo",label:"Soy nuevo en el vino",icon:"🌱"}];
const CEPAS_REG   = ["Malbec","Cabernet Sauvignon","Carménère","Merlot","Tannat","Pinot Noir","Tempranillo","Syrah","Chardonnay","Sauvignon Blanc","Torrontés","Aún no lo sé","Otra"];
const CEPAS_ADM   = ["Malbec","Cabernet Sauvignon","Carménère","Merlot","Tannat","Pinot Noir","Tempranillo","Syrah","Chardonnay","Sauvignon Blanc","Torrontés","Viognier","Riesling","Espumoso / Cava","Otra"];
const ORIGENES    = ["Mendoza, Argentina","Salta, Argentina","Valle del Maipo, Chile","Valle de Colchagua, Chile","Valle de Casablanca, Chile","Ica, Perú","Lima, Perú","Arequipa, Perú","Ribera del Duero, España","Rioja, España","Toscana, Italia","Piamonte, Italia","Burdeos, Francia","Otro"];
const TANINOS_OPT = ["Muy suaves","Suaves","Medios","Marcados","Intensos"];
const BADGES      = [{id:"b1",icon:"🥂",label:"Primera Copa",req:1},{id:"b2",icon:"🧭",label:"Explorador",req:5},{id:"b3",icon:"👅",label:"Paladar Fino",req:10},{id:"b4",icon:"🎓",label:"Sommelier Jr.",req:20}];
const NIVELES     = [
  {id:"empezar",    label:"Para empezar",     icon:"🟢", desc:"Accesible, fácil de beber"},
  {id:"explorar",   label:"Para explorar",    icon:"🟡", desc:"Más estructura, requiere atención"},
  {id:"coleccionista", label:"Coleccionista", icon:"🔴", desc:"Complejo, para paladares entrenados"},
];
const OCASIONES   = [
  {id:"informal",     label:"Informal",       icon:"🍕"},
  {id:"mesa",         label:"Mesa especial",  icon:"🥩"},
  {id:"regalo",       label:"Para regalar",   icon:"🎁"},
  {id:"descubrimiento",label:"Descubrimiento",icon:"🌱"},
];
const EMPTY_WINE  = {nombre:"",bodega:"",origen:"",cepa:"",anada:"",notas:"",taninos:"",maridaje:"",nivel:"",ocasion:"",imagen:"",activo:true};

const Stars = ({value,onChange,size=26,readonly=false}) => {
  const [hov,setHov]=useState(0);
  return <div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(i=><span key={i} onClick={()=>!readonly&&onChange&&onChange(i)} onMouseEnter={()=>!readonly&&setHov(i)} onMouseLeave={()=>!readonly&&setHov(0)} style={{fontSize:size,cursor:readonly?"default":"pointer",color:i<=(hov||value)?"#C9A84C":"#2A1E14",transition:"all 0.12s",display:"inline-block",transform:!readonly&&i<=(hov||value)?"scale(1.18)":"scale(1)"}}>★</span>)}</div>;
};

export default function VinotecaV2() {
  const [mode,    setMode]    = useState("boot");
  const [catalog, setCatalog] = useState([]);
  const [ratings, setRatings] = useState({});
  const [user,    setUser]    = useState(null);
  const [cava,    setCava]    = useState({probados:{},pendientes:[]});
  const [toast,   setToast]   = useState(null);

  // User screens
  const [uScreen,  setUScreen]  = useState("login");
  const [uTab,     setUTab]     = useState("catalogo");
  const [cavaTab,  setCavaTab]  = useState("probados");
  const [selWine,  setSelWine]  = useState(null);
  const [rWine,    setRWine]    = useState(null);
  const [rVal,     setRVal]     = useState(0);
  const [rNote,    setRNote]    = useState("");
  const [rSaved,   setRSaved]   = useState(false);
  const [uSearch,  setUSearch]  = useState("");
  const [uFilter,  setUFilter]  = useState("Todas");
  const [uNivel,   setUNivel]   = useState("Todas");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginErr,   setLoginErr]   = useState("");
  const [loginLoad,  setLoginLoad]  = useState(false);

  // Register state
  const [regStep,  setRegStep]  = useState(1);
  const [regForm,  setRegForm]  = useState({nombre:"",email:"",telefono:"",distrito:"",edad:"",frecuencia:"",cepas:[],cepaOtra:"",mayorEdad:false});
  const [regErr,   setRegErr]   = useState({});
  const [regSend,  setRegSend]  = useState(false);

  // Admin state
  const [aAuthed,   setAAuthed]   = useState(null);
  const [aLogin,    setALogin]    = useState({user:"",pass:"",err:""});
  const [aScreen,   setAScreen]   = useState("list");
  const [aEditing,  setAEditing]  = useState(null);
  const [aForm,     setAForm]     = useState(EMPTY_WINE);
  const [aErr,      setAErr]      = useState({});
  const [aSearch,   setASearch]   = useState("");
  const [aFilter,   setAFilter]   = useState("Todas");
  const [delConfirm,setDelConfirm]= useState(null);

  // Boot
  useEffect(()=>{
    (async()=>{
      const [cat,rat,session]=await Promise.all([
        sGet("catalog"),
        sGet("ratings"),
        sGet("session"),
      ]);
      setCatalog(cat ? Object.values(cat) : []);
      setRatings(rat||{});
      if(session?.email){
        const dir = await sGet("users");
        const emailKey = session.email.replace(/\./g,"_");
        const perfil = dir?.[emailKey];
        if(perfil){
          const cv = await sGet("cavas/"+emailKey);
          setUser(perfil);
          if(cv) setCava(cv);
          setUScreen("home");
        }
      }
      setMode("user");
    })();
  },[]);

  const showToast=(msg)=>{ setToast(msg); setTimeout(()=>setToast(null),2800); };

  // ── LOGIN ────────────────────────────────────────────────────
  const handleLogin = async () => {
    const email = loginEmail.trim().toLowerCase();
    if(!email || !/\S+@\S+\.\S+/.test(email)){ setLoginErr("Ingresa un email válido"); return; }
    setLoginLoad(true);
    const dir = await sGet("users");
    const emailKey = email.replace(/\./g,"_");
    const perfil = dir?.[emailKey];
    if(perfil){
      const cv = await sGet("cavas/"+emailKey);
      await sSet("session", {email});
      setUser(perfil);
      if(cv) setCava(cv);
      setLoginLoad(false);
      setUScreen("home");
      showToast(`¡Bienvenido/a de vuelta, ${perfil.nombre}! 🍷`);
    } else {
      // Usuario no existe — ir a registro con email prellenado
      setLoginLoad(false);
      setRegForm(f=>({...f, email: loginEmail.trim()}));
      setRegStep(1);
      setUScreen("register");
      showToast("Email no encontrado, completa tu registro 📝");
    }
  };

  // ── LOGOUT ───────────────────────────────────────────────────
  const handleLogout = async () => {
    await sDel("session");
    setUser(null);
    setCava({probados:{},pendientes:[]});
    setLoginEmail("");
    setLoginErr("");
    setUScreen("login");
  };

  // ── REGISTER ─────────────────────────────────────────────────
  const rSet=(k,v)=>{ setRegForm(f=>({...f,[k]:v})); setRegErr(e=>({...e,[k]:undefined})); };
  const toggleCepa=id=>setRegForm(f=>({...f,cepas:f.cepas.includes(id)?f.cepas.filter(c=>c!==id):[...f.cepas,id]}));

  const validateReg=()=>{
    const e={};
    if(regStep===1){
      if(!regForm.nombre.trim())e.nombre="Requerido";
      if(!regForm.email.trim()||!/\S+@\S+\.\S+/.test(regForm.email))e.email="Email inválido";
      if(!regForm.telefono.trim())e.telefono="Requerido";
      if(!regForm.distrito)e.distrito="Requerido";
      if(!regForm.edad)e.edad="Requerido";
      if(!regForm.mayorEdad)e.mayorEdad="Confirma que eres mayor de edad";
    }
    if(regStep===2){
      if(!regForm.frecuencia)e.frecuencia="Elige una opción";
      if(!regForm.cepas.length)e.cepas="Elige al menos una";
    }
    setRegErr(e); return !Object.keys(e).length;
  };

  const submitReg = async () => {
    if(!validateReg()) return;
    setRegSend(true);
    const email = regForm.email.trim().toLowerCase();
    const perfil = {
      nombre:regForm.nombre, email, telefono:regForm.telefono,
      distrito:regForm.distrito, edad:regForm.edad,
      frecuencia:regForm.frecuencia, cepas: regForm.cepas.includes("Otra") && regForm.cepaOtra.trim() ? [...regForm.cepas.filter(c=>c!=="Otra"), regForm.cepaOtra.trim()] : regForm.cepas,
      joined:new Date().toLocaleDateString("es-PE")
    };
    const emailKey = email.replace(/[.]/g,"_");
    const dir = (await sGet("users")) || {};
    dir[emailKey] = perfil;
    await sSet("users", dir);
    await sSet("session", {email});
    // Enviar a Google Sheets
    const p=new URLSearchParams({nombre:perfil.nombre,email,telefono:perfil.telefono,distrito:perfil.distrito,edad:perfil.edad,frecuencia:perfil.frecuencia,cepas:perfil.cepas.join(", "),fecha:perfil.joined});
    window.open(`${APPS_SCRIPT_URL}?${p.toString()}`,"_blank");
    setUser(perfil);
    setRegSend(false);
    setUScreen("home");
    showToast(`¡Bienvenido/a, ${perfil.nombre}! 🍷`);
  };

  // ── CAVA OPS ─────────────────────────────────────────────────
  const saveCava=async(nc)=>{
    setCava(nc);
    const emailKey = user.email.replace(/\./g,"_");
    await sSet("cavas/"+emailKey, nc);
  };
  const addPendiente=async(w)=>{
    if(cava.pendientes.includes(w.id)||cava.probados[w.id]){ showToast(cava.probados[w.id]?"Ya está en tus probados":"Ya en pendientes"); return; }
    await saveCava({...cava,pendientes:[...cava.pendientes,w.id]});
    showToast(`"${w.nombre}" añadido a Pendientes 📌`);
  };
  const openRating=(w)=>{ setRWine(w); const ex=cava.probados[w.id]; setRVal(ex?.score||0); setRNote(ex?.nota||""); setRSaved(false); setUScreen("rating"); };
  const saveRating=async()=>{
    if(!rVal) return;
    const entry={score:rVal,nota:rNote,fecha:new Date().toLocaleDateString("es-PE")};
    const np={...cava.probados,[rWine.id]:entry};
    const npe=cava.pendientes.filter(id=>id!==rWine.id);
    await saveCava({probados:np,pendientes:npe});
    const nr={...ratings,[rWine.id]:{...(ratings[rWine.id]||{}),[user.nombre]:{score:rVal,nota:rNote}}};
    setRatings(nr); await sSet("ratings",nr);
    setRSaved(true);
    const cnt=Object.keys(np).length;
    const b=BADGES.find(x=>x.req===cnt);
    if(b) showToast(`🏅 ¡Insignia: ${b.label}!`); else showToast("¡Guardado en tu cava! 🍷");
  };

  // ── STATS ────────────────────────────────────────────────────
  const getStats=(id)=>{ const r=ratings[id]; if(!r) return {avg:0,count:0}; const v=Object.values(r).map(x=>x.score); return {avg:(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1),count:v.length}; };
  const probadosCount=Object.keys(cava.probados).length;
  const earnedBadges=BADGES.filter(b=>probadosCount>=b.req);
  const publicCatalog=catalog.filter(w=>w.activo);
  const topWines=[...publicCatalog].map(w=>({...w,...getStats(w.id)})).filter(w=>w.count>0).sort((a,b)=>b.avg-a.avg);
  const uFiltered=publicCatalog.filter(w=>{
    const ms=!uSearch||w.nombre?.toLowerCase().includes(uSearch.toLowerCase())||w.bodega?.toLowerCase().includes(uSearch.toLowerCase());
    const mn=uNivel==="Todas"||w.nivel===uNivel;
    const mc=uFilter==="Todas"||w.cepa===uFilter;
    return ms&&mn&&mc;
  });
  const uCepas=["Todas",...Array.from(new Set(publicCatalog.map(w=>w.cepa).filter(Boolean)))];

  // ── ADMIN OPS ────────────────────────────────────────────────
  const syncVinoToSheet=async(wine)=>{
    const params=new URLSearchParams({
      tipo:"vino",
      nombre:wine.nombre||"",
      bodega:wine.bodega||"",
      origen:wine.origen||"",
      cepa:wine.cepa||"",
      anada:wine.anada||"",
      taninos:wine.taninos||"",
      notas:wine.notas||"",
      maridaje:wine.maridaje||"",
      nivel:(()=>{const n=NIVELES.find(x=>x.id===wine.nivel);return n?n.label:"";})(),
      ocasion:(()=>{const o=OCASIONES.find(x=>x.id===wine.ocasion);return o?o.label:"";})(),
      activo:wine.activo?"Sí":"No",
      fechaAlta:wine.fechaAlta||new Date().toLocaleDateString("es-PE"),
      creadoPor:wine.creadoPor||"",
    });
    window.open(`${APPS_SCRIPT_URL}?${params.toString()}`,"_blank");
  };

  const saveWine=async()=>{
    const e={};
    if(!aForm.nombre.trim())e.nombre="Requerido"; if(!aForm.bodega.trim())e.bodega="Requerido";
    if(!aForm.origen.trim())e.origen="Requerido"; if(!aForm.cepa.trim())e.cepa="Requerido";
    if(!aForm.anada.trim())e.anada="Requerido"; if(!aForm.notas.trim())e.notas="Requerido";
    if(!aForm.taninos)e.taninos="Requerido";
    if(Object.keys(e).length){ setAErr(e); return; }
    let updated; let wineToSync;
    if(aEditing){
      wineToSync={...aForm,id:aEditing.id};
      updated=catalog.map(w=>w.id===aEditing.id?wineToSync:w);
      showToast("Vino actualizado ✓");
    } else {
      wineToSync={...aForm,id:Date.now(),creadoPor:aAuthed.role,fechaAlta:new Date().toLocaleDateString("es-PE")};
      updated=[...catalog,wineToSync];
      showToast("Vino agregado 🍷");
    }
    // Store as object with id as key for Firebase
    const catalogObj = {};
    updated.forEach(w => { catalogObj[w.id] = w; });
    await sSet("catalog", catalogObj);
    setCatalog(updated);
    await syncVinoToSheet(wineToSync);
    setAScreen("list");
  };
  const deleteWine=async(w)=>{ const u=catalog.filter(x=>x.id!==w.id); const obj={}; u.forEach(x=>{ obj[x.id]=x; }); await sSet("catalog",obj); setCatalog(u); setDelConfirm(null); setAScreen("list"); showToast("Eliminado"); };
  const toggleActivo=async(w)=>{ const u=catalog.map(x=>x.id===w.id?{...x,activo:!x.activo}:x); const obj={}; u.forEach(x=>{ obj[x.id]=x; }); await sSet("catalog",obj); setCatalog(u); showToast(w.activo?"Ocultado":"Publicado ✓"); };
  const aFiltered=catalog.filter(w=>(!aSearch||w.nombre?.toLowerCase().includes(aSearch.toLowerCase())||w.bodega?.toLowerCase().includes(aSearch.toLowerCase()))&&(aFilter==="Todas"||w.cepa===aFilter));
  const aCepas=["Todas",...Array.from(new Set(catalog.map(w=>w.cepa).filter(Boolean)))];

  // ── COLORS & STYLES ──────────────────────────────────────────
  const bg="#0A0705",panel="#131009",card="#1B1208",border="#2A1E14";
  const gold="#C9A84C",wine="#8B1A1A",cream="#F0E6D3",muted="#7A6A5A",green="#2D6A2D";
  const s={
    app:  {minHeight:"100vh",background:bg,color:cream,fontFamily:"'Palatino Linotype','Book Antiqua',Palatino,serif",maxWidth:430,margin:"0 auto"},
    top:  {background:panel,borderBottom:`1px solid ${border}`,padding:"13px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:20},
    body: {padding:"16px 16px 90px"},
    card: {background:card,border:`1px solid ${border}`,borderRadius:12,padding:16,marginBottom:12},
    inp:  (e)=>({width:"100%",background:"#110D08",border:`1px solid ${e?wine:border}`,borderRadius:8,padding:"12px 14px",color:cream,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}),
    sel:  (e)=>({width:"100%",background:"#110D08",border:`1px solid ${e?wine:border}`,borderRadius:8,padding:"12px 14px",color:cream,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",appearance:"none"}),
    ta:   ()=>({width:"100%",background:"#110D08",border:`1px solid ${border}`,borderRadius:8,padding:"12px 14px",color:cream,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",minHeight:80,resize:"vertical",outline:"none"}),
    lbl:  {fontSize:10,letterSpacing:2,textTransform:"uppercase",color:muted,marginBottom:7,display:"block"},
    err:  {fontSize:11,color:"#E74C3C",marginTop:4},
    fld:  {marginBottom:18},
    btnP: {background:`linear-gradient(135deg,${wine},#C0392B)`,color:cream,border:"none",borderRadius:8,padding:"13px 20px",fontSize:15,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",width:"100%"},
    btnG: {background:`linear-gradient(135deg,#7A5C14,${gold})`,color:"#1a0d06",border:"none",borderRadius:8,padding:"11px 18px",fontSize:13,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"},
    btnO: {background:"transparent",color:muted,border:`1px solid ${border}`,borderRadius:8,padding:"10px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"},
    btnD: {background:"transparent",color:"#E74C3C",border:"1px solid #E74C3C44",borderRadius:8,padding:"10px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"},
    tab:  (a)=>({flex:1,padding:"11px 0",textAlign:"center",fontSize:11,letterSpacing:1,textTransform:"uppercase",background:a?"#1a0d06":"transparent",color:a?gold:muted,border:"none",cursor:"pointer",borderBottom:a?`2px solid ${gold}`:`2px solid transparent`,transition:"all 0.2s"}),
    pill: (c)=>({background:`${c}22`,border:`1px solid ${c}44`,borderRadius:20,padding:"3px 10px",fontSize:11,color:c,display:"inline-block"}),
  };
  const Topbar=({left,center,right})=>(<div style={s.top}><div style={{minWidth:60}}>{left}</div><div style={{fontSize:12,letterSpacing:3,color:gold,textTransform:"uppercase",textAlign:"center"}}>{center}</div><div style={{minWidth:60,textAlign:"right"}}>{right}</div></div>);
  const Toast=()=>toast?<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:gold,color:"#1a0d06",padding:"10px 22px",borderRadius:20,fontSize:13,fontWeight:"bold",zIndex:100,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>{toast}</div>:null;

  // ════════════════════════════════════════════
  // BOOT
  // ════════════════════════════════════════════
  if(mode==="boot") return <div style={{...s.app,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><div style={{fontSize:56}}>🍷</div><div style={{color:muted,fontSize:12,letterSpacing:3,marginTop:8}}>CARGANDO</div></div></div>;

  // ════════════════════════════════════════════
  // ADMIN MODE
  // ════════════════════════════════════════════
  if(mode==="admin"){
    if(!aAuthed) return (
      <div style={{...s.app,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32}}>
        <Toast/>
        <div style={{textAlign:"center",marginBottom:32}}><div style={{fontSize:48,marginBottom:10}}>🔐</div><div style={{fontSize:11,letterSpacing:5,color:gold,textTransform:"uppercase",marginBottom:6}}>Vinoteca</div><div style={{fontSize:22,fontWeight:"bold",color:cream}}>Panel Admin</div></div>
        <div style={{width:"100%",maxWidth:340}}>
          <div style={s.fld}><label style={s.lbl}>Usuario</label><input style={s.inp(false)} value={aLogin.user} onChange={e=>setALogin(f=>({...f,user:e.target.value,err:""}))} onKeyDown={e=>{if(e.key==="Enter"){const f=ADMIN_USERS.find(u=>u.user===aLogin.user&&u.pass===aLogin.pass);f?setAAuthed(f):setALogin(l=>({...l,err:"Datos incorrectos"}));}}} /></div>
          <div style={s.fld}><label style={s.lbl}>Contraseña</label><input style={s.inp(aLogin.err)} type="password" value={aLogin.pass} onChange={e=>setALogin(f=>({...f,pass:e.target.value,err:""}))} onKeyDown={e=>{if(e.key==="Enter"){const f=ADMIN_USERS.find(u=>u.user===aLogin.user&&u.pass===aLogin.pass);f?setAAuthed(f):setALogin(l=>({...l,err:"Datos incorrectos"}));}}} />{aLogin.err&&<div style={s.err}>⚠ {aLogin.err}</div>}</div>
          <button style={s.btnP} onClick={()=>{const f=ADMIN_USERS.find(u=>u.user===aLogin.user&&u.pass===aLogin.pass);f?setAAuthed(f):setALogin(l=>({...l,err:"Datos incorrectos"}));}}>Ingresar →</button>
          <button style={{...s.btnO,width:"100%",marginTop:10}} onClick={()=>setMode("user")}>← Volver</button>
        </div>
      </div>
    );

    if(aScreen==="detail"&&aEditing) return (
      <div style={s.app}><Toast/>
        {delConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{background:card,border:`1px solid ${wine}`,borderRadius:14,padding:24,maxWidth:300,width:"100%",textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>⚠️</div><div style={{fontSize:15,fontWeight:"bold",color:cream,marginBottom:8}}>¿Eliminar "{delConfirm.nombre}"?</div><div style={{display:"flex",gap:10,marginTop:16}}><button style={{...s.btnO,flex:1}} onClick={()=>setDelConfirm(null)}>Cancelar</button><button style={{...s.btnD,flex:1,background:wine,color:cream}} onClick={()=>deleteWine(delConfirm)}>Eliminar</button></div></div></div>}
        <Topbar left={<button onClick={()=>setAScreen("list")} style={{background:"none",border:"none",color:gold,fontSize:20,cursor:"pointer"}}>←</button>} center="Ficha de Vino" right={<button onClick={()=>{setAForm({...aEditing});setAErr({});setAScreen("form");}} style={{...s.btnG,padding:"6px 12px",fontSize:11}}>Editar</button>}/>
        <div style={s.body}>
          <div style={{background:"linear-gradient(135deg,#2a1508,#1c1008)",border:`1px solid ${gold}33`,borderRadius:16,padding:24,marginBottom:20,textAlign:"center"}}>
            {aEditing.imagen?<img src={aEditing.imagen} style={{width:130,height:130,objectFit:"contain",borderRadius:12,marginBottom:12,border:`1px solid ${gold}33`}}/>:<div style={{fontSize:60,marginBottom:12}}>🍷</div>}
            <div style={{fontSize:21,fontWeight:"bold",color:cream,marginBottom:4}}>{aEditing.nombre}</div>
            <div style={{fontSize:13,color:muted,marginBottom:14}}>{aEditing.bodega}</div>
            <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}><span style={s.pill(gold)}>{aEditing.cepa}</span><span style={s.pill("#9A7A5A")}>{aEditing.anada}</span><span style={s.pill(aEditing.activo?"#2D8C2D":"#8C2D2D")}>{aEditing.activo?"● Publicado":"○ Oculto"}</span></div>
          </div>
          {[["📍 Origen",aEditing.origen],["🍇 Cepa",aEditing.cepa],["📅 Añada",aEditing.anada],["🌿 Taninos",aEditing.taninos]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${border}`}}><span style={{fontSize:13,color:muted}}>{k}</span><span style={{fontSize:13,color:cream,fontWeight:"bold"}}>{v}</span></div>)}
          {aEditing.notas&&<div style={{...s.card,marginTop:16}}><div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:8}}>📝 Nota del Sommelier</div><div style={{fontSize:13,color:cream,lineHeight:1.7,fontStyle:"italic"}}>"{aEditing.notas}"</div></div>}
          {aEditing.maridaje&&<div style={{...s.card,marginTop:12}}><div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:8}}>🍽️ Maridaje</div><div style={{fontSize:13,color:cream,lineHeight:1.7}}>"{aEditing.maridaje}"</div></div>}
          {(aEditing.nivel||aEditing.ocasion)&&<div style={{...s.card,marginTop:12}}><div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:10}}>🏷️ Clasificación</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{aEditing.nivel&&(()=>{const n=NIVELES.find(x=>x.id===aEditing.nivel);return n?<span style={{background:`${gold}18`,border:`1px solid ${gold}44`,borderRadius:20,padding:"4px 12px",fontSize:12,color:gold}}>{n.icon} {n.label}</span>:null;})()}{aEditing.ocasion&&(()=>{const o=OCASIONES.find(x=>x.id===aEditing.ocasion);return o?<span style={{background:`${gold}18`,border:`1px solid ${gold}44`,borderRadius:20,padding:"4px 12px",fontSize:12,color:gold}}>{o.icon} {o.label}</span>:null;})()}</div></div>}
          <div style={{display:"flex",gap:10,marginTop:20}}><button style={{...s.btnO,flex:1}} onClick={()=>toggleActivo(aEditing)}>{aEditing.activo?"⊘ Ocultar":"✓ Publicar"}</button><button style={{...s.btnD,flex:1}} onClick={()=>setDelConfirm(aEditing)}>🗑 Eliminar</button></div>
        </div>
      </div>
    );

    if(aScreen==="form") return (
      <div style={s.app}><Toast/>
        <Topbar left={<button onClick={()=>setAScreen("list")} style={{background:"none",border:"none",color:gold,fontSize:20,cursor:"pointer"}}>←</button>} center={aEditing?"Editar Vino":"Nuevo Vino"} right={null}/>
        <div style={s.body}>
          <div style={s.card}>
            <div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:14}}>Imagen de la botella</div>
            <div style={{display:"flex",gap:14,alignItems:"center"}}>
              <div style={{width:80,height:80,borderRadius:10,border:`2px dashed ${aForm.imagen?gold:border}`,background:"#110D08",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>{aForm.imagen?<img src={aForm.imagen} style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<span style={{fontSize:28}}>🍷</span>}</div>
              <div style={{flex:1}}>
                <label htmlFor="imgUp" style={{...s.btnO,display:"inline-block",cursor:"pointer",fontSize:12,padding:"8px 14px"}}>{aForm.imagen?"Cambiar":"Subir imagen"}</label>
                <input id="imgUp" type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;if(f.size>2097152){alert("Máx 2MB");return;}const r=new FileReader();r.onload=ev=>setAForm(x=>({...x,imagen:ev.target.result}));r.readAsDataURL(f);}}/>
                <div style={{fontSize:11,color:"#4A3A2A",marginTop:6}}>JPG, PNG · Máx 2MB</div>
                {aForm.imagen&&<button onClick={()=>setAForm(f=>({...f,imagen:""}))} style={{background:"none",border:"none",color:"#E74C3C",fontSize:11,cursor:"pointer",marginTop:4,padding:0}}>✕ Quitar</button>}
              </div>
            </div>
          </div>
          <div style={{...s.card,marginTop:12}}>
            <div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:14}}>Identificación</div>
            <div style={s.fld}><label style={s.lbl}>Nombre</label><input style={s.inp(aErr.nombre)} value={aForm.nombre} placeholder="ej. Malbec Reserva 2021" onChange={e=>{setAForm(f=>({...f,nombre:e.target.value}));setAErr(x=>({...x,nombre:undefined}));}}/>{aErr.nombre&&<div style={s.err}>⚠ {aErr.nombre}</div>}</div>
            <div style={s.fld}><label style={s.lbl}>Bodega</label><input style={s.inp(aErr.bodega)} value={aForm.bodega} placeholder="ej. Achaval Ferrer" onChange={e=>{setAForm(f=>({...f,bodega:e.target.value}));setAErr(x=>({...x,bodega:undefined}));}}/>{aErr.bodega&&<div style={s.err}>⚠ {aErr.bodega}</div>}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={s.fld}><label style={s.lbl}>Añada</label><input style={s.inp(aErr.anada)} value={aForm.anada} placeholder="2021" maxLength={4} onChange={e=>{setAForm(f=>({...f,anada:e.target.value}));setAErr(x=>({...x,anada:undefined}));}}/>{aErr.anada&&<div style={s.err}>⚠ {aErr.anada}</div>}</div>
              <div style={s.fld}><label style={s.lbl}>Estado</label><div onClick={()=>setAForm(f=>({...f,activo:!f.activo}))} style={{...s.inp(false),cursor:"pointer",display:"flex",alignItems:"center",gap:8}}><div style={{width:18,height:18,borderRadius:4,border:`2px solid ${aForm.activo?green:border}`,background:aForm.activo?green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"white",flexShrink:0}}>{aForm.activo?"✓":""}</div><span style={{fontSize:13,color:aForm.activo?cream:muted}}>{aForm.activo?"Publicado":"Oculto"}</span></div></div>
            </div>
          </div>
          <div style={{...s.card,marginTop:12}}>
            <div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:14}}>Perfil Vinícola</div>
            <div style={s.fld}><label style={s.lbl}>Origen / Región</label><input style={s.inp(aErr.origen)} value={aForm.origen} placeholder="ej. Valle de Luján de Cuyo, Mendoza, Argentina" onChange={e=>{setAForm(f=>({...f,origen:e.target.value}));setAErr(x=>({...x,origen:undefined}));}}/><div style={{fontSize:11,color:"#4A3A2A",marginTop:5}}>Detalla la zona con la precisión que consideres necesaria</div>{aErr.origen&&<div style={s.err}>⚠ {aErr.origen}</div>}</div>
            <div style={s.fld}><label style={s.lbl}>Cepa / Blend</label><input style={s.inp(aErr.cepa)} value={aForm.cepa} placeholder="ej. Malbec 70%, Cabernet Sauvignon 30%" onChange={e=>{setAForm(f=>({...f,cepa:e.target.value}));setAErr(x=>({...x,cepa:undefined}));}}/><div style={{fontSize:11,color:"#4A3A2A",marginTop:5}}>Para blends indica la composición porcentual</div>{aErr.cepa&&<div style={s.err}>⚠ {aErr.cepa}</div>}</div>
            <div style={s.fld}><label style={s.lbl}>Taninos</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{TANINOS_OPT.map(t=><button key={t} onClick={()=>{setAForm(f=>({...f,taninos:t}));setAErr(x=>({...x,taninos:undefined}));}} style={{padding:"7px 12px",borderRadius:6,cursor:"pointer",border:`1px solid ${aForm.taninos===t?gold:border}`,background:aForm.taninos===t?`${gold}22`:"#110D08",color:aForm.taninos===t?gold:muted,fontSize:12,fontFamily:"inherit"}}>{t}</button>)}</div>{aErr.taninos&&<div style={s.err}>⚠ {aErr.taninos}</div>}</div>
          </div>
          <div style={{...s.card,marginTop:12,marginBottom:24}}>
            <div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:14}}>✍️ Nota del Sommelier</div>
            <textarea style={s.ta()} value={aForm.notas} placeholder="Aromas, sabores, final en boca..." onChange={e=>{setAForm(f=>({...f,notas:e.target.value}));setAErr(x=>({...x,notas:undefined}));}}/>
            {aErr.notas&&<div style={s.err}>⚠ {aErr.notas}</div>}
          </div>
          <div style={{...s.card,marginTop:12,marginBottom:24}}>
            <div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:6}}>🍽️ Recomendación de Maridaje</div>
            <div style={{fontSize:11,color:"#4A3A2A",marginBottom:12}}>Sugerencia del chef para acompañar este vino</div>
            <textarea style={s.ta()} value={aForm.maridaje} placeholder="ej. Ideal con un lomo saltado, resalta los taninos del vino. También marida muy bien con quesos curados y tabla de embutidos..." onChange={e=>setAForm(f=>({...f,maridaje:e.target.value}))}/>
          </div>
          <div style={{...s.card,marginTop:12,marginBottom:24}}>
            <div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:14}}>🏷️ Clasificación</div>
            <div style={s.fld}>
              <label style={s.lbl}>Nivel de exploración</label>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {NIVELES.map(n=><button key={n.id} onClick={()=>setAForm(f=>({...f,nivel:n.id}))} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:8,cursor:"pointer",border:`1px solid ${aForm.nivel===n.id?gold:border}`,background:aForm.nivel===n.id?`${gold}18`:"#110D08",color:aForm.nivel===n.id?gold:muted,fontSize:13,fontFamily:"inherit",textAlign:"left"}}><span style={{fontSize:18}}>{n.icon}</span><div><div style={{fontWeight:"bold"}}>{n.label}</div><div style={{fontSize:11,opacity:0.7}}>{n.desc}</div></div></button>)}
              </div>
            </div>
            <div style={s.fld}>
              <label style={s.lbl}>Ocasión de consumo</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {OCASIONES.map(o=><button key={o.id} onClick={()=>setAForm(f=>({...f,ocasion:o.id}))} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:8,cursor:"pointer",border:`1px solid ${aForm.ocasion===o.id?gold:border}`,background:aForm.ocasion===o.id?`${gold}18`:"#110D08",color:aForm.ocasion===o.id?gold:muted,fontSize:13,fontFamily:"inherit"}}><span style={{fontSize:18}}>{o.icon}</span>{o.label}</button>)}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:12}}><button style={s.btnO} onClick={()=>setAScreen("list")}>Cancelar</button><button style={{...s.btnG,flex:1}} onClick={saveWine}>{aEditing?"Guardar cambios ✓":"Agregar al catálogo 🍷"}</button></div>
        </div>
      </div>
    );

    // Admin list
    return (
      <div style={s.app}><Toast/>
        {delConfirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{background:card,border:`1px solid ${wine}`,borderRadius:14,padding:24,maxWidth:300,width:"100%",textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>⚠️</div><div style={{fontSize:15,fontWeight:"bold",color:cream,marginBottom:8}}>¿Eliminar "{delConfirm.nombre}"?</div><div style={{display:"flex",gap:10,marginTop:16}}><button style={{...s.btnO,flex:1}} onClick={()=>setDelConfirm(null)}>Cancelar</button><button style={{...s.btnD,flex:1,background:wine,color:cream}} onClick={()=>deleteWine(delConfirm)}>Eliminar</button></div></div></div>}
        <div style={s.top}>
          <div><div style={{fontSize:13,letterSpacing:3,color:gold,textTransform:"uppercase",fontWeight:"bold"}}>Admin 🍷</div><div style={{fontSize:10,color:muted}}>{aAuthed.role}</div></div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={()=>setMode("user")} style={{...s.btnO,padding:"6px 12px",fontSize:11}}>Ver plataforma</button>
            <button onClick={()=>setAAuthed(null)} style={{background:"none",border:"none",color:muted,fontSize:11,cursor:"pointer"}}>Salir</button>
          </div>
        </div>
        <div style={s.body}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
            {[[catalog.length,"🍷","Total"],[catalog.filter(w=>w.activo).length,"✅","Publicados"],[catalog.filter(w=>!w.activo).length,"⊘","Ocultos"]].map(([n,i,l])=><div key={l} style={{...s.card,textAlign:"center",padding:12}}><div style={{fontSize:18}}>{i}</div><div style={{fontSize:20,fontWeight:"bold",color:gold}}>{n}</div><div style={{fontSize:10,color:muted}}>{l}</div></div>)}
          </div>
          <input style={{...s.inp(false),marginBottom:10}} placeholder="🔍 Buscar..." value={aSearch} onChange={e=>setASearch(e.target.value)}/>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:12}}>{aCepas.map(c=><button key={c} onClick={()=>setAFilter(c)} style={{background:aFilter===c?gold:"#110D08",color:aFilter===c?"#1a0d06":muted,border:`1px solid ${aFilter===c?gold:border}`,borderRadius:20,padding:"5px 13px",fontSize:11,whiteSpace:"nowrap",cursor:"pointer",fontWeight:aFilter===c?"bold":"normal"}}>{c}</button>)}</div>
          <button style={{...s.btnG,width:"100%",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8}} onClick={()=>{setAEditing(null);setAForm(EMPTY_WINE);setAErr({});setAScreen("form");}}>＋ Agregar nuevo vino</button>
          {aFiltered.length===0?<div style={{textAlign:"center",padding:"40px 20px",color:muted}}><div style={{fontSize:40,marginBottom:12}}>🍾</div><div style={{fontSize:14,color:cream}}>{catalog.length===0?"Catálogo vacío":"Sin resultados"}</div></div>
          :aFiltered.map(w=><div key={w.id} style={{...s.card,cursor:"pointer"}} onClick={()=>{setAEditing(w);setAScreen("detail");}}>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:50,height:50,borderRadius:9,background:"#150f08",border:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>{w.imagen?<img src={w.imagen} style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<span style={{fontSize:24}}>🍷</span>}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><span style={{fontSize:14,fontWeight:"bold",color:cream}}>{w.nombre}</span><span style={{...s.pill(w.activo?"#2D8C2D":"#5A3A3A"),fontSize:10,padding:"2px 7px"}}>{w.activo?"✓":"○"}</span></div>
                <div style={{fontSize:12,color:muted,marginBottom:4}}>{w.bodega} · {w.anada}</div>
                <div style={{display:"flex",gap:6}}><span style={s.pill(gold)}>{w.cepa}</span><span style={s.pill("#6A5A4A")}>{w.origen?.split(",")[0]}</span></div>
              </div>
              <div style={{color:muted,fontSize:18}}>›</div>
            </div>
          </div>)}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // USER MODE — LOGIN
  // ════════════════════════════════════════════
  if(uScreen==="login") return (
    <div style={{...s.app,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32}}>
      <Toast/>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:64,marginBottom:14}}>🍷</div>
        <div style={{fontSize:11,letterSpacing:6,color:gold,textTransform:"uppercase",marginBottom:8}}>Vinoteca</div>
        <div style={{fontSize:26,fontWeight:"bold",color:cream,lineHeight:1.2,marginBottom:8}}>Club de Cata · Lima</div>
        <div style={{fontSize:13,color:muted,lineHeight:1.6}}>Ingresa tu email para acceder<br/>a tu cava personal.</div>
      </div>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={s.fld}>
          <label style={s.lbl}>Tu email</label>
          <input
            style={s.inp(loginErr)}
            type="email"
            placeholder="correo@email.com"
            value={loginEmail}
            onChange={e=>{ setLoginEmail(e.target.value); setLoginErr(""); }}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            autoFocus
          />
          {loginErr&&<div style={s.err}>⚠ {loginErr}</div>}
        </div>
        <button style={{...s.btnP,opacity:loginLoad?0.6:1}} onClick={handleLogin} disabled={loginLoad}>
          {loginLoad?"Verificando...":"Ingresar →"}
        </button>
        <div style={{textAlign:"center",marginTop:16,fontSize:12,color:muted}}>
          ¿No tienes cuenta?{" "}
          <span onClick={()=>{setRegStep(1);setUScreen("register");}} style={{color:gold,cursor:"pointer",textDecoration:"underline"}}>Regístrate aquí</span>
        </div>
        <div style={{textAlign:"center",marginTop:24}}>
          <button onClick={()=>{setMode("admin");setAScreen("list");}} style={{background:"none",border:"none",color:"#3A2A1A",fontSize:11,cursor:"pointer"}}>⚙️ Acceso administración</button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════
  // USER MODE — REGISTER
  // ════════════════════════════════════════════
  if(uScreen==="register") return (
    <div style={s.app}><Toast/>
      <Topbar left={<button onClick={()=>regStep===1?setUScreen("login"):setRegStep(s=>s-1)} style={{background:"none",border:"none",color:gold,fontSize:20,cursor:"pointer"}}>←</button>} center="Crear cuenta" right={<div style={{display:"flex",gap:6}}>{[1,2].map(i=><div key={i} style={{width:regStep===i?24:7,height:7,borderRadius:4,background:regStep>i?gold:regStep===i?wine:border,transition:"all 0.3s"}}/>)}</div>}/>
      <div style={s.body}>
        {regStep===1&&(<>
          <div style={{marginBottom:22}}><div style={{fontSize:20,fontWeight:"bold",color:cream,marginBottom:4}}>Tus datos</div><div style={{fontSize:13,color:muted}}>Solo para enviarte novedades del club.</div></div>
          <div style={s.fld}><label style={s.lbl}>Nombre completo</label><input style={s.inp(regErr.nombre)} placeholder="Tu nombre" value={regForm.nombre} onChange={e=>rSet("nombre",e.target.value)}/>{regErr.nombre&&<div style={s.err}>⚠ {regErr.nombre}</div>}</div>
          <div style={s.fld}><label style={s.lbl}>Email</label><input style={s.inp(regErr.email)} type="email" placeholder="correo@email.com" value={regForm.email} onChange={e=>rSet("email",e.target.value)}/>{regErr.email&&<div style={s.err}>⚠ {regErr.email}</div>}</div>
          <div style={s.fld}><label style={s.lbl}>WhatsApp</label><input style={s.inp(regErr.telefono)} type="tel" placeholder="9XXXXXXXX" value={regForm.telefono} onChange={e=>rSet("telefono",e.target.value)}/>{regErr.telefono&&<div style={s.err}>⚠ {regErr.telefono}</div>}</div>
          <div style={s.fld}><label style={s.lbl}>Distrito</label><select style={s.sel(regErr.distrito)} value={regForm.distrito} onChange={e=>rSet("distrito",e.target.value)}><option value="">Selecciona tu distrito</option>{DISTRITOS.map(d=><option key={d} value={d}>{d}</option>)}</select>{regErr.distrito&&<div style={s.err}>⚠ {regErr.distrito}</div>}</div>
          <div style={s.fld}><label style={s.lbl}>Edad</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{EDADES.map(e=><button key={e} onClick={()=>rSet("edad",e)} style={{padding:"8px 14px",borderRadius:7,cursor:"pointer",border:`1px solid ${regForm.edad===e?gold:border}`,background:regForm.edad===e?`${gold}22`:"#110D08",color:regForm.edad===e?gold:muted,fontSize:13,fontFamily:"inherit"}}>{e}</button>)}</div>{regErr.edad&&<div style={s.err}>⚠ {regErr.edad}</div>}</div>
          <div style={{height:1,background:border,margin:"8px 0 16px"}}/>
          <div style={s.fld}><div onClick={()=>rSet("mayorEdad",!regForm.mayorEdad)} style={{display:"flex",gap:12,alignItems:"flex-start",background:"#110D08",border:`1px solid ${regErr.mayorEdad?wine:border}`,borderRadius:8,padding:14,cursor:"pointer"}}><div style={{width:20,height:20,borderRadius:4,border:`2px solid ${regForm.mayorEdad?gold:border}`,background:regForm.mayorEdad?gold:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#1a0d06",flexShrink:0,marginTop:1}}>{regForm.mayorEdad?"✓":""}</div><div style={{fontSize:13,color:"#9A8A7A",lineHeight:1.5}}>Confirmo que soy <strong style={{color:cream}}>mayor de 18 años</strong> y acepto recibir comunicaciones de Vinoteca.</div></div>{regErr.mayorEdad&&<div style={s.err}>⚠ {regErr.mayorEdad}</div>}</div>
          <button style={s.btnP} onClick={()=>{if(validateReg())setRegStep(2);}}>Continuar →</button>
        </>)}
        {regStep===2&&(<>
          <div style={{marginBottom:22}}><div style={{fontSize:20,fontWeight:"bold",color:cream,marginBottom:4}}>Tu relación con el vino</div><div style={{fontSize:13,color:muted}}>Para curarte los mejores vinos.</div></div>
          <div style={s.fld}><label style={s.lbl}>¿Con qué frecuencia tomas vino?</label><div style={{display:"flex",flexDirection:"column",gap:8}}>{FRECUENCIAS.map(f=><button key={f.id} onClick={()=>rSet("frecuencia",f.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:8,cursor:"pointer",border:`1px solid ${regForm.frecuencia===f.id?gold:border}`,background:regForm.frecuencia===f.id?`${gold}18`:"#110D08",color:regForm.frecuencia===f.id?gold:muted,fontSize:13,fontFamily:"inherit",textAlign:"left"}}><span style={{fontSize:18}}>{f.icon}</span>{f.label}</button>)}</div>{regErr.frecuencia&&<div style={s.err}>⚠ {regErr.frecuencia}</div>}</div>
          <div style={s.fld}><label style={s.lbl}>Cepas favoritas <span style={{textTransform:"none",letterSpacing:0,color:"#5A4A3A"}}>(elige todas las que quieras)</span></label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{CEPAS_REG.map(c=><button key={c} onClick={()=>toggleCepa(c)} style={{padding:"9px 10px",borderRadius:8,cursor:"pointer",border:`1px solid ${regForm.cepas.includes(c)?wine:border}`,background:regForm.cepas.includes(c)?`${wine}22`:"#110D08",color:regForm.cepas.includes(c)?"#E8A090":muted,fontSize:12,fontFamily:"inherit",textAlign:"center"}}>{c}</button>)}</div>{regForm.cepas.includes("Otra")&&<input style={{...s.inp(false),marginTop:10}} placeholder="¿Cuál cepa? ej. Nebbiolo, Grenache..." value={regForm.cepaOtra} onChange={e=>rSet("cepaOtra",e.target.value)}/>}{regErr.cepas&&<div style={s.err}>⚠ {regErr.cepas}</div>}</div>
          <button style={{...s.btnP,opacity:regSend?0.6:1}} onClick={submitReg} disabled={regSend}>{regSend?"Creando cuenta...":"¡Crear mi cuenta! 🍷"}</button>
          <div style={{textAlign:"center",fontSize:11,color:"#4A3A2A",marginTop:14}}>🔒 Tus datos son privados</div>
        </>)}
      </div>
    </div>
  );

  // ════════════════════════════════════════════
  // USER MODE — RATING
  // ════════════════════════════════════════════
  if(uScreen==="rating"&&rWine){
    const st=getStats(rWine.id);
    const revs=ratings[rWine.id]?Object.entries(ratings[rWine.id]):[];
    return (
      <div style={s.app}><Toast/>
        <Topbar left={<button onClick={()=>setUScreen(selWine?"wineDetail":"home")} style={{background:"none",border:"none",color:gold,fontSize:20,cursor:"pointer"}}>←</button>} center="Catar Vino" right={null}/>
        <div style={s.body}>
          <div style={{background:"linear-gradient(135deg,#2a1508,#1c1008)",border:`1px solid ${gold}33`,borderRadius:16,padding:24,marginBottom:20,textAlign:"center"}}>
            {rWine.imagen?<img src={rWine.imagen} style={{width:120,height:120,objectFit:"contain",borderRadius:12,marginBottom:12,border:`1px solid ${gold}22`}}/>:<div style={{fontSize:56,marginBottom:12}}>🍷</div>}
            <div style={{fontSize:20,fontWeight:"bold",color:cream,marginBottom:4}}>{rWine.nombre}</div>
            <div style={{fontSize:13,color:muted,marginBottom:12}}>{rWine.bodega} · {rWine.anada}</div>
            <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}><span style={s.pill(gold)}>{rWine.cepa}</span>{st.count>0&&<span style={s.pill("#7A6A5A")}>★ {st.avg} ({st.count} votos)</span>}</div>
          </div>
          {rWine.notas&&<div style={{...s.card,marginBottom:16}}><div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:8}}>📝 Nota del Sommelier</div><div style={{fontSize:13,color:cream,lineHeight:1.7,fontStyle:"italic"}}>"{rWine.notas}"</div>{rWine.taninos&&<div style={{marginTop:8,fontSize:12,color:muted}}>Taninos: <span style={{color:cream}}>{rWine.taninos}</span></div>}</div>}
          {rWine.maridaje&&<div style={{...s.card,marginBottom:16}}><div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:8}}>🍽️ Maridaje recomendado</div><div style={{fontSize:13,color:cream,lineHeight:1.7}}>{rWine.maridaje}</div></div>}
          <div style={{...s.card,marginBottom:16}}>
            <div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:14}}>Tu puntuación</div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><Stars value={rVal} onChange={v=>{setRVal(v);setRSaved(false);}} size={34}/></div>
            <label style={s.lbl}>Tus notas <span style={{textTransform:"none",letterSpacing:0,color:"#5A4A3A"}}>(opcional)</span></label>
            <textarea style={s.ta()} placeholder="¿Qué aromas, sabores o sensaciones encontraste?" value={rNote} onChange={e=>{setRNote(e.target.value);setRSaved(false);}}/>
            <div style={{height:12}}/>
            <button onClick={saveRating} style={{...rVal?s.btnG:s.btnO,width:"100%",background:rSaved?"linear-gradient(135deg,#1a5c1a,#2d8c2d)":rVal?undefined:"transparent",color:rSaved?cream:rVal?"#1a0d06":muted,opacity:rVal?1:0.5}}>{rSaved?"✓ Guardado en tu cava":"Guardar en mi cava 🗂️"}</button>
          </div>
          {revs.length>0&&<><div style={{fontSize:10,letterSpacing:2,color:muted,textTransform:"uppercase",marginBottom:12}}>La comunidad dice</div>{revs.map(([n,d])=><div key={n} style={{...s.card,padding:14,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:d.nota?6:0}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:`${gold}22`,border:`1px solid ${gold}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:gold,fontWeight:"bold"}}>{n[0].toUpperCase()}</div><span style={{fontSize:13,color:cream}}>{n}</span></div><Stars value={d.score} size={14} readonly/></div>{d.nota&&<div style={{fontSize:12,color:muted,fontStyle:"italic",lineHeight:1.5,paddingLeft:36}}>"{d.nota}"</div>}</div>)}</>}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // USER MODE — HOME
  // ════════════════════════════════════════════
  return (
    <div style={s.app}><Toast/>

      {/* Wine detail overlay */}
      {uScreen==="wineDetail"&&selWine&&(
        <div style={{position:"fixed",inset:0,background:bg,zIndex:50,overflowY:"auto",maxWidth:430,margin:"0 auto"}}>
          <Topbar left={<button onClick={()=>setUScreen("home")} style={{background:"none",border:"none",color:gold,fontSize:20,cursor:"pointer"}}>←</button>} center="Detalle" right={null}/>
          <div style={{padding:"20px 16px 100px"}}>
            <div style={{background:"linear-gradient(135deg,#2a1508,#1c1008)",border:`1px solid ${gold}33`,borderRadius:16,padding:24,marginBottom:20,textAlign:"center"}}>
              {selWine.imagen?<img src={selWine.imagen} style={{width:130,height:130,objectFit:"contain",borderRadius:12,marginBottom:12,border:`1px solid ${gold}22`}}/>:<div style={{fontSize:56,marginBottom:12}}>🍷</div>}
              <div style={{fontSize:21,fontWeight:"bold",color:cream,marginBottom:4}}>{selWine.nombre}</div>
              <div style={{fontSize:13,color:muted,marginBottom:14}}>{selWine.bodega} · {selWine.anada}</div>
              <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
                <span style={s.pill(gold)}>{selWine.cepa}</span>
                {getStats(selWine.id).count>0&&<span style={s.pill("#7A6A5A")}>★ {getStats(selWine.id).avg} ({getStats(selWine.id).count})</span>}
                {cava.probados[selWine.id]&&<span style={s.pill("#2D8C2D")}>✓ En tu cava</span>}
                {selWine.nivel&&(()=>{const n=NIVELES.find(x=>x.id===selWine.nivel);return n?<span style={s.pill("#4A3A1A")}>{n.icon} {n.label}</span>:null;})()}
                {selWine.ocasion&&(()=>{const o=OCASIONES.find(x=>x.id===selWine.ocasion);return o?<span style={s.pill("#3A3A1A")}>{o.icon} {o.label}</span>:null;})()}
              </div>
              <div style={{fontSize:12,color:muted}}>📍 {selWine.origen}</div>
            </div>
            {selWine.notas&&<div style={{...s.card,marginBottom:16}}><div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:8}}>📝 Nota del Sommelier</div><div style={{fontSize:13,color:cream,lineHeight:1.7,fontStyle:"italic"}}>"{selWine.notas}"</div>{selWine.taninos&&<div style={{marginTop:8,fontSize:12,color:muted}}>Taninos: <span style={{color:cream}}>{selWine.taninos}</span></div>}</div>}
            {selWine.maridaje&&<div style={{...s.card,marginBottom:16}}><div style={{fontSize:10,letterSpacing:2,color:gold,textTransform:"uppercase",marginBottom:8}}>🍽️ Maridaje recomendado</div><div style={{fontSize:13,color:cream,lineHeight:1.7}}>{selWine.maridaje}</div></div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>openRating(selWine)} style={{...s.btnP,flex:2}}>{cava.probados[selWine.id]?"Editar mi cata 🍷":"Agregar a probados 🍷"}</button>
              {!cava.probados[selWine.id]&&<button onClick={()=>addPendiente(selWine)} style={{...s.btnO,flex:1,color:cava.pendientes.includes(selWine.id)?gold:muted,borderColor:cava.pendientes.includes(selWine.id)?gold:border}}>{cava.pendientes.includes(selWine.id)?"📌 Guardado":"📌 Quiero probar"}</button>}
            </div>
          </div>
        </div>
      )}

      <div style={s.top}>
        <div><div style={{fontSize:14,letterSpacing:3,color:gold,textTransform:"uppercase",fontWeight:"bold"}}>Vinoteca 🍷</div><div style={{fontSize:10,color:muted}}>Club de Cata · Lima</div></div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,color:cream}}>{user?.nombre}</div>
            <div style={{fontSize:10,color:muted}}>{probadosCount} vinos catados</div>
          </div>
          <button onClick={handleLogout} title="Cerrar sesión" style={{background:"none",border:"none",color:muted,fontSize:18,cursor:"pointer",padding:4}}>⏻</button>
        </div>
      </div>

      <div style={{display:"flex",background:"#0f0906",borderBottom:`1px solid ${border}`,position:"sticky",top:57,zIndex:19}}>
        {[["catalogo","🍾 Catálogo"],["cava","🗂️ Mi Cava"],["ranking","🏆 Ranking"]].map(([id,label])=><button key={id} style={s.tab(uTab===id)} onClick={()=>setUTab(id)}>{label}</button>)}
      </div>

      <div style={s.body}>
        {/* CATÁLOGO */}
        {uTab==="catalogo"&&(<>
          <input style={{...s.inp(false),marginBottom:12}} placeholder="🔍 Buscar vino o bodega..." value={uSearch} onChange={e=>setUSearch(e.target.value)}/>
          {/* Nivel chips — filtro primario */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            {[{id:"Todas",icon:"🍷",label:"Todos"},{id:"empezar",icon:"🟢",label:"Empezar"},{id:"explorar",icon:"🟡",label:"Explorar"},{id:"coleccionista",icon:"🔴",label:"Experto"}].map(n=>(
              <button key={n.id} onClick={()=>setUNivel(n.id)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 8px",borderRadius:10,cursor:"pointer",border:`2px solid ${uNivel===n.id?gold:border}`,background:uNivel===n.id?`${gold}22`:"#110D08",color:uNivel===n.id?gold:muted,fontSize:12,fontWeight:uNivel===n.id?"bold":"normal",fontFamily:"inherit",transition:"all 0.2s",width:"100%"}}>
                <span style={{fontSize:16}}>{n.icon}</span><span>{n.label}</span>
              </button>
            ))}
          </div>
          {/* Cepa chips — filtro secundario */}
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:8}}>{uCepas.map(c=><button key={c} onClick={()=>setUFilter(c)} style={{background:uFilter===c?gold:"#110D08",color:uFilter===c?"#1a0d06":muted,border:`1px solid ${uFilter===c?gold:border}`,borderRadius:20,padding:"5px 13px",fontSize:11,whiteSpace:"nowrap",cursor:"pointer",fontWeight:uFilter===c?"bold":"normal"}}>{c}</button>)}</div>
          {uFiltered.length===0?<div style={{textAlign:"center",padding:"48px 20px",color:muted}}><div style={{fontSize:40,marginBottom:12}}>🍾</div><div style={{fontSize:14,color:cream,marginBottom:6}}>{publicCatalog.length===0?"El catálogo está vacío":"Sin resultados"}</div><div style={{fontSize:12}}>{publicCatalog.length===0?"Pronto el sommelier agregará vinos":"Intenta con otro filtro"}</div></div>
          :uFiltered.map(w=>{ const st=getStats(w.id); return <div key={w.id} style={{...s.card,cursor:"pointer"}} onClick={()=>{setSelWine(w);setUScreen("wineDetail");}}>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:56,height:56,borderRadius:10,background:"#150f08",border:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>{w.imagen?<img src={w.imagen} style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<span style={{fontSize:28}}>🍷</span>}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:"bold",color:cream,marginBottom:2}}>{w.nombre}</div>
                <div style={{fontSize:12,color:muted,marginBottom:6}}>{w.bodega} · {w.anada}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={s.pill(gold)}>{w.cepa}</span>
                  {w.nivel&&(()=>{const n=NIVELES.find(x=>x.id===w.nivel);return n?<span style={{...s.pill("#4A3A1A"),fontSize:10}}>{n.icon} {n.label}</span>:null;})()}
                  {w.ocasion&&(()=>{const o=OCASIONES.find(x=>x.id===w.ocasion);return o?<span style={{...s.pill("#3A3A1A"),fontSize:10}}>{o.icon} {o.label}</span>:null;})()}
                  {st.count>0&&<span style={{fontSize:12,color:gold}}>★ {st.avg} <span style={{color:"#5A4A3A"}}>({st.count})</span></span>}
                  {cava.probados[w.id]&&<span style={s.pill("#2D8C2D")}>✓</span>}
                  {cava.pendientes.includes(w.id)&&<span style={s.pill("#5A4A2A")}>📌</span>}
                </div>
              </div>
              <div style={{color:muted,fontSize:18}}>›</div>
            </div>
          </div>; })}
        </>)}

        {/* MI CAVA */}
        {uTab==="cava"&&(<>
          <div style={{...s.card,textAlign:"center",marginBottom:16,background:"linear-gradient(135deg,#1e1208,#150d06)"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:`${gold}22`,border:`2px solid ${gold}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:gold,fontWeight:"bold",margin:"0 auto 10px"}}>{user?.nombre?.[0]?.toUpperCase()}</div>
            <div style={{fontSize:17,fontWeight:"bold",color:cream,marginBottom:2}}>{user?.nombre}</div>
            <div style={{fontSize:11,color:muted,marginBottom:14}}>Miembro desde {user?.joined}</div>
            <div style={{display:"flex",justifyContent:"center",gap:28}}>{[[probadosCount,"Probados"],[cava.pendientes.length,"Pendientes"],[earnedBadges.length,"Insignias"]].map(([n,l])=><div key={l}><div style={{fontSize:22,fontWeight:"bold",color:gold}}>{n}</div><div style={{fontSize:10,color:muted,letterSpacing:1}}>{l.toUpperCase()}</div></div>)}</div>
          </div>
          {earnedBadges.length>0&&<div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:16}}>{earnedBadges.map(b=><div key={b.id} style={{background:`${gold}18`,border:`1px solid ${gold}44`,borderRadius:10,padding:"8px 14px",textAlign:"center",flexShrink:0,minWidth:90}}><div style={{fontSize:24}}>{b.icon}</div><div style={{fontSize:11,color:gold,marginTop:4}}>{b.label}</div></div>)}</div>}
          <div style={{display:"flex",background:"#0f0906",borderRadius:8,overflow:"hidden",border:`1px solid ${border}`,marginBottom:16}}>
            {[["probados",`✓ Probados (${probadosCount})`],["pendientes",`📌 Pendientes (${cava.pendientes.length})`]].map(([id,label])=><button key={id} style={{flex:1,padding:"10px 8px",fontSize:12,cursor:"pointer",border:"none",background:cavaTab===id?`${wine}33`:"transparent",color:cavaTab===id?cream:muted,fontFamily:"inherit",borderBottom:cavaTab===id?`2px solid ${wine}`:`2px solid transparent`}} onClick={()=>setCavaTab(id)}>{label}</button>)}
          </div>
          {cavaTab==="probados"&&(Object.keys(cava.probados).length===0
            ?<div style={{textAlign:"center",padding:"40px 20px",color:muted}}><div style={{fontSize:40,marginBottom:12}}>🗂️</div><div style={{fontSize:14,color:cream,marginBottom:6}}>Tu cava está vacía</div><div style={{fontSize:12}}>Ve al catálogo y agrega tu primer vino</div></div>
            :Object.entries(cava.probados).map(([id,data])=>{ const w=publicCatalog.find(x=>x.id===parseInt(id)||x.id===id); if(!w)return null; return <div key={id} style={s.card}><div style={{display:"flex",gap:12,alignItems:"center",marginBottom:data.nota?8:0}}><div style={{width:48,height:48,borderRadius:9,background:"#150f08",border:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>{w.imagen?<img src={w.imagen} style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<span style={{fontSize:24}}>🍷</span>}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:"bold",color:cream,marginBottom:2}}>{w.nombre}</div><div style={{fontSize:12,color:muted,marginBottom:4}}>{w.bodega}</div><Stars value={data.score} size={14} readonly/></div><button onClick={()=>openRating(w)} style={{...s.btnO,padding:"6px 12px",fontSize:11}}>Editar</button></div>{data.nota&&<div style={{fontSize:12,color:muted,fontStyle:"italic",lineHeight:1.5,paddingLeft:60}}>"{data.nota}"</div>}<div style={{fontSize:10,color:"#4A3A2A",textAlign:"right",marginTop:4}}>{data.fecha}</div></div>; })
          )}
          {cavaTab==="pendientes"&&(cava.pendientes.length===0
            ?<div style={{textAlign:"center",padding:"40px 20px",color:muted}}><div style={{fontSize:40,marginBottom:12}}>📌</div><div style={{fontSize:14,color:cream,marginBottom:6}}>Sin pendientes</div><div style={{fontSize:12}}>Toca 📌 en cualquier vino del catálogo</div></div>
            :cava.pendientes.map(id=>{ const w=publicCatalog.find(x=>x.id===id||x.id===parseInt(id)); if(!w)return null; return <div key={id} style={s.card}><div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:48,height:48,borderRadius:9,background:"#150f08",border:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>{w.imagen?<img src={w.imagen} style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<span style={{fontSize:24}}>🍷</span>}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:"bold",color:cream,marginBottom:2}}>{w.nombre}</div><div style={{fontSize:12,color:muted}}>{w.bodega} · {w.cepa}</div></div><div style={{display:"flex",flexDirection:"column",gap:6}}><button onClick={()=>openRating(w)} style={{...s.btnG,padding:"6px 10px",fontSize:11}}>Catar</button><button onClick={async()=>await saveCava({...cava,pendientes:cava.pendientes.filter(p=>p!==id)})} style={{...s.btnO,padding:"5px 10px",fontSize:10}}>✕</button></div></div></div>; })
          )}
          {(()=>{ const nx=BADGES.find(b=>probadosCount<b.req); if(!nx) return null; const rem=nx.req-probadosCount; return <div style={{...s.card,marginTop:8,textAlign:"center",background:"linear-gradient(135deg,#1a1208,#120d06)"}}><div style={{fontSize:10,color:muted,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Próxima insignia</div><div style={{fontSize:28,marginBottom:4}}>{nx.icon}</div><div style={{fontSize:14,fontWeight:"bold",color:gold,marginBottom:4}}>{nx.label}</div><div style={{fontSize:12,color:muted}}>Faltan <strong style={{color:cream}}>{rem}</strong> vino{rem!==1?"s":""}</div><div style={{marginTop:10,height:6,background:"#2A1E14",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(probadosCount/nx.req)*100}%`,background:`linear-gradient(90deg,${wine},${gold})`,borderRadius:3}}/></div></div>; })()}
        </>)}

        {/* RANKING */}
        {uTab==="ranking"&&(<>
          <div style={{fontSize:10,color:muted,letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>Top vinos de la comunidad</div>
          {topWines.length===0?<div style={{textAlign:"center",padding:"48px 20px",color:muted}}><div style={{fontSize:40,marginBottom:12}}>🏆</div><div style={{fontSize:14,color:cream,marginBottom:6}}>Aún sin ratings</div><div style={{fontSize:12}}>¡Sé el primero en catar un vino!</div></div>
          :topWines.map((w,i)=><div key={w.id} style={{...s.card,cursor:"pointer"}} onClick={()=>openRating(w)}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:i<3?"24px":"16px",width:32,textAlign:"center",flexShrink:0}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div><div style={{width:44,height:44,borderRadius:9,background:"#150f08",border:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>{w.imagen?<img src={w.imagen} style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<span style={{fontSize:22}}>🍷</span>}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:"bold",color:cream,marginBottom:2}}>{w.nombre}</div><div style={{fontSize:12,color:muted}}>{w.bodega}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:22,fontWeight:"bold",color:gold}}>{w.avg}</div><div style={{fontSize:10,color:muted}}>{w.count} votos</div></div></div></div>)}
        </>)}

        <div style={{marginTop:16,textAlign:"center"}}>
          <button onClick={()=>setMode("admin")} style={{background:"none",border:"none",color:"#3A2A1A",fontSize:11,cursor:"pointer"}}>⚙️ Administración</button>
        </div>
      </div>
    </div>
  );
}
