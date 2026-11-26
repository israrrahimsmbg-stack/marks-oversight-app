/* ===================== main screens ===================== */

/* ---------- shared list rows ---------- */
function checkRow(e, opts = {}){
  const st = e.status;
  const o = ownersOf(e);
  return h("button",{type:"button",class:"li s-" + st.state, onclick:()=>go("#/check/" + encodeURIComponent(e.check.id))},
    h("span",{class:"bar4"}),
    h("div",null, h("b",null, opts.noHome ? "" : e.home.name + " · ", checkTitle(e)), h("small",{text:`${st.reason} · due ${dlong(e.check.due)} · owner: ${roleLabel(o.role)}${o.people.length ? " (" + o.people.map(p => p.name).join(", ") + ")" : ""}`})),
    h("div",{class:"r"}, p999(e.module), isBlankSubmit(e) ? h("span",{class:"flag",text:"Blank form submitted"}) : null, spill(st.state)));
}
function actionRow(a){
  const f = QA.actionFlags(a, today());
  const hm = S.homes[a.homeId];
  const tone = !f.open ? "complete" : f.hold ? "on_hold" : f.overdue ? "outstanding" : f.noDeadline ? "pending" : f.dueSoon ? "due_soon" : "in_progress";
  return h("button",{type:"button",class:"li s-" + tone, onclick:()=>openAction(a.id)},
    h("span",{class:"bar4"}),
    h("div",null, h("b",null, a.ref + " · " + a.finding), h("small",{text:`${hm ? hm.name : ""} · ${MOD[a.module] ? MOD[a.module].label : a.module} · owner: ${uname(a.ownerId)} · target: ${a.target ? dlong(a.target) : "none set"}`}), h("small",{text: a.nextStep ? `Next step: ${a.nextStep}${a.nextStepDate ? " · by " + dl(a.nextStepDate) : ""}` : "Next step: not set"})),
    h("div",{class:"r"}, actionFlagChips(f), h("span",{class:"pill nodot p-" + (a.status === "Completed" ? "occ" : a.status === "On hold" ? "away" : a.status === "Awaiting sign-off" ? "ref" : "unset"), text:a.status})));
}
function actionFlagChips(f){
  return h("span",{class:"flags"}, f.overdue ? h("span",{class:"flag",text:`${f.daysOver}d overdue`}) : null, f.noDeadline ? h("span",{class:"flag",text:"Deadline required"}) : null,
    f.noOwner ? h("span",{class:"flag",text:"No owner"}) : null, f.prioritised ? h("span",{class:"flag",text:"Head office priority"}) : null, f.nextStepLate ? h("span",{class:"flag warn",text:"Next step late"}) : null, f.updateDue ? h("span",{class:"flag warn",text:"Update due"}) : null, f.dueSoon ? h("span",{class:"flag info",text:"Due in 7 days"}) : null);
}
const visibleChecks = () => ev().all.filter(canSee);
const visibleActions = () => Object.values(S.actions).filter(canSeeAction);
const isLate = e => e.status.state === "outstanding" || (e.status.state === "blocked" && e.status.daysLate > 0);

