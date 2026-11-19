import { RAG } from "./rag.js";
import { daysBetween } from "./dates.js";

/** Roles that must NEVER receive escalation notices (Mark, 18 Nov 2026; Hamida, 19 Nov 2026). */
export const NEVER_NOTIFY = Object.freeze(["support_worker"]);

export const LEVEL = Object.freeze({
  NONE: 0,
  SERVICE_TEAM: 1,   // overdue at all: in-app reminder to manager, deputy, team leaders
  SERVICE_MANAGER: 2, // overdue >= escalate_manager_days: email the service manager (or delegate)
  HEAD_OFFICE: 3,     // overdue >= escalate_head_office_days: also Mark and Hamida (last resort)
});

export function escalationLevel(result, rule) {
  if (result.status === RAG.NOT_RECORDED) return LEVEL.SERVICE_MANAGER; // [ASSUMPTION] missing data goes to the manager
  if (result.daysOverdue == null || result.daysOverdue <= 0) return LEVEL.NONE;
  if (result.daysOverdue >= rule.escalate_head_office_days) return LEVEL.HEAD_OFFICE;
  if (result.daysOverdue >= rule.escalate_manager_days) return LEVEL.SERVICE_MANAGER;
  return LEVEL.SERVICE_TEAM;
}

/**
 * Who should be told, given a service's people and the head-office list.
 * people: [{name, role, email, on_leave?, delegate?}]
 */
export function recipients(level, service, headOffice = []) {
  const team = (service.people || []).filter(p => !NEVER_NOTIFY.includes(p.role));
  const byRole = r => team.filter(p => p.role === r);
  const cover = p => (p.on_leave && p.delegate ? team.find(x => x.name === p.delegate) || p : p);
  let out = [];
  if (level >= LEVEL.SERVICE_TEAM) out.push(...byRole("service_manager").map(cover), ...byRole("deputy_manager"), ...byRole("team_leader"));
  if (level === LEVEL.SERVICE_MANAGER) out = out.filter(p => p.role !== "team_leader");
  if (level >= LEVEL.HEAD_OFFICE) out.push(...headOffice);
  const seen = new Set();
  return out.filter(p => !NEVER_NOTIFY.includes(p.role) && !seen.has(p.name) && seen.add(p.name));
}

/** Avoid spamming: only send again after repeat_reminder_days, or when the level goes up. */
export function shouldSend({ level, lastLevel = LEVEL.NONE, lastSentOn = null, today, rule }) {
  if (level === LEVEL.NONE) return false;
  if (level > lastLevel || !lastSentOn) return true;
  return daysBetween(lastSentOn, today) >= (rule.repeat_reminder_days ?? 7);
}
