/* ===================== sample data (invented) =====================
   Real home names (public, from estocare.com) in Mark's rollout order, 25 Nov 2026.
   Every person, resident reference and finding below is INVENTED (CLAUDE.md rule 3).
   Dates are generated relative to "today" so the demo always looks current. */

const ROLLOUT = [
  ["hall-close","Hall Close"],["pendragon","Pendragon"],["effingham","Effingham"],["ragstone","Ragstone Road"],["stoke-poges","Stoke Poges"],
  ["waxlow","Waxlow"],["lambourne","Lambourne"],["queenswood","Queenswood"],["hermitage","Hermitage"],["wansbeck-a","Wansbeck A"],["wansbeck-h","Wansbeck H"]
];
const FIRST = ["Aisha","Ben","Chloe","Dan","Ella","Femi","Grace","Hari","Isla","Jon","Kemi","Liam","Maya","Nia","Omar","Priya","Ravi","Sana","Tom","Uma","Vik","Wren","Yusuf","Zoe","Alex","Bea","Cal","Dee","Eli","Faye","Gus","Hana","Ivo","Jas","Kai","Lola","Max","Noor","Ola","Pip"];
const LAST = ["Archer","Bell","Clarke","Dale","Evans","Fox","Grant","Hale","Irwin","Jones","Khan","Lane","Moss","Nash","Owen","Patel","Reid","Shaw","Todd","Vale","Webb","Young"];