/* ---------- dashboard ---------- */
function viewDashboard(){
  const u = me();
  const checks = visibleChecks(), acts = visibleActions(), t = today();
  const late = checks.filter(isLate);
  const late999 = late.filter(e => e.module.priority === "999");
  const soon = checks.filter(e => ["pending","due_soon"].includes(e.status.state) || (e.status.state === "upcoming" && e.status.daysLate >= -7));
  const flags = acts.map(a => QA.actionFlags(a, t));
  const overdueA = flags.filter(f => f.overdue).length, noDl = flags.filter(f => f.noDeadline).length;
  const deficits = checks.filter(e => e.status.state === "complete" && e.status.tally.bad && e.status.daysLate <= 28 && e.status.daysLate >= 0);
  const fireRed = ev().fire.filter(x => x.module.key === "fire_property" && homeFilterIds().includes(x.home.id) && access("fire_property", x.home.id) !== "none" && (x.rag.status === "RED" || x.rag.status === "NOT_RECORDED"));
  const hs = homeFilterIds().map(id => S.homes[id]);
  const running = hs.filter(x => RUNNING.includes(x.status));
  const isHO = QA.HEAD_OFFICE.includes(u.role) || u.role === "viewer";

  const tiles = h("div",{class:"kpis"},
    kpi("Checks not done", late.length, late999.length ? `${late999.length} are 999 priority` : "None at 999 priority", late.length ? "void" : "occ", "alert", ()=>go("#/checks/late")),
    kpi("Due in the next 7 days", soon.length, "Heads-up already sent to owners", "res", "clock", ()=>go("#/calendar")),
    kpi("Actions overdue", overdueA, `${nplural(noDl, "action")} with no deadline`, overdueA ? "void" : "occ", "flag", ()=>go("#/actions/overdue")),
    kpi("Audits with deficits", deficits.length, "Done, but some answers not met (last 4 weeks)", "acc", "clipboard", ()=>go("#/report")),
    kpi("Fire & certificates", fireRed.length, fireRed.length ? "Expired, overdue or not recorded" : "All in date", fireRed.length ? "void" : "occ", "flame", ()=>go("#/module/fire_property")),
    kpi("Homes running", `${running.length}/${hs.length}`, `${hs.filter(x => x.status === "live").length} live, ${hs.filter(x => x.status === "shadow").length} in shadow mode`, "brand", "home", ()=>go("#/homes")));

  const mods = visibleModules();
  const heat = h("div",{class:"heat"}, h("table",null,
    h("thead",null, h("tr",null, h("th",{text:"Home"}), mods.map(m => h("th",{class:"m"}, h("a",{href:"#/module/" + m.key, style:"color:inherit;text-decoration:none", text:m.label}))))),
    h("tbody",null, running.map(hm => h("tr",null, h("td",{class:"h"}, h("a",{href:"#/home/" + hm.id, text:hm.name}), hm.status === "shadow" ? h("div",{class:"meta",text:"shadow mode"}) : null),
      mods.map(m => { const on = hm.modules[m.key] && access(m.key, hm.id) !== "none"; const c = on ? cellFor(hm.id, m.key) : null;
        return h("td",null, on && c ? h("button",{type:"button",class:"cell s-" + c.state, title:`${hm.name} · ${m.label}: ${c.text}`, onclick:()=>go(`#/home/${hm.id}/${m.key}`), text:c.text}) : h("span",{class:"cell off",text:"off"})); }))))));

  const attention = late.sort((a,b) => (b.module.priority === "999") - (a.module.priority === "999") || b.status.daysLate - a.status.daysLate).slice(0, 8);
  const myTodo = checks.filter(e => mineToDo(e) && ["outstanding","pending","due_soon","blocked","in_progress"].includes(e.status.state)).sort((a,b) => b.status.daysLate - a.status.daysLate);
  const myActs = acts.filter(a => a.ownerId === u.id && QA.actionFlags(a, t).open);

  return h("div",{class:"page"},
    phead(dlong(t), isHO ? "Overview" : `Hello, ${u.name.split(" ")[0]}`, isHO ? "What is not done, what is due, and what needs a decision, across the homes you can see. Tap any number or square to see the detail." : "Your checks and actions for the homes you work in. A check only counts as done when every question is answered and you press Submit."),
    S.session.home === "all" && hs.some(x => x.status === "shadow") ? h("div",{class:"banner info"}, icon("eye",18), h("div",null, h("b",{text:"Shadow mode: "}), "Pendragon is running its checks, but alerts only go to the app builder and the compliance lead for a week while timings are tuned.")) : null,
    tiles,
    !isHO && myTodo.length ? card("Your checks", h("div",{class:"list"}, myTodo.slice(0,10).map(e => checkRow(e))), { raw:true, sub:"Oldest first. Outstanding checks are alerted every day until they are done." }) : null,
    !isHO && myActs.length ? card("Your actions", h("div",{class:"list"}, myActs.map(actionRow)), { raw:true }) : null,
    card("Homes at a glance", h("div",{class:"chain"}, heat, h("div",{class:"legend2"}, [["outstanding","Not done"],["blocked","Waiting on earlier checks"],["pending","Due today"],["due_soon","Due soon"],["deficit","Done with deficits"],["complete","All done"]].map(([s,l]) => h("span",{class:"s-" + s}, h("i"), l)))), { sub:"Worst status in the current period for each home and module. Switched-off modules are hatched." }),
    h("div",{class:"grid2"},
      card("Needs attention now", attention.length ? h("div",{class:"list"}, attention.map(e => checkRow(e))) : empty("Nothing is outstanding."), { raw:true, right: link("All not done", "#/checks/late") }),
      card("Actions overdue or without a deadline", (() => { const l = acts.filter(a => { const f = QA.actionFlags(a, t); return f.overdue || f.noDeadline; }).sort((a,b) => QA.actionFlags(b, t).daysOver - QA.actionFlags(a, t).daysOver).slice(0, 8); return l.length ? h("div",{class:"list"}, l.map(actionRow)) : empty("No overdue actions."); })(), { raw:true, right: link("All actions", "#/actions") })));
}

/* ---------- checks list / to do ---------- */
function viewChecks(mode){
  const t = today();
  const all = visibleChecks();
  const u = me();
  let list, title, desc;
  if (mode === "late"){ list = all.filter(isLate).sort((a,b) => b.status.daysLate - a.status.daysLate); title = "Checks not done"; desc = "Checks past their due date that have not been fully completed. A check done with 'not met' answers is not here: it shows as a deficit in the Monday report."; }
  else { list = all.filter(e => (QA.HEAD_OFFICE.includes(u.role) ? canRecord(e) : mineToDo(e)) && e.status.daysLate >= -14 && !["complete","na","upcoming"].includes(e.status.state) || (mode !== "late" && mineToDo(e) && e.status.state === "upcoming" && e.status.daysLate >= -7)).sort((a,b) => b.status.daysLate - a.status.daysLate); title = "To do"; desc = "Checks you can complete, oldest first. Team leaders see weekly checks, deputies weekly and monthly, managers all of them."; }
  const f = S.session.checkFilter || {};
  const fl = list.filter(e => (!f.module || e.module.key === f.module) && (!f.level || e.check.level === f.level));
  const groups = [["Not done (late)", fl.filter(isLate)], ["Due today", fl.filter(e => e.status.state === "pending")], ["Waiting on earlier checks", fl.filter(e => e.status.state === "blocked" && e.status.daysLate <= 0)], ["Coming up", fl.filter(e => ["due_soon","in_progress","upcoming"].includes(e.status.state))], ["On hold", fl.filter(e => e.status.state === "on_hold")]];
  const mods = visibleModules().filter(m => m.chain);
  return h("div",{class:"page"},
    phead(mode === "late" ? "Oversight" : "My work", title, desc, [
      sel([["", "All modules"], ...mods.map(m => [m.key, m.label])], f.module || "", v => { S.session.checkFilter = Object.assign({}, f, { module:v }); save(); render(); }),
      sel([["", "All levels"], ...Object.entries(S.levels).map(([k,v]) => [k, v.label + (k === "monthly_simple" ? " (simple)" : "")])], f.level || "", v => { S.session.checkFilter = Object.assign({}, f, { level:v }); save(); render(); })]),
    card(null, fl.length ? h("div",{class:"list"}, groups.filter(g => g[1].length).map(([g, l]) => [h("div",{class:"grouph",text:`${g} · ${l.length}`}), l.map(e => checkRow(e))])) : empty(mode === "late" ? "Everything is done. Nothing is outstanding." : "Nothing for you to do right now."), { raw:true }));
}

