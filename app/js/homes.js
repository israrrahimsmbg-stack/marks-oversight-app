/* ===================== homes, modules and registers ===================== */

/* chain strip: weekly squares > monthly blocks > quarter */
function chainStrip(homeId, m){
  const list = ev().all.filter(e => e.home.id === homeId && e.module.key === m.key);
  const t = today();
  const grid = (m.chain || []).includes("weekly");
  const cell = e => { const st = (e.status.state === "complete" && e.status.tally.bad) ? "deficit" : e.status.state; const lv = e.check.level;
    const txt = lv === "weekly" ? String(e.check.n) : lv === "monthly" ? "Month " + e.check.n : lv === "quarterly" ? "Quarter" : lv === "monthly_simple" ? e.check.label.slice(0, 3) : dl(e.check.due);
    return h("button",{type:"button",class:"s-" + st + " lv-" + lv + (t >= e.check.start && t <= e.check.due ? " today" : ""), title:`${e.check.label} (${e.check.sub}): ${QA.STATE_LABEL[e.status.state]}${e.status.tally.bad ? `, ${e.status.tally.bad} not met` : ""}. ${e.status.reason}`, "aria-label":`${levelLabel(lv)} ${e.check.label}: ${QA.STATE_LABEL[e.status.state]}`, onclick:()=>go("#/check/" + encodeURIComponent(e.check.id)), text:txt}, isBlankSubmit(e) ? h("i",{class:"dot",title:"Blank form submitted"}) : null); };
  return h("div",{class:"chain"}, (m.chain || []).map(lvl => { const l = list.filter(e => e.check.level === lvl); if (!l.length) return null;
    return h("div",{class:"chainrow"}, h("span",{text:levelLabel(lvl)}), h("div",{class:"sq" + (grid ? " g13" : "")}, l.map(cell))); }));
}
const LEGEND = () => h("div",{class:"legend2"}, [["complete","Done"],["deficit","Done, some not met"],["outstanding","Not done"],["pending","Due today"],["due_soon","Due soon"],["blocked","Waiting on earlier checks"],["on_hold","On hold"],["upcoming","Upcoming"]].map(([s,l]) => h("span",{class:"s-" + s}, h("i"), l)));

/* ---------- homes & rollout ---------- */
function viewHomes(){
  const hs = myHomes();
  return h("div",{class:"page"},
    phead("Homes", "Homes and rollout", "Homes join one at a time in Mark's order. Each home moves from Not started › Setting up › Shadow mode › Live, and its modules are switched on one by one (Finance, Medication and H&S first).", cap("configure") ? [h("button",{type:"button",class:"btn ghost",onclick:()=>go("#/admin/setup")}, icon("sliders"), "Set up homes and modules")] : null),
    h("div",{class:"rollout"}, hs.map(hm => { const on = MODS.filter(m => hm.modules[m.key]); const late = ev().all.filter(e => e.home.id === hm.id && isLate(e) && access(e.module.key, hm.id) !== "none").length;
      return h("button",{type:"button",class:"card rcard r-" + hm.status, onclick:()=>go("#/home/" + hm.id)},
        h("div",{class:"top"}, h("div",null, h("div",{class:"ord",text:`#${hm.order} in rollout · wave ${hm.wave}`}), h("h3",{text:hm.name})), h("span",{class:"spill",style:"background:var(--ss);color:var(--sc)",text:HOME_STATUS[hm.status]})),
        h("div",{class:"meta",text: RUNNING.includes(hm.status) ? `${late ? nplural(late, "check") + " not done" : "Nothing outstanding"} · ${nplural(on.length, "module")} on` : HOME_STATUS_HINT[hm.status]}),
        h("div",{class:"mchips"}, MODS.map(m => h("span",{class:"mchip" + (hm.modules[m.key] ? " on" : ""), title:m.label + (hm.modules[m.key] ? ": on" : ": off"), text:m.short}))));
    })));
}

