# Google Apps Script Setup

Use a Google Sheet as the lightweight backend for the portal.

## Recommended setup

1. Open the target Google Sheet that will store responses.
2. Open `Extensions -> Apps Script` from that sheet.
3. Replace the default code with the contents of `Code.gs`.
4. Save the project.
5. Deploy as `Web app`.
6. Set access to `Anyone with the link`.
7. Copy the deployment URL into `assets/js/site-config.js` as `appsScriptUrl`.

This bound-script flow is preferred because it does not require manually copying a spreadsheet ID.

## What the script writes

- `Assessment_Sessions`: one summary row per submitted assessment
- `Assessment_Responses`: one row per question response
- `Assessment_Priority`: top-priority list for each session

The script will create these tabs and headers automatically if they do not already exist.

## Notes

- The front-end computes results locally, so users see scores immediately.
- The Apps Script layer is only used for logging submissions into Google Sheets.
- The site sends data using browser-safe background submission methods that work well for GitHub Pages style static hosting.
