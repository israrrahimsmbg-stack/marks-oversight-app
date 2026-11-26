/* ===================== admin: setup, people, access, alert rules, library ===================== */

function noCap(what){ return h("div",{class:"banner",text:`Read only: your role cannot ${what}.`}); }
function toggle(checked, onchange, disabled, label){ return h("label",{class:"switch",title:label || ""}, h("input",{type:"checkbox",checked: checked ? true : null,disabled: disabled ? true : null,"aria-label":label || "",onchange:e => onchange(e.target.checked)}), h("span")); }

/* ---------- homes & modules ---------- */
function viewSetup(){
  const can = cap("configure");
  const hs = homesSorted();
  return h("div",{class:"page"},
    phead("Admin", "Homes and modules", "Switch each module on per home, and move each home through the rollout. Changes apply straight away and are kept in the activity log."),
    can ? null : noCap("switch homes or modules"),
    h("div",{class:"banner info"}, icon("book",18), h("div",null, h("b",{text:"Rollout plan. "}), "Wave 1 (Finance, Medication, Health & Safety, Fire & certificates) at Hall Close first, then one home a week in Mark's order after a week of shadow mode. Wave 2 adds Infection control, Maintenance and Occupancy; wave 3 adds QA actions, Spot checks, Manager reports and Supervision & training.")),
    card(null, h("div",{class:"matrix"}, h("table",null,
      h("thead",null, h("tr",null, h("th",{text:"Home"}), h("th",{text:"Status"}), h("th",{text:"Quarter starts"}), MODS.map(m => h("th",{title:m.label}, m.short, h("div",{style:"font-weight:500;text-transform:none",text:"wave " + m.wave}))))),
      h("tbody",null, hs.map(hm => h("tr",null,
        h("td",null, h("b",null, h("a",{href:"#/home/" + hm.id,style:"color:inherit",text:`${hm.order}. ${hm.name}`}))),
        h("td",null, sel(Object.entries(HOME_STATUS), hm.status, v => { hm.status = v; logAct(`${hm.name}: status set to ${HOME_STATUS[v]}`); save(); EV = null; render(); }, { disabled: !can ? true : null, "aria-label":"Status for " + hm.name })),
        h("td",null, h("input",{type:"date",value:hm.quarterStart,disabled: !can ? true : null,style:"width:auto;padding:4px 6px;font-size:12px",onchange:e => { if (new Date(e.target.value + "T00:00:00Z").getUTCDay() !== 1) return toast("The quarter must start on a Monday."), render(); hm.quarterStart = e.target.value; logAct(`${hm.name}: quarter start set to ${e.target.value}`); save(); EV = null; render(); }})),
        MODS.map(m => h("td",null, toggle(hm.modules[m.key], v => { hm.modules[m.key] = v; logAct(`${hm.name}: ${m.label} switched ${v ? "on" : "off"}`); save(); EV = null; render(); }, !can, `${m.label} at ${hm.name}`)))))))), { raw:true }),
    h("div",{class:"legend2"}, Object.entries(HOME_STATUS).map(([k,v]) => h("span",{class:"r-" + k}, h("i",{style:"background:var(--ss);border-color:var(--sc)"}), `${v}: ${HOME_STATUS_HINT[k]}`))),
    trackerRegister());
}