function viewHome(id, tabKey){
  const hm = S.homes[id];
  if (!hm || !QA.inHome(me(), id)) return h("div",{class:"page"}, h("div",{class:"banner bad",text:"You do not have access to this home."}));
  const mods = MODS.filter(m => hm.modules[m.key] && access(m.key, id) !== "none");
  const tab = tabKey || "overview";
  const tabs = [["overview","Overview"], ...mods.map(m => [m.key, m.label]), ["team","Team & alerts"]];
  let body;
  if (!RUNNING.includes(hm.status) && tab !== "team") body = card(null, h("div",{class:"chain"}, h("div",{class:"banner"}, icon("clock",18), h("div",null, h("b",{text:HOME_STATUS[hm.status] + ". "}), HOME_STATUS_HINT[hm.status])), h("p",{class:"meta",text:"Steps for each home: the compliance lead sets up the drive with the standard trackers › the builder registers the trackers › one week in shadow mode › go live. About 2 to 3 hours per home once the template is proven."}), cap("configure") ? h("div",null, h("button",{type:"button",class:"btn",onclick:()=>go("#/admin/setup"),text:"Change status or modules"})) : null));
  else if (tab === "overview") body = h("div",{class:"grid2"}, mods.map(m => card(m.label, m.chain ? h("div",{class:"chain"}, chainStrip(id, m), moduleSummary(id, m)) : moduleSummary(id, m), { right: h("div",{class:"row"}, p999(m), h("a",{href:`#/home/${id}/${m.key}`,class:"btn ghost sm",text:"Open"})) })));
  else if (tab === "team") body = teamPanel(hm);
  else { const m = MOD[tab]; body = moduleAtHome(hm, m); }
  return h("div",{class:"page"},
    h("div",{class:"crumbs"}, link("Homes", "#/homes"), "›", h("span",{text:hm.name})),
    phead(`#${hm.order} in rollout · ${HOME_STATUS[hm.status]}`, hm.name, hm.notes || HOME_STATUS_HINT[hm.status], RUNNING.includes(hm.status) && cap("export") ? [h("button",{type:"button",class:"btn ghost",onclick:()=>reviewPack(hm)}, icon("report"), "Review pack")] : null),
    h("div",{class:"tabs",role:"tablist"}, tabs.map(([k,l]) => h("button",{type:"button",role:"tab","aria-selected":String(k === tab),onclick:()=>go(`#/home/${id}/${k}`),text:l}))),
    body);
}
function moduleSummary(homeId, m){
  const t = today();
  const list = ev().all.filter(e => e.home.id === homeId && e.module.key === m.key);
  const late = list.filter(isLate).length, def = list.filter(e => e.status.state === "complete" && e.status.tally.bad).length;
  const acts = Object.values(S.actions).filter(a => a.homeId === homeId && a.module === m.key && QA.actionFlags(a, t).open);
  const parts = [];
  if (m.chain) parts.push(h("div",{class:"meta",text:`${late ? nplural(late, "check") + " not done" : "All due checks done"} · ${nplural(def, "audit")} with deficits this quarter · ${nplural(acts.length, "open action")}`}));
  if (m.rules_categories) { const f = ev().fire.filter(x => x.home.id === homeId && x.module.key === m.key); const red = f.filter(x => ["RED","NOT_RECORDED"].includes(x.rag.status)).length; parts.push(h("div",{class:"meta",text:`${f.length} items · ${red} not in date · ${f.filter(x => x.rag.status === "AMBER").length} due soon`})); }
  if (m.key === "supervision_training") parts.push(h("div",{class:"meta",text:`${registerIssues(homeId, m.key)} supervisions or training items overdue`}));
  if (m.key === "finance") { const cap2 = S.registers.capacity.filter(c => c.homeId === homeId); const bad = cap2.filter(c => !c.held || c.review < t).length; parts.push(h("div",{class:"meta",text:`Capacity & best-interest register: ${bad ? bad + " missing or out of date" : "all in date"}`})); }
  if (m.key === "maintenance") { const mm = S.registers.maintenance.filter(x => x.homeId === homeId && x.status !== "Completed"); parts.push(h("div",{class:"meta",text:`${mm.length} open repairs · ${mm.filter(x => x.target < t).length} past target`})); }
  if (m.key === "occupancy") { const o = S.registers.onboarding.filter(x => x.homeId === homeId); parts.push(h("div",{class:"meta",text:`${o.length} recent move-ins · ${o.reduce((n, x) => n + Object.values(x.docs).filter(v => !v).length, 0)} onboarding documents missing`})); }
  return h("div",{class:"chain"}, parts);
}

