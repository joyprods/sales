// Auth.js
// Authentication & Session management

// User Login Check against MD5 password hash
function loginUser(email, password) {
  _initSpreadsheet();
  var ss = _getSetupSpreadsheet();
  var usersSheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  var usersData = usersSheet.getDataRange().getValues();
  
  var matchedUser = null;
  // Match password input MD5 hash
  var inputHash = _md5Hash(password);
  
  for (var i = 1; i < usersData.length; i++) {
    var uId = (usersData[i][0] || "").toString().trim();
    var uEmail = (usersData[i][1] || "").toString().trim().toLowerCase();
    var uPassHash = (usersData[i][3] || "").toString().trim().toLowerCase();
    var uActive = (usersData[i][6] === true || usersData[i][6].toString().toUpperCase() === "TRUE");
    
    if (uEmail === email.trim().toLowerCase() && uPassHash === inputHash && uActive) {
      matchedUser = {
        id: uId,
        email: usersData[i][1],
        name: uId
      };
      break;
    }
  }
  
  if (!matchedUser) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }
  
  // Create a new session
  var sessionId = "sess_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
  var sessionsSheet = ss.getSheetByName(CONFIG.SHEET_SESSIONS);
  var now = new Date();
  sessionsSheet.appendRow([sessionId, matchedUser.id, matchedUser.email, now, now]);
  
  return {
    ok: true,
    session: { sessionId: sessionId },
    user: matchedUser
  };
}

// Session Validation
function isValidSession(sessionId) {
  if (!sessionId) return false;
  var ss = _getSetupSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_SESSIONS);
  if (!sheet) return false;
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === sessionId) {
      // Update last accessed time
      var now = new Date();
      sheet.getRange(i + 1, 5).setValue(now);
      return true;
    }
  }
  return false;
}