/* ---------- tracker register: one tracker per home per area, fixed paths (Mark, 25 Nov) ---------- */
function trackerRegister(){
  const can = cap("trackers");
  const rows = (S.registers.trackers || []).filter(x => homeFilterIds().includes(x.homeId)).sort((a,b) => S.homes[a.homeId].order - S.homes[b.homeId].order);
  const t = today();
  const stale = x => diffD(x.lastSynced.slice(0,10), t) > 1;
  const edit = x => { const path = h("input",{type:"text",value:x.path}); openModal("Tracker file", [h("p",{class:"meta",text:`${S.homes[x.homeId].name} · ${MOD[x.module].label}. The nightly sync reads only this file. Its data must be in named Excel tables.`}), field("Path on HomesCentral", path),
    h("div",{class:"acts"}, h("button",{type:"button",class:"btn ghost",onclick:closeModal,text:"Cancel"}), h("button",{type:"button",class:"btn",text:"Save",onclick:()=>{ x.path = path.value.trim(); logAct(`Tracker for ${S.homes[x.homeId].name} · ${MOD[x.module].label} set to ${x.path}`); save(); closeModal(); render(); }}))]); };
  return card("Tracker files", rows.length ? h("div",{class:"tw"}, h("table",{class:"t"},
    h("thead",null, h("tr",null, ["Home","Area","File","Last synced","Check",""].map(x => h("th",{text:x})))),
    h("tbody",null, rows.map(x => h("tr",null, h("td",{text:S.homes[x.homeId].name}), h("td",{text:MOD[x.module].label}), h("td",null, h("code",{style:"font-size:12px;word-break:break-all",text:x.path}), h("div",{class:"meta",text:"Tables: " + x.tables})),
      h("td",{text:tl(x.lastSynced)}),
      h("td",null, x.copies.length ? h("span",{class:"flag",title:x.copies.join("\n"),text:`${nplural(x.copies.length, "stray copy", "stray copies")} found`}) : stale(x) ? h("span",{class:"flag warn",text:"Not synced last night"}) : spill("complete","OK")),
      h("td",null, can ? h("button",{type:"button",class:"btn ghost sm",onclick:()=>edit(x),text:"Change"}) : null)))))) : empty("No trackers registered yet. A home's trackers are registered when it moves to Setting up."),
    { raw:true, sub:"Staff keep working in these Excel files. Each night at 02:00 the sync reads them into the app; a weekly check flags copies or renamed files, because only one tracker per home per area is allowed (Mark, 25 Nov)." });
}

