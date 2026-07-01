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
    }
    return true;
  } catch (e) {
    _logError("syncClientToPricingSheet", e, partyName + " (" + localOrOutstation + ")");
    return false;
  }
}

// Fetch all active client names grouped by Local/Outstation type
function getActiveClientsGrouped() {
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
    
    var data = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, lastCol).getValues();
    var localClients = [];
    var outstationClients = [];
    
    for (var i = 0; i < data.length; i++) {
      var status = (data[i][statusIdx] || "").toString().trim().toUpperCase();
      var name = (data[i][nameIdx] || "").toString().trim();
      var type = (data[i][typeIdx] || "").toString().trim().toUpperCase();
      
      if (!name) continue;
      if (statusIdx !== -1 && status !== "ACTIVE") continue;
      
      if (type === "OUTSTATION") {
        outstationClients.push(name);
      } else {
        localClients.push(name);
      }
    }
    
    return {
      LOCAL: localClients.sort(),
      OUTSTATION: outstationClients.sort()
    };
  } catch (e) {
    _logError("getActiveClientsGrouped", e, "");
    return { LOCAL: [], OUTSTATION: [] };
  }
}

// Get active products list, resize matrix columns, verify client row, and fetch prices
function getProductPricingData(clientType, clientName) {
  try {
    var setupSs = _getSetupSpreadsheet();
    var prodSheetName = (clientType === "OUTSTATION") ? "productsOutstation" : "productsLocal";
    var prodSheet = setupSs.getSheetByName(prodSheetName);
    var activeProducts = [];
    
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
    
    var config = _getSetupConfig();
    var clientSs = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var pricingSheetName = (clientType === "OUTSTATION") ? "Outstation Product Prices" : "Local Product Prices";
    var pricingSheet = clientSs.getSheetByName(pricingSheetName);
    if (!pricingSheet) {
      pricingSheet = clientSs.insertSheet(pricingSheetName);
    }
    
    var lastRow = pricingSheet.getLastRow();
    var lastCol = pricingSheet.getLastColumn();
    var headers = [];
    
    if (lastRow === 0 || lastCol === 0) {
      headers = ["PARTY NAME"];
      pricingSheet.appendRow(headers);
      lastRow = 1;
      lastCol = 1;
    } else {
      headers = pricingSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
        return (h || "").toString().trim();
      });
    }
    
    // Add missing product columns at the end
    var newProductsAdded = false;
    for (var i = 0; i < activeProducts.length; i++) {
      var prod = activeProducts[i];
      if (headers.indexOf(prod) === -1) {
        pricingSheet.getRange(1, lastCol + 1).setValue(prod);
        headers.push(prod);
        lastCol++;
        newProductsAdded = true;
      }
    }
    
    if (newProductsAdded) {
      headers = pricingSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
        return (h || "").toString().trim();
      });
    }
    
    // Find or create client row
    var clientRowIdx = -1;
    if (lastRow > 1) {
      var clientNames = pricingSheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) {
        return (r[0] || "").toString().trim();
      });
      clientRowIdx = clientNames.indexOf(clientName);
    }
    
    if (clientRowIdx === -1) {
      pricingSheet.appendRow([clientName]);
      lastRow++;
      clientRowIdx = lastRow;
    } else {
      clientRowIdx = clientRowIdx + 2;
    }
    
    // Read prices
    var rowValues = pricingSheet.getRange(clientRowIdx, 1, 1, lastCol).getValues()[0];
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

// Save updated prices to the spreadsheet matrix
function saveProductPrices(clientType, clientName, prices) {
  try {
    var config = _getSetupConfig();
    var clientSs = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var pricingSheetName = (clientType === "OUTSTATION") ? "Outstation Product Prices" : "Local Product Prices";
    var pricingSheet = clientSs.getSheetByName(pricingSheetName);
    if (!pricingSheet) {
      return { ok: false, code: "PRICING_SHEET_NOT_FOUND" };
    }
    
    var lastRow = pricingSheet.getLastRow();
    var lastCol = pricingSheet.getLastColumn();
    if (lastRow === 0 || lastCol === 0) {
      return { ok: false, code: "PRICING_SHEET_EMPTY" };
    }
    
    var headers = pricingSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return (h || "").toString().trim();
    });
    
    var clientNames = pricingSheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) {
      return (r[0] || "").toString().trim();
    });
    var clientRowIdx = clientNames.indexOf(clientName);
    if (clientRowIdx === -1) {
      pricingSheet.appendRow([clientName]);
      lastRow++;
      clientRowIdx = lastRow;
    } else {
      clientRowIdx = clientRowIdx + 2;
    }
    
    for (var prodName in prices) {
      if (!prices.hasOwnProperty(prodName)) continue;
      
      var priceVal = prices[prodName];
      var colIdx = headers.indexOf(prodName);
      if (colIdx === -1) {
        pricingSheet.getRange(1, lastCol + 1).setValue(prodName);
        headers.push(prodName);
        lastCol++;
        colIdx = lastCol - 1;
      }
      
      pricingSheet.getRange(clientRowIdx, colIdx + 1).setValue(priceVal === "" ? "" : parseFloat(priceVal));
    }
    
    return { ok: true };
  } catch (e) {
    _logError("saveProductPrices", e, JSON.stringify({ clientType: clientType, clientName: clientName }));
    return { ok: false, code: "SERVER_ERROR", message: e.toString() };
  }
}
