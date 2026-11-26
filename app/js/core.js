/* ===================== Esto Care QA: core helpers =====================
   Same building blocks as the Esto Care Operations app (h() DOM helper, icon set,
   modal and toast), so the two apps look and behave alike. */

const CFG = QA_CONFIG;
const MODS = CFG.modules;
const MOD = Object.fromEntries(MODS.map(m => [m.key, m]));
const STORE_KEY = "esto-qa-demo-v1";

/* ---------- DOM ---------- */
function h(tag, attrs, ...kids){
  const el = document.createElement(tag);
  if (attrs) for (const [k,v] of Object.entries(attrs)){
    if (v == null || v === false) continue;
    if (k === "class") el.className = v; else if (k === "text") el.textContent = v; else if (k === "html") el.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(9)) if (c != null && c !== false && c !== "") el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}
const IC = {
  dash:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  home:'<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  report:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  check:'<path d="m5 12 5 5 9-10"/>',
  todo:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
  flag:'<path d="M5 21V4h11l-2 4 2 4H5"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pound:'<path d="M17 20H7c2-1 3-3 3-5V8a3 3 0 0 1 6-1M6 13h8"/>',
  pill:'<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="m9 9 6 6"/>',
  shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  flame:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2 2 2 3 1-2 1-4 1-6z"/>',
  drop:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  wrench:'<path d="M14.5 5.5a4 4 0 0 0 4.9 5L21 12l-9 9-3-3 9-9 1.5 1.5"/><path d="M3 21l6-6"/>',
  bed:'<path d="M3 18V7M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/>',
  clipboard:'<path d="M9 4h6v3H9z"/><path d="M8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2"/><path d="M9 12h6M9 16h4"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  people:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 4 6"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  book:'<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h11M9 8h5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  left:'<path d="m15 18-6-6 6-6"/>', right:'<path d="m9 18 6-6-6-6"/>', dl:'<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>', mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  print:'<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z"/>', pause:'<path d="M8 5v14M16 5v14"/>', lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  activity:'<path d="M3 12h4l3 8 4-16 3 8h4"/>', arrowr:'<path d="M5 12h14M13 6l6 6-6 6"/>'
};
function icon(name, size){ const sp = document.createElementNS("http://www.w3.org/2000/svg","svg"); sp.setAttribute("viewBox","0 0 24 24"); sp.setAttribute("fill","none"); sp.setAttribute("stroke","currentColor"); sp.setAttribute("stroke-width","1.8"); sp.setAttribute("stroke-linecap","round"); sp.setAttribute("stroke-linejoin","round"); sp.setAttribute("aria-hidden","true"); if (size) sp.style.width = sp.style.height = size + "px"; sp.innerHTML = IC[name] || IC.grid; return sp; }

/* ---------- dates (ISO strings as UTC days, same as src/rules/dates.js) ---------- */
const realToday = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
const addD = (iso, n) => QA.addDays(iso, n);
const diffD = (a, b) => QA.daysBetween(a, b);
function dl(iso, opts){ if (!iso) return "–"; const d = new Date(String(iso).slice(0,10) + "T12:00:00Z"); return isNaN(d) ? iso : d.toLocaleDateString("en-GB", Object.assign({ day:"numeric", month:"short" }, opts || {})); }
const dlong = iso => dl(iso, { weekday:"short", year:"numeric" });
function tl(iso){ const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("en-GB",{ day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }); }
const nplural = (n, w, p) => `${n} ${n === 1 ? w : (p || w + "s")}`;
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const clone = o => JSON.parse(JSON.stringify(o));
const initials = n => (n||"?").split(/\s+/).filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join("") || "?";
function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); return true; } catch(e){ return false; } }

/* ---------- state ----------
   Preview build: everything lives in this browser (localStorage), seeded with invented
   sample data. The shapes match the SharePoint lists in docs/QA_APP.md, so the live
   build swaps this store for SharePoint (Power Apps) without changing the screens. */
let S = null;
function load(){ const raw = lsGet(STORE_KEY); if (raw) try { S = JSON.parse(raw); if (S && S.v === 1) return; } catch(e){} S = seed(realToday()); save(); }
function save(){ lsSet(STORE_KEY, JSON.stringify(Object.assign({}, S, { ui: undefined }))); }
function resetDemo(){ S = seed(realToday()); save(); location.hash = "#/dashboard"; toast("Demo data reset"); render(); }
const today = () => S.session.today || realToday();
const me = () => S.users[S.session.userId] || Object.values(S.users)[0];
function logAct(text, extra){ S.activity.unshift(Object.assign({ at:new Date().toISOString(), by:me().id, text }, extra || {})); if (S.activity.length > 500) S.activity.length = 500; }

