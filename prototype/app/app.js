// Mark's App — clickable prototype.
// All RAG, due-date and escalation logic comes from src/rules/ (the reference
// implementation, ADR-0008). Nothing is computed twice in this file.
// Changes you make here live in the browser tab only; nothing is saved anywhere.

const CONFIG = RULES_CONFIG;
const RULE = Object.fromEntries(CONFIG.rules.map(r => [r.key, withDefaults(r, CONFIG.defaults)]));
const ITEMS = buildItems(CONFIG.rules, CONFIG.defaults);
const USERS = buildUsers();
const SERVICE = Object.fromEntries(SERVICES.map(s => [s.id, s]));

const CATEGORY_LABEL = {
  fire: "Fire safety",
  property: "Property and premises",
  medication: "Medicines",
  care_records: "Support plans and reviews",
  qa: "Quality assurance",
  occupancy: "Occupancy",
};
const BASIS_LABEL = { legal: "Legal requirement", guidance: "Recognised guidance", policy: "Esto Care policy" };
const STATUS_CLASS = { RED: "red", AMBER: "amber", GREEN: "green", NOT_RECORDED: "grey", NA: "grey" };
const STATUS_LABEL = { RED: "Red", AMBER: "Amber", GREEN: "Green", NOT_RECORDED: "Not recorded", NA: "N/A" };

