const fetch = require('node-fetch');

const API_URL = "https://script.google.com/macros/s/AKfycbxYqsW9TaHHeeOF2HUrRqxzCPMPTNqyhR7AfxR2HAmUDrrmKqBj2dc25K7F-A4t5L-j/exec";

async function runSync() {
  console.log("Triggering client sync on Apps Script...");
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'syncAllClients',
        sessionId: 'sess_admin_sync_direct',
        portal: 'local'
      })
    });
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Error running sync:", err);
  }
}

runSync();