function moduleAtHome(hm, m){
  const t = today();
  const parts = [];
  parts.push(h("div",{class:"banner info"}, icon(m.icon,18), h("div",null, m.summary, " ", basis(m.basis), " ", unverified(), h("div",{class:"meta",style:"margin-top:4px",text:m.basis_note}))));
  if (m.chain) parts.push(card("This quarter", h("div",{class:"chain"}, chainStrip(hm.id, m), LEGEND()), { sub:`Quarter from ${dlong(hm.quarterStart)}. Tap a square to open the check.` }));
  if (m.chain) { const list = ev().all.filter(e => e.home.id === hm.id && e.module.key === m.key && e.status.daysLate >= -14 && !["complete","na","upcoming"].includes(e.status.state)); if (list.length) parts.push(card("Open now", h("div",{class:"list"}, list.map(e => checkRow(e, { noHome:true }))), { raw:true })); }
  if (m.rules_categories) parts.push(fireTable(hm.id, null, m));
  if (m.key === "finance") parts.push(capacityTable(hm.id));
  if (m.key === "maintenance") parts.push(maintenanceTable(hm.id));
  if (m.key === "occupancy") parts.push(onboardingTable(hm.id));
  if (m.key === "supervision_training") parts.push(staffTable(hm.id));
  const acts = Object.values(S.actions).filter(a => a.homeId === hm.id && a.module === m.key);
  parts.push(card("Actions", acts.length ? h("div",{class:"list"}, acts.sort((a,b) => QA.actionFlags(b, t).daysOver - QA.actionFlags(a, t).daysOver).map(actionRow)) : empty("No actions."), { raw:true, right: QA.atLeast(access(m.key, hm.id), "record") ? h("button",{type:"button",class:"btn soft sm",onclick:()=>newAction({ homeId:hm.id, module:m.key })}, icon("plus"), "New action") : null }));
  return h("div",{style:"display:flex;flex-direction:column;gap:18px"}, parts);
}

