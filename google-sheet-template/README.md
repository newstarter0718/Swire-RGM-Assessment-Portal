# Google Sheet Template Import

If the Google Drive connector is not currently authorized, you can still create the backend sheet quickly:

1. Create a blank Google Sheet.
2. Rename the first tab to `Assessment_Sessions`.
3. Import `Assessment_Sessions.csv` into that tab.
4. Add two more tabs named `Assessment_Responses` and `Assessment_Priority`.
5. Import the matching CSV file into each tab.
6. Open `Extensions -> Apps Script`.
7. Paste `../apps-script/Code.gs` into the Apps Script editor.
8. Deploy it as a Web App and copy the URL into `assets/js/site-config.js`.

This gives you the same backend structure as the automated version.
