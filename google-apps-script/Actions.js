// Actions.js
// Client data retrieval & insertion logic

// Fetch Client Names Grouped by Sales POC
function getClientList() {
  var config = _getSetupConfig();
  var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
  var sheet = ss.getSheetByName(config.clientSheetName);
  if (!sheet) {
    return { ok: false, code: "SHEET_NOT_FOUND" };
  }
  
  var headerRow = 2; // Column headers are on row 2
  var lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) {
    return {};
  }
  
  var headers = sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  var partyNameIdx = _findHeaderIndex(headers, "PARTY NAME");
  var salesPocIdx = _findHeaderIndex(headers, "SALES POC");
  
  if (partyNameIdx === -1 || salesPocIdx === -1) {
    return {};
  }
  
  var data = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, sheet.getLastColumn()).getValues();
  
  var clientsByPoc = {};
  clientsByPoc["All"] = [];

  for (var i = 0; i < data.length; i++) {
    var partyName = (data[i][partyNameIdx] || "").toString().trim();
    var salesPoc = (data[i][salesPocIdx] || "").toString().trim();
    
    if (!partyName) continue;
    
    var clientObj = { name: partyName };
    
    if (salesPoc) {
      if (!clientsByPoc[salesPoc]) {
        clientsByPoc[salesPoc] = [];
      }
      clientsByPoc[salesPoc].push(clientObj);
    }
    clientsByPoc["All"].push(clientObj);
  }
  
  return clientsByPoc;
}

// Add Client dynamically matching spreadsheet column headers
function createClient(data) {
  var config = _getSetupConfig();
  var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
  var sheet = ss.getSheetByName(config.clientSheetName);
  if (!sheet) {
    return { ok: false, code: "SHEET_NOT_FOUND" };
  }
  
  var headerRow = 2; // Row 2 holds actual column headers
  var lastColumn = sheet.getLastColumn();
  var headers = sheet.getRange(headerRow, 1, 1, lastColumn).getValues()[0];
  
  // Find highest Client ID to auto-increment
  var clientIdIndex = _findHeaderIndex(headers, "CLIENT ID");
  var maxId = 0;
  if (clientIdIndex !== -1) {
    var lastRow = sheet.getLastRow();
    if (lastRow > headerRow) {
      var idValues = sheet.getRange(headerRow + 1, clientIdIndex + 1, lastRow - headerRow, 1).getValues();
      for (var i = 0; i < idValues.length; i++) {
        var val = parseFloat(idValues[i][0]);
        if (!isNaN(val) && val > maxId) {
          maxId = val;
        }
      }
    }
  }
  var newClientId = maxId + 1;

  // Format current date
  var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

  // Map incoming JSON keys to column headers dynamically
  var newRow = [];
  for (var c = 0; c < headers.length; c++) {
    var header = (headers[c] || "").toString().trim().toUpperCase();
    var val = "";
    
    switch (header) {
      case "CLIENT STATUS":
        val = "Active";
        break;
      case "CLIENT ID":
        val = newClientId;
        break;
      case "CLIENT CATEGORY":
        val = data.clientCategory || "";
        break;
      case "PARTY NAME":
        val = data.partyName || "";
        break;
      case "SALES POC":
        val = data.salesPoc || "";
        break;
      case "MSME NUMBER":
        val = (data.hasMsme === "Yes") ? (data.msmeNumber || "") : "";
        break;
      case "CONTACT PERSON (PURCHASE)":
        val = data.contactPersonPurchase || "";
        break;
      case "CONTACT NUMBER (PURCHASE)":
        val = data.contactNumberPurchase || "";
        break;
      case "EMAIL ID (PURCHASE)":
        val = data.emailIdPurchase || "";
        break;
      case "CONTACT PERSON (ACCOUNTS)":
        val = data.contactPersonAccounts || "";
        break;
      case "MOBILE NUMBER (ACCOUNTS)":
        val = data.mobileNumberAccounts || "";
        break;
      case "EMAIL ID (ACCOUNTS)":
        val = data.emailIdAccounts || "";
        break;
      case "CONTACT PERSON 3":
        val = data.contactPerson3 || "";
        break;
      case "CONTACT NUMBER":
        val = data.contactNumber3 || "";
        break;
      case "EMAIL ID 3":
        val = data.emailId3 || "";
        break;
      case "AREA":
        val = data.area || "";
        break;
      case "CUSTOMER TYPE (HORECA/RETAIL)":
        val = data.customerType || "";
        break;
      case "CLASS":
        val = data.class || "";
        break;
      case "BILLING ADDRESS":
        val = data.billingAddress || "";
        break;
      case "GST NO":
        val = data.gstNo || "";
        break;
      case "GOOGLE LOCATION LINKS":
        val = data.googleLocationLinks || "";
        break;
      case "SHIPPING ADDRESS":
        val = data.shippingAddress || "";
        break;
      case "PIN CODE":
        val = data.pinCode || "";
        break;
      case "PAN NUMBER":
        val = data.panNumber || "";
        break;
      case "SALES POC CONTACT NO":
        val = data.salesPocContactNo || "";
        break;
      case "CREDIT TYPE":
        val = data.creditType || "";
        break;
      case "CRM POC":
        val = data.crmPoc || "";
        break;
      case "SECONDARY UPPER LIMIT (IN DAYS)":
        val = data.secondaryUpperLimitInDays ? parseFloat(data.secondaryUpperLimitInDays) : "";
        break;
      case "DATE OF ADDING":
        val = dateStr;
        break;
      case "FSSAI NUMBER":
        val = data.fssaiNumber || "";
        break;
      case "FREIGHT TO BE ADDED? Y/N":
        val = (data.freightToBeAdded === "Yes" || data.freightToBeAdded === "Y") ? "Y" : "N";
        break;
      default:
        val = "";
    }
    newRow.push(val);
  }

  sheet.appendRow(newRow);
  
  // Dynamically sync client name to the correct pricing matrix sheet on creation
  try {
    var clientType = _getClientTypeFromArea(data.area);
    syncClientToPricingSheet(data.partyName, clientType);
  } catch (syncErr) {
    _logError("createClientSync", syncErr, data.partyName);
  }
  
  // Clear cached client list and row data
  try {
    _clearCacheKey("active_clients_grouped");
    _clearCacheKey("pricing_clients_LOCAL");
    _clearCacheKey("pricing_clients_OUTSTATION");
  } catch (cacheErr) {
    Logger.log("Cache bust error: " + cacheErr);
  }
  
  return { ok: true, clientId: newClientId };
}