/* ---------- people ---------- */
function viewPeople(){
  const can = cap("users");
  const f = S.session.peopleRole || "";
  const list = Object.values(S.users).filter(u => !f || u.role === f).sort((a,b) => QA.ROLE_ORDER.indexOf(a.role) - QA.ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name));
  return h("div",{class:"page"},
    phead("Admin", "People and roles", "Everyone signs in with their company Microsoft account in the live app (IT rule). Here you choose their role, their homes, and whether they get alerts. Every name here is invented for the demo.", [
      sel([["", "All roles"], ...QA.ROLE_ORDER.map(r => [r, roleLabel(r)])], f, v => { S.session.peopleRole = v; save(); render(); }),
      can ? h("button",{type:"button",class:"btn",onclick:()=>editUser(null)}, icon("plus"), "Add person") : null]),
    can ? null : noCap("add people or change roles"),
    card(null, h("div",{class:"tw"}, h("table",{class:"t"},
      h("thead",null, h("tr",null, ["Name","Role","Homes","Alerts","Leave cover",""].map(x => h("th",{text:x})))),
      h("tbody",null, list.map(u => h("tr",null, h("td",null, h("b",{text:u.name}), h("div",{class:"meta",text:u.email})), h("td",null, roleLabel(u.role), h("div",{class:"meta",text:QA.ROLES[u.role].group})),
        h("td",{text: QA.ROLES[u.role].scope === "all" ? "All homes" : QA.ROLES[u.role].scope === "none" ? "–" : (u.homes || []).map(id => (S.homes[id]||{}).name).join(", ")}),
        h("td",{text: u.role === "support_worker" ? "Never" : u.alerts ? "On" : "Off"}), h("td",{text: u.onLeave ? `On leave · ${uname(u.delegate)} covers` : "–"}),
        h("td",null, can ? h("button",{type:"button",class:"btn ghost sm",onclick:()=>editUser(u.id),text:"Edit"}) : null)))))), { raw:true }));
}
function editUser(id){
  const u = id ? clone(S.users[id]) : { id:"u-" + uid(), name:"", role:"team_leader", homes:[], email:"", alerts:true };
  const name = h("input",{type:"text",value:u.name}), email = h("input",{type:"email",value:u.email,placeholder:"name@company (Microsoft account)"});
  const role = sel(QA.ROLE_ORDER.map(r => [r, roleLabel(r)]), u.role, v => { u.role = v; });
  const homes = h("div",{class:"chips"}, homesSorted().map(hm => h("button",{type:"button",class:"chip","aria-pressed":String((u.homes||[]).includes(hm.id)),onclick:e => { const on = (u.homes||[]).includes(hm.id); u.homes = on ? u.homes.filter(x => x !== hm.id) : (u.homes||[]).concat(hm.id); e.currentTarget.setAttribute("aria-pressed", String(!on)); },text:hm.name})));
  const alerts = h("input",{type:"checkbox",checked:u.alerts ? true : null});
  const leave = h("input",{type:"checkbox",checked:u.onLeave ? true : null});
  const delegate = sel([["", "Nobody"], ...Object.values(S.users).filter(x => x.id !== u.id && x.role !== "support_worker").map(x => [x.id, `${x.name} (${roleLabel(x.role)})`])], u.delegate || "", v => { u.delegate = v || null; });
  openModal(id ? "Edit " + u.name : "Add a person", [
    h("div",{class:"fgrid"}, field("Name", name), field("Work email", email)),
    field("Role", role, "sets what they can see and do (Admin › Access)"),
    h("div",{class:"meta",text:QA.ROLES[u.role].desc}),
    field("Homes", homes, "home team roles only see these homes; head office sees all"),
    h("div",{class:"fgrid"}, h("label",{class:"f",style:"flex-direction:row;align-items:center;gap:8px"}, alerts, "Gets alert emails"), h("label",{class:"f",style:"flex-direction:row;align-items:center;gap:8px"}, leave, "On leave")),
    field("Who covers when on leave", delegate),
    h("div",{class:"acts"}, h("button",{type:"button",class:"btn ghost",onclick:closeModal,text:"Cancel"}), h("button",{type:"button",class:"btn",text:"Save",onclick:()=>{
      if (!name.value.trim()) return toast("Add a name.");
      const old = S.users[u.id];
      Object.assign(u, { name:name.value.trim(), email:email.value.trim(), alerts:alerts.checked, onLeave:leave.checked });
      if (u.role === "support_worker") u.alerts = false;
      // keep each home's staff lists in step with roles and homes
      for (const hm of Object.values(S.homes)) { for (const r of Object.keys(hm.staff)) hm.staff[r] = hm.staff[r].filter(x => x !== u.id); if (QA.LADDER.concat("support_worker").includes(u.role) && (u.homes||[]).includes(hm.id)) (hm.staff[u.role] = hm.staff[u.role] || []).push(u.id); }
      S.users[u.id] = u; logAct(`${old ? "Updated" : "Added"} ${u.name} as ${roleLabel(u.role)}`); save(); EV = null; closeModal(); render(); }}))]);
}

