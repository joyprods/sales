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
    if (type !== "syncAllClients" && type !== "optimizeAllSheets" && type !== "dumpClientListHeaders" && type !== "debugCell" && type !== "dumpLogs" && !isValidSession(sessionId)) {
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
    } else if (type === "getClientDetails") {
      var details = getClientDetails(payload.partyName);
      result = details;
    } else if (type === "updateClient") {
      var updateResult = updateClient(payload.originalPartyName, payload.data);
      result = updateResult;
    } else if (type === "getAreas") {
      var areas = getAreasList();
      result = { ok: true, response_data: areas };
    } else if (type === "getCities") {
      var cities = getCitiesList();
      result = { ok: true, response_data: cities };
    } else if (type === "getClientCategories") {
      var categories = getClientCategoriesList();
      result = { ok: true, response_data: categories };
    } else if (type === "getActiveClientsGrouped") {
      var clientsGrouped = getActiveClientsGrouped();
      result = { ok: true, response_data: clientsGrouped };
    } else if (type === "getProductPrices") {
      var pricesData = getProductPricingData(payload.clientType, payload.clientName);
      result = pricesData;
    } else if (type === "getAllPricingData") {
      var allPricesData = getAllPricingData(payload.clientType);
      result = allPricesData;
    } else if (type === "saveProductPrices") {
      var saveResult = saveProductPrices(payload.clientType, payload.clientName, payload.prices);
      result = saveResult;
    } else if (type === "syncAllClients") {
      populateAllClientsInPricingSheets();
      result = { ok: true, message: "Sync triggered successfully" };
    } else if (type === "optimizeAllSheets") {
      var optResult = optimizeAllSheets();
      result = optResult;
    } else if (type === "dumpClientListHeaders") {
      var clientSpreadsheetId = payload.clientSpreadsheetId || _getSetupConfig().clientSpreadsheetId;
      var ss = SpreadsheetApp.openById(clientSpreadsheetId);
      var sheet = ss.getSheetByName("Client List");
      if (!sheet) {
        result = { ok: false, message: "Sheet not found: Client List" };
      } else {
        var lastCol = sheet.getLastColumn();
        var headers1 = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        var headers2 = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
        var lastRow = sheet.getLastRow();
        var numRows = Math.min(5, lastRow);
        var rows = lastRow > 0 ? sheet.getRange(1, 1, numRows, lastCol).getValues() : [];
        result = {
          ok: true,
          clientSpreadsheetId: clientSpreadsheetId,
          headersRow1: headers1,
          headersRow2: headers2,
          lastRow: lastRow,
          lastCol: lastCol,
          rows: rows
        };
      }
    } else if (type === "debugCell") {
      var config = _getSetupConfig();
      var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
      var sheet = ss.getSheetByName(config.clientSheetName);
      var range = sheet.getRange(1686, 6); // Column F (PARTY NAME) is column 6
      result = {
        ok: true,
        value: range.getValue(),
        formula: range.getFormula(),
        headers: sheet.getRange(_getHeaderRowIndex(sheet), 1, 1, 15).getValues()[0].map(function(h) {
          return (h || "").toString();
        })
      };
    } else if (type === "dumpLogs") {
      var ss = _getSetupSpreadsheet();
      var sheet = ss.getSheetByName("Logs");
      if (!sheet) {
        result = { ok: false, message: "Logs sheet not found" };
      } else {
        var lastRow = sheet.getLastRow();
        var numRows = Math.min(20, lastRow);
        var rows = lastRow > 0 ? sheet.getRange(Math.max(1, lastRow - numRows + 1), 1, numRows, 5).getValues() : [];
        result = { ok: true, logs: rows };
      }
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
