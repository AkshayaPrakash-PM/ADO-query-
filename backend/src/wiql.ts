export type Filters = {
  project: string;
  areaPaths?: string[];
  iterationPaths?: string[];
  states?: string[];
  workItemTypes?: string[];
  tagsInclude?: string[];
  dateField?: "System.ChangedDate" | "System.CreatedDate" | "Microsoft.VSTS.Common.ClosedDate";
  dateFrom?: string; // ISO date
  dateTo?: string;   // ISO date
};

const esc = (s: string) => s.replace(/'/g, "''");

export function buildWiql(f: Filters, orderByDate = true) {
  const where: string[] = [`[System.TeamProject] = @project`];

  if (f.workItemTypes?.length) {
    where.push(`[System.WorkItemType] IN (${f.workItemTypes.map(t => `'${esc(t)}'`).join(",")})`);
  }
  if (f.states?.length) {
    where.push(`[System.State] IN (${f.states.map(s => `'${esc(s)}'`).join(",")})`);
  }
  if (f.areaPaths?.length) {
    const areas = f.areaPaths.map(a => `[System.AreaPath] UNDER '${esc(a)}'`);
    where.push(`(${areas.join(" OR ")})`);
  }
  if (f.iterationPaths?.length) {
    const iters = f.iterationPaths.map(i => `[System.IterationPath] UNDER '${esc(i)}'`);
    where.push(`(${iters.join(" OR ")})`);
  }
  if (f.tagsInclude?.length) {
    f.tagsInclude.forEach(tag => where.push(`[System.Tags] CONTAINS '${esc(tag)}'`));
  }
  const df = f.dateField || "System.ChangedDate";
  if (f.dateFrom) where.push(`[${df}] >= '${esc(f.dateFrom)}'`);
  if (f.dateTo) where.push(`[${df}] <= '${esc(f.dateTo)}'`);

  const whereClause = where.join(" AND ");
  const order = orderByDate ? ` ORDER BY [${df}] DESC` : "";
  const query = `SELECT [System.Id] FROM WorkItems WHERE ${whereClause}${order}`;
  return query;
}