function rng(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function mondayOnOrBefore(iso){ const d = new Date(iso + "T00:00:00Z"); const back = (d.getUTCDay() + 6) % 7; return QA.addDays(iso, -back); }

function seed(t){
  const R = rng(20261126);
  const pick = a => a[Math.floor(R() * a.length)];
  let nameN = 0;
  const person = () => { const n = `${FIRST[nameN % FIRST.length]} ${LAST[(nameN * 7) % LAST.length]}`; nameN++; return n; };
  const qs = mondayOnOrBefore(addD(t, -52));
  const S = { v:2, created:new Date().toISOString(), session:{ userId:"u-dir", today:null, home:"all" },
    settings:{ headOfficeFrom:"first", mondayTime:"07:00", digestTime:"08:00", shadowWeeks:1 },
    levels: clone(CFG.levels), matrix: clone(QA.DEFAULT_MATRIX), caps: Object.fromEntries(Object.entries(QA.CAPABILITIES).map(([k,v]) => [k, v.roles.slice()])),
    homes:{}, users:{}, records:{}, actions:{}, registers:{ fire:{}, residents:{}, trackers:[], capacity:[], maintenance:[], onboarding:[], staff:[] }, activity:[], signoff:{} };

  // head office (invented names; roles mirror Mark, Hamida, Nafisa, Zara and Zakir)
  const HO = [["u-dir","Daniel Price","director","Director, South"],["u-qa","Amira Khan","head_compliance","Compliance & QA lead"],["u-fin","Noor Ahmed","finance","Finance lead"],
    ["u-ops","Zoe Hart","operations","Operations & housing"],["u-adm","Zain Malik","super_admin","Business analyst / app builder"],["u-view","Visiting auditor","viewer","Read-only demo account"]];
  HO.forEach(([id, name, role, title]) => S.users[id] = { id, name, role, title, homes: role === "viewer" ? ["hall-close"] : [], email: name.toLowerCase().replace(/[^a-z]+/g,".") + "@example.org", alerts:true });

  ROLLOUT.forEach(([id, name], i) => {
    const status = i === 0 ? "live" : i === 1 ? "shadow" : i === 2 ? "setup" : "planned";
    const modules = Object.fromEntries(MODS.map(m => [m.key, i === 0 ? true : m.wave === 1]));
    const staff = { service_manager:[], deputy_manager:[], team_leader:[], support_worker:[] };
    const mk = (role, title) => { const uidv = `u-${id}-${role}-${staff[role].length + 1}`; S.users[uidv] = { id:uidv, name:person(), role, title:`${title}, ${name}`, homes:[id], email:`${uidv}@example.org`, alerts:true }; staff[role].push(uidv); };
    mk("service_manager","Service manager");
    if (!["effingham","hermitage"].includes(id)) mk("deputy_manager","Deputy manager");
    mk("team_leader","Team leader"); if (id === "effingham") mk("team_leader","Team leader");
    mk("support_worker","Support worker"); mk("support_worker","Support worker");
    S.homes[id] = { id, name, order:i + 1, status, wave: i < 2 ? 1 : i < 6 ? 2 : 3, quarterStart: qs, modules, staff,
      golive: status === "live" ? addD(t, -10) : status === "shadow" ? addD(t, 9) : null, notes: id === "hall-close" ? "Pilot home. Every tracker is switched on." : "" };
  });
  S.users["u-view"].homes = ["hall-close","pendragon"];

  // check records for homes that are running
  const live = Object.values(S.homes).filter(hm => hm.status === "live" || hm.status === "shadow");
  for (const hm of live) for (const m of MODS) {
    if (!hm.modules[m.key] || !m.chain) continue;
    const checks = QA.checksForModule(CFG, hm, m);
    for (const c of checks) {
      const late = diffD(c.due, t);
      const qsList = QA.questionsFor(m, c.level);
      const answerSet = q => CFG.answer_sets[q.answers].options;
      const fill = badN => { const a = {}; const badIdx = new Set(); while (badIdx.size < Math.min(badN, qsList.length)) badIdx.add(Math.floor(R() * qsList.length)); qsList.forEach((q, i) => { const o = answerSet(q); a[i] = badIdx.has(i) ? (CFG.answer_sets[q.answers].bad[0]) : (R() < .08 && o.includes("N/A") ? "N/A" : o.find(x => !CFG.answer_sets[q.answers].bad.includes(x) && x !== "N/A")); }); return a; };
      const owner = QA.ownerRole(m, c.level, CFG, hm);
      const by = (hm.staff[owner] || [])[0] || hm.staff.service_manager[0];
      const done = (bad, note) => { S.records[c.id] = { answers: fill(bad), submitted:true, submittedAt: addD(c.due, -Math.floor(R()*2)) + "T16:20:00Z", submittedBy: by, evidence: bad ? (note || "Issues found and discussed with staff. Actions raised.") : "All checked against the records." }; };
      if (late < 0) { if (late > -4 && R() < .35 && qsList.length) S.records[c.id] = { answers: Object.fromEntries(qsList.slice(0, 3).map((q, i) => [i, answerSet(q)[0]])), submitted:false }; continue; }
      // Hall Close story: one blank template submitted, the latest weekly finance not done
      if (hm.id === "hall-close" && m.key === "finance" && c.level === "weekly" && c.n === 4) { S.records[c.id] = { answers:{}, submitted:true, submittedAt: c.due + "T18:00:00Z", submittedBy: by, evidence:"" }; continue; }
      if (c.level === "weekly" && late >= 1 && late <= 7 && (m.key === "finance" || (m.key === "medication" && hm.id === "pendragon"))) continue;
      if (c.level === "weekly" && m.key === "health_safety" && hm.id === "hall-close" && late >= 1 && late <= 4) continue;
      if (c.level === "monthly" && c.deps.some(d => !(S.records[d] && S.records[d].submitted && Object.keys(S.records[d].answers).length))) continue;
      if (c.level === "twice_weekly" && R() < .2) continue;
      if (c.level === "weekly_update" && late < 10 && R() < .5) continue;
      if (m.key === "medication" && c.level === "weekly" && hm.id === "hall-close" && c.n === 3) { S.records[c.id] = { onHold:{ reason:"Medicines moved to the pharmacy while the room is refitted", review: addD(t, 3) }, answers:{} }; continue; }
      const bad = R() < .45 ? Math.ceil(R() * 3) : 0;
      done(bad);
    }
  }

  // actions: invented findings modelled on the kinds of things the trackers record
  const A = (hm, mod, finding, action, priority, o) => {
    const n = Object.values(S.actions).filter(a => a.homeId === hm && a.module === mod).length + 1;
    const ref = `${hm === "hall-close" ? "HC" : "PN"}-${MOD[mod].short.replace("&","")}-${String(n).padStart(3,"0")}`;
    const id = "a-" + ref.toLowerCase();
    const home = S.homes[hm];
    const ownerId = o.owner === null ? null : (home.staff[o.owner || "service_manager"] || [])[0];
    S.actions[id] = { id, ref, homeId:hm, module:mod, source:o.source || "", finding, action, priority, ownerId, identified: addD(t, o.id ?? -30), target: o.target == null ? null : addD(t, o.target), updateDue: o.update != null ? addD(t, o.update) : null,
      nextStep: o.next || "", nextStepDate: o.nd != null ? addD(t, o.nd) : null,
      status: o.status || "Not started", evidence: o.evidence || "", verifiedBy: o.verifiedBy || null, verifiedOn: o.verifiedOn ? addD(t, o.verifiedOn) : null, hold: o.hold || null,
      comments: (o.comments || []).map(([d, by, text]) => ({ at: addD(t, d) + "T10:00:00Z", by, text })), createdBy:"u-qa" };
  };
  A("hall-close","finance","Missing balance checks and second signatures on several days","Check the missing entries, find out why, and evidence corrective checks with independent signatures.","High",{ source:"Week 1", target:-12, owner:"deputy_manager", status:"In progress", next:"Deputy to go through the rota with the service manager", nd:2, comments:[[-20,"u-hall-close-deputy_manager-1","Spoke to the team at handover; checking the rota for who was on."]] });
  A("hall-close","finance","Taxi receipts missing and some balance checks not done","Verify taxi spending through other evidence and keep the records together.","High",{ source:"Week 2", target:null, owner:"deputy_manager" });
  A("hall-close","finance","Carried-forward balance not entered","Correct the ledger carry-forward and independently check the reconciliation.","High",{ source:"Week 2", target:4, owner:"team_leader", status:"Awaiting evidence", next:"Upload the corrected ledger page", nd:3 });
  A("hall-close","finance","Two audit forms uploaded blank","Ask for completed, signed audits. Do not report the week as done until they are supplied.","High",{ source:"Week 4", target:-3, owner:"service_manager" });
  A("hall-close","finance","Receipt missing for a small purchase","Get other proof for the purchase, record why the receipt is missing and get manager review.","Medium",{ source:"Week 5", target:6, owner:"team_leader", status:"Awaiting sign-off", evidence:"Bank card statement line attached to the ledger." });
  A("hall-close","finance","Lone-working signature process not confirmed","Confirm how the lone-working policy applies to signing, and record any exceptions.","Medium",{ source:"Week 5", target:null, owner:null });
  A("hall-close","finance","MCA for money management out of date for one resident (R03)","Ask the social worker for a review; record the best-interest decision when held.","High",{ source:"Capacity register", target:10, owner:"service_manager", status:"In progress", next:"Social worker review booked", nd:6 });
  A("hall-close","medication","Controlled drug second signatures missing (lone working)","Agree how CDs are double-signed on lone-working shifts and brief staff.","High",{ source:"Week 1", target:-5, owner:"deputy_manager", status:"In progress", next:"Brief staff at the team meeting", nd:-1 });
  A("hall-close","medication","Fridge temperatures not recorded on some days","Put the temperature log next to the fridge and check it daily for two weeks.","Medium",{ source:"Week 2", target:2, owner:"team_leader", status:"In progress", update:-1 });
  A("hall-close","medication","Stock not enough for the next cycle","Check the ordering cycle with the pharmacy.","Medium",{ source:"Week 2", target:-9, owner:"deputy_manager", status:"Completed", evidence:"Pharmacy confirmed new order dates.", verifiedBy:"u-hall-close-service_manager-1", verifiedOn:-8 });
  A("hall-close","health_safety","Upstairs hallway and bedroom lighting not working","Report to IronOak and chase a repair date.","High",{ source:"Week 3", target:-2, owner:"service_manager", status:"Awaiting evidence", next:"Operations lead meeting IronOak about the electrician's visit", nd:1, comments:[[-6,"u-ops","IronOak say an electrician is booked."]] });
  A("hall-close","health_safety","No hot water upstairs; radiators not heating","Emergency repair request to the landlord; portable heaters risk-assessed meanwhile.","High",{ source:"Week 3", target:-1, owner:"service_manager", status:"In progress" });
  A("hall-close","health_safety","CO alarm check left blank every week","Test the CO alarms and add them to the weekly walk-round.","High",{ source:"Weeks 1-4", target:null, owner:"team_leader" });
  A("hall-close","qa_audit","Support plans not reviewed in the last 6 months for two residents","Review both support plans with the residents and record the review.","Medium",{ source:"QA visit", id:-16, target:12, owner:"service_manager", status:"In progress", update:-2, next:"Review meetings booked with both residents", nd:4 });
  A("hall-close","qa_audit","Staff meeting minutes not on file","File the last three months of minutes on the drive.","Low",{ source:"QA visit", id:-16, target:5, owner:"deputy_manager", status:"Not started" });
  A("hall-close","infection_control","Cleaning schedule gaps at weekends","Add a weekend sign-off to the cleaning schedule.","Medium",{ source:"Quarterly audit", target:-20, owner:"team_leader", status:"On hold", hold:{ reason:"New cleaning contract starts next month", review: addD(t, 21) } });
  A("pendragon","finance","Petty cash float not reconciled","Reconcile the float and record the result weekly.","High",{ source:"Week 3", target:-4, owner:"team_leader", status:"Not started" });
  A("pendragon","medication","PRN protocol missing for one medicine","Ask the GP for a PRN protocol and add it to the MAR folder.","High",{ source:"Week 5", target:3, owner:"deputy_manager", status:"In progress" });
  A("pendragon","health_safety","Trip hazard by the back door","Fix the threshold strip.","Medium",{ source:"Week 6", target:7, owner:"service_manager", status:"Not started" });

  // fire log and certificates (rated by the tested rules engine in src/rules)
  const fireRules = RULES_CONFIG.rules.filter(r => ["fire","property"].includes(r.category));
  for (const hm of Object.values(S.homes)) {
    S.registers.fire[hm.id] = {};
    for (const r of fireRules) {
      if (r.key === "loler_hoist" || (r.key === "hmo_licence" && hm.id !== "pendragon")) { S.registers.fire[hm.id][r.key] = { applicable:false }; continue; }
      const ivDays = r.interval.unit === "day" ? r.interval.n : r.interval.unit === "month" ? r.interval.n * 30 : r.interval.n * 365;
      const ago = Math.floor(R() * ivDays * (hm.id === "hall-close" && r.key === "emergency_lighting_monthly" ? 1.5 : 1.05));
      const last = addD(t, -ago);
      S.registers.fire[hm.id][r.key] = r.kind === "certificate" ? { last_done:last, expires: QA.addInterval(last, r.interval) } : { last_done:last };
    }
    // the motivating example: a weekly fire log missed for over a week; and a gas certificate about to expire
    if (hm.id === "hall-close") S.registers.fire[hm.id].fire_alarm_weekly_test = { last_done: addD(t, -11) };
    if (hm.id === "pendragon") S.registers.fire[hm.id].gas_safety = { last_done: addD(t, -345), expires: addD(t, 20) };
  }
  // resident references and care records (support plans, risk assessments, reviews, funding, DoLS): per person, rated by src/rules
  const careRules = RULES_CONFIG.rules.filter(r => r.category === "care_records");
  for (const hm of live) {
    const pre = hm.id === "hall-close" ? "HC" : "PN";
    S.registers.residents[hm.id] = Array.from({ length: hm.id === "hall-close" ? 5 : 4 }, (_, i) => `${pre}-R0${i+1}`);
    S.registers.fire[hm.id] = S.registers.fire[hm.id] || {};
    S.registers.residents[hm.id].forEach((ref, i) => {
      for (const r of careRules) {
        const key = r.key + "@" + ref;
        if (r.key === "dols_authorisation" && i !== 1) { S.registers.fire[hm.id][key] = { applicable:false }; continue; }
        const ivDays = r.interval.unit === "month" ? r.interval.n * 30 : r.interval.n * 365;
        let ago = Math.floor(R() * ivDays * 0.9);
        // the QA visit finding: two support plans not reviewed in 6 months at Hall Close
        if (hm.id === "hall-close" && r.key === "support_plan_review" && (i === 1 || i === 3)) ago = 200 + i * 5;
        if (hm.id === "pendragon" && r.key === "funding_package_review" && i === 2) ago = 350;
        const last = addD(t, -ago);
        S.registers.fire[hm.id][key] = r.kind === "certificate" ? { last_done:last, expires: QA.addInterval(last, r.interval) } : { last_done:last };
      }
    });
  }
  // tracker register: one file per home per area, fixed paths (Mark, 25 Nov: no copies)
  for (const hm of live) for (const m of MODS.filter(x => hm.modules[x.key] && x.tracker)) {
    const area = m.label.replace(/ & /g, " and ");
    S.registers.trackers.push({ id:uid(), homeId:hm.id, module:m.key, path:`HomesCentral/Audits/CCC/${hm.name}/Audits 2026/${area}/${hm.name} ${area} tracker.xlsx`, tables: m.chain ? "Weekly, Monthly, Quarterly, Actions" : "Register, Actions", lastSynced: addD(t, m.key === "health_safety" && hm.id === "pendragon" ? -3 : 0) + "T02:0" + Math.floor(R() * 9) + ":00Z", copies: hm.id === "hall-close" && m.key === "medication" ? [`HomesCentral/Audits/CCC/${hm.name}/Audits 2026/Medication/${hm.name} Medication tracker - Copy.xlsx`] : [] });
  }
  // finance capacity register (MCA / best interest), onboarding, maintenance, staff
  for (const hm of live) {
    const pre = hm.id === "hall-close" ? "HC" : "PN";
    ["MCA: managing money","Best-interest decision","Financial support plan","Appointee / deputyship","MCA: managing money"].forEach((type, i) => {
      const review = addD(t, i === 2 ? -6 : Math.floor(R() * 300) - 20);
      S.registers.capacity.push({ id:uid(), homeId:hm.id, ref:`${pre}-R0${i+1}`, type, held: i !== 4 || hm.id !== "hall-close", review, notes: i === 4 && hm.id === "hall-close" ? "Not on file. Ask the social worker." : "" });
    });
    [["Upstairs lighting","Electrical","High",-12,-2,"Awaiting contractor"],["Hot water upstairs","Plumbing / heating","High",-12,-1,"Awaiting contractor"],["Bathroom extractor fan","Ventilation","Medium",-30,5,"Open"],["Garden gate latch","External","Low",-40,-10,"Open"],["Kitchen cupboard door","Fixtures","Low",-20,-14,"Completed"]].forEach(([issue, area, pri, rep, tgt, st], i) => {
      if (hm.id !== "hall-close" && i > 2) return;
      S.registers.maintenance.push({ id:uid(), homeId:hm.id, ref:`${pre}-MNT-${String(i+1).padStart(3,"0")}`, issue, area, priority:pri, reported:addD(t, rep), target:addD(t, tgt), who: i < 2 ? "Landlord (IronOak)" : "Esto Care maintenance", status:st });
    });
    [["R06", -9], ["R07", -2]].forEach(([r, moved]) => {
      if (hm.id !== "hall-close" && r === "R07") return;
      S.registers.onboarding.push({ id:uid(), homeId:hm.id, ref:`${pre}-${r}`, moveIn:addD(t, moved), docs:{ "Care and support plan": moved < -7, "Risk assessments": true, "MCA (if needed)": false, "Tenancy / licence signed": true, "Funding agreement": moved < -5 } });
    });
    for (let i = 1; i <= 6; i++) {
      S.registers.staff.push({ id:uid(), homeId:hm.id, ref:`${pre}-S${String(i).padStart(2,"0")}`, role: i === 1 ? "Team leader" : "Support worker",
        supervision: addD(t, -Math.floor(R() * 75)), training:{ "Safeguarding adults": addD(t, Math.floor(R() * 400) - 40), "Medication competency": addD(t, Math.floor(R() * 360) - 30), "Fire safety": addD(t, Math.floor(R() * 360) - 20), "Oliver McGowan Tier 1": addD(t, Math.floor(R() * 900) - 60) } });
    }
  }
  S.activity.push({ at:new Date().toISOString(), by:"u-adm", text:"Demo data created. Every person and resident reference is invented." });
  return S;
}
