// Actions.js
// Client data retrieval & insertion logic

// Fetch Client Names Grouped by Sales POC
// Fetch Client Names Grouped by Sales POC (Optimized and Cached)
function getClientList() {
  var cacheKey = "client_list_poc";
  try {
    var cached = _getCachedData(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    Logger.log("Cache get error for client list: " + err);
  }

  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var sheet = ss.getSheetByName(config.clientSheetName);
    if (!sheet) {
      return { ok: false, code: "SHEET_NOT_FOUND" };
    }
    
    var headerRow = _getHeaderRowIndex(sheet); // Dynamically detect header row (Row 1 or Row 2)
    var lastRow = sheet.getLastRow();
    if (lastRow <= headerRow) {
      return {};
    }
    
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
    var partyNameIdx = _findHeaderIndex(headers, "PARTY NAME");
    var salesPocIdx = _findHeaderIndex(headers, "SALES POC");
    
    if (partyNameIdx === -1) {
      return {};
    }
    
    var nameValues = sheet.getRange(headerRow + 1, partyNameIdx + 1, lastRow - headerRow, 1).getValues();
    var salesPocValues = salesPocIdx !== -1 
      ? sheet.getRange(headerRow + 1, salesPocIdx + 1, lastRow - headerRow, 1).getValues()
      : null;
    
    var clientsByPoc = {};
    clientsByPoc["All"] = [];

    for (var i = 0; i < nameValues.length; i++) {
      var partyName = (nameValues[i][0] || "").toString().trim();
      var salesPoc = salesPocValues ? (salesPocValues[i][0] || "").toString().trim() : "";
      
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
    
    // Cache for 30 minutes
    _setCachedData(cacheKey, clientsByPoc, 1800);
    return clientsByPoc;
  } catch (e) {
    _logError("getClientList", e, "");
    return {};
  }
}

// Add Client dynamically matching spreadsheet column headers
function createClient(data) {
  var config = _getSetupConfig();
  var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
  var sheet = ss.getSheetByName(config.clientSheetName);
  if (!sheet) {
    return { ok: false, code: "SHEET_NOT_FOUND" };
  }
  
  var headerRow = _getHeaderRowIndex(sheet); // Dynamically detect header row (Row 1 or Row 2)
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
  var maxCols = Math.max(headers.length, 36);
  for (var c = 0; c < maxCols; c++) {
    var header = c < headers.length ? (headers[c] || "").toString().trim().toUpperCase() : "";
    var val = "";
    
    if (_isFormulaHeader(header)) {
      val = "";
    } else {
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
        case "CITY":
          val = "";
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
        case "LOCAL / OUTSTATION":
        case "LOCAL/OUTSTATION":
          val = "";
          break;
        default:
          if (c === 35) { // 36th column (AJ) is index 35
            val = "";
          } else {
            val = "";
          }
      }
    }
    newRow.push(val);
  }

  sheet.appendRow(newRow);
  var appendedRowIndex = sheet.getLastRow();
  
  // Clear formula cells to let ARRAYFORMULAs run
  try {
    _clearFormulaCells(sheet, appendedRowIndex, headers);
  } catch (clearErr) {
    _logError("createClientClearFormula", clearErr, data.partyName);
  }
  
  // If a new area and city are provided, ensure they are registered in the Data Sheet
  if (data.area && data.city) {
    addNewAreaToDataSheet(data.area, data.city);
  }
  
  // Dynamically sync client name to the correct pricing matrix sheet on creation
  var clientType = "LOCAL";
  try {
    var rawCity = (data.city || "").toString().trim().toUpperCase();
    if (rawCity) {
      clientType = (rawCity === "MUMBAI") ? "LOCAL" : "OUTSTATION";
    } else {
      clientType = _getClientTypeFromArea(data.area);
    }
    syncClientToPricingSheet(data.partyName, clientType);
  } catch (syncErr) {
    _logError("createClientSync", syncErr, data.partyName);
  }
  
  // Clear cached client list and row data
  try {
    _clearCacheKey("active_clients_grouped");
    _clearCacheKey("client_list_poc");
    _clearCacheKey("pricing_clients_LOCAL");
    _clearCacheKey("pricing_clients_OUTSTATION");
    _clearCacheKey("all_pricing_data_v3_LOCAL");
    _clearCacheKey("all_pricing_data_v3_OUTSTATION");
    _clearCacheKey("client_details_" + data.partyName.trim().toUpperCase());
  } catch (cacheErr) {
    Logger.log("Cache bust error: " + cacheErr);
  }
  
  return { ok: true, clientId: newClientId, clientType: clientType };
}

