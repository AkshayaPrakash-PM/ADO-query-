import fetch from "node-fetch";

type FetchOpts = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
};

export class AdoClient {
  private pat: string;
  constructor(private org: string, private project?: string, pat?: string) {
    this.pat = pat || process.env.ADO_PAT || "";
    if (!this.pat) throw new Error("ADO_PAT is required");
  }

  private base(projectScoped = true) {
    return projectScoped && this.project
      ? `https://dev.azure.com/${this.org}/${this.project}/_apis`
      : `https://dev.azure.com/${this.org}/_apis`;
  }

  private async call(path: string, opts: FetchOpts = {}, projectScoped = true): Promise<any> {
    const url = `${this.base(projectScoped)}${path}${path.includes("?") ? "&" : "?"}api-version=7.1`;
    const auth = Buffer.from(`:${this.pat}`).toString("base64");
    const resp = await fetch(url, {
      method: opts.method || "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        ...(opts.headers || {})
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!resp.ok) {
      const text = await resp.text();
      const err = new Error(`ADO error ${resp.status}: ${text}`);
      (err as any).status = resp.status;
      throw err;
    }
    return resp.json();
  }

  fields() {
    return this.call(`/wit/fields`);
  }

  areas(depth = 5) {
    return this.call(`/wit/classificationnodes/areas?$depth=${depth}`);
  }

  iterations(depth = 5) {
    return this.call(`/wit/classificationnodes/iterations?$depth=${depth}`);
  }

  tags(projectScoped = false) {
    return this.call(`/wit/tags`, {}, projectScoped);
  }

  workItemTypes() {
    return this.call(`/wit/workitemtypes`);
  }

  statesForType(typeName: string) {
    return this.call(`/wit/workitemtypes/${encodeURIComponent(typeName)}/states`);
  }

  wiql(query: string) {
    return this.call(`/wit/wiql`, { method: "POST", body: { query } });
  }

  workItemsBatch(ids: number[], fields: string[]) {
    return this.call(`/wit/workitemsbatch`, {
      method: "POST",
      body: {
        ids,
        $expand: "Relations",
        fields,
        errorPolicy: "Omit"
      }
    });
  }
}