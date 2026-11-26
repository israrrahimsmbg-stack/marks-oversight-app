/* ===================== model: evaluate checks, access, alerts ===================== */

const cfgNow = () => Object.assign({}, CFG, { levels: S.levels });
const RUNNING = ["live","shadow"];
const HOME_STATUS = { live:"Live", shadow:"Shadow mode", setup:"Setting up", planned:"Not started", paused:"Paused" };
const HOME_STATUS_HINT = { live:"Alerts go to the home team and head office.", shadow:"Checks run, but alerts go only to the app builder and compliance lead while timings are tuned.", setup:"The compliance lead is setting up the drive and trackers. No alerts.", planned:"Waiting its turn in the rollout.", paused:"Temporarily stopped. No alerts." };

let EV = null; // cache for one render
function homesSorted(){ return Object.values(S.homes).sort((a,b) => a.order - b.order); }
function evaluate(){
  const cfg = cfgNow(), t = today();
  const recordOf = id => S.records[id];
  const all = [];
  for (const hm of homesSorted()) {
    if (!RUNNING.includes(hm.status)) continue;
    for (const m of MODS) {
      if (!hm.modules[m.key] || !m.chain) continue;
      for (const c of QA.checksForModule(cfg, hm, m)) all.push({ check:c, module:m, home:hm, status: QA.checkStatus(c, S.records[c.id], { config:cfg, module:m, today:t, recordOf }) });
    }
  }
  const byId = Object.fromEntries(all.map(e => [e.check.id, e]));
  // fire & certificates via the tested rules engine (src/rules)
  const fire = [];
  for (const hm of homesSorted()) {
    if (!RUNNING.includes(hm.status) || !hm.modules.fire_property) continue;
    for (const r of RULES_CONFIG.rules.filter(x => (MOD.fire_property.rules_categories || []).includes(x.category))) {
      const rule = QA.withDefaults(r, RULES_CONFIG.defaults);
      const item = (S.registers.fire[hm.id] || {})[r.key] || {};
      fire.push({ home:hm, rule, item, rag: QA.rag(item, rule, t) });
    }
  }
  EV = { all, byId, fire, t, cfg };
  return EV;
}
const ev = () => EV || evaluate();

/* ---------- access for the person using the app ---------- */
function access(moduleKey, homeId){ return QA.moduleAccess(me(), moduleKey, homeId, S.matrix, homeId ? S.homes[homeId] : null); }
function cap(key){ const u = me(); if (!u) return false; if (u.role === "super_admin") return true; return (S.caps[key] || []).includes(u.role); }
function myHomes(){ return homesSorted().filter(hm => QA.inHome(me(), hm.id)); }
function homeFilterIds(){ const f = S.session.home; const mine = myHomes().map(x => x.id); return f && f !== "all" && mine.includes(f) ? [f] : mine; }
/** modules this user can see in at least one of their running homes */
function visibleModules(){ return MODS.filter(m => myHomes().some(hm => RUNNING.includes(hm.status) && hm.modules[m.key] && access(m.key, hm.id) !== "none")); }
function canSee(e){ return homeFilterIds().includes(e.home.id) && access(e.module.key, e.home.id) !== "none"; }
function canRecord(e){ const a = access(e.module.key, e.home.id); return QA.canRecordLevel(me(), e.check.level, QA.ownerRole(e.module, e.check.level, cfgNow(), e.home), a); }
function canManage(moduleKey, homeId){ return QA.atLeast(access(moduleKey, homeId), "manage"); }
function canSeeAction(a){ return homeFilterIds().includes(a.homeId) && access(a.module, a.homeId) !== "none"; }
function canEditAction(a){ const acc = access(a.module, a.homeId); if (QA.atLeast(acc, "manage")) return true; if (!QA.atLeast(acc, "record")) return false; return a.ownerId === me().id || ["service_manager","deputy_manager"].includes(me().role); }
function canSignOff(a){ const acc = access(a.module, a.homeId); return QA.atLeast(acc, "manage") || (me().role === "service_manager" && QA.atLeast(acc, "record") && a.ownerId !== me().id); }
function mineToDo(e){ if (!canRecord(e)) return false; const owner = QA.ownerRole(e.module, e.check.level, cfgNow(), e.home); return QA.HEAD_OFFICE.includes(me().role) ? false : (owner === me().role || ["service_manager"].includes(me().role)); }