/* ---------- access matrix ---------- */
function viewAccess(){
  const can = cap("matrix");
  const roles = QA.ROLE_ORDER;
  return h("div",{class:"page"},
    phead("Admin", "Who can see and do what", "Module access per role. Home team roles only ever see their own homes; head office roles see all homes. A module switched off at a home is hidden for everyone there.", can ? [h("button",{type:"button",class:"btn ghost",onclick:()=>{ S.matrix = clone(QA.DEFAULT_MATRIX); S.caps = Object.fromEntries(Object.entries(QA.CAPABILITIES).map(([k,v]) => [k, v.roles.slice()])); logAct("Access matrix reset to the default"); save(); render(); },text:"Reset to default"})] : null),
    can ? null : noCap("change access"),
    h("div",{class:"legend2"}, QA.ACCESS_ORDER.map(l => h("span",null, h("span",{class:"lv lv-" + l,text:QA.ACCESS_LABEL[l]}), QA.ACCESS_HINT[l]))),
    card("Modules", h("div",{class:"matrix"}, h("table",null,
      h("thead",null, h("tr",null, h("th",{text:"Role"}), h("th",{text:"Homes"}), MODS.map(m => h("th",{title:m.label,text:m.short})))),
      h("tbody",null, roles.map(r => h("tr",null, h("td",null, h("b",{text:roleLabel(r)}), h("div",{class:"meta",style:"white-space:normal;max-width:240px",text:QA.ROLES[r].desc})), h("td",{text: QA.ROLES[r].scope === "all" ? "All" : QA.ROLES[r].scope === "none" ? "None" : "Own"}),
        MODS.map(m => { const v = (S.matrix[r] || {})[m.key] || "none"; return h("td",null, can && r !== "super_admin" && r !== "support_worker" ? sel(QA.ACCESS_ORDER.map(l => [l, QA.ACCESS_LABEL[l]]), v, nv => { S.matrix[r] = Object.assign({}, S.matrix[r], { [m.key]: nv }); logAct(`Access: ${roleLabel(r)} › ${m.label} set to ${QA.ACCESS_LABEL[nv]}`); save(); EV = null; render(); }, { "aria-label":`${roleLabel(r)} access to ${m.label}`, class:"lv-" + v }) : h("span",{class:"lv lv-" + v,text:QA.ACCESS_LABEL[v]})); })))))), { raw:true, sub:"Record lets a person complete the checks at their own level and below: team leaders weekly, deputies weekly and monthly, managers all levels." }),
    card("App-wide permissions", h("div",{class:"matrix"}, h("table",null,
      h("thead",null, h("tr",null, h("th",{text:"Permission"}), roles.map(r => h("th",{text:roleLabel(r)})))),
      h("tbody",null, Object.entries(QA.CAPABILITIES).map(([k, c]) => h("tr",null, h("td",{text:c.label}), roles.map(r => { const on = r === "super_admin" || (S.caps[k] || []).includes(r); return h("td",null, can && r !== "super_admin" && r !== "support_worker" ? h("input",{type:"checkbox",checked: on ? true : null,"aria-label":`${c.label}: ${roleLabel(r)}`,onchange:e => { S.caps[k] = e.target.checked ? (S.caps[k] || []).concat(r) : (S.caps[k] || []).filter(x => x !== r); logAct(`Permission "${c.label}" ${e.target.checked ? "given to" : "taken from"} ${roleLabel(r)}`); save(); render(); }}) : h("span",{class: on ? "tick" : "cross",text: on ? "✓" : "–"})); })))))), { raw:true, sub:"Mark's email of 24 Nov: only the director, finance, compliance and operations leads can change settings. Support workers never have access and are never notified." }));
}

