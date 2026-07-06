const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const fetch = require('node-fetch');

const CLASP_JSON_PATH = path.join(__dirname, '../google-apps-script/.clasp.json');
const CLIENT_SCRIPT_ID = "1W3g052HszocZCDHDMbQzFaeEIPR__kfob52nbo4BkV3rulZPSbFU-JgI";
const DEV_SCRIPT_ID = "18hnKwlnsKZKqRNxHBL8gvpGFJJVdD-g-x8ez4RAq-hdrm5E5vLE3dCQd";

async function run() {
  console.log("1. Swapping to Dev Script ID...");
  const claspContent = JSON.parse(fs.readFileSync(CLASP_JSON_PATH, 'utf8'));
  claspContent.scriptId = DEV_SCRIPT_ID;
  fs.writeFileSync(CLASP_JSON_PATH, JSON.stringify(claspContent, null, 2));

  try {
    console.log("2. Running clasp push on Dev Script...");
    execSync('clasp push --force', { cwd: path.join(__dirname, '../google-apps-script'), stdio: 'inherit' });

    console.log("3. Deploying Dev Script...");
    const deployOut = execSync('clasp deploy -d "Diagnostic createClient test"', { cwd: path.join(__dirname, '../google-apps-script') }).toString();
    console.log(deployOut);

    const match = deployOut.match(/Deployed\s+([A-Za-z0-9_-]+)\s+@/);
    if (!match) {
      throw new Error("Failed to extract deployment ID from: " + deployOut);
    }
    const deployId = match[1];
    const webAppUrl = `https://script.google.com/macros/s/${deployId}/exec`;
    console.log("Deployed Web App URL:", webAppUrl);

    console.log("4. Creating client TEST CLIENT FROM API...");
    const createRes = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'createClient',
        sessionId: 'sess_admin_sync_direct',
        portal: 'local',
        data: {
          clientCategory: 'Restaurants & Cafes - Local',
          partyName: 'TEST CLIENT FROM DIAGNOSTIC',
          salesPoc: 'H1',
          hasMsme: 'No',
          msmeNumber: '',
          contactPersonPurchase: 'Purchaser Name',
          contactNumberPurchase: '9876543210',
          emailIdPurchase: 'purch@test.com',
          contactPersonAccounts: 'Accounts Name',
          mobileNumberAccounts: '9876543211',
          emailIdAccounts: 'accts@test.com',
          contactPerson3: '',
          contactNumber3: '',
          emailId3: '',
          area: 'ANDHERI EAST',
          customerType: 'HORECA',
          class: 'CB',
          billingAddress: 'Test Billing Address',
          gstNo: '',
          googleLocationLinks: 'https://test.com',
          shippingAddressSame: true,
          shippingAddress: 'Test Billing Address',
          pinCode: '400059',
          panNumber: '',
          salesPocContactNo: '',
          creditType: 'ADVANCE',
          crmPoc: 'P1',
          secondaryUpperLimitInDays: '30',
          fssaiNumber: '12345678901234',
          freightToBeAdded: 'No',
          localOrOutstation: 'LOCAL',
          city: 'MUMBAI'
        }
      })
    });
    const createData = await createRes.json();
    console.log("Create response:", createData);

    console.log("5. Fetching headers & last rows from test spreadsheet...");
    const inspectRes = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'dumpClientListHeaders',
        clientSpreadsheetId: '1a9wF8bAH2-V0zUF_f6l0ZDXmRsMoW7HioD79RgxrZ5I',
        sessionId: 'sess_admin_sync_direct',
        portal: 'local'
      })
    });
    const inspectData = await inspectRes.json();
    
    if (inspectData.ok) {
      console.log("Last row index:", inspectData.lastRow);
      console.log("Last row content:", inspectData.rows[inspectData.rows.length - 1]);
    } else {
      console.log("Inspection failed:", inspectData);
    }

  } catch (err) {
    console.error("Execution error:", err);
  } finally {
    console.log("6. Restoring Client Script ID...");
    claspContent.scriptId = CLIENT_SCRIPT_ID;
    fs.writeFileSync(CLASP_JSON_PATH, JSON.stringify(claspContent, null, 2));
  }
}

run();
