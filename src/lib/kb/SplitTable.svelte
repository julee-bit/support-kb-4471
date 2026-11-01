<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/split';

  // issues: problem → link to its own ticket.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } =
    $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.unique}</strong> reports in #{ticket}
  ({split.exported - split.unique} repeated rows in the export dropped) ·
  <strong>{split.rows.length}</strong> problems
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.rows as row (row.problem)}
      <tr>
        <td><code>{row.problem}</code></td>
        <td>{row.reports.length}</td>
        <td>{row.tenants.length}</td>
        <td class="muted">{channels(row.channels)}</td>
        <td>{row.firstSeen} → {row.lastSeen}</td>
        <td>
          {#if issues[row.problem]}<a href={issues[row.problem]}>#{issues[row.problem]?.split('/').pop()}</a>
          {:else}<span class="warn">none yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .warn { color: var(--warn); font-weight: 600; }
</style>