/* ---------- one check: answer the questions ---------- */
function viewCheck(id){
  const e = ev().byId[id];
  if (!e || !canSee(e)) return h("div",{class:"page"}, h("div",{class:"banner bad",text:"This check is not available to you, or its module is switched off for this home."}));
  const m = e.module, c = e.check, st = e.status;
  const qs = QA.questionsFor(m, c.level);
  const draft = S.ui && S.ui.draftId === id ? S.ui.draft : clone(S.records[id] || { answers:{} });
  S.ui = { draftId:id, draft, showErrors: !!(S.ui && S.ui.draftId === id && S.ui.showErrors) };
  draft.answers = draft.answers || {};
  const editable = canRecord(e) && st.state !== "complete" && st.state !== "na";
  const blocked = st.state === "blocked";
  const v = QA.validateSubmission(cfgNow(), m, c.level, draft);
  const own = ownersOf(e);
  const deps = (c.deps || []).map(d => ev().byId[d]).filter(Boolean);
  const alertsNow = QA.checkAlerts(e, { config:cfgNow(), users:S.users, today:today(), settings:S.settings });
  const t = QA.timing(cfgNow(), m, c.level);
  const ans = (i, val) => { draft.answers[i] = draft.answers[i] === val ? undefined : val; render(); };

  const qlist = h("div",{class:"qs"}, qs.map((q, i) => {
    const set = CFG.answer_sets[q.answers];
    const val = draft.answers[i];
    return h("div",{class:"q" + (val && set.bad.includes(val) ? " bad" : "") + (!val && st.daysLate >= 0 ? " miss" : "")},
      h("span",{class:"no",text:i + 1}), h("span",{class:"txt",text:q.q}),
      h("div",{class:"seg3",role:"group","aria-label":q.q}, set.options.map(o => h("button",{type:"button","aria-pressed":String(val === o), class: o === "N/A" ? "n" : set.bad.includes(o) ? "b" : "g", disabled: !editable || blocked ? true : null, onclick:()=>ans(i, o), text:o}))));
  }));
  const tl = v.tally;
  const pct = tl.total ? Math.round(tl.answered / tl.total * 100) : 0;
  const submit = () => {
    if (blocked) return toast("Finish the earlier checks first.");
    const vv = QA.validateSubmission(cfgNow(), m, c.level, draft);
    if (!vv.ok) { toast("Not submitted yet: see what's missing above the questions."); S.ui.showErrors = true; return render(); }
    S.records[id] = Object.assign({}, draft, { submitted:true, submittedAt:new Date().toISOString(), submittedBy:me().id, onHold:null });
    logAct(`Submitted ${e.home.name} · ${checkTitle(e)}${vv.tally.bad ? ` with ${vv.tally.bad} not met` : ""}`, { checkId:id });
    S.ui = null; save(); EV = null; toast(vv.tally.bad ? "Submitted. Not-met answers show as deficits in the Monday report." : "Submitted. Thank you.");
    if (vv.tally.bad) offerActions(e, vv.tally.badItems); else render();
  };
  const saveDraft = () => { S.records[id] = Object.assign({}, draft, { submitted:false }); logAct(`Saved a draft of ${e.home.name} · ${checkTitle(e)}`, { checkId:id }); save(); EV = null; toast("Draft saved. It still counts as not done until you submit."); render(); };

  return h("div",{class:"page"},
    h("div",{class:"crumbs"}, link(e.home.name, "#/home/" + e.home.id), "›", link(m.label, "#/module/" + m.key), "›", h("span",{text:levelLabel(c.level) + " · " + c.label})),
    phead(`${e.home.name} · ${m.label}`, `${levelLabel(c.level)} check · ${c.label}`, `${c.sub}. Due ${dlong(c.due)}. ${m.tracker ? "Tracker: " + m.tracker + "." : ""}`, [p999(m), spill(st.state)]),
    st.state === "complete" ? h("div",{class:"banner info"}, icon("check",18), h("div",null, h("b",{text:"Completed "}), `by ${uname(S.records[id].submittedBy)} on ${tl ? dl((S.records[id].submittedAt||"").slice(0,10)) : ""}. ${tl.bad ? `${tl.bad} not met: these are deficits for the manager to follow up, not overdue items.` : "All met."}`)) : null,
    isBlankSubmit(e) ? h("div",{class:"banner bad"}, icon("alert",18), h("div",null, h("b",{text:"A blank or part-filled form was submitted. "}), "It does not count as done. Ask for the completed, signed audit.")) : null,
    st.state === "on_hold" ? h("div",{class:"banner"}, icon("pause",18), h("div",{text:"On hold: " + st.reason + ". No alerts while on hold."})) : null,
    blocked ? h("div",{class:"banner"}, icon("lock",18), h("div",null, h("b",{text:"Waiting on earlier checks. "}), "This level can only be done once the checks below it are complete (team leader › deputy › service manager). The earlier checks are being alerted, so this one is not alerted separately.")) : null,
    h("div",{class:"split"},
      h("section",{class:"card"},
        h("header",null, h("div",null, h("h2",{text:qs.length ? `Questions (${tl.answered} of ${tl.total} answered)` : "Confirm"}), h("div",{class:"meta",text: editable ? "Tap an answer. Tap it again to clear it." : "Read only for you."})), h("div",{style:"min-width:140px"}, h("div",{class:"progress"}, h("i",{style:{width:pct + "%"}})))),
        h("div",{class:"body"},
          S.ui && S.ui.showErrors && !v.ok ? h("div",{class:"errors"}, v.errors.map(x => h("div",{class:"banner bad",text:x}))) : null,
          qlist,
          h("div",{class:"fgrid",style:"margin-top:14px"},
            field("Evidence and comments", h("textarea",{disabled: !editable ? true : null, placeholder:"What did you check? What did you find? Where is the evidence (file name)?", oninput:ev2 => { draft.evidence = ev2.target.value; }, text:draft.evidence || ""}), "needed if anything is not met"),
            tl.na > tl.total / 2 && tl.total >= 4 ? field("Why so many N/A?", h("input",{type:"text",value:draft.naReason || "",disabled: !editable ? true : null, oninput:ev2 => { draft.naReason = ev2.target.value; }})) : null)),
        editable ? h("div",{class:"sticky-foot"},
          h("button",{type:"button",class:"btn ghost",onclick:saveDraft,text:"Save draft"}),
          h("button",{type:"button",class:"btn",disabled: blocked ? true : null, onclick:submit}, icon("check"), "Submit as complete")) : null),
      h("div",{style:"display:flex;flex-direction:column;gap:18px"},
        card("Who owns this", h("div",{class:"chain"},
          h("div",null, h("b",{text:roleLabel(own.role)}), h("div",{class:"meta",text: own.people.length ? own.people.map(p => p.name + (p.coverFor ? " (covering)" : "")).join(", ") : "Nobody in this role at this home"})),
          h("div",{class:"meta",text:`Heads-up ${nplural(t.heads_up_days, "day")} before. Outstanding from ${nplural(t.outstanding_after_days, "day")} late, then a reminder every ${m.priority === "999" ? "day (999 priority)" : nplural(t.repeat_every_days, "day")}. Escalated at ${nplural(t.escalate_after_days, "day")} late.`}))),
        alertsNow.length ? card("Alerts going out today", h("div",{class:"who"}, alertsNow[0].recipients.map(r => h("span",{class:"pill p-brand",title:r.why.join(", "),text:`${uname(r.userId)} · ${r.why[0]}`}))), { sub: alertsNow[0].reason }) : null,
        deps.length ? card("Depends on", h("div",{class:"list"}, deps.map(d => checkRow(d, { noHome:true }))), { raw:true, sub:"All of these must be complete first." }) : null,
        canManage(m.key, e.home.id) ? card("Manage", h("div",{class:"row"},
          st.state !== "on_hold" && st.state !== "complete" ? h("button",{type:"button",class:"btn ghost sm",onclick:()=>holdCheck(e)}, icon("pause"), "Put on hold") : null,
          st.state === "on_hold" ? h("button",{type:"button",class:"btn ghost sm",onclick:()=>{ S.records[id] = Object.assign({}, S.records[id], { onHold:null }); logAct("Took off hold: " + checkTitle(e)); save(); EV = null; render(); }, text:"Take off hold"}) : null,
          st.state !== "na" && st.state !== "complete" ? h("button",{type:"button",class:"btn ghost sm",onclick:()=>naCheck(e),text:"Not applicable"}) : null,
          st.state === "complete" || st.state === "na" ? h("button",{type:"button",class:"btn ghost sm",onclick:()=>{ S.records[id] = Object.assign({}, S.records[id], { submitted:false, na:false }); logAct("Reopened " + e.home.name + " · " + checkTitle(e)); save(); EV = null; S.ui = null; render(); }, text:"Reopen"}) : null,
          h("button",{type:"button",class:"btn soft sm",onclick:()=>newAction({ homeId:e.home.id, module:m.key, source:c.label })}, icon("plus"), "Raise an action")), { sub:"Head office and module leads only." }) : null)));
}
function holdCheck(e){
  const reason = h("input",{type:"text",placeholder:"e.g. resident in hospital"}), review = h("input",{type:"date",value:addD(today(), 7)});
  openModal("Put this check on hold", [h("p",{class:"meta",text:"No alerts are sent while a check is on hold. It comes back automatically on the review date."}), field("Reason", reason), field("Review date", review),
    h("div",{class:"acts"}, h("button",{type:"button",class:"btn ghost",onclick:closeModal,text:"Cancel"}), h("button",{type:"button",class:"btn",text:"Put on hold",onclick:()=>{ if (!reason.value.trim()) return toast("Give a reason."); S.records[e.check.id] = Object.assign({}, S.records[e.check.id] || { answers:{} }, { onHold:{ reason:reason.value.trim(), review:review.value } }); logAct(`Put on hold: ${e.home.name} · ${checkTitle(e)} (${reason.value.trim()})`); save(); EV = null; closeModal(); render(); }}))]);
}
function naCheck(e){
  const reason = h("input",{type:"text",placeholder:"e.g. no residents' money handled this week"});
  openModal("Mark as not applicable", [field("Reason (kept in the activity log)", reason), h("div",{class:"acts"}, h("button",{type:"button",class:"btn ghost",onclick:closeModal,text:"Cancel"}), h("button",{type:"button",class:"btn",text:"Mark N/A",onclick:()=>{ if (!reason.value.trim()) return toast("Give a reason."); S.records[e.check.id] = Object.assign({}, S.records[e.check.id] || {}, { na:true, naReason:reason.value.trim() }); logAct(`Marked N/A: ${e.home.name} · ${checkTitle(e)} (${reason.value.trim()})`); save(); EV = null; closeModal(); render(); }}))]);
}
function offerActions(e, items){
  openModal("Raise actions for what was not met?", [h("p",{class:"meta",text:"Each finding needs an owner and a target date, otherwise it shows as 'Deadline required' in the Monday report."}),
    h("div",{class:"list"}, items.map(q => h("div",{class:"li",style:"cursor:default"}, h("span",{class:"bar4",style:"--sc:var(--void)"}), h("div",null, h("b",{text:q})), h("div",{class:"r"}, h("button",{type:"button",class:"btn soft sm",text:"Raise action",onclick:()=>{ closeModal(); newAction({ homeId:e.home.id, module:e.module.key, source:e.check.label, finding:q }); }}))))),
    h("div",{class:"acts"}, h("button",{type:"button",class:"btn ghost",onclick:()=>{ closeModal(); render(); },text:"Not now"}))]);
}

