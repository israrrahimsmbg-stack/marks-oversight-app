// Who can see and do what, per role, per module and per home. Pure (ADR-0008).
// Based on Mark's email of 24 Nov 2026 ("only Mark, Nafisa, Hamida and Zara can edit")
// and the escalation ladder from the 25 Nov call. A draft for Mark to confirm.

export const ACCESS = Object.freeze({ NONE: "none", VIEW: "view", RECORD: "record", MANAGE: "manage" });
export const ACCESS_ORDER = ["none", "view", "record", "manage"];
export const ACCESS_LABEL = { none: "No access", view: "View", record: "Record", manage: "Manage" };
export const ACCESS_HINT = {
  none: "Cannot see this module",
  view: "Can see checks, results and actions",
  record: "Can complete the checks they own and update their actions",
  manage: "Can do everything: put checks on hold, sign off, close and reassign actions",
};

export const ROLES = {
  super_admin:     { label: "System admin",            group: "Head office", scope: "all",      desc: "Builds and runs the app (Zakir). Full control, including access and settings." },
  director:        { label: "Director",                group: "Head office", scope: "all",      desc: "Director for the region (Mark). Sees everything, gets all alerts and the Monday report, can change settings." },
  head_compliance: { label: "Compliance & QA lead",    group: "Head office", scope: "all",      desc: "Owns the trackers and the QA visits (Hamida). Manages checks, templates and rules; signs off." },
  operations:      { label: "Operations & housing",    group: "Head office", scope: "all",      desc: "Property, maintenance and landlord liaison (Zara). Manages H&S, maintenance and occupancy." },
  finance:         { label: "Finance",                 group: "Head office", scope: "all",      desc: "Finance team (Nafisa). Manages finance and occupancy; gets all alerts." },
  service_manager: { label: "Service manager",         group: "Home team",   scope: "assigned", desc: "Runs the home. Owns quarterly checks, signs off monthly ones, owns the home's actions." },
  deputy_manager:  { label: "Deputy manager",          group: "Home team",   scope: "assigned", desc: "Owns monthly checks and checks the weekly ones." },
  team_leader:     { label: "Team leader",             group: "Home team",   scope: "assigned", desc: "Owns weekly checks." },
  viewer:          { label: "Viewer (read only)",      group: "Other",       scope: "assigned", desc: "Read-only, e.g. an auditor or commissioner visit. No personal data modules." },
  support_worker:  { label: "Support worker",          group: "Other",       scope: "none",     desc: "No access and never notified (Mark, 18 Nov 2026)." },
};
export const ROLE_ORDER = Object.keys(ROLES);
export const HEAD_OFFICE = ["super_admin", "director", "head_compliance", "operations", "finance"];

const M = (v, over = {}) => ({ finance: v, medication: v, health_safety: v, fire_property: v, care_records: v, infection_control: v, maintenance: v, occupancy: v, qa_audit: v, spot_checks: v, manager_report: v, supervision_training: v, ...over });

/** Default module access per role. Editable in Admin › Access (saved per organisation). */
export const DEFAULT_MATRIX = {
  super_admin:     M("manage"),
  director:        M("manage"),
  head_compliance: M("manage"),
  operations:      M("view", { health_safety: "manage", maintenance: "manage", occupancy: "manage", fire_property: "manage" }),
  finance:         M("view", { finance: "manage", occupancy: "manage" }),
  service_manager: M("record", { qa_audit: "record", supervision_training: "record", occupancy: "record" }),
  deputy_manager:  M("record", { manager_report: "view", occupancy: "none", supervision_training: "view" }),
  team_leader:     M("record", { manager_report: "none", occupancy: "none", supervision_training: "none", qa_audit: "view", spot_checks: "none", care_records: "view" }),
  viewer:          M("view", { occupancy: "none", supervision_training: "none", care_records: "none" }),
  support_worker:  M("none"),
};

/** App-wide capabilities, separate from module access. */
export const CAPABILITIES = {
  // Mark, 24 Nov: "only Mark, Nafisa, Hamida and Zara can edit" the settings
  configure:    { label: "Switch homes and modules on or off", roles: ["super_admin", "director", "head_compliance", "operations", "finance"] },
  users:        { label: "Add people and change their roles", roles: ["super_admin", "director", "head_compliance", "operations", "finance"] },
  matrix:       { label: "Change this access matrix", roles: ["super_admin", "director", "head_compliance", "operations", "finance"] },
  alert_rules:  { label: "Change alert timings", roles: ["super_admin", "director", "head_compliance", "operations", "finance"] },
  trackers:     { label: "Register tracker files (one per home per area)", roles: ["super_admin", "head_compliance"] },
  prioritise:   { label: "Make an action a priority (head office challenge)", roles: ["super_admin", "director", "head_compliance", "operations", "finance"] },
  rules_signoff:{ label: "Sign off compliance rules and timings", roles: ["head_compliance", "director"] },
  monday:       { label: "Receive the Monday report", roles: ["director", "head_compliance", "finance", "operations", "super_admin"] },
  all_alerts:   { label: "Copied into every alert (Mark's rule)", roles: ["director", "head_compliance", "finance"] },
  personal:     { label: "See resident and staff references", roles: ["super_admin", "director", "head_compliance", "operations", "finance", "service_manager"] },
  export:       { label: "Download reports and review packs", roles: ["super_admin", "director", "head_compliance", "operations", "finance", "service_manager"] },
  audit_log:    { label: "See the activity log", roles: ["super_admin", "director", "head_compliance"] },
};

export function hasCap(user, cap, caps = CAPABILITIES) {
  if (!user || user.role === "support_worker") return false;
  if (user.role === "super_admin") return true;
  return (caps[cap]?.roles || []).includes(user.role);
}

export function inHome(user, homeId) {
  if (!user) return false;
  const scope = ROLES[user.role]?.scope;
  if (scope === "none") return false;
  if (scope === "all") return true;
  return (user.homes || []).includes(homeId);
}

/** Module access for a user at a home, given the (possibly edited) matrix and the home's switches. */
export function moduleAccess(user, moduleKey, homeId, matrix = DEFAULT_MATRIX, home = null) {
  if (!user || !inHome(user, homeId)) return ACCESS.NONE;
  if (home && home.modules && !home.modules[moduleKey]) return ACCESS.NONE;
  const lvl = (matrix[user.role] || {})[moduleKey] || ACCESS.NONE;
  return lvl;
}

export const atLeast = (have, need) => ACCESS_ORDER.indexOf(have) >= ACCESS_ORDER.indexOf(need);

/**
 * Can this user complete a check at this level? "Record" lets you complete your own
 * level and the ones below (a deputy can do a weekly check if the team leader is off);
 * "Manage" can complete any level.
 */
export function canRecordLevel(user, level, ownerRole, access) {
  if (atLeast(access, ACCESS.MANAGE)) return true;
  if (!atLeast(access, ACCESS.RECORD)) return false;
  const ladder = ["team_leader", "deputy_manager", "service_manager"];
  const mine = ladder.indexOf(user.role), need = ladder.indexOf(ownerRole);
  if (mine < 0) return false;
  if (need < 0) return user.role === "service_manager"; // e.g. QA actions owned by head office: manager may update
  return mine >= need;
}
