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