/* ---------- module across homes ---------- */
function viewModule(key){
  const m = MOD[key];
  if (!m) return h("div",{class:"page"}, empty("Unknown module."));
  const hs = myHomes().filter(hm => homeFilterIds().includes(hm.id) && RUNNING.includes(hm.status) && hm.modules[key] && access(key, hm.id) !== "none");
  const off = myHomes().filter(hm => !hm.modules[key] || !RUNNING.includes(hm.status));
  const t = today();
  const body = [];
  body.push(h("div",{class:"banner info"}, icon(m.icon,18), h("div",null, m.summary, " ", basis(m.basis), " ", unverified(), h("div",{class:"meta",style:"margin-top:4px",text:m.basis_note}), m.source_url ? h("div",{class:"meta"}, "Source: ", h("a",{href:m.source_url,target:"_blank",rel:"noopener",text:m.source_url.replace(/^https?:\/\//,"")})) : null)));
  if (m.chain) body.push(card("By home, this quarter", h("div",{class:"chain"}, hs.length ? hs.map(hm => h("div",{style:"display:flex;flex-direction:column;gap:8px;padding-bottom:12px;border-bottom:1px solid var(--line)"}, h("div",{class:"row"}, h("b",null, h("a",{href:`#/home/${hm.id}/${key}`,style:"color:inherit",text:hm.name})), hm.status === "shadow" ? h("span",{class:"pill p-ref",text:"shadow"}) : null), chainStrip(hm.id, m))) : empty("No running homes have this module switched on."), LEGEND())));
  if (m.rules_categories) hs.forEach(hm => body.push(fireTable(hm.id, hm.name, m)));
  if (key === "finance") hs.forEach(hm => body.push(capacityTable(hm.id, hm.name)));
  if (key === "maintenance") hs.forEach(hm => body.push(maintenanceTable(hm.id, hm.name)));
  if (key === "occupancy") hs.forEach(hm => body.push(onboardingTable(hm.id, hm.name)));
  if (key === "supervision_training") hs.forEach(hm => body.push(staffTable(hm.id, hm.name)));
  const acts = visibleActions().filter(a => a.module === key && QA.actionFlags(a, t).open);
  body.push(card("Open actions", acts.length ? h("div",{class:"list"}, acts.map(actionRow)) : empty("No open actions."), { raw:true }));
  if (off.length) body.push(h("div",{class:"meta",text:`Not on yet at: ${off.map(x => x.name).join(", ")}.`}));
  return h("div",{class:"page"}, phead(`Module · wave ${m.wave}${m.priority === "999" ? " · 999 priority" : ""}`, m.label, m.tracker ? "Tracker: " + m.tracker : ""), body);
}

/* ---------- registers ---------- */
const RAGTXT = { RED:["outstanding","Red"], AMBER:["due_soon","Due soon"], GREEN:["complete","In date"], NOT_RECORDED:["outstanding","Not recorded"], NA:["na","N/A"] };
function fireTable(homeId, title, m){
  m = m || MOD.fire_property;
  const rows = ev().fire.filter(x => x.home.id === homeId && x.module.key === m.key);
  const editable = QA.atLeast(access(m.key, homeId), "record");
  const perPerson = rows.some(x => x.ref);
  const showRefs = cap("personal") || QA.atLeast(access(m.key, homeId), "record");
  const name = m.key === "fire_property" ? "Fire log and certificates" : m.label;
  return card(title ? `${title}: ${name.toLowerCase()}` : name, h("div",{class:"tw"}, h("table",{class:"t"},
    h("thead",null, h("tr",null, [perPerson ? "Resident ref" : null,"Item","Basis","Last done","Expires / due","Status",""].filter(Boolean).map(x => h("th",{text:x})))),
    h("tbody",null, rows.sort((a,b) => ["RED","NOT_RECORDED","AMBER","GREEN","NA"].indexOf(a.rag.status) - ["RED","NOT_RECORDED","AMBER","GREEN","NA"].indexOf(b.rag.status)).map(x => h("tr",null,
      perPerson ? h("td",{text: showRefs ? (x.ref || "Home") : "Hidden"}) : null,
      h("td",null, h("b",{text:x.rule.label}), h("div",{class:"meta",text:x.rule.legal_ref})), h("td",null, basis(x.rule.basis)), h("td",{text:x.item.last_done ? dl(x.item.last_done, { year:"numeric" }) : "–"}), h("td",{text:x.rag.due ? dl(x.rag.due, { year:"numeric" }) : "–"}),
      h("td",null, spill(RAGTXT[x.rag.status][0], RAGTXT[x.rag.status][1]), h("div",{class:"meta",text:x.rag.reason})),
      h("td",null, editable && x.rag.status !== "NA" ? h("button",{type:"button",class:"btn ghost sm",onclick:()=>recordFire(homeId, x.rule, x.key, x.ref),text:"Record"}) : null)))))),
    { raw:true, sub:(perPerson ? "One row per resident (references only, never names). " : "") + "Rated by the tested rules engine (config/rules.json). Every rule is UNVERIFIED until the compliance lead signs it off." });
}
function recordFire(homeId, rule, key, ref){
  key = key || rule.key;
  const cur = (S.registers.fire[homeId] || {})[key] || {};
  const last = h("input",{type:"date",value:today()});
  const exp = h("input",{type:"date",value: rule.kind === "certificate" ? QA.addInterval(today(), rule.interval) : ""});
  openModal("Record: " + rule.label + (ref ? " · " + ref : ""), [h("p",{class:"meta",text:rule.legal_ref}), field(rule.kind === "certificate" ? "Date of inspection / certificate" : "Date done", last), rule.kind === "certificate" ? field("Expires", exp, "check it against the certificate") : null,
    h("div",{class:"acts"}, h("button",{type:"button",class:"btn ghost",onclick:closeModal,text:"Cancel"}), h("button",{type:"button",class:"btn",text:"Save",onclick:()=>{ S.registers.fire[homeId] = S.registers.fire[homeId] || {}; S.registers.fire[homeId][key] = Object.assign({}, cur, { last_done:last.value, expires: rule.kind === "certificate" ? exp.value : undefined }); logAct(`Recorded ${rule.label}${ref ? " for " + ref : ""} at ${S.homes[homeId].name}`); save(); EV = null; closeModal(); render(); }}))]);
}
function capacityTable(homeId, title){
  const t = today();
  const rows = S.registers.capacity.filter(c => c.homeId === homeId);
  const canSeeRefs = cap("personal") || QA.atLeast(access("finance", homeId), "record");
  return card(title ? `${title}: capacity & best interest` : "Capacity & best-interest register", h("div",{class:"tw"}, h("table",{class:"t"},
    h("thead",null, h("tr",null, ["Resident ref","Record","On file","Review date","Status"].map(x => h("th",{text:x})))),
    h("tbody",null, rows.map(c => { const bad = !c.held || c.review < t; const soon = !bad && diffD(t, c.review) <= 30; return h("tr",null, h("td",{text: canSeeRefs ? c.ref : "Hidden"}), h("td",{text:c.type}), h("td",{text:c.held ? "Yes" : "No"}), h("td",{text:dl(c.review, { year:"numeric" })}), h("td",null, spill(bad ? "outstanding" : soon ? "due_soon" : "complete", !c.held ? "Missing" : bad ? "Review overdue" : soon ? "Review due" : "In date"), c.notes ? h("div",{class:"meta",text:c.notes}) : null)); })))),
    { raw:true, sub:"Before staff manage someone's money: a mental capacity assessment, or a best-interest decision, financial support plan or appointeeship must be on file and in date (MCA 2005; Hamida, 25 Nov). Resident references only." });
}
function maintenanceTable(homeId, title){
  const t = today();
  const rows = S.registers.maintenance.filter(x => x.homeId === homeId);
  const upd = ev().all.filter(e => e.home.id === homeId && e.module.key === "maintenance" && e.status.daysLate >= 0).slice(-1)[0];
  return card(title ? `${title}: maintenance tracker` : "Maintenance tracker", h("div",{class:"tw"}, h("table",{class:"t"},
    h("thead",null, h("tr",null, ["Ref","Issue","Area","Priority","Reported","Target","Who","Status","Updates"].map(x => h("th",{text:x})))),
    h("tbody",null, rows.map(x => h("tr",null, h("td",{text:x.ref}), h("td",null, h("b",{text:x.issue}), (x.comments || []).length ? h("div",{class:"meta",text:"Latest: " + x.comments[x.comments.length - 1].text}) : null), h("td",{text:x.area}), h("td",{text:x.priority}), h("td",{text:dl(x.reported)}), h("td",{text:dl(x.target)}), h("td",{text:x.who}),
      h("td",null, spill(x.status === "Completed" ? "complete" : x.target < t ? "outstanding" : "in_progress", x.status === "Completed" ? "Completed" : x.target < t ? `${x.status} · past target` : x.status)),
      h("td",null, h("button",{type:"button",class:"btn ghost sm",onclick:()=>repairHistory(x.id),text:`History (${(x.comments || []).length})`}))))))),
    { raw:true, sub: `Managers update this every Friday instead of emailing it round; operations reviews it fortnightly, and everyone can see the comment history (Zara, 25 Nov). Last Friday update: ${upd ? QA.STATE_LABEL[upd.status.state].toLowerCase() : "–"}.` });
}
function repairHistory(id){
  const x = S.registers.maintenance.find(r => r.id === id); if (!x) return;
  const can = QA.atLeast(access("maintenance", x.homeId), "record");
  const note = h("textarea",{placeholder:"What has happened since the last update? (kept in the history)",style:"min-height:60px"});
  const st = sel(["Open","Awaiting contractor","In progress","Completed"].map(v => [v, v]), x.status, () => {});
  openModal(`${x.ref} · ${x.issue}`, [
    h("div",{class:"meta",text:`${x.area} · ${x.priority} priority · reported ${dl(x.reported)} · target ${dl(x.target)} · ${x.who}`}),
    (x.comments || []).length ? h("div",{class:"comments"}, x.comments.slice().reverse().map(c => h("div",{class:"comment"}, h("small",{text:`${uname(c.by)} · ${tl(c.at)}`}), c.text))) : empty("No updates yet."),
    can ? h("div",{class:"fgrid"}, field("Status", st)) : null, can ? field("Add an update", note) : null,
    h("div",{class:"acts"}, h("button",{type:"button",class:"btn ghost",onclick:closeModal,text: can ? "Cancel" : "Close"}), can ? h("button",{type:"button",class:"btn",text:"Save update",onclick:()=>{
      const txt = note.value.trim(), ns = st.value;
      if (!txt && ns === x.status) return toast("Write an update or change the status.");
      x.comments = (x.comments || []).concat(txt ? [{ at:new Date().toISOString(), by:me().id, text:txt }] : [], ns !== x.status ? [{ at:new Date().toISOString(), by:me().id, text:`Status: ${x.status} › ${ns}` }] : []);
      x.status = ns; logAct(`Updated repair ${x.ref} at ${S.homes[x.homeId].name}`); save(); EV = null; closeModal(); toast("Saved"); render(); }}) : null)], { wide:true, sub:"Comment history for this repair" });
}
function onboardingTable(homeId, title){
  const rows = S.registers.onboarding.filter(x => x.homeId === homeId);
  const docs = rows.length ? Object.keys(rows[0].docs) : [];
  if (!cap("personal")) return card("Onboarding documents", empty("Head office only: resident references are hidden from your role.", "lock"));
  return card(title ? `${title}: new residents' onboarding documents` : "New residents' onboarding documents", h("div",{class:"tw"}, h("table",{class:"t"},
    h("thead",null, h("tr",null, h("th",{text:"Resident ref"}), h("th",{text:"Moved in"}), docs.map(d => h("th",{text:d})))),
    h("tbody",null, rows.map(r => h("tr",null, h("td",{text:r.ref}), h("td",{text:dl(r.moveIn)}), docs.map(d => h("td",null, r.docs[d] ? h("span",{class:"tick",text:"✓"}) : spill(diffD(r.moveIn, today()) > 7 ? "outstanding" : "due_soon", diffD(r.moveIn, today()) > 7 ? "Late" : "Due")))))))),
    { raw:true, sub:"The finance team's occupancy tracker is the master copy. Initials or references only, never names. Documents are flagged as late 7 days after move-in [UNVERIFIED]." });
}
function staffTable(homeId, title){
  const t = today();
  const rows = S.registers.staff.filter(x => x.homeId === homeId);
  const tr = rows.length ? Object.keys(rows[0].training) : [];
  if (!cap("personal") && !QA.atLeast(access("supervision_training", homeId), "view")) return card("Staff", empty("Hidden for your role.", "lock"));
  return card(title ? `${title}: supervision & training` : "Supervision & training", h("div",{class:"tw"}, h("table",{class:"t"},
    h("thead",null, h("tr",null, h("th",{text:"Staff ref"}), h("th",{text:"Role"}), h("th",{text:"Last supervision"}), tr.map(x => h("th",{text:x})))),
    h("tbody",null, rows.map(s => { const iss = staffIssues(s, t); return h("tr",null, h("td",{text:s.ref}), h("td",{text:s.role}), h("td",null, dl(s.supervision), " ", iss.sup ? h("span",{class:"flag",text:"over 8 weeks"}) : null),
      tr.map(x => h("td",null, s.training[x] < t ? h("span",{class:"flag",text:"Expired " + dl(s.training[x])}) : diffD(t, s.training[x]) <= 30 ? h("span",{class:"flag warn",text:"Due " + dl(s.training[x])}) : h("span",{class:"meta",text:dl(s.training[x], { year:"numeric" })})))); })))),
    { raw:true, sub:"Draft until Hamida's supervision and training trackers are finished. Supervision every 8 weeks and training renewal periods are UNVERIFIED Esto Care policy; Oliver McGowan training is a legal requirement (Health and Care Act 2022)." });
}

/* ---------- team & alert ladder for a home ---------- */
function teamPanel(hm){
  const rung = (role, note) => { const ppl = QA.staffIn(hm, role, S.users); return h("div",{class:"rung"}, h("b",{text:roleLabel(role)}), h("small",{text: ppl.length ? ppl.map(p => p.name + (p.onLeave ? " (on leave)" : "")).join(", ") : "Nobody: alerts go up to the next level"}), h("div",{class:"meta",text:note})); };
  const ho = Object.values(S.users).filter(u => (S.caps.all_alerts || []).includes(u.role));
  const sws = QA.staffIn(hm, "support_worker", S.users);
  return h("div",{style:"display:flex;flex-direction:column;gap:18px"},
    card("Escalation ladder", h("div",{class:"chain"},
      h("div",{class:"ladder"}, rung("team_leader","Owns weekly checks"), h("div",{class:"arrow"}, icon("arrowr")), rung("deputy_manager","Owns monthly checks"), h("div",{class:"arrow"}, icon("arrowr")), rung("service_manager","Owns quarterly checks"), h("div",{class:"arrow"}, icon("arrowr")),
        h("div",{class:"rung"}, h("b",{text:"Head office"}), h("small",{text:ho.map(u => u.name).join(", ")}), h("div",{class:"meta",text: S.settings.headOfficeFrom === "first" ? "Copied into every alert" : "Told when escalated"}))),
      h("div",{class:"meta",text:"When a check is not done, its owner and the next person up are alerted from 1 day late. At the escalation point the service manager and head office are added. Each level depends on the one below it."}),
      sws.length ? h("div",{class:"banner"}, icon("lock",18), h("div",{text:`${nplural(sws.length, "support worker")} at this home: never notified and no access (Mark, 18 Nov 2026).`})) : null)),
    card("People with access to this home", h("div",{class:"tw"}, h("table",{class:"t"}, h("thead",null, h("tr",null, ["Name","Role","Alerts"].map(x => h("th",{text:x})))),
      h("tbody",null, Object.values(S.users).filter(u => QA.inHome(u, hm.id) && QA.ROLES[u.role].scope === "assigned").map(u => h("tr",null, h("td",{text:u.name}), h("td",{text:roleLabel(u.role)}), h("td",{text: u.role === "support_worker" ? "Never" : u.alerts ? "Yes" : "Off"})))))), { raw:true, right: cap("users") ? h("a",{class:"btn ghost sm",href:"#/admin/people",text:"Manage people"}) : null }));
}

/* ---------- review pack: one home on one page, for the monthly review day (Mark, 25 Nov) ---------- */
function reviewPack(hm){
  const t = today();
  const rep = QA.mondayReport({ homes:{ [hm.id]:hm }, evaluated: ev().all.filter(e => e.home.id === hm.id && access(e.module.key, hm.id) !== "none"), actions: Object.values(S.actions).filter(a => a.homeId === hm.id && access(a.module, hm.id) !== "none"), today:t, rated: ev().fire.filter(x => x.home.id === hm.id && access(x.module.key, hm.id) !== "none") });
  const r = rep.rows[0];
  const L = [`Review pack · ${hm.name} · ${t}`, `Overall: ${r.rag} · ${HOME_STATUS[hm.status]}`, ""];
  for (const m of MODS.filter(x => hm.modules[x.key] && access(x.key, hm.id) !== "none")) {
    const list = ev().all.filter(e => e.home.id === hm.id && e.module.key === m.key && e.status.daysLate >= 0);
    const done = list.filter(e => e.status.state === "complete").length, late = list.filter(isLate).length, def = list.filter(e => e.status.state === "complete" && e.status.tally.bad).length;
    const reg = ev().fire.filter(x => x.home.id === hm.id && x.module.key === m.key);
    L.push(`${m.label}: ${m.chain ? (list.length ? `${done} of ${list.length} due checks done this quarter, ${late} not done, ${def} with deficits` : "nothing due yet this quarter") : ""}${reg.length ? `${reg.filter(x => x.rag.status === "GREEN").length} of ${reg.length} items in date` : ""}`);
  }
  L.push("", "Not done:", ...r.outstanding.map(e => `  - ${checkTitle(e)} · ${e.status.reason}`), "Out of date:", ...r.registerRed.map(x => `  - ${ratedLabel(x)} · ${x.rag.reason}`),
    "Deficits (last 4 weeks):", ...r.deficits.map(e => `  - ${checkTitle(e)}: ${e.status.tally.badItems.join("; ")}`), "", "Open actions:");
  Object.values(S.actions).filter(a => a.homeId === hm.id && QA.actionFlags(a, t).open).forEach(a => { const f = QA.actionFlags(a, t); L.push(`  - ${a.ref} ${a.finding} · ${a.status} · owner ${uname(a.ownerId)} · target ${a.target || "none"}${f.overdue ? ` (${f.daysOver} days over)` : ""} · next step: ${a.nextStep ? a.nextStep + (a.nextStepDate ? " by " + a.nextStepDate : "") : "not set"}`); });
  const txt = L.join("\n");
  openModal(`Review pack: ${hm.name}`, [h("p",{class:"meta",text:"Everything for this home on one page, for the monthly review day. Print it or download it to attach to the review notes."}), h("pre",{class:"mail",text:txt}),
    h("div",{class:"acts"}, h("button",{type:"button",class:"btn ghost",onclick:closeModal,text:"Close"}), h("button",{type:"button",class:"btn ghost",onclick:()=>window.print()}, icon("print"), "Print"), h("button",{type:"button",class:"btn",onclick:()=>download(`review-pack-${hm.id}-${t}.txt`, txt)}, icon("dl"), "Download"))], { wide:true });
  logAct(`Opened the review pack for ${hm.name}`);
}
