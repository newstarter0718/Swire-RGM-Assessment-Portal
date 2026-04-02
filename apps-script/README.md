# Google Apps Script Setup

Use a Google Sheet as the lightweight backend for the portal.

## Recommended setup

1. Create a new Google Sheet.
2. Open `Extensions -> Apps Script`.
3. Replace the default code with the contents of `Code.gs`.
4. Save the project.
5. Deploy as `Web app`.
6. Set access to `Anyone with the link`.
7. Copy the deployment URL into `assets/js/site-config.js` as `appsScriptUrl`.

## What the script writes

- `Assessment_Sessions`: one summary row per submitted assessment
- `Assessment_Responses`: one row per question response
- `Assessment_Priority`: top-priority list for each session

## Notes

- The front-end computes results locally, so users see scores immediately.
- The Apps Script layer is only used for logging submissions into Google Sheets.
- The site sends data using browser-safe background submission methods that work well for GitHub Pages style static hosting.
