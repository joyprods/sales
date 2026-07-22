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
    if (type !== "syncAllClients" && type !== "optimizeAllSheets" && !isValidSession(sessionId)) {
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