const state = {
  today: TODAY,
  user: USERS[0],
  screen: "report",
  itemId: null,
  back: "report",
  filter: null, // {status, category, service, horizon, title}
};

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ukDate = iso => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+m - 1]} ${y}`;
};
const longDate = iso => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return `${days[new Date(iso + "T00:00:00Z").getUTCDay()]} ${ukDate(iso)}`;
};
const openAction = item => (item.actions || []).find(a => a.status !== "closed") || null;
const isHeadOffice = () => state.user.scope === "all";
const visibleItems = () => (isHeadOffice() ? ITEMS : ITEMS.filter(i => i.service === state.user.scope));
const canEdit = item => isHeadOffice() || item.service === state.user.scope;

/** Every row, evaluated by the rules engine, for whatever this user can see. */
function rows() {
  return evaluate(CONFIG, visibleItems(), state.today).map(r => ({
    ...r,
    level: escalationLevel(r, r.rule),
    serviceName: SERVICE[r.item.service].name,
  }));
}

function report() {
  const svcs = isHeadOffice() ? SERVICES : SERVICES.filter(s => s.id === state.user.scope);
  const rep = buildReport(CONFIG, svcs, visibleItems(), state.today);
  rep.previous = buildPrevious(rep.rows);
  const prevRed = new Set(rep.previous.filter(p => p.status === "RED").map(p => p.key));
  const key = r => `${r.item.service}:${r.item.type}:${r.item.ref || ""}`;
  const nowRed = new Set(rep.rows.filter(r => r.status === RAG.RED).map(key));
  rep.changes = {
    newReds: [...nowRed].filter(k => !prevRed.has(k)).length,
    closedReds: [...prevRed].filter(k => !nowRed.has(k)).length,
  };
  return rep;
}

/* ---------------------------------------------------------------- rendering */

function render() {
  const app = document.getElementById("app");
  const screens = {
    report: screenReport,
    drill: screenDrill,
    item: screenItem,
    myservice: screenMyService,
    rules: screenRules,
    escalations: screenEscalations,
    email: screenEmail,
  };
  app.innerHTML = (screens[state.screen] || screenReport)();
  renderTopbar();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderTopbar() {
  document.getElementById("who").innerHTML = USERS.map(u =>
    `<option value="${u.id}"${u.id === state.user.id ? " selected" : ""}>${esc(u.label)}</option>`).join("");
  document.getElementById("today").value = state.today;
  const tabs = [
    ["report", isHeadOffice() ? "Monday report" : "My service summary"],
    ["myservice", isHeadOffice() ? "Service checklists" : "Today's checks"],
    ["escalations", "Who gets told"],
    ["rules", "Rules and sources"],
    ["email", "The Monday email"],
  ];
  document.getElementById("tabs").innerHTML = tabs.map(([id, label]) =>
    `<button data-tab="${id}" aria-current="${state.screen === id || (state.screen === "drill" && id === "report") || (state.screen === "item" && id === "report")}">${esc(label)}</button>`).join("");
}

function tiles(rep) {
  const t = rep.totals;
  const tile = (cls, n, k, filter) =>
    `<button class="tile ${cls}" data-drill='${esc(JSON.stringify(filter))}'><span class="n mono">${n}</span><span class="k">${esc(k)}</span></button>`;
  return `<div class="tiles">
    ${tile("red", t.RED, "Red", { status: "RED", title: "Red items" })}
    ${tile("amber", t.AMBER, "Amber", { status: "AMBER", title: "Amber items" })}
    ${tile("green", t.GREEN, "Green", { status: "GREEN", title: "Green items" })}
    ${tile("grey", t.NOT_RECORDED, "Not recorded", { status: "NOT_RECORDED", title: "Items with no date recorded" })}
    ${tile("red", rep.unmanaged.length, "No owner or plan", { unmanaged: true, title: "Reds and not-recorded items with no owner or next step" })}
  </div>`;
}

function itemRow(r, { showService = true } = {}) {
  const a = openAction(r.item);
  const cls = STATUS_CLASS[r.status];
  const serviceName = r.serviceName || SERVICE[r.item.service].name;
  const ref = r.item.ref ? ` <span class="muted small">(${esc(r.item.ref)})</span>` : "";
  const plan = a
    ? `Owner: <strong>${esc(a.owner)}</strong> · Next: ${esc(a.next_step)} (${ukDate(a.next_step_date)})`
    : `<span class="noplan">No owner or next step recorded</span>`;
  const needsPlan = r.status === RAG.RED || r.status === RAG.NOT_RECORDED;
  return `<button class="item ${cls}" data-item="${r.item.id}">
    <span class="stripe"></span>
    <span class="body">
      <span class="title">${showService ? esc(serviceName) + " — " : ""}${esc(r.rule.label)}${ref}</span>
      <span class="meta">${esc(r.reason)}${needsPlan ? " · " + plan : ""}</span>
    </span>
    <span class="right">
      <span class="pill ${cls}">${STATUS_LABEL[r.status]}</span>
      <span class="small muted">${esc(CATEGORY_LABEL[r.rule.category] || r.rule.category)}</span>
    </span>
  </button>`;
}

/* ------------------------------------------------------------ Monday report */

function screenReport() {
  const rep = report();
  const scopeName = isHeadOffice() ? "South (14 services)" : SERVICE[state.user.scope].name;
  const byCat = {};
  for (const r of rep.rows) {
    const c = r.rule.category;
    byCat[c] ||= { RED: 0, AMBER: 0, GREEN: 0, NOT_RECORDED: 0 };
    if (byCat[c][r.status] !== undefined) byCat[c][r.status]++;
  }

  const forwardRows = Object.entries(rep.forward).map(([cat, b]) => `<tr>
    <td>${esc(CATEGORY_LABEL[cat] || cat)}</td>
    ${HORIZONS.map(h => `<td class="n"><button class="link" data-drill='${esc(JSON.stringify({ category: cat, horizon: h, title: `${CATEGORY_LABEL[cat] || cat}: due in the next ${h} days` }))}'>${b[h]}</button></td>`).join("")}
  </tr>`).join("");

  const serviceRows = rep.byService.map(s => {
    const cell = (n, status) => `<td class="n"><button class="link" data-drill='${esc(JSON.stringify({ service: s.service.id, status, title: `${s.service.name}: ${STATUS_LABEL[status].toLowerCase()} items` }))}'>${n}</button></td>`;
    return `<tr>
      <td><button class="link" data-drill='${esc(JSON.stringify({ service: s.service.id, title: `${s.service.name}: everything tracked` }))}'>${esc(s.service.name)}</button></td>
      <td class="muted small">${esc(s.service.kind)}</td>
      ${cell(s.RED, "RED")}${cell(s.AMBER, "AMBER")}${cell(s.GREEN, "GREEN")}${cell(s.NOT_RECORDED, "NOT_RECORDED")}
    </tr>`;
  }).join("");

  return `
  <section class="card">
    <header>
      <h1>Weekly oversight report — ${esc(scopeName)}</h1>
      <span class="note">Position as at ${longDate(state.today)} · generated automatically, nothing to ask for</span>
    </header>
    ${tiles(rep)}
    <p class="small muted" style="margin:12px 0 0">
      Since last week: <strong>${rep.changes.newReds}</strong> new reds, <strong>${rep.changes.closedReds}</strong> reds closed.
      Tap any number to see the items behind it.
    </p>
  </section>

  <section class="card">
    <header>
      <h2>Reds with no owner and no next step (${rep.unmanaged.length})</h2>
      <span class="note">These come first: the number matters less than the action behind it</span>
    </header>
    <div class="items">${rep.unmanaged.slice(0, 12).map(r => itemRow(r)).join("") || '<p class="muted">Nothing: every red has an owner and a dated next step.</p>'}</div>
    ${rep.unmanaged.length > 12 ? `<p class="small"><button class="link" data-drill='${esc(JSON.stringify({ unmanaged: true, title: "Reds and not-recorded items with no owner or next step" }))}'>See all ${rep.unmanaged.length}</button></p>` : ""}
  </section>

  <section class="card">
    <header>
      <h2>All reds and not recorded (${rep.reds.length})</h2>
      <span class="note">Worst first; owner and next step on every line</span>
    </header>
    <div class="items">${rep.reds.slice(0, 15).map(r => itemRow(r)).join("")}</div>
    ${rep.reds.length > 15 ? `<p class="small"><button class="link" data-drill='${esc(JSON.stringify({ reds: true, title: "All reds and not-recorded items" }))}'>See all ${rep.reds.length}</button></p>` : ""}
  </section>

  <section class="card">
    <header><h2>By service</h2><span class="note">Tap a number to drill in</span></header>
    <div class="scroll"><table>
      <thead><tr><th>Service</th><th>Type</th><th class="n">Red</th><th class="n">Amber</th><th class="n">Green</th><th class="n">Not rec.</th></tr></thead>
      <tbody>${serviceRows}</tbody>
    </table></div>
  </section>

  <section class="card">
    <header><h2>Coming up</h2><span class="note">What is due in the next 7, 14, 30 and 90 days</span></header>
    <div class="scroll"><table>
      <thead><tr><th>Area</th>${HORIZONS.map(h => `<th class="n">${h} days</th>`).join("")}</tr></thead>
      <tbody>${forwardRows}</tbody>
    </table></div>
  </section>

  <section class="card">
    <header><h2>By area</h2></header>
    <div class="scroll"><table>
      <thead><tr><th>Area</th><th class="n">Red</th><th class="n">Amber</th><th class="n">Green</th><th class="n">Not rec.</th></tr></thead>
      <tbody>${Object.entries(byCat).map(([c, v]) => `<tr>
        <td><button class="link" data-drill='${esc(JSON.stringify({ category: c, title: CATEGORY_LABEL[c] || c }))}'>${esc(CATEGORY_LABEL[c] || c)}</button></td>
        <td class="n">${v.RED}</td><td class="n">${v.AMBER}</td><td class="n">${v.GREEN}</td><td class="n">${v.NOT_RECORDED}</td>
      </tr>`).join("")}</tbody>
    </table></div>
  </section>`;
}

/* ------------------------------------------------------------- drill-down */

function screenDrill() {
  const f = state.filter || {};
  let list = rows();
  if (f.status) list = list.filter(r => r.status === f.status);
  if (f.reds) list = list.filter(r => r.status === RAG.RED || r.status === RAG.NOT_RECORDED);
  if (f.unmanaged) list = list.filter(r => (r.status === RAG.RED || r.status === RAG.NOT_RECORDED) && !r.managed);
  if (f.category) list = list.filter(r => r.rule.category === f.category);
  if (f.service) list = list.filter(r => r.item.service === f.service);
  if (f.horizon) list = list.filter(r => r.daysOverdue != null && r.daysOverdue <= 0 && -r.daysOverdue <= f.horizon);
  list.sort((a, b) => Number(a.managed) - Number(b.managed) || (b.daysOverdue ?? -1e9) - (a.daysOverdue ?? -1e9));

  return `
  <button class="crumb" data-tab="report">← Back to the report</button>
  <section class="card">
    <header><h1>${esc(f.title || "Items")}</h1><span class="note">${list.length} item${list.length === 1 ? "" : "s"}</span></header>
    <div class="items">${list.map(r => itemRow(r)).join("") || '<p class="muted">No items match.</p>'}</div>
  </section>`;
}

/* --------------------------------------------------------------- item detail */

function screenItem() {
  const item = ITEMS.find(i => i.id === state.itemId);
  if (!item) return screenReport();
  const rule = RULE[item.type];
  const r = { ...rag(item, rule, state.today), item, rule, managed: isManaged(item) };
  const level = escalationLevel(r, rule);
  const a = openAction(item);
  const svc = SERVICE[item.service];
  const people = PEOPLE[item.service];
  const told = recipients(level, { people }, HEAD_OFFICE.filter(h => h.receives_escalations));
  const levelName = { 0: "Nobody — in date", 1: "Service team reminder in the app", 2: "Email to the service manager and deputy", 3: "Also head office (last resort)" }[level];

  return `
  <button class="crumb" data-back="1">← Back</button>
  <section class="card">
    <header>
      <h1>${esc(rule.label)}</h1>
      <span class="pill ${STATUS_CLASS[r.status]}">${STATUS_LABEL[r.status]}</span>
      <span class="pill basis">${esc(BASIS_LABEL[rule.basis] || rule.basis)}</span>
    </header>
    <dl class="kv">
      <dt>Service</dt><dd>${esc(svc.name)} <span class="muted small">(${esc(svc.kind)}, ${svc.beds} beds)</span></dd>
      ${item.ref ? `<dt>Reference</dt><dd>${esc(item.ref)} <span class="muted small">code only, no names (NFR-01)</span></dd>` : ""}
      <dt>Why this status</dt><dd>${esc(r.reason)}</dd>
      <dt>${rule.kind === "certificate" ? "Expires" : "Next due"}</dt><dd>${ukDate(r.due)}</dd>
      <dt>How often</dt><dd>Every ${rule.interval.n} ${esc(rule.interval.unit)}${rule.interval.n === 1 ? "" : "s"} · amber ${rule.amber_days} days before${rule.grace_days ? ` · ${rule.grace_days} day grace` : ""}</dd>
      <dt>Escalation now</dt><dd>${esc(levelName)}${told.length ? ` → ${esc(told.map(p => p.name).join(", "))}` : ""}</dd>
      <dt>Source</dt><dd class="small">${esc(rule.legal_ref)}<br><a href="${esc(rule.source_url)}" target="_blank" rel="noopener">${esc(rule.source_url)}</a> · <strong>${esc(rule.status)}</strong>, checked ${ukDate(rule.last_checked)}</dd>
    </dl>
  </section>

  <section class="card">
    <header><h2>Owner and next step</h2><span class="note">Every item that is not green needs both (BR-05)</span></header>
    ${a
      ? `<dl class="kv">
          <dt>Owner</dt><dd><strong>${esc(a.owner)}</strong></dd>
          <dt>Next step</dt><dd>${esc(a.next_step)}</dd>
          <dt>By</dt><dd>${ukDate(a.next_step_date)}</dd>
          ${a.priority ? `<dt>Priority</dt><dd>${esc(a.priority)}</dd>` : ""}
          ${a.comment ? `<dt>Comment from head office</dt><dd>${esc(a.comment)}</dd>` : ""}
        </dl>`
      : `<p class="noplan">No owner and no next step. This is why the item is at the top of Mark's report.</p>`}
    ${canEdit(item) ? `
    <form class="form-grid" id="action-form" style="margin-top:12px">
      <label>Owner
        <select name="owner">${people.filter(p => p.role !== "support_worker").map(p => `<option${a && a.owner === p.name ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
      </label>
      <label>Next step
        <input type="text" name="next_step" value="${esc(a?.next_step || "")}" placeholder="e.g. engineer booked">
      </label>
      <label>By when
        <input type="date" name="next_step_date" value="${esc(a?.next_step_date || "")}">
      </label>
      <label style="justify-content:flex-end">
        <button class="btn" type="submit">${a ? "Update the plan" : "Add owner and next step"}</button>
      </label>
    </form>` : `<p class="small muted">You can see this item but only ${esc(svc.name)}'s team can change it.</p>`}
    ${isHeadOffice() ? `
    <form class="form-grid" id="mark-form" style="margin-top:10px">
      <label>Head office comment / challenge priority (BR-19)
        <input type="text" name="comment" value="${esc(a?.comment || "")}" placeholder="e.g. why is this not a priority?">
      </label>
      <label>Priority
        <select name="priority"><option>Normal</option><option${a?.priority === "High" ? " selected" : ""}>High</option><option${a?.priority === "Critical" ? " selected" : ""}>Critical</option></select>
      </label>
      <label style="justify-content:flex-end"><button class="btn secondary" type="submit">Send to the owner</button></label>
    </form>` : ""}
  </section>

  <section class="card">
    <header><h2>History</h2><span class="note">Append-only: who did what, and when (NFR-03)</span></header>
    <ul class="timeline">
      ${(item.history || []).map(h => `<li><span class="when">${ukDate(h.on)}</span><span>${esc(h.what)} <span class="muted">— ${esc(h.by)}</span></span></li>`).join("") || '<li class="muted">Nothing recorded yet.</li>'}
    </ul>
    ${canEdit(item) && rule.kind !== "certificate" ? `<p style="margin:12px 0 0"><button class="btn" data-tick="${item.id}">Mark done today</button></p>` : ""}
  </section>`;
}

/* ----------------------------------------------- manager screen (click×3) */

function screenMyService() {
  const serviceId = isHeadOffice() ? (state.filter?.service || SERVICES[0].id) : state.user.scope;
  const svc = SERVICE[serviceId];
  const list = evaluate(CONFIG, ITEMS.filter(i => i.service === serviceId), state.today)
    .map(r => ({ ...r, serviceName: svc.name }))
    .filter(r => r.status !== RAG.NA)
    .sort((a, b) => (b.daysOverdue ?? -1e9) - (a.daysOverdue ?? -1e9));
  const dueNow = list.filter(r => r.status === RAG.RED || r.status === RAG.AMBER || r.status === RAG.NOT_RECORDED);
  const inDate = list.filter(r => r.status === RAG.GREEN);

  const tick = r => `<div class="tick ${STATUS_CLASS[r.status]}">
    <span class="label">
      <strong>${esc(r.rule.label)}</strong>${r.item.ref ? ` <span class="muted small">(${esc(r.item.ref)})</span>` : ""}
      <span class="meta">${esc(r.reason)}</span>
    </span>
    <span class="pill ${STATUS_CLASS[r.status]}">${STATUS_LABEL[r.status]}</span>
    ${r.rule.kind === "certificate"
      ? `<button class="btn secondary" data-item="${r.item.id}">Record certificate</button>`
      : `<button class="btn" data-tick="${r.item.id}">Done today</button>`}
    <button class="btn secondary" data-item="${r.item.id}">Open</button>
  </div>`;

  return `
  <section class="card">
    <header>
      <h1>${esc(svc.name)} — today's checks</h1>
      <span class="note">One tap records the check, today's date and who did it</span>
    </header>
    ${isHeadOffice() ? `<p class="filters">Service:
      <select id="svc-picker">${SERVICES.map(s => `<option value="${s.id}"${s.id === serviceId ? " selected" : ""}>${esc(s.name)}</option>`).join("")}</select>
      <span class="small muted">Managers only ever see their own service (BR-09).</span></p>` : ""}
    <div class="ticks">${dueNow.map(tick).join("") || '<p class="muted">Nothing due or overdue. Everything here is in date.</p>'}</div>
  </section>

  <section class="card">
    <header><h2>In date (${inDate.length})</h2><span class="note">Nothing to do, shown so the manager can see the whole picture</span></header>
    <div class="items">${inDate.map(r => itemRow(r, { showService: false })).join("")}</div>
  </section>`;
}

/* ------------------------------------------------------------- escalations */

function screenEscalations() {
  const list = rows().filter(r => r.level >= LEVEL.SERVICE_MANAGER)
    .sort((a, b) => b.level - a.level || (b.daysOverdue ?? -1e9) - (a.daysOverdue ?? -1e9));
  const byPerson = new Map();
  for (const r of list) {
    const people = PEOPLE[r.item.service];
    for (const p of recipients(r.level, { people }, HEAD_OFFICE.filter(h => h.receives_escalations))) {
      if (!byPerson.has(p.name)) byPerson.set(p.name, { person: p, items: [] });
      byPerson.get(p.name).items.push(r);
    }
  }
  const lvl = { 2: "Service manager and deputy", 3: "Head office as well (last resort)" };

  return `
  <section class="card">
    <header>
      <h1>Who gets told, and when</h1>
      <span class="note">Overdue ${CONFIG.defaults.escalate_manager_days}+ days: the service manager. ${CONFIG.defaults.escalate_head_office_days}+ days: head office too. Support workers never.</span>
    </header>
    <p class="small muted">One digest email per person per day, repeated at most every ${CONFIG.defaults.repeat_reminder_days} days unless the level goes up. Thresholds are still to be agreed with Mark and the compliance lead.</p>
    <div class="scroll"><table>
      <thead><tr><th>Person</th><th>Role</th><th class="n">Items in their digest</th><th>Worst item</th></tr></thead>
      <tbody>${[...byPerson.values()].sort((a, b) => b.items.length - a.items.length).map(e => `<tr>
        <td>${esc(e.person.name)}</td>
        <td class="muted small">${esc(e.person.role.replace(/_/g, " "))}</td>
        <td class="n">${e.items.length}</td>
        <td class="small"><button class="link" data-item="${e.items[0].item.id}">${esc(e.items[0].serviceName)} — ${esc(e.items[0].rule.label)}</button></td>
      </tr>`).join("")}</tbody>
    </table></div>
  </section>

  <section class="card">
    <header><h2>Every escalation that would go out today (${list.length})</h2></header>
    <div class="items">${list.slice(0, 25).map(r => `<button class="item ${STATUS_CLASS[r.status]}" data-item="${r.item.id}">
      <span class="stripe"></span>
      <span class="body">
        <span class="title">${esc(r.serviceName)} — ${esc(r.rule.label)}</span>
        <span class="meta">${esc(r.reason)} · ${esc(lvl[r.level])}</span>
      </span>
      <span class="right"><span class="pill ${STATUS_CLASS[r.status]}">Level ${r.level}</span></span>
    </button>`).join("")}</div>
    <p class="small muted" style="margin-top:10px">Support workers appear nowhere in this list, by design (Mark, 18 Nov 2026).</p>
  </section>`;
}

/* ------------------------------------------------------- rules and sources */

function screenRules() {
  const byCat = {};
  for (const r of CONFIG.rules) (byCat[r.category] ||= []).push(r);
  return `
  <section class="card">
    <header>
      <h1>Rules and where they come from</h1>
      <span class="note">${CONFIG.rules.length} tracker types · every one marked UNVERIFIED until the compliance lead signs it off</span>
    </header>
    <p class="small muted">This app supports compliance. It is not legal advice and does not replace the registered manager's or nominated individual's judgement. Each rule says whether it is a legal requirement, recognised guidance or Esto Care policy.</p>
  </section>
  ${Object.entries(byCat).map(([cat, list]) => `
  <section class="card">
    <header><h2>${esc(CATEGORY_LABEL[cat] || cat)}</h2></header>
    <div class="scroll"><table>
      <thead><tr><th>Check</th><th>How often</th><th>Basis</th><th>Source</th><th>Signed off</th></tr></thead>
      <tbody>${list.map(r => `<tr>
        <td>${esc(r.label)}</td>
        <td class="small">Every ${r.interval.n} ${esc(r.interval.unit)}${r.interval.n === 1 ? "" : "s"}</td>
        <td><span class="pill basis">${esc(BASIS_LABEL[r.basis] || r.basis)}</span></td>
        <td class="small" style="white-space:normal;max-width:380px">${esc(r.legal_ref)}<br><a href="${esc(r.source_url)}" target="_blank" rel="noopener">source</a></td>
        <td><span class="pill ${r.status === "UNVERIFIED" ? "amber" : "green"}">${esc(r.status)}</span></td>
      </tr>`).join("")}</tbody>
    </table></div>
  </section>`).join("")}`;
}

/* --------------------------------------------------------- the Monday email */

function screenEmail() {
  const rep = report();
  const to = HEAD_OFFICE.filter(h => h.receives_monday).map(h => h.name).join(", ");
  return `
  <section class="card">
    <header>
      <h1>The Monday email</h1>
      <span class="note">Sent automatically at 07:00 UK time, before anyone asks</span>
    </header>
    <div class="email">
      <p style="margin:0 0 10px"><strong>To:</strong> ${esc(to)}<br>
      <strong>Subject:</strong> South — weekly oversight report, ${ukDate(state.today)}</p>
      <pre>${esc(renderText(rep, isHeadOffice() ? SERVICES : SERVICES.filter(s => s.id === state.user.scope)))}</pre>
    </div>
    <p class="small muted" style="margin-top:10px">This is the exact text the rules engine produces (<code>npm run report</code>). In the real build, Power Automate sends it from a shared mailbox and records that it went out (BR-21), and every line links back into the app.</p>
  </section>`;
}

/* ------------------------------------------------------------------ events */

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function go(screen, opts = {}) {
  if (screen === "item") state.back = state.screen === "item" ? state.back : state.screen;
  Object.assign(state, opts, { screen });
  render();
}

document.addEventListener("click", e => {
  const tab = e.target.closest("[data-tab]");
  if (tab) {
    const id = tab.dataset.tab;
    return go(id, id === "myservice" ? {} : { filter: null });
  }
  const back = e.target.closest("[data-back]");
  if (back) return go(state.back || "report");

  const drill = e.target.closest("[data-drill]");
  if (drill) return go("drill", { filter: JSON.parse(drill.dataset.drill) });

  const tick = e.target.closest("[data-tick]");
  if (tick) {
    const item = ITEMS.find(i => i.id === tick.dataset.tick);
    item.last_done = state.today;
    delete item.next_due;
    (item.history ||= []).unshift({ on: state.today, by: state.user.label.split(" (")[0], what: "Marked done in the app" });
    const open = openAction(item);
    if (open) open.status = "closed";
    toast("Recorded. Status recalculated.");
    return render();
  }

  const open = e.target.closest("[data-item]");
  if (open) return go("item", { itemId: open.dataset.item });
});

document.addEventListener("change", e => {
  if (e.target.id === "who") {
    state.user = USERS.find(u => u.id === e.target.value);
    state.filter = null;
    return go(state.screen === "drill" || state.screen === "item" ? "report" : state.screen);
  }
  if (e.target.id === "today") {
    state.today = e.target.value;
    return render();
  }
  if (e.target.id === "svc-picker") {
    return go("myservice", { filter: { service: e.target.value } });
  }
});

document.addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const item = ITEMS.find(i => i.id === state.itemId);
  if (!item) return;
  item.actions ||= [];
  let a = openAction(item);
  if (!a) {
    a = { status: "open" };
    item.actions.push(a);
  }
  if (e.target.id === "action-form") {
    a.owner = f.get("owner");
    a.next_step = f.get("next_step");
    a.next_step_date = f.get("next_step_date");
    (item.history ||= []).unshift({ on: state.today, by: state.user.label.split(" (")[0], what: `Plan set: ${a.owner} — ${a.next_step} by ${a.next_step_date}` });
    toast("Owner and next step saved.");
  }
  if (e.target.id === "mark-form") {
    a.comment = f.get("comment");
    a.priority = f.get("priority");
    (item.history ||= []).unshift({ on: state.today, by: state.user.label.split(" (")[0], what: `Head office: priority ${a.priority}${a.comment ? ` — "${a.comment}"` : ""}` });
    toast("Sent to the owner.");
  }
  render();
});

render();
