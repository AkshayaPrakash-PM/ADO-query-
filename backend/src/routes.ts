import { Request, Response } from "express";
import { AdoClient } from "./adoClient";
import { buildWiql, Filters } from "./wiql";

function clientFrom(req: Request) {
  const org = String((req.query.org as string) || (req.body?.org as string) || process.env.ADO_ORG || "");
  const project = String((req.query.project as string) || (req.body?.project as string) || process.env.ADO_PROJECT || "");
  if (!org) throw new Error("org is required (?org=... or body.org or ADO_ORG in env)");
  return new AdoClient(org, project);
}

export async function getFields(req: Request, res: Response) {
  try {
    const c = clientFrom(req);
    const data: any = await c.fields();
    res.json({ fields: data.value });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getAreas(req: Request, res: Response) {
  try {
    const c = clientFrom(req);
    const depth = Number(req.query.depth || 5);
    const data = await c.areas(depth);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getIterations(req: Request, res: Response) {
  try {
    const c = clientFrom(req);
    const depth = Number(req.query.depth || 5);
    const data = await c.iterations(depth);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getTags(req: Request, res: Response) {
  try {
    const c = clientFrom(req);
    const projectScoped = String(req.query.projectScoped || "false") === "true";
    const data: any = await c.tags(projectScoped);
    res.json({ tags: data.value?.map((t: any) => t.name) || [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getWorkItemTypes(req: Request, res: Response) {
  try {
    const c = clientFrom(req);
    const data: any = await c.workItemTypes();
    res.json({ types: data.value?.map((t: any) => t.name) || [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getStates(req: Request, res: Response) {
  try {
    const c = clientFrom(req);
    const type = String(req.query.type || "");
    if (type) {
      const data: any = await c.statesForType(type);
      return res.json({ states: data.value?.map((s: any) => s.name) || [] });
    }
    const typesData: any = await c.workItemTypes();
    const unique = new Set<string>();
    for (const t of typesData.value || []) {
      const st: any = await c.statesForType(t.name);
      for (const s of st.value || []) unique.add(s.name);
    }
    res.json({ states: Array.from(unique) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

type QueryBody = {
  org?: string;
  project?: string;
  filters: Filters;
  fields: string[];
  page?: { skip?: number; top?: number };
};

export async function runQuery(req: Request, res: Response) {
  const started = Date.now();
  try {
    const body: QueryBody = req.body;
    const c = clientFrom(req);

    const filters = { ...body.filters, project: body.project || body.filters.project || "" };

    const wiql = buildWiql(filters);
    const wiqlResp: any = await c.wiql(wiql);
    const ids: number[] = (wiqlResp?.workItems || []).map((w: any) => w.id);
    const total = ids.length;

    const skip = Math.max(0, body.page?.skip || 0);
    const top = Math.min(1000, Math.max(1, body.page?.top || 500));
    const pageIds = ids.slice(skip, skip + top);

    const items: any[] = [];
    const batchSize = 200;
    for (let i = 0; i < pageIds.length; i += batchSize) {
      const slice = pageIds.slice(i, i + batchSize);
      const data: any = await c.workItemsBatch(slice, body.fields);
      items.push(...(data.value || data || []));
    }

    res.json({
      total,
      items,
      meta: {
        durationMs: Date.now() - started,
        params: { skip, top, selectedFields: body.fields }
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message, durationMs: Date.now() - started });
  }
}