// Fetch Unique Areas from the Client List sheet
function getAreasList() {
  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var sheet = ss.getSheetByName(config.clientSheetName);
    if (!sheet) return [];
    
    var headerRow = 2; // Column headers are on row 2
    var lastRow = sheet.getLastRow();
    if (lastRow <= headerRow) return [];
    
    var headers = sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    var areaIdx = _findHeaderIndex(headers, "AREA");
    if (areaIdx === -1) return [];
    
    var data = sheet.getRange(headerRow + 1, areaIdx + 1, lastRow - headerRow, 1).getValues();
    var uniqueAreas = {};
    
    for (var i = 0; i < data.length; i++) {
      var area = (data[i][0] || "").toString().trim().toUpperCase();
      if (area) {
        uniqueAreas[area] = true;
      }
    }
    
    return Object.keys(uniqueAreas).sort();
  } catch (e) {
    _logError("getAreasList", e, "");
    return [];
  }
}

// Automatically deduce client category (LOCAL/OUTSTATION) from their Area using Data Sheet
function _getClientTypeFromArea(areaName) {
  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var dataSheet = ss.getSheetByName("Data Sheet");
    if (!dataSheet) return "LOCAL";
    
    var lastRow = dataSheet.getLastRow();
    if (lastRow <= 1) return "LOCAL";
    
    var data = dataSheet.getRange(2, 1, lastRow - 1, 5).getValues();
    var searchArea = (areaName || "").toString().trim().toUpperCase();
    
    for (var i = 0; i < data.length; i++) {
      var area = (data[i][0] || "").toString().trim().toUpperCase();
      if (area === searchArea) {
        var city = (data[i][4] || "").toString().trim().toUpperCase();
        return (city === "MUMBAI") ? "LOCAL" : "OUTSTATION";
      }
    }
    return "LOCAL";
  } catch (e) {
    _logError("_getClientTypeFromArea", e, areaName);
    return "LOCAL";
  }
}

