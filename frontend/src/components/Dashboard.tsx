import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from "recharts";

type WorkItem = {
  id: number;
  fields: Record<string, any>;
};

function weekOf(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const year = d.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 1));
  while (firstThursday.getUTCDay() !== 4) firstThursday.setUTCDate(firstThursday.getUTCDate() + 1);
  const diff = d.getTime() - firstThursday.getTime();
  const week = Math.floor(diff / (7 * 24 * 3600 * 1000)) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export default function Dashboard({ items }: { items: WorkItem[] }) {
  const countsByState = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      const s = String(it.fields?.["System.State"] ?? "Unknown");
      m.set(s, (m.get(s) || 0) + 1);
    }
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [items]);

  const countsByType = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      const t = String(it.fields?.["System.WorkItemType"] ?? "Unknown");
      m.set(t, (m.get(t) || 0) + 1);
    }
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [items]);

  const createdClosedPerWeek = useMemo(() => {
    const created = new Map<string, number>();
    const closed = new Map<string, number>();
    for (const it of items) {
      const cW = weekOf(it.fields?.["System.CreatedDate"]);
      if (cW) created.set(cW, (created.get(cW) || 0) + 1);
      const clW = weekOf(it.fields?.["Microsoft.VSTS.Common.ClosedDate"]);
      if (clW) closed.set(clW, (closed.get(clW) || 0) + 1);
    }
    const keys = new Set([...created.keys(), ...closed.keys()]);
    const arr = Array.from(keys).sort().map((k) => ({
      week: k,
      created: created.get(k) || 0,
      closed: closed.get(k) || 0
    }));
    return arr;
  }, [items]);

  if (!items.length) return null;

  return (
    <div style={{ marginTop: 24, display: "grid", gap: 24 }}>
      <div style={{ width: "100%", height: 300 }}>
        <h3>By State</h3>
        <ResponsiveContainer>
          <BarChart data={countsByState}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3182ce" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <h3>By Work Item Type</h3>
        <ResponsiveContainer>
          <BarChart data={countsByType}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#2f855a" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <h3>Created vs Closed per Week</h3>
        <ResponsiveContainer>
          <LineChart data={createdClosedPerWeek}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" interval={0} angle={-20} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="created" stroke="#3182ce" />
            <Line type="monotone" dataKey="closed" stroke="#e53e3e" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}