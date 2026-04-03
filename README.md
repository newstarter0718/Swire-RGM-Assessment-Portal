# Swire RGM Assessment Portal

This project is a GitHub Pages friendly static website that introduces the Swire RGM enterprise assessment and converts the core maturity workbook into a web assessment flow.

Key capabilities:

- Red, white, and silver branded landing experience
- Methodology and architecture overview derived from the uploaded deck and manual
- Web version of the 48-question core maturity assessment
- Instant results by pillar, stage, and enabler
- Google Apps Script and Google Sheets submission pattern for lightweight backend logging

## Structure

- `index.html`: single-page site shell
- `assets/css/styles.css`: site styling
- `assets/js/app.js`: interactive UI and scoring logic
- `assets/js/google-sheets.js`: Google Sheets submission helper
- `assets/js/site-config.js`: deployment-time config for the Apps Script URL
- `data/assessment-config.json`: workbook-derived assessment data
- `scripts/extract_workbook_data.py`: regenerate JSON from the source workbook
- `apps-script/Code.gs`: sample Apps Script web app backend
- `google-sheet-template/*.csv`: importable Google Sheet tab headers if connector setup is blocked

## Regenerate Assessment Data

```powershell
python .\scripts\extract_workbook_data.py `
  --workbook "D:\Codexwork\Swire_RGM_Assessment_Integrated_v6_nav_flow_prohome.xlsx" `
  --output ".\data\assessment-config.json"
```

## Local Preview

```powershell
python -m http.server 8765
```

Then open `http://localhost:8765/output/web/swire-rgm-assessment-portal/`

## Deployment

1. Push this folder to a GitHub repository.
2. The included `.github/workflows/deploy-pages.yml` will publish the site automatically from the `main` branch via GitHub Actions.
3. In the GitHub repository settings, set `Pages -> Source` to `GitHub Actions`.
4. Create a Google Sheet and bind an Apps Script project to it.
5. Paste the sample `apps-script/Code.gs` into the Apps Script editor.
6. Deploy the Apps Script as a Web App.
7. Paste the deployed Apps Script URL into the `Admin Setup` page of the live site to test draft autosave and final submission in your own browser.
8. After validation, update `assets/js/site-config.js` with the same deployed Apps Script URL if you want every user to submit without local setup.

If connector-based Google Sheet creation is unavailable, use the files in `google-sheet-template/` and the Apps Script bootstrap to create the required tabs manually, including the draft tab used for autosave.

## Publish From This Machine

This project has already been initialized as a local Git repository on branch `main`.

Once you have created a GitHub repository, run:

```powershell
git remote add origin <YOUR_GITHUB_REPO_URL>
git add .
git commit -m "Initial Swire RGM assessment portal"
git push -u origin main
```

If `git commit` asks for identity, configure:

```powershell
git config user.name "Your Name"
git config user.email "you@example.com"
```

## Scope

This first version focuses on the core maturity assessment that powers the dashboard outputs:

- Pricing
- OBPPC
- Promotion Spend
- DFR / Trade Investment

The workbook's knowledge questionnaire, interview guide, and case assessment are included as methodology context and phase-two expansion candidates rather than primary form flows in this release.