/* ---------- names ---------- */
const uname = id => (S.users[id] || {}).name || "Unassigned";
const roleLabel = r => (QA.ROLES[r] || { label:r }).label;
const levelLabel = l => (S.levels[l] || CFG.levels[l] || { label:l }).label;
const checkTitle = e => `${e.module.label} · ${levelLabel(e.check.level)} · ${e.check.label}`;
function ownersOf(e){ const role = QA.ownerRole(e.module, e.check.level, cfgNow(), e.home); const ppl = QA.LADDER.includes(role) ? QA.staffIn(e.home, role, S.users) : Object.values(S.users).filter(u => u.role === role); return { role, people: ppl }; }
const isBlankSubmit = e => { const r = S.records[e.check.id]; return r && r.submitted && e.status.state !== "complete" && QA.questionsFor(e.module, e.check.level).length > 0; };

/* ---------- worst status for heat cells ---------- */
const RANK = { outstanding:0, blocked:1, pending:2, due_soon:3, in_progress:4, on_hold:5, upcoming:6, complete:7, na:8 };
function cellFor(homeId, moduleKey){
  const list = ev().all.filter(e => e.home.id === homeId && e.module.key === moduleKey && e.status.daysLate > -15);
  if (moduleKey === "fire_property") {
    const f = ev().fire.filter(x => x.home.id === homeId);
    if (!f.length) return null;
    const red = f.filter(x => x.rag.status === "RED" || x.rag.status === "NOT_RECORDED").length, amb = f.filter(x => x.rag.status === "AMBER").length;
    return red ? { state:"outstanding", text: red + " red" } : amb ? { state:"due_soon", text: amb + " due" } : { state:"complete", text:"In date" };
  }
  if (MOD[moduleKey].register && !MOD[moduleKey].chain) {
    const n = registerIssues(homeId, moduleKey);
    return n ? { state:"outstanding", text: n + " due" } : { state:"complete", text:"In date" };
  }
  if (!list.length) return { state:"upcoming", text:"Not due yet" };
  const out = list.filter(e => e.status.state === "outstanding" || (e.status.state === "blocked" && e.status.daysLate > 0)).length;
  if (out) return { state:"outstanding", text: out + " not done" };
  const worst = list.reduce((w, e) => RANK[e.status.state] < RANK[w.status.state] ? e : w, list[0]);
  const deficits = list.filter(e => e.status.state === "complete" && e.status.tally.bad && e.status.daysLate <= 28).length;
  if (worst.status.state === "complete" && deficits) return { state:"deficit", text: deficits + " with deficits" };
  return { state: worst.status.state, text: QA.STATE_LABEL[worst.status.state] };
}

/* registers that are their own module (supervision & training) */
function staffIssues(s, t){ const sup = diffD(s.supervision, t) > 56; const tr = Object.values(s.training).filter(d => d < t).length; return { sup, tr, n:(sup ? 1 : 0) + tr }; }
function registerIssues(homeId, key){
  const t = today();
  if (key === "supervision_training") return S.registers.staff.filter(s => s.homeId === homeId).reduce((n, s) => n + staffIssues(s, t).n, 0);
  return 0;
}

/* ---------- alerts for a day ---------- */
function alertsToday(){
  const t = today(), cfg = cfgNow();
  const list = [];
  for (const e of ev().all) list.push(...QA.checkAlerts(e, { config:cfg, users:S.users, today:t, settings:S.settings }));
  for (const a of Object.values(S.actions)) list.push(...QA.actionAlerts(a, { users:S.users, today:t, homes:S.homes }));
  return list;
}
