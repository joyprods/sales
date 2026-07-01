// PasswordManager.js
// Secure Password Hashing & Updating utility

function hashOrUpdateUserPassword() {
  _initSpreadsheet();
  var ss = _getSetupSpreadsheet();
  var usersSheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!usersSheet) {
    SpreadsheetApp.getUi().alert("Users sheet not found!");
    return;
  }
  
  var dataRange = usersSheet.getDataRange();
  var values = dataRange.getValues();
  var lastRow = values.length;
  
  var updatedCount = 0;
  var now = new Date();
  
  // Columns matching Setup sheet:
  // Col A (0): id
  // Col B (1): email
  // Col C (2): password
  // Col D (3): passwordHash
  // Col E (4): createdAt
  // Col F (5): updatedAt
  // Col G (6): active
  
  for (var i = 1; i < lastRow; i++) {
    var rawPassword = (values[i][2] || "").toString().trim();
    
    // If a plain text password was entered in Column C:
    if (rawPassword !== "") {
      var hash = _md5Hash(rawPassword);
      
      // Update Column D with the MD5 hash
      usersSheet.getRange(i + 1, 4).setValue(hash);
      
      // Clear the plain text password in Column C for security
      usersSheet.getRange(i + 1, 3).setValue("");
      
      // Update the updatedAt timestamp in Column F
      usersSheet.getRange(i + 1, 6).setValue(now);
      
      updatedCount++;
    }
  }
  
  if (updatedCount > 0) {
    SpreadsheetApp.getUi().alert("Successfully hashed and updated passwords for " + updatedCount + " user(s). Plaintext passwords have been cleared for security.");
  } else {
    SpreadsheetApp.getUi().alert("No new plain text passwords found in the 'password' column (Column C) to update.");
  }
}

// Add a custom menu to the Setup Spreadsheet to run this utility easily
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Joymex Form Admin")
    .addItem("Update & Hash User Passwords", "hashOrUpdateUserPassword")
    .addItem("Sync All Clients to Pricing Sheets", "populateAllClientsInPricingSheets")
    .addItem("Optimize Sheet Sizes (Delete Empty Rows/Cols)", "optimizeAllSheets")
    .addToUi();
}
