import { useMemo, useState } from "react";
import Dashboard from "./components/Dashboard";

type Filters = {
  org: string;
  project: string;
  areaPaths: string[];
  iterationPaths: string[];
  states: string[];
  workItemTypes: string[];
  tagsInclude: string[];
  dateField: "System.ChangedDate" | "System.CreatedDate" | "Microsoft.VSTS.Common.ClosedDate";
  dateFrom?: string;
  dateTo?: string;
};

const DEFAULT_FIELDS = [
  "System.Id",
  "System.Title",
  "System.WorkItemType",
  "System.State",
  "System.AssignedTo",
  "System.Tags",
  "System.AreaPath",
  "System.IterationPath",
  "System.CreatedDate",
  "System.ChangedDate",
  "Microsoft.VSTS.Common.Priority",
  "Microsoft.VSTS.Common.ClosedDate"
];

function App() {
  const [filters, setFilters] = useState<Filters>({
    org: "",
    project: "",
    areaPaths: [],
    iterationPaths: [],
    states: [],
    workItemTypes: [],
    tagsInclude: [],
    dateField: "System.ChangedDate"
  });
  const [fields, setFields] = useState<string[]>(DEFAULT_FIELDS);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const canQuery = useMemo(() => !!filters.org && !!filters.project, [filters]);

  const runQuery = async () => {
    if (!canQuery) return;
    setLoading(true);
    const resp = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org: filters.org,
        project: filters.project,
        filters: {
          project: filters.project,
          areaPaths: filters.areaPaths,
          iterationPaths: filters.iterationPaths,
          states: filters.states,
          workItemTypes: filters.workItemTypes,
          tagsInclude: filters.tagsInclude,
          dateField: filters.dateField,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo
        },
        fields,
        page: { skip: 0, top: 500 }
      })
    });
    const data = await resp.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const exportCSV = () => {
    const rows = items.map((it) =>
      fields.map((f) => {
        const v = it.fields?.[f];
        const s = v == null ? "" : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const header = fields.join(",");
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workitems.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workitems.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h2>ADO Work Items</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          placeholder="Org"
          value={filters.org}
          onChange={(e) => setFilters({ ...filters, org: e.target.value })}
        />
        <input
          placeholder="Project"
          value={filters.project}
          onChange={(e) => setFilters({ ...filters, project: e.target.value })}
        />
        <select
          value={filters.dateField}
          onChange={(e) =>
            setFilters({ ...filters, dateField: e.target.value as Filters["dateField"] })
          }
        >
          <option value="System.ChangedDate">ChangedDate</option>
          <option value="System.CreatedDate">CreatedDate</option>
          <option value="Microsoft.VSTS.Common.ClosedDate">ClosedDate</option>
        </select>
        <input
          type="date"
          value={filters.dateFrom || ""}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
        />
        <input
          type="date"
          value={filters.dateTo || ""}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
        />
        <button disabled={!canQuery || loading} onClick={runQuery}>
          {loading ? "Loading..." : "Query"}
        </button>
        <button disabled={!items.length} onClick={exportCSV}>Export CSV</button>
        <button disabled={!items.length} onClick={exportJSON}>Export JSON</button>
      </div>

      <div style={{ marginBottom: 8 }}>Results: {total}</div>

      <div style={{ overflowX: "auto" }}>
        <table border={1} cellPadding={6} style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {fields.map((f) => (
                <th key={f} style={{ textAlign: "left", background: "#f3f4f6" }}>{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                {fields.map((f) => (
                  <td key={f}>{String(it.fields?.[f] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dashboard items={items} />
    </div>
  );
}

export default App;