/* ---------- actions ---------- */
function viewActions(filter){
  const t = today();
  const f = filter || S.session.actFilter || "open";
  const all = visibleActions().map(a => ({ a, f:QA.actionFlags(a, t) }));
  const tabs = [["open","Open",x => x.f.open],["overdue","Overdue",x => x.f.overdue],["nodeadline","Deadline required",x => x.f.noDeadline],["nonext","No next step",x => x.f.noNextStep],["priority","Head office priority",x => x.f.prioritised],["update","Update due",x => x.f.updateDue],["signoff","Awaiting sign-off",x => x.f.needsSignOff],["hold","On hold",x => x.f.hold],["done","Completed",x => !x.f.open],["mine","Mine",x => x.a.ownerId === me().id && x.f.open]];
  const tab = tabs.find(x => x[0] === f) || tabs[0];
  const mf = S.session.actModule || "";
  const list = all.filter(tab[2]).filter(x => !mf || x.a.module === mf).sort((x, y) => (y.f.prioritised - x.f.prioritised) || (y.f.daysOver - x.f.daysOver) || String(x.a.target || "9").localeCompare(String(y.a.target || "9")));
  const canNew = visibleModules().some(m => myHomes().some(hm => QA.atLeast(access(m.key, hm.id), "record")));
  return h("div",{class:"page"},
    phead("My work", "Actions", "Every finding gets an owner, a target date and a mid-point progress update. Statuses: Not started, In progress, Awaiting evidence, Awaiting sign-off, Completed, On hold.", [
      sel([["", "All modules"], ...visibleModules().map(m => [m.key, m.label])], mf, v => { S.session.actModule = v; save(); render(); }),
      canNew ? h("button",{type:"button",class:"btn",onclick:()=>newAction({})}, icon("plus"), "New action") : null,
      h("button",{type:"button",class:"btn ghost",onclick:()=>exportActions(list.map(x => x.a))}, icon("dl"), "CSV")]),
    h("div",{class:"tabs",role:"tablist"}, tabs.map(([k, l, fn]) => h("button",{type:"button",role:"tab","aria-selected":String(k === tab[0]),onclick:()=>{ S.session.actFilter = k; save(); go("#/actions/" + k); }}, l, " ", h("span",{class:"meta",text:"(" + all.filter(fn).length + ")"})))),
    card(null, list.length ? h("div",{class:"list"}, list.map(x => actionRow(x.a))) : empty("No actions here."), { raw:true }));
}
function exportActions(list){
  const cols = ["ref","home","module","finding","action","priority","owner","identified","target","status","evidence"];
  const esc = v => `"${String(v ?? "").replace(/"/g,'""')}"`;
  const rows = list.map(a => [a.ref, (S.homes[a.homeId]||{}).name, (MOD[a.module]||{}).label, a.finding, a.action, a.priority, uname(a.ownerId), a.identified, a.target, a.status, a.evidence].map(esc).join(","));
  download("actions.csv", [cols.join(","), ...rows].join("\n"), "text/csv");
}
function homeOptions(writeModule){ return myHomes().filter(hm => RUNNING.includes(hm.status)).filter(hm => !writeModule || QA.atLeast(access(writeModule, hm.id), "record")).map(hm => [hm.id, hm.name]); }
function newAction(pre){
  const homes = homeOptions();
  if (!homes.length) return toast("You do not have a running home to add actions to.");
  const a = Object.assign({ id:"a-" + uid(), homeId: pre.homeId || homes[0][0], module: pre.module || "finance", source: pre.source || "", finding: pre.finding || "", action:"", priority:"Medium", ownerId:null, identified: today(), target:null, status:"Not started", evidence:"", comments:[], createdBy: me().id }, {});
  editAction(a, true);
}
function openAction(id){ editAction(clone(S.actions[id]), false); }
function editAction(a, isNew){
  const hm = S.homes[a.homeId];
  const canEdit = isNew || canEditAction(a);
  const staff = id => Object.values(S.users).filter(u => u.role !== "support_worker" && !u.disabled && (QA.inHome(u, id))).sort((x,y) => x.name.localeCompare(y.name));
  const D = (k, el) => { el.addEventListener("input", () => { a[k] = el.value || null; }); el.addEventListener("change", () => { a[k] = el.value || null; }); if (!canEdit) el.disabled = true; return el; };
  const homeSel = D("homeId", sel(homeOptions(), a.homeId, v => { a.homeId = v; }));
  const modSel = D("module", sel(MODS.map(m => [m.key, m.label]), a.module, v => { a.module = v; }));
  const owner = D("ownerId", sel([["", "No owner yet"], ...staff(a.homeId).map(u => [u.id, `${u.name} (${roleLabel(u.role)})`])], a.ownerId || "", v => { a.ownerId = v || null; }));
  const statusSel = D("status", sel(CFG.action_statuses.map(s => [s, s]), a.status, v => { a.status = v; }));
  const holdReason = h("input",{type:"text",value:(a.hold||{}).reason || "",placeholder:"Why it is on hold",disabled: !canEdit ? true : null});
  const holdReview = h("input",{type:"date",value:(a.hold||{}).review || "",disabled: !canEdit ? true : null});
  const note = h("textarea",{placeholder:"Progress update (kept in the history, can't be edited later)",style:"min-height:60px",disabled: !canEdit ? true : null});
  const f = QA.actionFlags(a, today());
  const doSave = () => {
    if (!a.finding || !a.finding.trim()) return toast("Describe the finding.");
    if (a.status === "On hold") { if (!holdReason.value.trim()) return toast("Give a reason for putting it on hold."); a.hold = { reason:holdReason.value.trim(), review:holdReview.value || null }; } else a.hold = null;
    if (a.status === "Completed") {
      if (!(a.evidence || "").trim()) return toast("Add the evidence before completing.");
      if (!canSignOff(a)) return toast("Set it to Awaiting sign-off. A manager or head office signs it off.");
      a.verifiedBy = me().id; a.verifiedOn = today();
    }
    const prev = S.actions[a.id];
    if (note.value.trim()) a.comments = (a.comments || []).concat({ at:new Date().toISOString(), by:me().id, text:note.value.trim() });
    if (prev && prev.status !== a.status) a.comments = (a.comments || []).concat({ at:new Date().toISOString(), by:me().id, text:`Status: ${prev.status} › ${a.status}` });
    if (!a.ref) { const short = (MOD[a.module]||{}).short || "ACT"; const pre = (S.homes[a.homeId].name.match(/\b[A-Z]/g) || ["X"]).join("").slice(0,2); const n = Object.values(S.actions).filter(x => x.homeId === a.homeId && x.module === a.module).length + 1; a.ref = `${pre}-${short.replace("&","")}-${String(n).padStart(3,"0")}`; }
    S.actions[a.id] = a; logAct(`${isNew ? "Raised" : "Updated"} action ${a.ref}`, { actionId:a.id }); save(); EV = null; closeModal(); toast("Saved"); render();
  };
  const body = [
    !isNew ? h("div",{class:"row"}, h("span",{class:"pill nodot p-brand",text:a.ref}), actionFlagChips(f), f.updateOn ? h("span",{class:"meta",text:"Mid-point update: " + dlong(f.updateOn)}) : null) : null,
    h("div",{class:"fgrid"}, field("Home", homeSel), field("Module", modSel), field("Source", D("source", h("input",{type:"text",value:a.source || "",placeholder:"e.g. Week 5, QA visit"}))), field("Priority", D("priority", sel(CFG.action_priorities.map(p => [p,p]), a.priority, v => { a.priority = v; })))),
    field("Finding", D("finding", h("input",{type:"text",value:a.finding || ""}))),
    field("What needs to happen", D("action", h("textarea",{text:a.action || "",style:"min-height:60px"}))),
    h("div",{class:"fgrid"}, field("Owner", owner), field("Identified", D("identified", h("input",{type:"date",value:a.identified || ""}))), field("Target date", D("target", h("input",{type:"date",value:a.target || ""})), "required"), field("Progress update due", D("updateDue", h("input",{type:"date",value:a.updateDue || ""})), "default: mid-point")),
    h("div",{class:"fgrid"}, field("Next step", D("nextStep", h("input",{type:"text",value:a.nextStep || "",placeholder:"e.g. Zara meeting the landlord"})), "what happens next"), field("Next step by", D("nextStepDate", h("input",{type:"date",value:a.nextStepDate || ""})))),
    h("div",{class:"fgrid"}, field("Status", statusSel), field("Evidence / reference", D("evidence", h("input",{type:"text",value:a.evidence || "",placeholder:"file name or link"})))),
    a.prioritisedBy ? h("div",{class:"banner"}, icon("flag",18), h("div",{text:`Made a priority by ${uname(a.prioritisedBy)} on ${dlong(a.prioritisedOn)}: ${a.prioritisedWhy}`})) : null,
    h("div",{class:"fgrid"}, field("On hold: reason", holdReason), field("On hold: review date", holdReview)),
    a.verifiedBy ? h("div",{class:"banner info",text:`Signed off by ${uname(a.verifiedBy)} on ${dlong(a.verifiedOn)}.`}) : null,
    field("Add a progress update", note),
    (a.comments || []).length ? h("div",null, h("h4",{class:"meta",style:"margin:0 0 6px",text:"History"}), h("div",{class:"comments"}, (a.comments || []).slice().reverse().map(c => h("div",{class:"comment"}, h("small",{text:`${uname(c.by)} · ${tl(c.at)}`}), c.text)))) : null,
    h("div",{class:"acts"}, !isNew && f.open && cap("prioritise") && QA.HEAD_OFFICE.includes(me().role) ? h("button",{type:"button",class:"btn ghost",onclick:()=>prioritise(a.id)}, icon("flag"), a.prioritisedBy ? "Change priority note" : "Make this a priority") : null,
      h("button",{type:"button",class:"btn ghost",onclick:closeModal,text: canEdit ? "Cancel" : "Close"}), canEdit ? h("button",{type:"button",class:"btn",onclick:doSave,text: isNew ? "Raise action" : "Save"}) : null)
  ];
  openModal(isNew ? "New action" : a.finding, body, { wide:true, sub: isNew ? "Owner and target date are required for it to stop showing 'Deadline required'." : `${hm ? hm.name : ""} · ${(MOD[a.module]||{}).label || ""} · raised by ${uname(a.createdBy)}` });
}

