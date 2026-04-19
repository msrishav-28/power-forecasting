# POWERGRID ER-I Frontend

Vite-based operator dashboard for the POWERGRID ER-I Intelligence project.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run sync:data
```

## Environment

Create a local `.env` from `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Snapshot boot

The app reads static contracts from:

- `public/snapshots/meta.json`
- `public/snapshots/assets.json`
- `public/snapshots/grid.json`
- `public/snapshots/corridors.json`

Refresh them with:

```bash
npm run sync:data
```

## Deployment

Deploy this directory to Vercel.

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

`vercel.json` includes SPA rewrites for `/dashboard/*` so route refreshes work correctly with `BrowserRouter`.