// Fetch Unique Areas from the Client List sheet
function getAreasList() {
  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var sheet = ss.getSheetByName(config.clientSheetName);
    if (!sheet) return [];
    
    var headerRow = _getHeaderRowIndex(sheet); // Dynamically detect header row (Row 1 or Row 2)
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

// Fetch Unique Client Categories from Data Sheet (Column I or header matching CLIENT CATEGORY)
function getClientCategoriesList() {
  var cacheKey = "client_categories_list";
  var cached = _getCachedData(cacheKey);
  if (cached) return cached;

  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var dataSheet = ss.getSheetByName("Data Sheet");
    if (!dataSheet) return [];
    
    var lastRow = dataSheet.getLastRow();
    if (lastRow <= 1) return [];
    
    var lastCol = dataSheet.getLastColumn();
    var headers = dataSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    var categoryColIndex = -1;
    for (var j = 0; j < headers.length; j++) {
      var headerText = (headers[j] || "").toString().trim().toUpperCase();
      if (headerText === "CLIENT CATEGORY") {
        categoryColIndex = j;
        break;
      }
    }
    
    if (categoryColIndex === -1) {
      categoryColIndex = 8; // Column I is index 8
    }
    
    var data = dataSheet.getRange(2, categoryColIndex + 1, lastRow - 1, 1).getValues();
    var uniqueMap = {};
    var categoriesList = [];
    
    for (var i = 0; i < data.length; i++) {
      var cat = (data[i][0] || "").toString().trim();
      if (cat && !uniqueMap[cat]) {
        uniqueMap[cat] = true;
        categoriesList.push(cat);
      }
    }
    
    _setCachedData(cacheKey, categoriesList, 600);
    return categoriesList;
  } catch (e) {
  }
}

// Fetch details of a specific client from the sheet
function getClientDetails(partyName) {
  var cacheKey = "client_details_" + partyName.trim().toUpperCase();
  try {
    var cached = _getCachedData(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    Logger.log("Cache get error for client details: " + err);
  }

  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var sheet = ss.getSheetByName(config.clientSheetName);
    if (!sheet) return { ok: false, message: "Sheet not found" };

    var headerRow = _getHeaderRowIndex(sheet);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
    
    var partyNameIdx = _findHeaderIndex(headers, "PARTY NAME");
    if (partyNameIdx === -1) return { ok: false, message: "PARTY NAME column not found" };

    var nameValues = sheet.getRange(headerRow + 1, partyNameIdx + 1, lastRow - headerRow, 1).getValues();
    var targetRowIndex = -1;
    for (var i = 0; i < nameValues.length; i++) {
      if (nameValues[i][0] && nameValues[i][0].toString().trim().toUpperCase() === partyName.trim().toUpperCase()) {
        targetRowIndex = headerRow + 1 + i;
        break;
      }
    }

    if (targetRowIndex === -1) return { ok: false, message: "Client not found: " + partyName };

    var rowValues = sheet.getRange(targetRowIndex, 1, 1, lastCol).getValues()[0];
    
    // Map the row back to the JSON structure expected by the form
    var clientData = {
      clientCategory: "",
      partyName: "",
      salesPoc: "",
      hasMsme: "No",
      msmeNumber: "",
      contactPersonPurchase: "",
      contactNumberPurchase: "",
      emailIdPurchase: "",
      contactPersonAccounts: "",
      mobileNumberAccounts: "",
      emailIdAccounts: "",
      contactPerson3: "",
      contactNumber3: "",
      emailId3: "",
      area: "",
      city: "",
      customerType: "HORECA",
      class: "PB",
      localOrOutstation: "LOCAL",
      billingAddress: "",
      gstNo: "",
      googleLocationLinks: "",
      shippingAddressSame: false,
      shippingAddress: "",
      pinCode: "",
      panNumber: "",
      salesPocContactNo: "",
      creditType: "ADVANCE",
      crmPoc: "P1",
      secondaryUpperLimitInDays: "",
      fssaiNumber: "",
      freightToBeAdded: "No"
    };

    for (var j = 0; j < headers.length; j++) {
      var header = (headers[j] || "").toString().trim().toUpperCase();
      var val = rowValues[j] !== undefined && rowValues[j] !== null ? rowValues[j].toString().trim() : "";
      
      switch (header) {
        case "CLIENT CATEGORY":
          clientData.clientCategory = val;
          break;
        case "PARTY NAME":
          clientData.partyName = val;
          break;
        case "SALES POC":
          clientData.salesPoc = val;
          break;
        case "MSME NUMBER":
          clientData.msmeNumber = val;
          clientData.hasMsme = val ? "Yes" : "No";
          break;
        case "CONTACT PERSON (PURCHASE)":
          clientData.contactPersonPurchase = val;
          break;
        case "CONTACT NUMBER (PURCHASE)":
          clientData.contactNumberPurchase = val;
          break;
        case "EMAIL ID (PURCHASE)":
          clientData.emailIdPurchase = val;
          break;
        case "CONTACT PERSON (ACCOUNTS)":
          clientData.contactPersonAccounts = val;
          break;
        case "MOBILE NUMBER (ACCOUNTS)":
          clientData.mobileNumberAccounts = val;
          break;
        case "EMAIL ID (ACCOUNTS)":
          clientData.emailIdAccounts = val;
          break;
        case "CONTACT PERSON 3":
          clientData.contactPerson3 = val;
          break;
        case "CONTACT NUMBER":
          clientData.contactNumber3 = val;
          break;
        case "EMAIL ID 3":
          clientData.emailId3 = val;
          break;
        case "AREA":
          clientData.area = val;
          break;
        case "CITY":
          clientData.city = val;
          break;
        case "CUSTOMER TYPE (HORECA/RETAIL)":
          clientData.customerType = val || "HORECA";
          break;
        case "CLASS":
          clientData.class = val || "PB";
          break;
        case "BILLING ADDRESS":
          clientData.billingAddress = val;
          break;
        case "GST NO":
          clientData.gstNo = val;
          break;
        case "GOOGLE LOCATION LINKS":
          clientData.googleLocationLinks = val;
          break;
        case "SHIPPING ADDRESS":
          clientData.shippingAddress = val;
          break;
        case "PIN CODE":
          clientData.pinCode = val;
          break;
        case "PAN NUMBER":
          clientData.panNumber = val;
          break;
        case "SALES POC CONTACT NO":
          clientData.salesPocContactNo = val;
          break;
        case "CREDIT TYPE":
          clientData.creditType = val || "ADVANCE";
          break;
        case "CRM POC":
          clientData.crmPoc = val || "P1";
          break;
        case "SECONDARY UPPER LIMIT (IN DAYS)":
          clientData.secondaryUpperLimitInDays = val;
          break;
        case "FSSAI NUMBER":
          clientData.fssaiNumber = val;
          break;
        case "FREIGHT TO BE ADDED? Y/N":
          clientData.freightToBeAdded = (val === "Y" || val === "Yes") ? "Yes" : "No";
          break;
        case "LOCAL / OUTSTATION":
        case "LOCAL/OUTSTATION":
          clientData.localOrOutstation = val || "LOCAL";
          break;
      }
    }

    // Determine city:
    // If city is not directly in the client list, try to lookup city based on area using the Data Sheet (cached)
    if (!clientData.city && clientData.area) {
      try {
        var map = _getAreaCityMap();
        var searchArea = clientData.area.toUpperCase().trim();
        if (map[searchArea]) {
          clientData.city = map[searchArea];
        }
      } catch (cityErr) {
        Logger.log("City lookup error for " + clientData.area + ": " + cityErr);
      }
    }

    if (clientData.billingAddress === clientData.shippingAddress) {
      clientData.shippingAddressSame = true;
    }

    var resObj = { ok: true, data: clientData };
    try {
      _setCachedData(cacheKey, resObj, 1800); // Cache for 30 minutes
    } catch (cacheErr) {
      Logger.log("Cache set error for client details: " + cacheErr);
    }
    return resObj;
  } catch (e) {
    _logError("getClientDetails", e, partyName);
    return { ok: false, message: e.toString() };
  }
}