/* Mark, 18 Nov: "Zara, why aren't we making this a priority?" Head office can challenge an action:
   it becomes High priority, the reason goes in the history, and the owner sees it at the top of their list. */
function prioritise(id){
  const a = S.actions[id]; if (!a) return;
  const why = h("textarea",{placeholder:"Why this needs to move now, and what you expect by when",style:"min-height:70px"});
  const by = h("input",{type:"date",value:a.nextStepDate || addD(today(), 3)});
  closeModal();
  openModal("Make this a priority", [h("p",{class:"meta",text:`${a.ref} · ${a.finding}. The owner (${uname(a.ownerId)}) and the service manager are told in tomorrow's digest, and it moves to the top of the Monday report.`}), field("Reason", why), field("Next step needed by", by),
    h("div",{class:"acts"}, h("button",{type:"button",class:"btn ghost",onclick:closeModal,text:"Cancel"}), h("button",{type:"button",class:"btn",text:"Make it a priority",onclick:()=>{
      if (!why.value.trim()) return toast("Say why it is a priority.");
      Object.assign(a, { priority:"High", prioritisedBy:me().id, prioritisedOn:today(), prioritisedWhy:why.value.trim(), nextStepDate: by.value || a.nextStepDate });
      a.comments = (a.comments || []).concat({ at:new Date().toISOString(), by:me().id, text:`Made a priority: ${why.value.trim()}` });
      logAct(`Made action ${a.ref} a priority`, { actionId:a.id }); save(); EV = null; closeModal(); toast("Marked as a priority"); render(); }}))]);
}