// Automatically sync client name to respective Local/Outstation Product Prices sheet
function syncClientToPricingSheet(partyName, localOrOutstation) {
  try {
    var config = _getSetupConfig();
    var clientSs = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var clientType = (localOrOutstation || "").toString().trim().toUpperCase();
    
    var pricingSheetName = (clientType === "OUTSTATION") ? "Outstation Product Prices" : "Local Product Prices";
    var pricingSheet = clientSs.getSheetByName(pricingSheetName);
    if (!pricingSheet) {
      pricingSheet = clientSs.insertSheet(pricingSheetName);
    }
    
    var lastRow = pricingSheet.getLastRow();
    var lastCol = pricingSheet.getLastColumn();
    
    if (lastRow === 0 || lastCol === 0) {
      pricingSheet.appendRow(["PARTY NAME"]);
      lastRow = 1;
    }
    
    var clientNames = [];
    if (lastRow > 1) {
      clientNames = pricingSheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) {
        return (r[0] || "").toString().trim();
      });
    }
    
    if (clientNames.indexOf(partyName) === -1) {
      pricingSheet.appendRow([partyName]);
      _clearCacheKey("pricing_clients_" + clientType);
      _clearCacheKey("active_clients_grouped");
    }
    return true;
  } catch (e) {
    _logError("syncClientToPricingSheet", e, partyName + " (" + localOrOutstation + ")");
    return false;
  }
}

// Fetch all active client names grouped by Local/Outstation type
function getActiveClientsGrouped() {
  var cacheKey = "active_clients_grouped";
  try {
    var cached = _getCachedData(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    Logger.log("Cache get error for active clients: " + err);
  }

  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var sheet = ss.getSheetByName(config.clientSheetName);
    if (!sheet) return { LOCAL: [], OUTSTATION: [] };
    
    var headerRow = 2;
    var lastRow = sheet.getLastRow();
    if (lastRow <= headerRow) return { LOCAL: [], OUTSTATION: [] };
    
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
    
    var statusIdx = _findHeaderIndex(headers, "CLIENT STATUS");
    var nameIdx = _findHeaderIndex(headers, "PARTY NAME");
    var typeIdx = _findHeaderIndex(headers, "LOCAL / OUTSTATION");
    
    if (nameIdx === -1) return { LOCAL: [], OUTSTATION: [] };
    
    var statusValues = statusIdx !== -1 
      ? sheet.getRange(headerRow + 1, statusIdx + 1, lastRow - headerRow, 1).getValues()
      : null;
    var nameValues = sheet.getRange(headerRow + 1, nameIdx + 1, lastRow - headerRow, 1).getValues();
    var typeValues = typeIdx !== -1
      ? sheet.getRange(headerRow + 1, typeIdx + 1, lastRow - headerRow, 1).getValues()
      : null;
    
    var localClients = [];
    var outstationClients = [];
    
    for (var i = 0; i < nameValues.length; i++) {
      var status = statusValues ? (statusValues[i][0] || "").toString().trim().toUpperCase() : "ACTIVE";
      var name = (nameValues[i][0] || "").toString().trim();
      var type = typeValues ? (typeValues[i][0] || "").toString().trim().toUpperCase() : "";
      
      if (!name) continue;
      if (statusIdx !== -1 && status !== "ACTIVE") continue;
      
      if (type === "OUTSTATION") {
        outstationClients.push(name);
      } else {
        localClients.push(name);
      }
    }
    
    var result = {
      LOCAL: localClients.sort(),
      OUTSTATION: outstationClients.sort()
    };
    
    // Cache for 30 minutes (1800 seconds)
    _setCachedData(cacheKey, result, 1800);
    return result;
  } catch (e) {
    _logError("getActiveClientsGrouped", e, "");
    return { LOCAL: [], OUTSTATION: [] };
  }
}