// Update existing client details in place
function updateClient(originalPartyName, data) {
  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var sheet = ss.getSheetByName(config.clientSheetName);
    if (!sheet) return { ok: false, message: "Sheet not found" };

    var headerRow = _getHeaderRowIndex(sheet);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
    
    var partyNameIdx = _findHeaderIndex(headers, "PARTY NAME");
    if (partyNameIdx === -1) return { ok: false, message: "PARTY NAME column not found" };

    var nameValues = sheet.getRange(headerRow + 1, partyNameIdx + 1, lastRow - headerRow, 1).getValues();
    var targetRowIndex = -1;
    for (var i = 0; i < nameValues.length; i++) {
      if (nameValues[i][0] && nameValues[i][0].toString().trim().toUpperCase() === originalPartyName.trim().toUpperCase()) {
        targetRowIndex = headerRow + 1 + i;
        break;
      }
    }

    if (targetRowIndex === -1) return { ok: false, message: "Client not found: " + originalPartyName };

    var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
    var updatedRow = [];
    var maxCols = Math.max(headers.length, 36);
    var existingRowValues = sheet.getRange(targetRowIndex, 1, 1, maxCols).getValues()[0];

    for (var c = 0; c < maxCols; c++) {
      var header = c < headers.length ? (headers[c] || "").toString().trim().toUpperCase() : "";
      var val = "";
      
      if (_isFormulaHeader(header)) {
        val = "";
      } else {
        switch (header) {
          case "CLIENT STATUS":
            val = existingRowValues[c] || "Active";
            break;
          case "CLIENT ID":
            val = existingRowValues[c] || "";
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
          case "CITY":
            val = "";
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
            var existingDate = existingRowValues[c];
            val = (existingDate !== "" && existingDate !== null && existingDate !== undefined) ? existingDate : dateStr;
            break;
          case "FSSAI NUMBER":
            val = data.fssaiNumber || "";
            break;
          case "FREIGHT TO BE ADDED? Y/N":
            val = (data.freightToBeAdded === "Yes" || data.freightToBeAdded === "Y") ? "Y" : "N";
            break;
          case "LOCAL / OUTSTATION":
          case "LOCAL/OUTSTATION":
            val = "";
            break;
          default:
            if (c === 35) { // 36th column (AJ) is index 35
              val = "";
            } else {
              val = existingRowValues[c] || "";
            }
        }
      }
      updatedRow.push(val);
    }

    sheet.getRange(targetRowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    try {
      _logError("DEBUG_updateClient", "targetRowIndex=" + targetRowIndex + ", originalPartyName=" + originalPartyName + ", newPartyName=" + data.partyName + ", updatedRowPartyName=" + updatedRow[partyNameIdx], "HeaderLength=" + headers.length + ", RowLength=" + updatedRow.length);
    } catch (logErr) {
      Logger.log("Debug log error: " + logErr);
    }
    
    // Clear formula cells to let ARRAYFORMULAs run
    try {
      _clearFormulaCells(sheet, targetRowIndex, headers);
    } catch (clearErr) {
      _logError("updateClientClearFormula", clearErr, data.partyName);
    }

    if (data.area && data.city) {
      addNewAreaToDataSheet(data.area, data.city);
    }

    var clientType = "LOCAL";
    try {
      var rawCity = (data.city || "").toString().trim().toUpperCase();
      if (rawCity) {
        clientType = (rawCity === "MUMBAI") ? "LOCAL" : "OUTSTATION";
      } else {
        clientType = _getClientTypeFromArea(data.area);
      }
      if (originalPartyName && data.partyName && originalPartyName.trim().toUpperCase() !== data.partyName.trim().toUpperCase()) {
        try {
          _renameClientInPricingSheets(originalPartyName, data.partyName);
        } catch (renameErr) {
          _logError("updateClientRenamePricing", renameErr, originalPartyName + " -> " + data.partyName);
        }
      }
      syncClientToPricingSheet(data.partyName, clientType);
    } catch (syncErr) {
      _logError("updateClientSync", syncErr, data.partyName);
    }

    try {
      _clearCacheKey("active_clients_grouped");
      _clearCacheKey("client_list_poc");
      _clearCacheKey("pricing_clients_LOCAL");
      _clearCacheKey("pricing_clients_OUTSTATION");
      _clearCacheKey("all_pricing_data_v3_LOCAL");
      _clearCacheKey("all_pricing_data_v3_OUTSTATION");
      _clearCacheKey("client_details_" + originalPartyName.trim().toUpperCase());
      _clearCacheKey("client_details_" + data.partyName.trim().toUpperCase());
    } catch (cacheErr) {
      Logger.log("Cache bust error: " + cacheErr);
    }

    return { ok: true, clientType: clientType };
  } catch (e) {
    _logError("updateClient", e, originalPartyName);
    return { ok: false, message: e.toString() };
  }
}

