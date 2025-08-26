import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  getAreas,
  getFields,
  getIterations,
  getTags,
  getWorkItemTypes,
  getStates,
  runQuery
} from "./routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/healthz", (_req, res) => res.send({ ok: true }));

app.get("/api/fields", getFields);
app.get("/api/areas", getAreas);
app.get("/api/iterations", getIterations);
app.get("/api/tags", getTags);
app.get("/api/workitemtypes", getWorkItemTypes);
app.get("/api/states", getStates);
app.post("/api/query", runQuery);

const port = Number(process.env.PORT || 5174);
app.listen(port, () => console.log(`Backend listening on :${port}`));