/* ---------- Monday report ---------- */
const RAGPILL = { RED:["outstanding","Red"], AMBER:["due_soon","Amber"], GREEN:["complete","Green"] };
function viewReport(){
  const t = today();
  const homes = Object.fromEntries(homeFilterIds().map(id => [id, S.homes[id]]));
  const evaluated = visibleChecks();
  const rated = ev().fire.filter(x => homeFilterIds().includes(x.home.id) && access(x.module.key, x.home.id) !== "none");
  const rep = QA.mondayReport({ homes, evaluated, actions: visibleActions(), today: t, rated });
  const nextMon = (() => { let d = t; while (new Date(d + "T00:00:00Z").getUTCDay() !== 1) d = addD(d, 1); return d; })();
  const recips = Object.values(S.users).filter(u => (S.caps.monday || []).includes(u.role));
  const sec = (title, items, id) => items.length ? h("div",{class:"rsec",id}, h("h4",{text:`${title} (${items.length})`}), h("ul",null, items)) : null;
  const jump = id => () => { const el = document.getElementById(id) || document.querySelector(`[id^="${id}"]`); if (el) el.scrollIntoView({ behavior:"smooth", block:"start" }); else toast("Nothing in this section."); };
  const actLi = (a, extra) => h("li",null, h("a",{href:"#",onclick:ev2 => { ev2.preventDefault(); openAction(a.id); }, text:a.ref}), ` ${a.finding} · ${extra} · ${uname(a.ownerId)} · next step: ${a.nextStep ? a.nextStep + (a.nextStepDate ? " by " + dl(a.nextStepDate) : "") : "not set"}`, a.prioritisedBy ? h("span",{class:"flag",style:"margin-left:6px",text:"priority"}) : null);
  return h("div",{class:"page"},
    phead("Oversight", "Monday report", `Sent every Monday at ${S.settings.mondayTime} (next: ${dlong(nextMon)}) to ${recips.map(u => u.name).join(", ")}. Home by home: what is out of date, what is coming up, and what is in date, with the actions and next steps behind every number. Tap any number or line to drill in.`, [
      h("button",{type:"button",class:"btn ghost",onclick:()=>window.print()}, icon("print"), "Print"),
      h("button",{type:"button",class:"btn ghost",onclick:()=>download(`qa-report-${t}.txt`, QA.mondayText(rep))}, icon("dl"), "Email text")]),
    h("div",{class:"kpis"},
      kpi("Homes red", `${rep.totals.red}/${rep.rows.length}`, "a 999 item not done or out of date", rep.totals.red ? "void" : "occ", "home", jump("rh-")),
      kpi("Not done", rep.totals.outstanding, "checks past due", rep.totals.outstanding ? "void" : "occ", "alert", ()=>go("#/checks/late")),
      kpi("Out of date", rep.totals.registerRed, "certificates, fire log, care records", rep.totals.registerRed ? "void" : "occ", "flame", jump("rs-red-")),
      kpi("Deficits", rep.totals.deficits, "audits with not-met answers", "acc", "clipboard", jump("rs-def-")),
      kpi("Actions overdue", rep.totals.overdueActions, "", rep.totals.overdueActions ? "void" : "occ", "flag", ()=>go("#/actions/overdue")),
      kpi("Coming up", rep.totals.dueSoonChecks + rep.totals.dueSoon, "checks and actions due in 7 days", "res", "clock", ()=>go("#/calendar")),
      kpi("In date", rep.totals.inDate, "done or in date", "occ", "check")),
    h("div",{class:"banner info"}, icon("book",18), h("div",null, h("b",{text:"RAG for each home [UNVERIFIED]: "}), "Red when a 999 item (finance, medication, H&S, fire & certificates) is not done or out of date, or an action is 14 or more days over. Amber when anything else is outstanding, there are deficits, or an action is overdue or has no deadline. Green when nothing is.")),
    card(null, rep.rows.length ? rep.rows.map(r => h("div",{class:"report-home",id:"rh-" + r.home.id},
      h("h3",null, h("a",{href:"#/home/" + r.home.id, style:"color:inherit;text-decoration:none", text:r.home.name}), spill(RAGPILL[r.rag][0], RAGPILL[r.rag][1]), r.home.status === "shadow" ? h("span",{class:"pill p-ref",text:"shadow mode"}) : null, r.outstanding999 ? h("span",{class:"p999",text:r.outstanding999 + " × 999"}) : null, h("span",{class:"meta",style:"font-weight:500",text:`${r.inDate} in date`})),
      sec("Checks not done", r.outstanding.map(e => h("li",null, h("a",{href:"#/check/" + encodeURIComponent(e.check.id), text:checkTitle(e)}), ` · ${e.status.reason} · owner ${roleLabel(ownersOf(e).role)}`))),
      sec("Out of date: certificates, fire log, care records", r.registerRed.map(x => h("li",null, h("a",{href:`#/home/${r.home.id}/${x.module.key}`, text:ratedLabel(x)}), `: ${x.rag.reason}`)), "rs-red-" + r.home.id),
      sec("Deficits (done, but not met)", r.deficits.map(e => h("li",null, h("a",{href:"#/check/" + encodeURIComponent(e.check.id), text:checkTitle(e)}), ": " + e.status.tally.badItems.join("; "))), "rs-def-" + r.home.id),
      sec("Actions overdue", r.overdueActions.map(({ a, f }) => actLi(a, `${f.daysOver} days over`))),
      sec("Actions due in the next 7 days", r.dueSoon.map(({ a }) => actLi(a, `due ${dl(a.target)}`))),
      sec("Deadline required", r.noDeadline.map(({ a }) => actLi(a, "no target date"))),
      sec("Late or due actions with no next step", r.noNextStep.map(({ a }) => actLi(a, a.status))),
      sec("Coming up in the next 7 days", [...r.dueSoonChecks.map(e => h("li",null, h("a",{href:"#/check/" + encodeURIComponent(e.check.id), text:checkTitle(e)}), ` · due ${dl(e.check.due)}`)), ...r.registerSoon.filter(x => diffD(t, x.rag.due) <= 7).map(x => h("li",null, h("a",{href:`#/home/${r.home.id}/${x.module.key}`, text:ratedLabel(x)}), ` · ${x.rag.reason}`))]),
      r.rag === "GREEN" && !r.dueSoonChecks.length ? h("div",{class:"meta",text:"Nothing outstanding."}) : null)) : empty("No homes are running yet."), { raw:true }));
}