// Get active products list, resize matrix columns, verify client row, and fetch prices
function getProductPricingData(clientType, clientName) {
  try {
    // 1. Get active products (cached for 15 minutes)
    var prodCacheKey = "active_products_" + clientType;
    var activeProducts = _getCachedData(prodCacheKey);
    if (!activeProducts) {
      activeProducts = [];
      var setupSs = _getSetupSpreadsheet();
      var prodSheetName = (clientType === "OUTSTATION") ? "productsOutstation" : "productsLocal";
      var prodSheet = setupSs.getSheetByName(prodSheetName);
      if (prodSheet) {
        var lastRow = prodSheet.getLastRow();
        if (lastRow > 0) {
          var values = prodSheet.getRange(1, 1, lastRow, 1).getValues();
          for (var i = 0; i < values.length; i++) {
            var val = (values[i][0] || "").toString().trim();
            if (val && val.toLowerCase() !== "product name" && val.toLowerCase() !== "products") {
              activeProducts.push(val);
            }
          }
        }
      }
      _setCachedData(prodCacheKey, activeProducts, 900); // 15 mins cache
    }
    
    var config = _getSetupConfig();
    var clientSs = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var pricingSheetName = (clientType === "OUTSTATION") ? "Outstation Product Prices" : "Local Product Prices";
    var pricingSheet = null;
    
    // 2. Get columns/headers (cached for 15 minutes)
    var headersCacheKey = "pricing_headers_" + clientType;
    var headers = _getCachedData(headersCacheKey);
    if (!headers) {
      pricingSheet = clientSs.getSheetByName(pricingSheetName);
      if (!pricingSheet) {
        pricingSheet = clientSs.insertSheet(pricingSheetName);
      }
      var lastCol = pricingSheet.getLastColumn();
      if (lastCol === 0) {
        headers = ["PARTY NAME"];
      } else {
        headers = pricingSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
          return (h || "").toString().trim();
        });
      }
      _setCachedData(headersCacheKey, headers, 900);
    }
    
    // Add missing product columns at the end in batch!
    var newProductsToAppend = [];
    for (var i = 0; i < activeProducts.length; i++) {
      var prod = activeProducts[i];
      if (headers.indexOf(prod) === -1) {
        newProductsToAppend.push(prod);
        headers.push(prod);
      }
    }
    
    if (newProductsToAppend.length > 0) {
      if (!pricingSheet) {
        pricingSheet = clientSs.getSheetByName(pricingSheetName);
      }
      var currentLastCol = pricingSheet.getLastColumn();
      pricingSheet.getRange(1, currentLastCol + 1, 1, newProductsToAppend.length).setValues([newProductsToAppend]);
      _setCachedData(headersCacheKey, headers, 900);
    }
    
    // 3. Get client row index (cached for 15 minutes)
    var clientsCacheKey = "pricing_clients_" + clientType;
    var pricingClients = _getCachedData(clientsCacheKey);
    var lastRow = 0;
    
    if (!pricingClients) {
      if (!pricingSheet) {
        pricingSheet = clientSs.getSheetByName(pricingSheetName);
      }
      lastRow = pricingSheet.getLastRow();
      if (lastRow > 1) {
        pricingClients = pricingSheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) {
          return (r[0] || "").toString().trim();
        });
      } else {
        pricingClients = [];
      }
      _setCachedData(clientsCacheKey, pricingClients, 900);
    }
    
    // Auto-populate all active clients of this type to support editing directly in Google Sheets
    var activeClientsGrouped = getActiveClientsGrouped();
    var activeClientsOfType = (clientType === "OUTSTATION") ? activeClientsGrouped.OUTSTATION : activeClientsGrouped.LOCAL;
    var missingClients = [];
    
    for (var i = 0; i < activeClientsOfType.length; i++) {
      var ac = activeClientsOfType[i];
      if (pricingClients.indexOf(ac) === -1) {
        missingClients.push(ac);
      }
    }
    
    if (missingClients.length > 0) {
      if (!pricingSheet) {
        pricingSheet = clientSs.getSheetByName(pricingSheetName);
      }
      lastRow = pricingSheet.getLastRow();
      pricingSheet.getRange(lastRow + 1, 1, missingClients.length, 1).setValues(
        missingClients.map(function(c) { return [c]; })
      );
      
      pricingClients = pricingClients.concat(missingClients);
      _setCachedData(clientsCacheKey, pricingClients, 900);
    }
    
    var clientRowIdx = pricingClients.indexOf(clientName);
    if (clientRowIdx === -1) {
      if (!pricingSheet) {
        pricingSheet = clientSs.getSheetByName(pricingSheetName);
      }
      lastRow = pricingSheet.getLastRow();
      pricingSheet.getRange(lastRow + 1, 1).setValue(clientName);
      pricingClients.push(clientName);
      _setCachedData(clientsCacheKey, pricingClients, 900);
      clientRowIdx = pricingClients.length + 1;
    } else {
      clientRowIdx = clientRowIdx + 2;
    }
    
    // 4. Read prices for the client's row
    if (!pricingSheet) {
      pricingSheet = clientSs.getSheetByName(pricingSheetName);
    }
    var rowValues = pricingSheet.getRange(clientRowIdx, 1, 1, headers.length).getValues()[0];
    var productPricesList = [];
    
    for (var c = 1; c < headers.length; c++) {
      var pName = headers[c];
      if (!pName) continue;
      
      var priceVal = rowValues[c];
      var isActive = (activeProducts.indexOf(pName) !== -1);
      
      productPricesList.push({
        name: pName,
        price: (priceVal !== "" && priceVal !== null && !isNaN(priceVal)) ? parseFloat(priceVal) : null,
        isActive: isActive
      });
    }
    
    return {
      ok: true,
      products: productPricesList
    };
  } catch (e) {
    _logError("getProductPricingData", e, clientName + " (" + clientType + ")");
    return { ok: false, code: "SERVER_ERROR", message: e.toString() };
  }
}

