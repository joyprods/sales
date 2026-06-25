// doPost.js
// Main entry point dispatcher for POST requests

function doPost(e) {
  var payload = null;
  try {
    payload = JSON.parse(e.postData.contents);
    var type = payload.type;
    
    // Login doesn't check session
    if (type === "login") {
      var email = payload.email;
      var password = payload.password;
      var loginResult = loginUser(email, password);
      return ContentService.createTextOutput(JSON.stringify(loginResult))
        .setMimeType(ContentService.MimeType.JSON);
    }


    
    // Validate session token for other actions
    var sessionId = payload.sessionId;
    if (!isValidSession(sessionId)) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, code: "NO_SESSION" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var result;
    if (type === "getClientList") {
      var clients = getClientList();
      result = { ok: true, response_data: clients };
    } else if (type === "createClient") {
      var createResult = createClient(payload.data);
      result = createResult;
    } else if (type === "getAreas") {
      var areas = getAreasList();
      result = { ok: true, response_data: areas };
    } else {
      result = { ok: false, code: "UNKNOWN_TYPE" };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log exception to Logs sheet
    _logError(payload ? payload.type : "doPost", error, payload || (e && e.postData ? e.postData.contents : ""));
    return ContentService.createTextOutput(JSON.stringify({ ok: false, code: "SERVER_ERROR", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