/* ---------- alerts (what would be emailed today) ---------- */
function viewAlerts(){
  const t = today();
  const al = alertsToday().filter(a => homeFilterIds().includes(a.homeId));
  const ds = QA.digests(al, S.users);
  const mineOnly = !QA.HEAD_OFFICE.includes(me().role);
  const shown = mineOnly ? ds.filter(d => d.user.id === me().id) : ds;
  const fsel = S.session.alertUser || "";
  const list = fsel ? shown.filter(d => d.user.id === fsel) : shown;
  const KIND = { prioritised:["Priority","outstanding"], escalated:["Escalated","outstanding"], outstanding:["Outstanding","outstanding"], action_overdue:["Action overdue","pending"], action_update:["Update due","due_soon"], heads_up:["Heads-up","due_soon"] };
  return h("div",{class:"page"},
    phead("Oversight", "Alerts", `The digest emails that go out on ${dlong(t)} at ${S.settings.digestTime}: one email per person, never one per check. Change the date in the demo panel to see other days.`, mineOnly ? null : [sel([["", "Everyone"], ...ds.map(d => [d.user.id, `${d.user.name} (${d.items.length})`])], fsel, v => { S.session.alertUser = v; save(); render(); })]),
    h("div",{class:"banner info"}, icon("bell",18), h("div",null, "Alerts are only for checks that have ", h("b",{text:"not been done"}), ". A check done with 'not met' answers is not alerted: the manager follows it up and it shows in the Monday report. Support workers are never notified. Head office is copied ", h("b",{text: S.settings.headOfficeFrom === "first" ? "from the first alert (Mark's rule, 24 Nov)" : "only when escalated"}), ".")),
    h("div",{class:"grid2"}, list.length ? list.map(d => card(`${d.user.name}`, h("div",{class:"list"}, d.items.map(it => h("div",{class:"li s-" + KIND[it.kind][1], style:"cursor:pointer", onclick:()=> it.checkId ? go("#/check/" + encodeURIComponent(it.checkId)) : it.ruleKey ? go(`#/home/${it.homeId}/${it.module}`) : openAction(it.actionId)},
        h("span",{class:"bar4"}), h("div",null, h("b",{text:`${S.homes[it.homeId].name} · ${it.title}`}), h("small",{text:`${it.reason} · why you: ${it.why.join(", ")}`})), h("div",{class:"r"}, it.priority === "999" ? h("span",{class:"p999",text:"999"}) : null, spill(KIND[it.kind][1], KIND[it.kind][0]))))), { raw:true, sub:`${roleLabel(d.user.role)} · ${d.user.email} · ${nplural(d.items.length, "item")}` })) : card(null, empty("No alerts go out on this day."))));
}

