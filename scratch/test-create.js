const fetch = require('node-fetch');

const API_URL = "https://script.google.com/macros/s/AKfycby8u-Xu9PJpVH-Y4JqjDLiUsyhJqZ2EsWlu1Sq9rcFfxl-SY0ERyUTzMgdKifH2w6bO/exec";

async function testCreate() {
  console.log("Triggering createClient on Apps Script...");
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'createClient',
        sessionId: 'sess_admin_sync_direct',
        portal: 'local',
        data: {
          clientCategory: 'Restaurants & Cafes - Local',
          partyName: 'TEST CLIENT FROM API',
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
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Error creating client:", err);
  }
}

testCreate();
