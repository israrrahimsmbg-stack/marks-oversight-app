/* ===================== shell: menu, routing, demo controls ===================== */

let route = { view:"dashboard", a:null, b:null };
function parseHash(){ const p = (location.hash || "#/dashboard").replace(/^#\/?/, "").split("/").map(decodeURIComponent); route = { view:p[0] || "dashboard", a:p[1] || null, b:p[2] || null }; }

function navModel(){
  const u = me(), ho = QA.HEAD_OFFICE.includes(u.role);
  const late = visibleChecks().filter(isLate);
  const t = today();
  const overdueA = visibleActions().filter(a => QA.actionFlags(a, t).overdue).length;
  const todo = visibleChecks().filter(e => mineToDo(e) && ["outstanding","pending","due_soon"].includes(e.status.state)).length;
  const groups = [
    ["Overview", [["dashboard","Overview","dash"], ho || u.role === "viewer" ? ["report","Monday report","report"] : null, ["alerts", ho ? "Alerts" : "My alerts","bell", null]]],
    ["My work", [!ho && u.role !== "viewer" ? ["checks","To do","todo", todo] : ["checks/late","Not done","alert", late.length, true], ["actions","Actions","flag", overdueA, true], ["calendar","Forward look","cal"]]],
    ["Modules", visibleModules().map(m => ["module/" + m.key, m.label, m.icon, late.filter(e => e.module.key === m.key).length, m.priority === "999"])],
    ["Homes", [["homes", ho ? "Homes & rollout" : "My homes", "home"]]],
    ho ? ["Admin", [["admin/setup","Homes & modules","sliders"], ["admin/people","People & roles","people"], ["admin/access","Who can do what","key"], ["admin/alerts","Alert rules","bell"], ["admin/library","Check library","book"], cap("audit_log") ? ["admin/activity","Activity log","activity"] : null]] : ["Reference", [["admin/library","Check library","book"]]],
    ["Help", [["help","How it works","book"]]]
  ];
  return groups.map(([g, items]) => [g, items.filter(Boolean)]).filter(g => g[1].length);
}
function renderNav(){
  const cur = [route.view, route.a].filter(Boolean).join("/");
  const nav = document.getElementById("nav");
  nav.replaceChildren(...navModel().flatMap(([g, items]) => [h("div",{class:"navlbl",text:g}), ...items.map(([k, l, ic, n, hot]) => h("button",{type:"button",class:"navbtn","aria-current": (cur === k || (route.view === k) || (k.startsWith(route.view + "/") && k.split("/")[1] === route.a)) ? "page" : null, onclick:()=>{ document.querySelector(".app").classList.remove("open"); go("#/" + k); }}, icon(ic), h("span",{text:l}), n ? h("span",{class:"cnt" + (hot ? " hot" : ""),text:String(n)}) : null))]));
  const u = me();
  document.getElementById("me").replaceChildren(h("div",{class:"av",text:initials(u.name)}), h("div",null, h("b",{text:u.name}), h("small",{text:roleLabel(u.role)})));
  // demo panel: view as, today, home filter
  const people = Object.values(S.users).filter(x => x.role !== "support_worker").sort((a,b) => QA.ROLE_ORDER.indexOf(a.role) - QA.ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name));
  const hf = myHomes();
  document.getElementById("demo").replaceChildren(...[
    h("label",null, "View as (demo)", sel(people.map(x => [x.id, `${x.name} · ${roleLabel(x.role)}${QA.ROLES[x.role].scope === "assigned" ? " · " + (x.homes||[]).map(id => (S.homes[id]||{}).name).join(", ") : ""}`]), u.id, v => { S.session.userId = v; S.session.home = "all"; S.ui = null; save(); EV = null; go("#/dashboard"); render(); })),
    hf.length > 1 ? h("label",null, "Homes", sel([["all","All my homes"], ...hf.map(x => [x.id, x.name])], S.session.home || "all", v => { S.session.home = v; save(); render(); })) : null,
    h("label",null, "Today (demo)", h("input",{type:"date",value:today(),onchange:e => { S.session.today = e.target.value || null; save(); EV = null; render(); }}))].filter(Boolean));
  document.getElementById("demosum").textContent = `Demo · viewing as ${u.name.split(" ")[0]} · ${dl(today())}`;
  const th = lsGet("esto-qa-theme") || "auto";
  document.getElementById("theme").replaceChildren(...[["auto","Auto"],["light","Light"],["dark","Dark"]].map(([k,l]) => h("button",{type:"button","aria-pressed":String(th === k),onclick:()=>{ lsSet("esto-qa-theme", k); applyTheme(); renderNav(); },text:l})));
}
function applyTheme(){ const th = lsGet("esto-qa-theme") || "auto"; if (th === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", th); }

function render(){
  EV = null; evaluate();
  const c = document.getElementById("canvas"), sy = c ? c.scrollTop : 0;
  const sameView = render.last === location.hash;
  renderNav();
  let el;
  try {
    const v = route.view, a = route.a;
    if (v === "dashboard") el = viewDashboard();
    else if (v === "checks") el = viewChecks(a);
    else if (v === "check") el = viewCheck(a);
    else if (v === "actions") el = viewActions(a);
    else if (v === "report") el = viewReport();
    else if (v === "alerts") el = viewAlerts();
    else if (v === "calendar") el = viewCalendar();
    else if (v === "homes") el = viewHomes();
    else if (v === "home") el = viewHome(a, route.b);
    else if (v === "module") el = viewModule(a);
    else if (v === "admin" && a === "setup") el = viewSetup();
    else if (v === "admin" && a === "people") el = viewPeople();
    else if (v === "admin" && a === "access") el = viewAccess();
    else if (v === "admin" && a === "alerts") el = viewAlertRules();
    else if (v === "admin" && a === "library") el = viewLibrary();
    else if (v === "admin" && a === "activity") el = viewActivity();
    else if (v === "help") el = viewHelp();
    else el = viewDashboard();
  } catch(err){ console.error(err); el = h("div",{class:"page"}, h("div",{class:"banner bad",text:"Something went wrong showing this page. Try another section, then come back."}), h("pre",{class:"mail",text:String(err && err.stack || err)})); }
  document.getElementById("view").replaceChildren(el);
  if (c) c.scrollTop = sameView ? sy : 0;
  render.last = location.hash;
}

window.addEventListener("hashchange", () => { parseHash(); if (route.view !== "check") S.ui = null; render(); });
document.getElementById("menu").addEventListener("click", () => document.querySelector(".app").classList.toggle("open"));
document.querySelector(".app").addEventListener("click", e => { const app = document.querySelector(".app"); if (app.classList.contains("open") && !e.target.closest(".rail") && !e.target.closest("#menu")) app.classList.remove("open"); });
applyTheme(); load(); parseHash(); render();
