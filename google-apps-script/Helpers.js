// Helpers.js
// All private helper functions start with _ as requested

// 1. Open Setup Spreadsheet
function _getSetupSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    return SpreadsheetApp.openById(CONFIG.SETUP_SPREADSHEET_ID);
  }
}

// 2. Read client configuration dynamically from Setup sheet
function _getSetupConfig() {
  var ss = _getSetupSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_SETUP) || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  var config = {
    clientSpreadsheetId: "1a9wF8bAH2-V0zUF_f6l0ZDXmRsMoW7HioD79RgxrZ5I", // Default fallback
    clientSheetName: "Client List" // Default fallback
  };
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    for (var j = 0; j < row.length - 1; j++) {
      var key = (row[j] || "").toString().trim().toLowerCase();
      var val = (row[j+1] || "").toString().trim();
      
      if (key.indexOf("client spreadsheet id") !== -1 || key.indexOf("client spreadsheetid") !== -1) {
        config.clientSpreadsheetId = val;
      } else if (key.indexOf("client sheet") !== -1) {
        config.clientSheetName = val;
      }
    }
  }
  return config;
}

// 3. Initialize dynamic tables in Setup spreadsheet if missing
function _initSpreadsheet() {
  var ss = _getSetupSpreadsheet();
  
  // Create Users sheet if missing
  var usersSheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(CONFIG.SHEET_USERS);
    usersSheet.appendRow(["id", "email", "password", "passwordHash", "createdAt", "updatedAt", "active"]);
    
    // Add default admin user (hash of 'joy')
    var now = new Date();
    usersSheet.appendRow(["sales1", "sales1@joy.com", "", _md5Hash("joy"), now, now, true]);
  }
  
  // Create Sessions sheet if missing
  var sessionsSheet = ss.getSheetByName(CONFIG.SHEET_SESSIONS);
  if (!sessionsSheet) {
    sessionsSheet = ss.insertSheet(CONFIG.SHEET_SESSIONS);
    sessionsSheet.appendRow(["SessionId", "UserId", "Email", "CreatedAt", "LastAccessedAt"]);
  }
}

// 4. MD5 Hash implementation matching Node.js / crypto MD5
function _md5Hash(input) {
  if (!input) return "";
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, input, Utilities.Charset.UTF_8);
  var output = "";
  for (var i = 0; i < rawHash.length; i++) {
    var byteValue = rawHash[i];
    if (byteValue < 0) byteValue += 256;
    var byteString = byteValue.toString(16);
    if (byteString.length == 1) byteString = "0" + byteString;
    output += byteString;
  }
  return output;
}

// 5. Find index of header matching name (case-insensitive and trimmed)
function _findHeaderIndex(headers, name) {
  if (!headers || !name) return -1;
  var target = name.toString().trim().toUpperCase();
  for (var i = 0; i < headers.length; i++) {
    var h = (headers[i] || "").toString().trim().toUpperCase();
    if (h === target) {
      return i;
    }
  }
  return -1;
}

// 6. Append errors to the Logs sheet in Setup spreadsheet
function _logError(type, error, payload) {
  try {
    var ss = _getSetupSpreadsheet();
    var sheet = ss.getSheetByName("Logs");
    if (!sheet) {
      sheet = ss.insertSheet("Logs");
      sheet.appendRow(["Timestamp", "Type", "Error Message", "Stack Trace", "Payload"]);
    }
    
    var timestamp = new Date();
    var errorMsg = error ? error.toString() : "Unknown Error";
    var stack = error && error.stack ? error.stack : "";
    var payloadStr = payload ? (typeof payload === "string" ? payload : JSON.stringify(payload)) : "";
    
    sheet.appendRow([timestamp, type || "ERROR", errorMsg, stack, payloadStr]);
  } catch (e) {
    Logger.log("Failed to log error to spreadsheet: " + e.toString());
  }
}
