
# Brain Link Tracker – Production Fixes (Aug 20, 2025)

This package contains code-level fixes to make all APIs live end‑to‑end, remove mock data, stabilize responses, and ensure the Geography tab and Live Tracking table show real data in production.

## What I changed

1. **Auth API parity**
   - Added `/api/auth/login`, `/api/auth/logout`, and `/api/auth/status` routes to match the frontend and test suite expectations.
   - File: `src/routes/auth.py`.

2. **Security Analytics (missing endpoint)**
   - Implemented `/api/security-analytics` that aggregates blocked events, bot detections, reasons, and top ISPs.
   - File: `src/routes/security_analytics.py`. Registered in `src/main.py`.

3. **Geo Analytics response normalization**
   - Ensured `/api/geo-analytics` responds with `{"success": true, "map_data": [...]}` and that items include `country`, `country_code`, `city`, `lat`, `lon`, and `count`.
   - Files: `src/routes/geo_analytics.py` (+ normalization), `src/routes/analytics.py` (already consistent).

4. **Live Activity & Events payloads**
   - Extended event payloads to include:
     - `timestamp`, `ip_address`, `email` (alias of captured_email), `captured_email`, `recipient_email`
     - `tracking_id` (unique_id or event id), `user_agent`, **`device_type`**, `isp`
     - `country`, `country_code`, `city`, `region`, **`zip_code`**, `latitude`, `longitude`, `timezone`
   - Files: `src/routes/live_activity.py`, `src/routes/events.py`.

5. **Tracking model + migration**
   - Added **`zip_code`** and **`device_type`** columns to `TrackingEvent`; ensured `to_dict()` exposes them.
   - File: `src/models/tracking_event.py`.
   - New production migration script using `DATABASE_URL` and `psycopg2` with safe `ADD COLUMN IF NOT EXISTS`:
     - `migrate_production.py` (adds `country_code`, `zip_code`, `device_type` if missing).

6. **Pixel tracking**
   - Implemented `/pixel/<short_code>.png` that logs an *email open* event and returns a 1×1 transparent PNG (no-cache).
   - Captures geolocation (now includes `zip` when available) and infers **device_type** from the User-Agent.
   - File: `src/routes/track.py`.

7. **CORS & session hardening**
   - Enabled permissive CORS for `/api/*` and set a 7‑day session lifetime.
   - File: `src/main.py`.

8. **Environment safety**
   - Removed hardcoded database URLs from migration code. Everything reads from `DATABASE_URL` now.

## Required environment variables

- `SECRET_KEY` – strong random string
- `DATABASE_URL` – Postgres URL (e.g., `postgres://...` or `postgresql://...`)
- Any provider tokens you use for enrichment (none required for `ip-api.com`)

## One‑time production migration

Run this once **after deploying** (or via a one‑off job):

```bash
python migrate_production.py
```

It will add any missing columns on `tracking_event`:
- `country_code` (if not present)
- `zip_code`
- `device_type`

## Geography tab (live data)

- API: `GET /api/geo-analytics` → `{ success, map_data: [{ country, country_code, city, lat, lon, count }] }`
- Uses real coordinates averaged per (country, city). The map can place clustered markers or heatmap from this payload.

## Live tracking table (live events)

The events endpoints now include the exact fields requested:
`timestamp, ip_address, email, captured_email, tracking_id, user_agent, device_type, isp, country, city, zip_code, region, latitude, longitude, timezone, recipient_email`.

**Pixel URL** (use in emails):
```
/pixel/<SHORT_CODE>.png
```
This will create an `email_open` event linked to the corresponding `Link` (by `short_code` or id).

## Smoke test (post‑deploy)

1. Log in via `/api/auth/login` (POST JSON: `{username/email, password}`) → `success: true`.
2. Hit `/api/link-stats`, `/api/security-analytics`, `/api/geo-analytics`, `/api/live-activity` → expect `success: true`.
3. Open `https://<your-domain>/pixel/<short_code>.png` from a real network → confirm new event appears in `/api/live-activity`.

## Notes

- There are older routes in `src/routes/events.py` that used direct SQLite connections. The *new* tracking and pixel logic is SQLAlchemy‑based and production‑safe. The legacy bits are left intact for compatibility, but your production flow should hit the SQLAlchemy endpoints.
- If your frontend had any mock fallbacks, they can be removed now that all APIs return structured `success` payloads.