/* ---------- forward look ---------- */
function viewCalendar(){
  const t = today();
  const days = +(S.session.ahead || 14);
  const items = visibleChecks().filter(e => e.status.daysLate <= 0 && e.status.daysLate >= -days && !["complete","na"].includes(e.status.state));
  const acts = visibleActions().filter(a => { const f = QA.actionFlags(a, t); return f.live && a.target && a.target >= t && diffD(t, a.target) <= days; });
  const regs = ev().fire.filter(x => homeFilterIds().includes(x.home.id) && access(x.module.key, x.home.id) !== "none" && x.rag.due && x.rag.due >= t && diffD(t, x.rag.due) <= days);
  const byDay = {};
  const slot = d => (byDay[d] = byDay[d] || { c:[], a:[], r:[] });
  items.forEach(e => slot(e.check.due).c.push(e));
  acts.forEach(a => slot(a.target).a.push(a));
  regs.forEach(x => slot(x.rag.due).r.push(x));
  const regRow = x => h("button",{type:"button",class:"li s-due_soon",onclick:()=>go(`#/home/${x.home.id}/${x.module.key}`)}, h("span",{class:"bar4"}), h("div",null, h("b",{text:`${x.home.name} · ${x.module.label} · ${ratedLabel(x)}`}), h("small",{text:x.rag.reason})), h("div",{class:"r"}, p999(x.module), basis(x.rule.basis)));
  const keys = Object.keys(byDay).sort();
  return h("div",{class:"page"},
    phead("My work", "Forward look", "What falls due, day by day: checks, actions, certificates and care record reviews. Owners get a heads-up before each due date.", [h("div",{class:"seg",role:"group"}, [7,14,21,30,90].map(n => h("button",{type:"button","aria-pressed":String(days === n),onclick:()=>{ S.session.ahead = n; save(); render(); },text:`${n} days`})))]),
    card(`Next ${days} days`, keys.length ? h("div",{class:"list"}, keys.map(k => [h("div",{class:"grouph",text:`${dlong(k)}${k === t ? " · today" : ""}`}), byDay[k].c.map(e => checkRow(e)), byDay[k].r.map(regRow), byDay[k].a.map(actionRow)])) : empty("Nothing due in this window."), { raw:true, sub:`${items.length} checks, ${regs.length} certificates or reviews and ${acts.length} actions due in the next ${days} days.` }));
}
