# ADO Query (Phase 1)

Local web app to query Azure DevOps Work Items with filters and visualize a dashboard.

## Stack
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Auth: ADO PAT in backend (.env), never exposed to browser

## Quick start
1. Copy `backend/.env.example` to `backend/.env` and set your ADO_PAT, ADO_ORG, and default ADO_PROJECT.
2. Install deps:
   - `npm install`
3. Dev:
   - `npm run dev` (starts backend on 5174, frontend on 5173 with proxy)
4. Open `http://localhost:5173`

## Security
- Store your PAT only in `backend/.env`.
- Backend proxies all ADO requests; the frontend never sees the PAT.

## Features (Phase 1)
- Filter by Area, Iteration, State, Work Item Type, Tags, Date Range (Changed/Created/Closed).
- Select fields to return (default set + custom).
- Table view with sorting; export CSV/JSON.
- Dashboard: counts by State/Type; created vs. closed per week.
- Save views locally in the browser (coming soon).

## Scripts
- `npm run dev` - run frontend and backend in watch mode
- `npm run build` - build backend and frontend

## Notes
- Defaults can be provided via `backend/.env`.
- You can override org/project per-request via the UI inputs.