/* ---------- alert rules ---------- */
function viewAlertRules(){
  const can = cap("alert_rules");
  const num = (lvl, k) => h("input",{type:"number",min:"0",max:"60",value:S.levels[lvl][k],disabled: !can ? true : null,style:"width:70px;padding:4px 6px",onchange:e => { S.levels[lvl][k] = Math.max(0, +e.target.value || 0); logAct(`Alert timing: ${S.levels[lvl].label} ${k.replace(/_/g," ")} set to ${S.levels[lvl][k]}`); save(); EV = null; render(); }});
  return h("div",{class:"page"},
    phead("Admin", "Alert rules", "When reminders and alerts go out, and to whom. All timings are UNVERIFIED until the compliance lead signs them off."),
    can ? null : noCap("change alert timings"),
    card("Timings by level", h("div",{class:"matrix"}, h("table",null,
      h("thead",null, h("tr",null, ["Level","Owner","Heads-up (days before)","Outstanding from (days late)","Repeat every (days)","Escalate at (days late)"].map(x => h("th",{text:x})))),
      h("tbody",null, Object.entries(S.levels).map(([k, l]) => h("tr",null, h("td",null, h("b",{text:l.label}), h("div",{class:"meta",text:k === "twice_weekly" ? "Occupancy" : k === "monthly_simple" ? "QA, spot checks, manager report" : ""})), h("td",{text:roleLabel(l.owner)}), h("td",null, num(k,"heads_up_days")), h("td",null, num(k,"outstanding_after_days")), h("td",null, num(k,"repeat_every_days")), h("td",null, num(k,"escalate_after_days")))))))),
      { raw:true, sub:"999 items (Finance, Medication, H&S, Fire & certificates) repeat every day while outstanding. Infection control uses its own softer timings: reminders 14 days before, first alert at 7 days late, escalation at 14." }),
    card("Head office", h("div",{class:"chain"},
      h("label",{class:"f"}, "When are Mark, Nafisa and Hamida's roles copied in?", sel([["first","From the first alert (Mark's email, 24 Nov)"],["escalation","Only when escalated, plus the Monday report"]], S.settings.headOfficeFrom, v => { S.settings.headOfficeFrom = v; logAct("Head office copy rule changed"); save(); render(); }, { disabled: !can ? true : null })),
      h("div",{class:"meta",text:"Open decision for Mark: being copied into every alert can fill inboxes. The recommendation is the Monday report plus escalations."}),
      h("div",{class:"fgrid"}, field("Monday report time", h("input",{type:"time",value:S.settings.mondayTime,disabled: !can ? true : null,onchange:e => { S.settings.mondayTime = e.target.value; save(); }})), field("Daily digest time", h("input",{type:"time",value:S.settings.digestTime,disabled: !can ? true : null,onchange:e => { S.settings.digestTime = e.target.value; save(); }}))))),
    card("Rules that never change", h("ul",{class:"steps"},
      h("li",{text:"Alerts are only for checks that have not been done. 'Not met' answers are deficits for the manager and the Monday report."}),
      h("li",{text:"A check is only done when every question is answered and it is submitted. Blank or part-filled forms stay outstanding."}),
      h("li",{text:"Monthly checks wait for their four weekly checks; quarterly checks wait for the three monthly ones."}),
      h("li",{text:"One digest email per person per day. Support workers are never notified."}),
      h("li",{text:"On hold pauses alerts until the review date; it needs a reason."}),
      h("li",{text:"Homes in shadow mode only alert the app builder and the compliance lead."})));
}

/* ---------- check library ---------- */
function viewLibrary(){
  const sign = cap("rules_signoff");
  return h("div",{class:"page"},
    phead("Admin", "Check library", "Every module, what it checks, who owns each level and where the requirement comes from. Legal requirements, recognised guidance and Esto Care policy are labelled separately. This app supports compliance; it is not legal advice."),
    MODS.map(m => { const so = S.signoff[m.key]; return card(m.label, h("div",{class:"chain"},
      h("div",{class:"row"}, p999(m), basis(m.basis), so ? h("span",{class:"pill p-occ",text:`Signed off by ${uname(so.by)} ${dl(so.on)}`}) : unverified(), h("span",{class:"meta",text:`Wave ${m.wave}`})),
      h("p",{style:"margin:0",text:m.summary}), h("div",{class:"meta",text:m.basis_note}),
      m.source_url ? h("div",{class:"meta"}, "Source: ", h("a",{href:m.source_url,target:"_blank",rel:"noopener",text:m.source_url})) : null,
      m.tracker ? h("div",{class:"meta",text:"Tracker: " + m.tracker}) : null,
      Object.keys(m.checks || {}).map(lvl => h("details",null, h("summary",{style:"cursor:pointer;font-weight:650",text:`${levelLabel(lvl)}: ${QA.questionsFor(m, lvl).length} questions · owner ${roleLabel(QA.ownerRole(m, lvl, cfgNow(), null))}`}), h("ol",{class:"steps",style:"margin-top:8px"}, QA.questionsFor(m, lvl).map(q => h("li",{text:q.q}))))),
      m.rules_categories ? h("div",{class:"meta",text:`${RULES_CONFIG.rules.filter(r => m.rules_categories.includes(r.category)).length} items from config/rules.json, each with its own legal reference.`}) : null,
      sign && !so ? h("div",null, h("button",{type:"button",class:"btn soft sm",onclick:()=>{ S.signoff[m.key] = { by:me().id, on:today() }; logAct(`Signed off ${m.label} checks and timings`); save(); render(); },text:"Sign off this module"})) : null)); }));
}

