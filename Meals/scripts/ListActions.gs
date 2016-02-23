/**
 * V1.0.0
 * https://developers.google.com/apps-script/reference/
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 */

var ACTIONS = ['Show', 'Hide', 'Top', 'Middle', 'Bottom', 'Up', 'Down'];

/**
 * Runs when spreadsheet cell has finished editing
 */
function onEdit(e) {
  // if text value is "Hide" then hide the row of that cell
  if(e.value) {
    if(e.value === "Hide") {
      Logger.log("onEdit: " + JSON.stringify(e));
      hideRow_();
    } else if(e.value === "Up" || e.value === "Down" || e.value === "Top" || e.value === "Middle" || e.value === "Bottom") {
      Logger.log("onEdit: " + JSON.stringify(e));
      moveRowAround_(e.value);
    }
  }
}

/**
 * Hide the current row
 */
function hideRow_() {
  var currentSheet = SpreadsheetApp.getActiveSheet();
  
  currentSheet.hideRows(currentSheet.getActiveCell().getRow());
}

/**
 * Move the row around the current row up or down
 */
function moveRowAround_(direction) {
  var currentSheet = SpreadsheetApp.getActiveSheet();
  var currentCell = currentSheet.getActiveCell();
  var currentRow = currentCell.getRow();
  var defaultValue = 'Show';
  
  // set default value again
  currentCell.setValue([defaultValue]);
  
  if(direction === "Up") {
    var srcRow = currentRow - 1;
    var destRow = currentRow + 1;
    
    // move to next row if it is hidden
    while(isHiddenRow(srcRow, currentSheet)) {
      srcRow -= 1;
    }
    
    // move to next row if it is hidden
    while(isHiddenRow(destRow, currentSheet)) {
      destRow += 1;
    }
    
    if(srcRow > 0 && destRow > 0) {
      moveRowAroundByNum_(srcRow, destRow, currentSheet);
    }
  } else if(direction === "Down") {    
    var srcRow = currentRow + 1;
    var destRow = currentRow;
    
    // move to next row if it is hidden
    while(isHiddenRow(srcRow, currentSheet)) {
      srcRow += 1;
    }
    
    if(srcRow > 0 && destRow > 0) {
      moveRowAroundByNum_(srcRow, destRow, currentSheet);
    }
  } else if(direction === "Top") {
    var srcRow = currentRow;
    var destRow = 1;
    
    if(srcRow > 0 && destRow > 0) {
      moveRowByNum_(srcRow, destRow, currentSheet);
    }
  } else if(direction === "Middle") {
    var srcRow = currentRow;
    var destRow = currentSheet.getDataRange().getLastRow()/2 + 1; // middle data row
    
    if(srcRow > 0 && destRow > 0) {
      moveRowByNum_(srcRow, destRow, currentSheet);
    }
  } else if(direction === "Bottom") {   
    var srcRow = currentRow;
    var destRow = currentSheet.getDataRange().getLastRow() + 1; // last data row
    
    if(srcRow > 0 && destRow > 0) {
      moveRowByNum_(srcRow, destRow, currentSheet);
    }
  }
}

/**
 * Check if the row is hidden
 *
 * Work around to feature request: https://code.google.com/p/google-apps-script-issues/issues/detail?id=195
 */
function isHiddenRow(currentRow, currentSheet) {
  var startCol = 1;
  var numOfRows = 1;
  var numOfCols = 1;
  
  if(currentRow > 0) {
    var showHideRange = currentSheet.getRange(currentRow, startCol, numOfRows, numOfCols);
    
    // http://stackoverflow.com/questions/6793805/how-to-skip-hidden-rows-while-iterating-through-google-spreadsheet-w-google-app
    if(showHideRange) {
      if(showHideRange.getValue() === 'Hide') {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Move a row up or down around the current row based on the row number
 */
function moveRowAroundByNum_(fromRow, toRow, currentSheet) {
  var startCol = 1;
  var numOfRows = 1;
  var numOfCols = 10;
  
  // if moving up, from row number will change after insert, need to alter appropriately
  if(toRow < fromRow) {
    fromRow += 1;
  }
  
  // insert new row
  currentSheet.insertRows(toRow);
  // copy values      
  currentSheet.getRange(fromRow, startCol, numOfRows, numOfCols).moveTo(currentSheet.getRange(toRow, startCol, numOfRows, numOfCols));
  // delete existing row
  currentSheet.deleteRow(fromRow);
}

/**
 * Move the current row up or down based on the row number
 */
function moveRowByNum_(fromRow, toRow, currentSheet) {
  var startCol = 1;
  var numOfRows = 1;
  var numOfCols = 10;
  
  // if moving up, from row number will change after insert, need to alter appropriately
  if(toRow < fromRow) {
    fromRow += 1;
  }
  
  // insert new row
  currentSheet.insertRows(toRow);
  // copy values      
  currentSheet.getRange(fromRow, startCol, numOfRows, numOfCols).moveTo(currentSheet.getRange(toRow, startCol, numOfRows, numOfCols));
  // delete existing row
  currentSheet.deleteRow(fromRow);
}


/**
 * Manual test functions for onEdit. Passes an event object to simulate an edit to
 * a cell in a spreadsheet.
 *
 * Check for updates: http://stackoverflow.com/a/16089067/1677912
 *
 * See https://developers.google.com/apps-script/guides/triggers/events#google_sheets_events
 */
function test_onEditHide() {
  onEdit({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Hide",
    authMode : ""
  });
}

function test_onEditDown() {
  onEdit({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Down",
    authMode : ""
  });
}

function test_onEditUp() {
  onEdit({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Up",
    authMode : ""
  });
}

function test_onEditTop() {
  onEdit({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Top",
    authMode : ""
  });
}

function test_onEditMiddle() {
  onEdit({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Middle",
    authMode : ""
  });
}

function test_onEditBottom() {
  onEdit({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Bottom",
    authMode : ""
  });
}

