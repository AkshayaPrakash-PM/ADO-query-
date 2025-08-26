# Phase 1 Spec

## Goals
- Local-only web app to query ADO Work Items using WIQL and render a readable grid + dashboard.

## Filters
- org (string), project (string)
- areaPaths (string[]), iterationPaths (string[])
- workItemTypes (string[]), states (string[])
- tagsInclude (string[])
- dateField: ChangedDate | CreatedDate | ClosedDate
- dateRange: { from: ISODate, to: ISODate }
- fields (string[])

## API
- GET /api/fields?org&project
- GET /api/areas?org&project&depth=5
- GET /api/iterations?org&project&depth=5
- GET /api/tags?org[&project]
- GET /api/workitemtypes?org&project
- GET /api/states?org&project[&type]
- POST /api/query
  - body: { org, project, filters, fields, page: { skip, top }, includeRelations?: boolean }
  - returns: { total, items: Array<{ id, url, rev, fields, relations? }>, meta: { durationMs, params, watermark? } }

## Dashboard metrics
- Counts by State, Work Item Type (derived client-side).
- Created per week, Closed per week (using CreatedDate/ClosedDate).
- Open backlog trending (approximate by ChangedDate <= weekEnd and ClosedDate is null or > weekEnd).

## Performance
- WIQL to get IDs (order by selected date desc).
- WorkItemsBatch in chunks of 200.
- Exponential backoff on 429/5xx with jitter (v1: basic retries).

## Security
- PAT only on server.
- Optional redaction: mask emails (e.g., AssignedTo) via future config toggle.

## Acceptance Criteria
- Query succeeds across typical datasets (<= 10k IDs) with batching.
- Table + export + dashboard render within acceptable time (< 10s for 5k items).
- Filters populate from ADO metadata.