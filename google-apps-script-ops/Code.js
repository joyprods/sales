/**
 * Main function to update Last Order Date and No of Days Since Last Order for each client
 * in the Client List sheet.
 * Runs on a 12-hour time-driven trigger.
 */
function updateLastOrderDates() {
  var clientSs = SpreadsheetApp.openById("16vCNb2-k5-ew9_jcu7zB0pr2QKBMZaMIbSMue0lLwY8");
  var clientSheet = clientSs.getSheetByName("Client List");
  if (!clientSheet) {
    Logger.log("Error: 'Client List' sheet not found in client spreadsheet.");
    return;
  }
  
  var lastRow = clientSheet.getLastRow();
  if (lastRow <= 2) {
    Logger.log("Info: No clients to process (sheet has only header rows).");
    return;
  }
  
  // Find column indices in Client List sheet
  var clientNameCol = _findColumnIndex(clientSheet, ["Party Name", "Client Name"]);
  if (clientNameCol === -1) clientNameCol = 6; // Default to Column F (6th column)
  
  var clientTypeCol = _findColumnIndex(clientSheet, ["LOCAL / OUTSTATION", "LOCAL/OUTSTATION"]);
  if (clientTypeCol === -1) clientTypeCol = 36; // Default to Column AJ (36th column)
  
  var lastOrderDateCol = _findColumnIndex(clientSheet, ["Last Order Date"]);
  var daysSinceCol = _findColumnIndex(clientSheet, ["No of Days Since Last Order"]);
  
  var headerRow = 2; // Default header row
  if (lastOrderDateCol === -1) {
    var nextCol = clientSheet.getLastColumn() + 1;
    clientSheet.getRange(headerRow, nextCol).setValue("Last Order Date");
    lastOrderDateCol = nextCol;
  }
  if (daysSinceCol === -1) {
    var nextCol = clientSheet.getLastColumn() + 1;
    clientSheet.getRange(headerRow, nextCol).setValue("No of Days Since Last Order");
    daysSinceCol = nextCol;
  }
  
  // Read all client rows (starting from row 3)
  var clientRows = clientSheet.getRange(3, 1, lastRow - 2, clientSheet.getLastColumn()).getValues();
  
  // Load Local Ops Spreadsheet
  var localData = [];
  try {
    var localSs = SpreadsheetApp.openById("1ZPJmcgOkaqzICh4nCZMPDobURvMFmO7dddlFtRbMlx4");
    var localOpsSheet = localSs.getSheetByName("OPS SHEET") || localSs.getSheets()[0];
    var lLastRow = localOpsSheet.getLastRow();
    if (lLastRow > 0) {
      localData = localOpsSheet.getRange(1, 1, lLastRow, localOpsSheet.getLastColumn()).getValues();
    }
  } catch (e) {
    Logger.log("Error loading Local Ops Sheet: " + e.message);
  }
  
  // Load Outstation Ops Spreadsheet
  var outstationData = [];
  try {
    var outstationSs = SpreadsheetApp.openById("1Kf-7k2QQnfh9uu81WcTD1jAwSD2RgXwIfwtdLc_sAR8");
    var outstationOpsSheet = outstationSs.getSheetByName("OPS SHEET") || outstationSs.getSheets()[0];
    var oLastRow = outstationOpsSheet.getLastRow();
    if (oLastRow > 0) {
      outstationData = outstationOpsSheet.getRange(1, 1, oLastRow, outstationOpsSheet.getLastColumn()).getValues();
    }
  } catch (e) {
    Logger.log("Error loading Outstation Ops Sheet: " + e.message);
  }
  
  // Resolve columns in OPS sheets (default Col F for name, Col E for order date)
  var localClientColIndex = _findColumnInOps(localData, ["Client Name", "Party Name"], 5);
  var localDateColIndex = _findColumnInOps(localData, ["Order Date"], 4);
  
  var outstationClientColIndex = _findColumnInOps(outstationData, ["Client Name", "Party Name"], 5);
  var outstationDateColIndex = _findColumnInOps(outstationData, ["Order Date"], 4);
  
  // Accumulate values to write back
  var dateValues = [];
  var daysFormulaValues = [];
  var dateColLetter = _columnToLetter(lastOrderDateCol);
  
  for (var i = 0; i < clientRows.length; i++) {
    var row = clientRows[i];
    var clientName = (row[clientNameCol - 1] || "").toString().trim();
    var clientType = (row[clientTypeCol - 1] || "").toString().trim().toUpperCase();
    
    if (!clientName) {
      dateValues.push([""]);
      daysFormulaValues.push([""]);
      continue;
    }
    
    var lastOrderDate = null;
    
    // Choose search order based on clientType (LOCAL vs OUTSTATION)
    var searchSequence = [];
    if (clientType === "OUTSTATION") {
      searchSequence = [
        { data: outstationData, clientCol: outstationClientColIndex, dateCol: outstationDateColIndex },
        { data: localData, clientCol: localClientColIndex, dateCol: localDateColIndex }
      ];
    } else {
      searchSequence = [
        { data: localData, clientCol: localClientColIndex, dateCol: localDateColIndex },
        { data: outstationData, clientCol: outstationClientColIndex, dateCol: outstationDateColIndex }
      ];
    }
    
    // Search bottom-to-up (latest first)
    for (var s = 0; s < searchSequence.length; s++) {
      var opsData = searchSequence[s].data;
      var cCol = searchSequence[s].clientCol;
      var dCol = searchSequence[s].dateCol;
      
      var foundDate = null;
      for (var j = opsData.length - 1; j >= 1; j--) {
        var opsRow = opsData[j];
        var opsClient = (opsRow[cCol] || "").toString().trim();
        
        if (opsClient.toLowerCase() === clientName.toLowerCase()) {
          var rawDate = opsRow[dCol];
          var parsed = _parseDate(rawDate);
          if (parsed) {
            foundDate = parsed;
            break;
          }
        }
      }
      
      if (foundDate) {
        lastOrderDate = foundDate;
        break; // Stop searching once we find the latest date
      }
    }
    
    if (lastOrderDate) {
      dateValues.push([lastOrderDate]);
      var rowNum = i + 3; // Row numbers on spreadsheet are 1-based and data starts on row 3
      daysFormulaValues.push(["=IF(ISBLANK(" + dateColLetter + rowNum + '), "", TODAY() - ' + dateColLetter + rowNum + ")"]);
    } else {
      dateValues.push([""]);
      daysFormulaValues.push([""]);
    }
  }
  
  // Write back in batch
  if (dateValues.length > 0) {
    clientSheet.getRange(3, lastOrderDateCol, dateValues.length, 1).setValues(dateValues);
    clientSheet.getRange(3, daysSinceCol, daysFormulaValues.length, 1).setValues(daysFormulaValues);
  }
  
  Logger.log("Finished updating last order dates for " + clientRows.length + " clients.");
}