/* ---------- small UI pieces ---------- */
function toast(msg){ const r = document.getElementById("toastroot"); const t = h("div",{class:"toast",role:"status",text:msg}); r.replaceChildren(t); setTimeout(()=>{ if (t.parentNode) t.remove(); }, 2800); }
function spill(state, text){ return h("span",{class:"spill s-" + state, text: text || QA.STATE_LABEL[state] || state}); }
function p999(m){ return m && m.priority === "999" ? h("span",{class:"p999", title:"Priority: fire, certificates, H&S, medication and finance", text:"999"}) : null; }
const BASIS_LABEL = { legal:"Legal requirement", guidance:"Recognised guidance", policy:"Esto Care policy", mixed:"Mixed (see each item)" };
function basis(b){ return h("span",{class:"basis " + b, text: BASIS_LABEL[b] || b}); }
const unverified = () => h("span",{class:"unv", title:"Not yet signed off by the compliance lead", text:"UNVERIFIED"});
function card(title, body, opts = {}){ return h("section",{class:"card" + (opts.cls ? " " + opts.cls : "")}, title ? h("header",null, h("div",null, h("h2",{text:title}), opts.sub ? h("div",{class:"meta",text:opts.sub}) : null), opts.right || null) : null, opts.raw ? body : h("div",{class:"body"}, body)); }
function kpi(lbl, val, sub, tone, ic, onclick){ return h("div",{class:"kpi t-" + (tone||"brand"), role: onclick ? "button" : null, tabindex: onclick ? "0" : null, onclick, onkeydown: onclick ? e => { if (e.key === "Enter") onclick(); } : null}, h("div",{class:"ico"}, icon(ic || "dash")), h("div",{class:"lbl",text:lbl}), h("div",{class:"val num",text:String(val)}), sub ? h("div",{class:"sub",text:sub}) : null); }
function empty(msg, ic){ return h("div",{class:"empty-state"}, icon(ic || "check"), h("div",{text:msg})); }
function phead(eyebrow, title, desc, right){ return h("div",{class:"phead"}, h("div",null, eyebrow ? h("div",{class:"eyebrow",text:eyebrow}) : null, h("h1",{text:title}), desc ? h("p",{text:desc}) : null), right ? h("div",{class:"toolbar"}, right) : null); }
function sel(opts, value, onchange, attrs){ return h("select", Object.assign({ onchange: e => onchange(e.target.value) }, attrs || {}), opts.map(([v, l]) => h("option",{ value:v, selected: String(v) === String(value) ? true : null, text:l }))); }
function link(text, hash){ return h("a",{ href:hash, text }); }
function go(hash){ location.hash = hash; }
function download(name, text, type){ const b = new Blob([text], { type: type || "text/plain" }); const a = h("a",{ href:URL.createObjectURL(b), download:name }); document.body.append(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500); }

/* ---------- modal ---------- */
function closeModal(){ document.getElementById("modalroot").replaceChildren(); document.removeEventListener("keydown", escClose); if (closeModal.ret) try { closeModal.ret.focus(); } catch(e){} }
function escClose(e){ if (e.key === "Escape") closeModal(); }
function openModal(title, body, opts = {}){
  closeModal.ret = document.activeElement;
  const m = h("div",{class:"modal" + (opts.wide ? " wide" : ""),role:"dialog","aria-modal":"true","aria-labelledby":"mtitle"},
    h("header",null, h("div",{style:"flex:1;min-width:0"}, h("h2",{id:"mtitle",text:title}), opts.sub ? h("div",{class:"meta",style:"margin-top:3px",text:opts.sub}) : null), h("button",{type:"button",class:"x","aria-label":"Close",text:"×",onclick:closeModal})),
    h("div",{class:"mb"}, body));
  const sc = h("div",{class:"scrim",onclick:e=>{ if (e.target === sc) closeModal(); }}, m);
  document.getElementById("modalroot").replaceChildren(sc);
  document.addEventListener("keydown", escClose);
  setTimeout(()=>{ const f = m.querySelector("input:not([type=file]):not([type=checkbox]),select,textarea"); f && f.focus(); }, 40);
}
function field(label, input, hint){ return h("label",{class:"f"}, h("span",null, label, hint ? h("small",{text:" " + hint}) : null), input); }