/* ---------- activity ---------- */
function viewActivity(){
  if (!cap("audit_log")) return h("div",{class:"page"}, noCap("see the activity log"));
  return h("div",{class:"page"}, phead("Admin", "Activity log", "Every submission, change of setting and action update, newest first. In the live app this is a SharePoint list nobody can edit."),
    card(null, S.activity.length ? h("div",{class:"tw"}, h("table",{class:"t"}, h("thead",null, h("tr",null, ["When","Who","What"].map(x => h("th",{text:x})))), h("tbody",null, S.activity.slice(0, 300).map(a => h("tr",null, h("td",{text:tl(a.at)}), h("td",{text:uname(a.by)}), h("td",{text:a.text})))))) : empty("Nothing yet."), { raw:true }));
}

/* ---------- help ---------- */
function viewHelp(){
  return h("div",{class:"page"}, phead("Help", "How this app works", "For managers, deputies, team leaders and head office."),
    h("div",{class:"grid2"},
      card("The idea in one minute", h("ol",{class:"steps"},
        h("li",{text:"Staff keep their trackers. Each home has one tracker per area (finance, medication, H&S and so on), the same everywhere, with Hall Close as the model."}),
        h("li",{text:"The app reads what has been done and works out what is due, pending and outstanding."}),
        h("li",{text:"If something has not been done, the owner and their line manager are told, every day until it is done. Head office sees everything."}),
        h("li",{text:"Every Monday at 7am head office gets one report, home by home: what is not done, deficits, overdue actions and actions due this week."}),
        h("li",{text:"Homes and modules are switched on one at a time."}))),
      card("Statuses", h("div",{class:"chain"}, ["upcoming","due_soon","pending","outstanding","blocked","in_progress","on_hold","complete","na"].map(s => h("div",{class:"row"}, spill(s), h("span",{class:"meta",text:{ upcoming:"Not due yet.", due_soon:"Inside the heads-up window; the owner has been reminded.", pending:"Due today, or in a short grace period.", outstanding:"Past due and not fully done. Alerted every day (999) or every 2 to 3 days.", blocked:"Cannot be done until the checks below it are complete.", in_progress:"Some answers saved as a draft. Still not done.", on_hold:"Paused with a reason and review date, e.g. resident in hospital.", complete:"Every question answered and submitted. 'Not met' answers become deficits, not alerts.", na:"Not applicable this period, with a reason." }[s]}))))),
      card("Action statuses", h("ul",{class:"steps"}, CFG.action_statuses.map(s => h("li",{text:s})), h("li",{text:"Deadline required: any open action with no target date."}), h("li",{text:"Update due: the mid-point progress update (14 days for QA actions)."}))),
      card("Platform and sign-in", h("div",{class:"chain"},
        h("p",{style:"margin:0",text:"This preview is built the same way as the Esto Care Operations app: one web page with a shared look, menus and building blocks. It runs entirely on invented data in your browser, with a 'View as' switch instead of sign-in."}),
        h("p",{style:"margin:0",text:"IT requires company Microsoft sign-in, so the live version runs on Microsoft 365 (SharePoint lists, Power Automate for the nightly sync, alerts and the Monday email). Every screen and list here maps one to one onto that design: see docs/QA_APP.md in the repository."}))),
      card("Data protection", h("ul",{class:"steps"}, h("li",{text:"Resident and staff references only (initials or codes), never names."}), h("li",{text:"Occupancy and supervision details are head office and manager only."}), h("li",{text:"A DPIA is needed before real data goes in (UK GDPR Article 35)."}))),
      card("Demo controls", h("ul",{class:"steps"}, h("li",{text:"'View as' switches between invented people in each role, so you can see what a team leader, deputy, manager or head office sees."}), h("li",{text:"'Today' lets you move the date to watch alerts start, repeat and escalate."}), h("li",null, "Changes stay in this browser only. ", h("button",{type:"button",class:"btn ghost sm",onclick:()=>{ if (confirmReset()) resetDemo(); },text:"Reset demo data"}))))));
}
function confirmReset(){ return true; }
