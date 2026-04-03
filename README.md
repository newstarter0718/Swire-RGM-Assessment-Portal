# Swire RGM Assessment Portal

This project is now a `React + Tailwind + Vite` application prepared for `Vercel` deployment while preserving the existing Swire RGM assessment logic, Google Sheets flow, and workbook-derived data model.

## Current Stack

- `React` for routed application structure
- `Tailwind CSS` with global Swire brand tokens in `src/index.css`
- `Vite` for local development and production builds
- `Vercel Functions` via `api/assessment.js` for proxying draft save and submission requests
- `Google Apps Script + Google Sheets` as the lightweight backend writer

## Routes

- `/#/` Home
- `/#/framework` Framework
- `/#/logic` Logic
- `/#/assessment` Assessment
- `/#/admin` Admin Setup

Legacy entry pages such as `framework.html` and `assessment.html` are retained as small redirects so older links continue to work.

## Important Files

- `src/App.jsx`: app routes and shell
- `src/pages/*.jsx`: page-level React views
- `src/components/ui.jsx`: reusable UI primitives
- `src/pages/AssessmentPage.jsx`: assessment wizard, autosave, live results, and submission flow
- `src/lib/assessment.js`: scoring logic, formatting helpers, and payload construction
- `src/lib/submission.js`: client submission transport selection
- `api/assessment.js`: Vercel proxy function
- `data/assessment-config.json`: workbook-derived assessment data
- `apps-script/Code.gs`: Google Apps Script writer
- `scripts/extract_workbook_data.py`: regenerate the assessment JSON from the source workbook

## Local Development

Install dependencies:

```powershell
npm install
```

Run the dev server:

```powershell
npm run dev
```

Build for production:

```powershell
npm run build
```

## Submission Paths

The app now supports two submission modes:

1. `Vercel Proxy`
   The browser posts to `/api/assessment`, and the Vercel Function forwards the payload to Apps Script using the server-side `APPS_SCRIPT_URL` environment variable.

2. `Direct Apps Script`
   The user can set a browser-specific Apps Script URL override from the Admin Setup page. This is useful for local testing or fallback scenarios.

## Vercel Setup

1. Create or open the Vercel project linked to this repository.
2. Add environment variable:
   - `APPS_SCRIPT_URL=<your Apps Script /exec URL>`
3. Deploy the project on Vercel.
4. Open the preview deployment and validate:
   - assessment autosave
   - live results
   - final submission to Google Sheets

## Google Apps Script

1. Open your target Google Sheet.
2. Create or open the bound Apps Script project.
3. Paste `apps-script/Code.gs`.
4. Deploy it as a Web App.
5. Copy the `/exec` URL.
6. Store it in Vercel as `APPS_SCRIPT_URL`, or paste it into the Admin Setup page for browser-local override testing.

## Regenerate Assessment Data

```powershell
python .\scripts\extract_workbook_data.py `
  --workbook "D:\Codexwork\Swire_RGM_Assessment_Integrated_v6_nav_flow_prohome.xlsx" `
  --output ".\data\assessment-config.json"
```

## Scope

This version focuses on the core 48-question maturity assessment and its reporting outputs:

- Pricing
- OBPPC
- Promotion Spend
- DFR / Trade Investment

The workbook's knowledge questionnaire, interview guide, and case assessment remain future expansion candidates rather than primary interactive flows in this release.
