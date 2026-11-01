// Splits a merged ticket into the problems its reports describe. causes.ts files every report
// by tenant; this also reads the desk's notes, so a one-day move gets a row of its own instead
// of hiding under the tenant's cause.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'one-day', 'unplaced'];

export function problemOf(
  r: Report,
  tenant: Tenant | undefined,
  oneDayMove: readonly string[],
): Problem {
  // A one-day move is not a day/month flip, whatever the tenant writes.
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, tenant) ?? 'unplaced';
}

export type ProblemRow = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: ProblemRow[]; exported: number; unique: number } {
  const merged = all.filter((r) => r.mergedInto === ticket);
  const unique = uniqueById(merged);
  const by = new Map<Problem, Report[]>();
  for (const r of unique) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const rows = PROBLEMS.filter((p) => by.has(p)).map((problem) => {
    const rs = by.get(problem)!;
    const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
    return {
      problem,
      reports: rs,
      tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
      channels: rs.reduce<Record<string, number>>(
        (n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }),
        {},
      ),
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
    };
  });
  return { rows, exported: merged.length, unique: unique.length };
}