// Save updated prices to the spreadsheet matrix in a single batch write call!
function saveProductPrices(clientType, clientName, prices) {
  try {
    var config = _getSetupConfig();
    var clientSs = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var pricingSheetName = (clientType === "OUTSTATION") ? "Outstation Product Prices" : "Local Product Prices";
    var pricingSheet = clientSs.getSheetByName(pricingSheetName);
    if (!pricingSheet) {
      return { ok: false, code: "PRICING_SHEET_NOT_FOUND" };
    }
    
    // Use cached headers
    var headersCacheKey = "pricing_headers_" + clientType;
    var headers = _getCachedData(headersCacheKey);
    var lastCol = pricingSheet.getLastColumn();
    if (!headers || headers.length !== lastCol) {
      headers = pricingSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
        return (h || "").toString().trim();
      });
      _setCachedData(headersCacheKey, headers, 900);
    }
    
    // Use cached clients
    var clientsCacheKey = "pricing_clients_" + clientType;
    var pricingClients = _getCachedData(clientsCacheKey);
    var lastRow = pricingSheet.getLastRow();
    if (!pricingClients || pricingClients.length !== lastRow - 1) {
      if (lastRow > 1) {
        pricingClients = pricingSheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) {
          return (r[0] || "").toString().trim();
        });
      } else {
        pricingClients = [];
      }
      _setCachedData(clientsCacheKey, pricingClients, 900);
    }
    
    var clientRowIdx = pricingClients.indexOf(clientName);
    if (clientRowIdx === -1) {
      pricingSheet.appendRow([clientName]);
      pricingClients.push(clientName);
      _setCachedData(clientsCacheKey, pricingClients, 900);
      clientRowIdx = pricingClients.length + 1;
    } else {
      clientRowIdx = clientRowIdx + 2;
    }
    
    // Read the current row of values
    var rowValues = pricingSheet.getRange(clientRowIdx, 1, 1, lastCol).getValues()[0];
    var newColsToAppend = [];
    var newColAdded = false;
    
    for (var prodName in prices) {
      if (!prices.hasOwnProperty(prodName)) continue;
      
      var priceVal = prices[prodName];
      var colIdx = headers.indexOf(prodName);
      if (colIdx === -1) {
        headers.push(prodName);
        newColsToAppend.push(prodName);
        colIdx = headers.length - 1;
        newColAdded = true;
      }
      
      var cellVal = priceVal === "" ? "" : parseFloat(priceVal);
      while (rowValues.length <= colIdx) {
        rowValues.push("");
      }
      rowValues[colIdx] = cellVal;
    }
    
    // Write new columns in batch if any
    if (newColsToAppend.length > 0) {
      pricingSheet.getRange(1, lastCol + 1, 1, newColsToAppend.length).setValues([newColsToAppend]);
      lastCol += newColsToAppend.length;
      _setCachedData(headersCacheKey, headers, 900);
    }
    
    // Write the entire updated row back in one batch call!
    pricingSheet.getRange(clientRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
    
    return { ok: true };
  } catch (e) {
    _logError("saveProductPrices", e, JSON.stringify({ clientType: clientType, clientName: clientName }));
    return { ok: false, code: "SERVER_ERROR", message: e.toString() };
  }
}