/**
 * Creates/re-creates time-driven trigger to run this script every 12 hours.
 * Run this function once from the Google Apps Script editor.
 */
function setupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "updateLastOrderDates") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  ScriptApp.newTrigger("updateLastOrderDates")
    .timeBased()
    .everyHours(12)
    .create();
    
  Logger.log("Trigger created successfully: updateLastOrderDates will run every 12 hours.");
}

/**
 * Utility to find a column index in the sheet based on a list of potential header names.
 * Searches row 1 and row 2. Returns 1-based column index, or -1 if not found.
 */
function _findColumnIndex(sheet, headerNames) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return -1;
  var row1 = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var row2 = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
  
  for (var c = 0; c < lastCol; c++) {
    var h1 = (row1[c] || "").toString().trim().toUpperCase();
    var h2 = (row2[c] || "").toString().trim().toUpperCase();
    for (var i = 0; i < headerNames.length; i++) {
      var target = headerNames[i].toUpperCase();
      if (h1 === target || h2 === target || h1.indexOf(target) !== -1 || h2.indexOf(target) !== -1) {
        return c + 1;
      }
    }
  }
  return -1;
}

/**
 * Utility to find a column index in raw Ops values.
 * Searches row 1 and row 2. Returns 0-based column index.
 */
function _findColumnInOps(opsValues, targetHeaders, defaultCol) {
  if (opsValues.length === 0) return defaultCol;
  var headerRow = opsValues[0];
  for (var c = 0; c < headerRow.length; c++) {
    var h = (headerRow[c] || "").toString().trim().toUpperCase();
    for (var i = 0; i < targetHeaders.length; i++) {
      var target = targetHeaders[i].toUpperCase();
      if (h === target || h.indexOf(target) !== -1) {
        return c;
      }
    }
  }
  if (opsValues.length > 1) {
    var headerRow2 = opsValues[1];
    for (var c = 0; c < headerRow2.length; c++) {
      var h = (headerRow2[c] || "").toString().trim().toUpperCase();
      for (var i = 0; i < targetHeaders.length; i++) {
        var target = targetHeaders[i].toUpperCase();
        if (h === target || h.indexOf(target) !== -1) {
          return c;
        }
      }
    }
  }
  return defaultCol;
}

/**
 * Utility to resiliently parse dates from Date objects or formatted strings.
 */
function _parseDate(val) {
  if (val instanceof Date) return val;
  if (!val) return null;
  var str = val.toString().trim();
  var parts = str.split("/");
  if (parts.length === 3) {
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1; // 0-based month
    var year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  var d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Converts a 1-based column index to an A-Z column letter string (e.g. 1 -> A, 28 -> AB).
 */
function _columnToLetter(column) {
  var temp, letter = "";
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}