// Automatically deduce client category (LOCAL/OUTSTATION) from their Area using Data Sheet (cached)
function _getClientTypeFromArea(areaName) {
  try {
    var map = _getAreaCityMap();
    var searchArea = (areaName || "").toString().trim().toUpperCase();
    var city = map[searchArea];
    if (city) {
      return (city.toUpperCase().trim() === "MUMBAI") ? "LOCAL" : "OUTSTATION";
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
    var clientSs = SpreadsheetApp.openById(config.productPriceSpreadsheetId);
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

// Renames a client row header in both Local and Outstation pricing sheets if the client's Party Name was edited
function _renameClientInPricingSheets(oldName, newName) {
  try {
    var config = _getSetupConfig();
    var clientSs = SpreadsheetApp.openById(config.productPriceSpreadsheetId);
    var sheets = ["Local Product Prices", "Outstation Product Prices"];
    
    for (var s = 0; s < sheets.length; s++) {
      var sheet = clientSs.getSheetByName(sheets[s]);
      if (sheet) {
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          var namesRange = sheet.getRange(2, 1, lastRow - 1, 1);
          var names = namesRange.getValues();
          var updated = false;
          for (var i = 0; i < names.length; i++) {
            if (names[i][0] && names[i][0].toString().trim().toUpperCase() === oldName.trim().toUpperCase()) {
              sheet.getRange(i + 2, 1).setValue(newName);
              updated = true;
            }
          }
          if (updated) {
            _clearCacheKey("pricing_clients_LOCAL");
            _clearCacheKey("pricing_clients_OUTSTATION");
            _clearCacheKey("all_pricing_data_v3_LOCAL");
            _clearCacheKey("all_pricing_data_v3_OUTSTATION");
          }
        }
      }
    }
  } catch (err) {
    _logError("renameClientInPricingSheets", err, oldName + " -> " + newName);
  }
}

// Fetch all active client names grouped by Local/Outstation type
// Fetch all active client names grouped by Local/Outstation type from pricing sheets
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
    var clientSs = SpreadsheetApp.openById(config.productPriceSpreadsheetId);
    
    var localClients = [];
    var localSheet = clientSs.getSheetByName("Local Product Prices");
    if (localSheet) {
      var localLastRow = localSheet.getLastRow();
      if (localLastRow > 1) {
        localClients = localSheet.getRange(2, 1, localLastRow - 1, 1).getValues().map(function(r) {
          return (r[0] || "").toString().trim();
        }).filter(function(name) {
          return name !== "";
        });
      }
    }
    
    var outstationClients = [];
    var outstationSheet = clientSs.getSheetByName("Outstation Product Prices");
    if (outstationSheet) {
      var outLastRow = outstationSheet.getLastRow();
      if (outLastRow > 1) {
        outstationClients = outstationSheet.getRange(2, 1, outLastRow - 1, 1).getValues().map(function(r) {
          return (r[0] || "").toString().trim();
        }).filter(function(name) {
          return name !== "";
        });
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
  clientType = (clientType || "").toString().trim().toUpperCase();
  try {
    // 1. Get active products (cached for 15 minutes)
    var prodCacheKey = "active_products_v4_" + clientType;
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
    var clientSs = SpreadsheetApp.openById(config.productPriceSpreadsheetId);
    var pricingSheetName = (clientType === "OUTSTATION") ? "Outstation Product Prices" : "Local Product Prices";
    var pricingSheet = clientSs.getSheetByName(pricingSheetName);
    if (!pricingSheet) {
      pricingSheet = clientSs.insertSheet(pricingSheetName);
    }
    
    // Sync product columns dynamically
    _syncProductColumns(pricingSheet, clientType);
    
    // Read the headers (cached or direct)
    var headersCacheKey = "pricing_headers_" + clientType;
    var headers = _getCachedData(headersCacheKey);
    if (!headers) {
      var lastCol = pricingSheet.getLastColumn();
      headers = pricingSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
        return (h || "").toString().trim();
      });
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
  clientType = (clientType || "").toString().trim().toUpperCase();
  try {
    var config = _getSetupConfig();
    var clientSs = SpreadsheetApp.openById(config.productPriceSpreadsheetId);
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
    var targetRowIdx = -1;
    var existingRowValues = [];
    
    if (clientRowIdx === -1) {
      pricingSheet.appendRow([clientName]);
      pricingClients.push(clientName);
      _setCachedData(clientsCacheKey, pricingClients, 900);
      targetRowIdx = pricingClients.length + 1;
    } else {
      targetRowIdx = clientRowIdx + 2;
      // Read existing row values to preserve unsubmitted prices
      try {
        existingRowValues = pricingSheet.getRange(targetRowIdx, 1, 1, headers.length).getValues()[0];
      } catch (readErr) {
        Logger.log("Failed to read existing prices row: " + readErr);
      }
    }
    
    // Construct the row values array directly from request payload (merging with existing)
    var rowValues = [];
    rowValues.push(clientName);
    
    var newColsToAppend = [];
    
    // Check if there are any new products not in headers yet
    for (var prodName in prices) {
      if (!prices.hasOwnProperty(prodName)) continue;
      if (headers.indexOf(prodName) === -1) {
        headers.push(prodName);
        newColsToAppend.push(prodName);
      }
    }
    
    // Build row values matching headers columns
    for (var c = 1; c < headers.length; c++) {
      var prodName = headers[c];
      var priceVal = prices[prodName];
      
      var cellVal;
      if (priceVal !== undefined) {
        cellVal = (priceVal === "" || priceVal === null) ? "" : parseFloat(priceVal);
      } else {
        // Preserve existing price if not submitted in this request
        var existingVal = existingRowValues[c];
        cellVal = (existingVal !== undefined && existingVal !== null && existingVal !== "") ? existingVal : "";
      }
      rowValues.push(cellVal);
    }
    
    // Write new columns in batch if any
    if (newColsToAppend.length > 0) {
      pricingSheet.getRange(1, lastCol + 1, 1, newColsToAppend.length).setValues([newColsToAppend]);
      lastCol += newColsToAppend.length;
      _setCachedData(headersCacheKey, headers, 900);
    }
    
    // Write the entire updated row back in one batch call!
    pricingSheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
    
    // Clear all pricing cache for this category to reload updated prices
    _clearCacheKey("all_pricing_data_v3_" + clientType);
    
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
  // Automatically optimize sheet sizes to free up cell count before syncing
  optimizeAllSheets();

  try {
    var clients = _getSourceActiveClientsGrouped();
    var config = _getSetupConfig();
    var clientSs = SpreadsheetApp.openById(config.productPriceSpreadsheetId);
    
    // Sync LOCAL clients
    var localSheet = clientSs.getSheetByName("Local Product Prices");
    if (!localSheet) {
      localSheet = clientSs.insertSheet("Local Product Prices");
      localSheet.appendRow(["PARTY NAME"]);
    }
    _syncProductColumns(localSheet, "LOCAL");
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
    _syncProductColumns(outstationSheet, "OUTSTATION");
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
    _clearCacheKey("all_pricing_data_v3_LOCAL");
    _clearCacheKey("all_pricing_data_v3_OUTSTATION");
    _clearCacheKey("active_products_v4_LOCAL");
    _clearCacheKey("active_products_v4_OUTSTATION");
    try {
      SpreadsheetApp.getUi().alert("Successfully synchronized all active clients to the pricing sheets.\nLocal: " + clients.LOCAL.length + " clients\nOutstation: " + clients.OUTSTATION.length + " clients.");
    } catch (uiErr) {
      Logger.log("UI alert not available: " + uiErr);
    }
  } catch (e) {
    _logError("populateAllClientsInPricingSheets", e, "");
    try {
      SpreadsheetApp.getUi().alert("Error synchronizing clients: " + e.toString());
    } catch (uiErr) {
      Logger.log("UI alert not available: " + uiErr);
    }
  }
}

// Remove empty rows and columns from pricing and data sheets in both Client and Pricing Spreadsheets
function optimizeAllSheets() {
  var log = "Optimization Log:\n";
  var totalCellsSaved = 0;
  
  try {
    var config = _getSetupConfig();
    var ssIds = [config.clientSpreadsheetId];
    if (config.productPriceSpreadsheetId && config.productPriceSpreadsheetId !== config.clientSpreadsheetId) {
      ssIds.push(config.productPriceSpreadsheetId);
    }
    
    for (var sIdx = 0; sIdx < ssIds.length; sIdx++) {
      try {
        var clientSs = SpreadsheetApp.openById(ssIds[sIdx]);
        log += "\nSpreadsheet: " + clientSs.getName() + " (" + ssIds[sIdx] + ")\n";
        var sheets = clientSs.getSheets();
        
        for (var i = 0; i < sheets.length; i++) {
          var sheet = sheets[i];
          var name = sheet.getName();
          
          // Get dimensions
          var maxRows = sheet.getMaxRows();
          var lastRow = sheet.getLastRow();
          var maxCols = sheet.getMaxColumns();
          var lastCol = sheet.getLastColumn();
          
          var initialCells = maxRows * maxCols;
          
          // Delete unused rows (keep 20 padding rows, minimum 100)
          var targetRows = Math.max(100, lastRow + 20);
          if (maxRows > targetRows) {
            sheet.deleteRows(targetRows + 1, maxRows - targetRows);
          }
          
          // Delete unused columns (keep 5 padding columns, minimum 26)
          var targetCols = Math.max(26, lastCol + 5);
          if (maxCols > targetCols) {
            sheet.deleteColumns(targetCols + 1, maxCols - targetCols);
          }
          
          var newMaxRows = sheet.getMaxRows();
          var newMaxCols = sheet.getMaxColumns();
          var finalCells = newMaxRows * newMaxCols;
          var cellsSaved = initialCells - finalCells;
          totalCellsSaved += cellsSaved;
          
          log += "- " + name + ": Shrunk from " + maxRows + "x" + maxCols + " to " + newMaxRows + "x" + newMaxCols + ". Saved: " + cellsSaved + "\n";
        }
      } catch (ssErr) {
        log += "Error optimizing spreadsheet " + ssIds[sIdx] + ": " + ssErr.toString() + "\n";
      }
    }
    
    log += "\nTotal Cells Saved: " + totalCellsSaved;
    Logger.log(log);
    
    try {
      SpreadsheetApp.getUi().alert("Sheet Optimization Completed!\n\n" + log);
    } catch (uiErr) {
      Logger.log("UI alert not available: " + uiErr);
    }
    
    return { ok: true, log: log };
  } catch (e) {
    _logError("optimizeAllSheets", e, "");
    try {
      SpreadsheetApp.getUi().alert("Error during optimization: " + e.toString());
    } catch (uiErr) {}
    return { ok: false, message: e.toString() };
  }
}

// Fetch all active client names grouped by Local/Outstation from the master Client List sheet
function _getSourceActiveClientsGrouped() {
  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var sheet = ss.getSheetByName(config.clientSheetName);
    if (!sheet) return { LOCAL: [], OUTSTATION: [] };
    
    var headerRow = _getHeaderRowIndex(sheet);
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
    
    return {
      LOCAL: localClients.sort(),
      OUTSTATION: outstationClients.sort()
    };
  } catch (e) {
    _logError("_getSourceActiveClientsGrouped", e, "");
    return { LOCAL: [], OUTSTATION: [] };
  }
}

// Fetch all product price matrix data for a specific category (Local/Outstation) at once
function getAllPricingData(clientType) {
  clientType = (clientType || "").toString().trim().toUpperCase();
  var cacheKey = "all_pricing_data_v3_" + clientType;
  try {
    var cached = _getCachedData(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    Logger.log("Cache get error for all pricing: " + err);
  }

  try {
    var config = _getSetupConfig();
    var clientSs = SpreadsheetApp.openById(config.productPriceSpreadsheetId);
    var pricingSheetName = (clientType === "OUTSTATION") ? "Outstation Product Prices" : "Local Product Prices";
    var pricingSheet = clientSs.getSheetByName(pricingSheetName);
    if (!pricingSheet) {
      pricingSheet = clientSs.insertSheet(pricingSheetName);
    }
    
    // Sync product columns before loading grid
    _syncProductColumns(pricingSheet, clientType);
    
    var lastRow = pricingSheet.getLastRow();
    var lastCol = pricingSheet.getLastColumn();
    if (lastRow <= 1 || lastCol <= 1) {
      return { ok: true, products: [], clients: [], priceMap: {}, categories: {}, minPrices: {} };
    }
    
    var gridValues = pricingSheet.getRange(1, 1, lastRow, lastCol).getValues();
    
    var headers = gridValues[0].map(function(h) {
      return (h || "").toString().trim();
    });
    
    var products = [];
    for (var c = 1; c < headers.length; c++) {
      if (headers[c]) {
        products.push(headers[c]);
      }
    }
    
    var clients = [];
    var priceMap = {};
    
    for (var r = 1; r < gridValues.length; r++) {
      var clientName = (gridValues[r][0] || "").toString().trim();
      if (!clientName) continue;
      
      clients.push(clientName);
      priceMap[clientName] = {};
      
      for (var c = 1; c < headers.length; c++) {
        var prodName = headers[c];
        if (!prodName) continue;
        
        var val = gridValues[r][c];
        var parsedPrice = (val !== "" && val !== null && !isNaN(val)) ? parseFloat(val) : null;
        if (parsedPrice !== null) {
          priceMap[clientName][prodName] = parsedPrice;
        }
      }
    }

    // Fetch product category (Col E / index 4) and min price (Col S / index 18) mapping from setup sheet
    var categoriesMap = {};
    var minPricesMap = {};
    try {
      var setupSs = _getSetupSpreadsheet();
      var prodSheetName = (clientType === "OUTSTATION") ? "productsOutstation" : "productsLocal";
      var prodSheet = setupSs.getSheetByName(prodSheetName);
      if (prodSheet) {
        var prodLastRow = prodSheet.getLastRow();
        var prodLastCol = prodSheet.getLastColumn();
        if (prodLastRow > 0 && prodLastCol >= 1) {
          var numCols = Math.min(prodLastCol, 19);
          var prodValues = prodSheet.getRange(1, 1, prodLastRow, numCols).getValues();
          for (var i = 0; i < prodValues.length; i++) {
            var pName = (prodValues[i][0] || "").toString().trim();
            var pCat = (numCols >= 5) ? (prodValues[i][4] || "").toString().trim() : "";
            var minPriceVal = (numCols >= 19) ? prodValues[i][18] : "";
            var minPriceParsed = (minPriceVal !== "" && minPriceVal !== null && !isNaN(minPriceVal)) ? parseFloat(minPriceVal) : null;
            
            if (pName && pName.toLowerCase() !== "product name" && pName.toLowerCase() !== "products") {
              categoriesMap[pName] = pCat || "Uncategorized";
              if (minPriceParsed !== null) {
                minPricesMap[pName] = minPriceParsed;
              }
            }
          }
        }
      }
    } catch (eCat) {
      Logger.log("Error loading product categories & min prices: " + eCat);
    }
    
    var result = {
      ok: true,
      products: products,
      clients: clients.sort(),
      priceMap: priceMap,
      categories: categoriesMap,
      minPrices: minPricesMap
    };
    
    _setCachedData(cacheKey, result, 300); // Cache for 5 minutes (fast reload of manual sheet edits)
    return result;
  } catch (e) {
    _logError("getAllPricingData", e, clientType);
    return { ok: false, message: e.toString() };
  }
}

// Fetch Unique Cities from the Data Sheet (with caching)
function getCitiesList() {
  var cacheKey = "cities_list";
  try {
    var cached = _getCachedData(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    Logger.log("Cache get error for cities list: " + err);
  }

  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var sheet = ss.getSheetByName("Data Sheet");
    if (!sheet) return [];
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    var data = sheet.getRange(2, 5, lastRow - 1, 1).getValues(); // Column E is City
    var uniqueCities = {};
    for (var i = 0; i < data.length; i++) {
      var city = (data[i][0] || "").toString().trim().toUpperCase();
      if (city) {
        uniqueCities[city] = true;
      }
    }
    var cities = Object.keys(uniqueCities).sort();
    
    try {
      _setCachedData(cacheKey, cities, 1800); // Cache for 30 minutes
    } catch (cacheErr) {
      Logger.log("Cache set error for cities list: " + cacheErr);
    }
    
    return cities;
  } catch (e) {
    _logError("getCitiesList", e, "");
    return [];
  }
}

// Add a new Area and City row to the Data Sheet
function addNewAreaToDataSheet(areaName, cityName) {
  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var sheet = ss.getSheetByName("Data Sheet");
    if (!sheet) return false;
    
    // Check if this Area already exists to avoid duplicates
    var lastRow = sheet.getLastRow();
    var data = [];
    if (lastRow > 1) {
      data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    }
    var searchArea = (areaName || "").toString().trim().toUpperCase();
    for (var i = 0; i < data.length; i++) {
      var existingArea = (data[i][0] || "").toString().trim().toUpperCase();
      if (existingArea === searchArea) {
        return true;
      }
    }
    
    // Append to Data Sheet: Column A (Area) and Column E (City)
    // We construct a row of length 5: [area, "COURIER", "COURIER", "COURIER", city]
    var newRow = [
      areaName.toUpperCase().trim(),
      "COURIER",
      "COURIER",
      "COURIER",
      cityName.toUpperCase().trim()
    ];
    sheet.appendRow(newRow);
    
    // Bust cached cities list and area-city map
    try {
      _clearCacheKey("cities_list");
      _clearCacheKey("area_city_map");
    } catch (cErr) {
      Logger.log("Cache clear error for cities_list/area_city_map: " + cErr);
    }
    
    return true;
  } catch (e) {
    _logError("addNewAreaToDataSheet", e, areaName + " | " + cityName);
    return false;
  }
}

// Dynamically determine the header row index (Row 1 or Row 2) based on key column presence
function _getHeaderRowIndex(sheet) {
  try {
    var maxCols = Math.min(sheet.getLastColumn(), 20);
    if (maxCols <= 0) return 2; // Default to Row 2
    
    var row1Values = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
    for (var i = 0; i < row1Values.length; i++) {
      var val = (row1Values[i] || "").toString().trim().toUpperCase();
      if (val === "PARTY NAME" || val === "CLIENT STATUS") {
        return 1;
      }
    }
    
    var row2Values = sheet.getRange(2, 1, 1, maxCols).getValues()[0];
    for (var i = 0; i < row2Values.length; i++) {
      var val = (row2Values[i] || "").toString().trim().toUpperCase();
      if (val === "PARTY NAME" || val === "CLIENT STATUS") {
        return 2;
      }
    }
  } catch (e) {
    Logger.log("Error in _getHeaderRowIndex: " + e);
  }
  return 2; // Default fallback to Row 2
}

// Check if a column header corresponds to a spreadsheet formula
function _isFormulaHeader(headerName) {
  var formulaHeaders = [
    "NO OF DAYS SINCE LAST ORDER",
    "LAST ORDER DATE",
    "SALES BOY",
    "CITY",
    "DELIVERY ROUTE",
    "SALES OFFICER",
    "DISTRIBUTOR CODE",
    "LOCAL / OUTSTATION",
    "LOCAL/OUTSTATION",
    "SALES POC CONTACT NO",
    "PRIMARY UPPER LIMIT",
    "SECONDARY UPPER LIMIT",
    "CLASS",
    "GOOGLE LOCATION LINKS",
    "SHIPPING ADDRESS",
    "CLIENT ID",
    "SECONDARY UPPER LIMIT (IN DAYS)"
  ];
  return (formulaHeaders.indexOf((headerName || "").toString().trim().toUpperCase()) !== -1);
}

// Automatically clear columns that contain sheet formulas so they don't break
function _clearFormulaCells(sheet, rowIndex, headers) {
  for (var i = 0; i < headers.length; i++) {
    var h = (headers[i] || "").toString().trim().toUpperCase();
    if (_isFormulaHeader(h)) {
      try {
        sheet.getRange(rowIndex, i + 1).clearContent();
      } catch (err) {
        Logger.log("Failed to clear formula column " + h + " at row " + rowIndex + ": " + err);
      }
    }
  }
}

function testGetDetails() {
  var result = getClientDetails("ANIKET (LOWER PAREL)");
  Logger.log(JSON.stringify(result));
}

function dumpLogs() {
  try {
    var ss = _getSetupSpreadsheet();
    var sheet = ss.getSheetByName("Logs");
    if (!sheet) return "No Logs sheet found";
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return "No logs recorded";
    var range = sheet.getRange(Math.max(1, lastRow - 10), 1, Math.min(10, lastRow), 5);
    var values = range.getValues();
    Logger.log(JSON.stringify(values));
  } catch (e) {
    Logger.log("Error dumping logs: " + e.toString());
  }
}

// Fetch the Area to City map from Data Sheet and cache it to speed up type lookups
function _getAreaCityMap() {
  var cacheKey = "area_city_map";
  try {
    var cached = _getCachedData(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    Logger.log("Cache get error for area_city_map: " + err);
  }

  try {
    var config = _getSetupConfig();
    var ss = SpreadsheetApp.openById(config.clientSpreadsheetId);
    var dataSheet = ss.getSheetByName("Data Sheet");
    if (!dataSheet) return {};
    
    var lastRow = dataSheet.getLastRow();
    if (lastRow <= 1) return {};
    
    var data = dataSheet.getRange(2, 1, lastRow - 1, 5).getValues();
    var map = {};
    for (var i = 0; i < data.length; i++) {
      var area = (data[i][0] || "").toString().trim().toUpperCase();
      var city = (data[i][4] || "").toString().trim();
      if (area) {
        map[area] = city;
      }
    }
    
    try {
      _setCachedData(cacheKey, map, 1800); // Cache for 30 minutes
    } catch (cacheErr) {
      Logger.log("Cache set error for area_city_map: " + cacheErr);
    }
    
    return map;
  } catch (e) {
    _logError("_getAreaCityMap", e, "");
    return {};
  }
}

// Fetch active products list, compare it to columns in pricing sheet, and append new products as columns
function _syncProductColumns(pricingSheet, clientType) {
  clientType = (clientType || "").toString().trim().toUpperCase();
  try {
    var prodCacheKey = "active_products_v4_" + clientType;
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
    
    var lastCol = pricingSheet.getLastColumn();
    var headers = [];
    if (lastCol > 0) {
      headers = pricingSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
        return (h || "").toString().trim();
      });
    } else {
      pricingSheet.appendRow(["PARTY NAME"]);
      headers = ["PARTY NAME"];
      lastCol = 1;
    }
    
    var newProducts = [];
    for (var i = 0; i < activeProducts.length; i++) {
      var prod = activeProducts[i];
      if (headers.indexOf(prod) === -1) {
        newProducts.push(prod);
      }
    }
    
    if (newProducts.length > 0) {
      pricingSheet.getRange(1, lastCol + 1, 1, newProducts.length).setValues([newProducts]);
      var headersCacheKey = "pricing_headers_" + clientType;
      _clearCacheKey(headersCacheKey);
    }
    return activeProducts;
  } catch (err) {
    Logger.log("Error in _syncProductColumns: " + err);
    return [];
  }
}