// ── Cache Service Helpers ───────────────────────────────────────────────────

function _getCachedData(key) {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    Logger.log("Cache read error for key " + key + ": " + e);
  }
  return null;
}

function _setCachedData(key, value, ttlSeconds) {
  try {
    var cache = CacheService.getScriptCache();
    var jsonStr = JSON.stringify(value);
    if (jsonStr.length < 100000) {
      cache.put(key, jsonStr, ttlSeconds || 600);
    }
  } catch (e) {
    Logger.log("Cache write error for key " + key + ": " + e);
  }
}

function _clearCacheKey(key) {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove(key);
  } catch (e) {
    Logger.log("Cache clear error for key " + key + ": " + e);
  }
}

// Re-sync and populate all active clients (Local/Outstation) directly into Column A of the pricing sheets
function populateAllClientsInPricingSheets() {
  try {
    var clients = getActiveClientsGrouped();
    var config = _getSetupConfig();
    var clientSs = SpreadsheetApp.openById(config.clientSpreadsheetId);
    
    // Sync LOCAL clients
    var localSheet = clientSs.getSheetByName("Local Product Prices");
    if (!localSheet) {
      localSheet = clientSs.insertSheet("Local Product Prices");
      localSheet.appendRow(["PARTY NAME"]);
    }
    var localLastRow = localSheet.getLastRow();
    var localExisting = [];
    if (localLastRow > 1) {
      localExisting = localSheet.getRange(2, 1, localLastRow - 1, 1).getValues().map(function(r) {
        return (r[0] || "").toString().trim();
      });
    }
    var localToAppend = [];
    for (var i = 0; i < clients.LOCAL.length; i++) {
      var c = clients.LOCAL[i];
      if (localExisting.indexOf(c) === -1) {
        localToAppend.push([c]);
      }
    }
    if (localToAppend.length > 0) {
      localSheet.getRange(localLastRow + 1, 1, localToAppend.length, 1).setValues(localToAppend);
      _clearCacheKey("pricing_clients_LOCAL");
    }
    
    // Sync OUTSTATION clients
    var outstationSheet = clientSs.getSheetByName("Outstation Product Prices");
    if (!outstationSheet) {
      outstationSheet = clientSs.insertSheet("Outstation Product Prices");
      outstationSheet.appendRow(["PARTY NAME"]);
    }
    var outLastRow = outstationSheet.getLastRow();
    var outExisting = [];
    if (outLastRow > 1) {
      outExisting = outstationSheet.getRange(2, 1, outLastRow - 1, 1).getValues().map(function(r) {
        return (r[0] || "").toString().trim();
      });
    }
    var outToAppend = [];
    for (var i = 0; i < clients.OUTSTATION.length; i++) {
      var c = clients.OUTSTATION[i];
      if (outExisting.indexOf(c) === -1) {
        outToAppend.push([c]);
      }
    }
    if (outToAppend.length > 0) {
      outstationSheet.getRange(outLastRow + 1, 1, outToAppend.length, 1).setValues(outToAppend);
      _clearCacheKey("pricing_clients_OUTSTATION");
    }
    
    _clearCacheKey("active_clients_grouped");
    SpreadsheetApp.getUi().alert("Successfully synchronized all active clients to the pricing sheets.\nLocal: " + clients.LOCAL.length + " clients\nOutstation: " + clients.OUTSTATION.length + " clients.");
  } catch (e) {
    _logError("populateAllClientsInPricingSheets", e, "");
    SpreadsheetApp.getUi().alert("Error synchronizing clients: " + e.toString());
  }
}
