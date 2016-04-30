/**
 * V1.2.1
 * https://developers.google.com/apps-script/reference/
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Meals)
 */

var ListActions = {};

ListActions.ACTIONS = ['Show', 'Hide', 'Top', 'Middle', 'Bottom', 'Up', 'Down'];

/**
 * Action an edit event on a list item
 */
ListActions.editEvent = function(e) {
  // if text value is "Hide" then hide the row of that cell
  if(e.value) {
    if(e.value === "Hide") {
      Logger.log("editEvent: " + JSON.stringify(e));
      ListActions.hideRow();
    } else if(e.value === "Up" || e.value === "Down" || e.value === "Top" || e.value === "Middle" || e.value === "Bottom") {
      Logger.log("editEvent: " + JSON.stringify(e));
      ListActions.moveRowAround(e.value);
    }
  }
}

/**
 * Hide the current row
 */
ListActions.hideRow = function() {
  var currentSheet = SpreadsheetApp.getActiveSheet();
  
  currentSheet.hideRows(currentSheet.getActiveCell().getRow());
}

/**
 * Move the row around the current row up, down,
 * top row, middle row, bottom row
 */
ListActions.moveRowAround = function(direction) {
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
    while(ListActions.isHiddenRow(srcRow, currentSheet)) {
      srcRow -= 1;
    }
    
    // move to next row if it is hidden
    while(ListActions.isHiddenRow(destRow, currentSheet)) {
      destRow += 1;
    }
    
    if(srcRow > 0 && destRow > 0) {
      ListActions.moveRowAroundByNum(srcRow, destRow, currentSheet);
    }
  } else if(direction === "Down") {    
    var srcRow = currentRow + 1;
    var destRow = currentRow;
    
    // move to next row if it is hidden
    while(ListActions.isHiddenRow(srcRow, currentSheet)) {
      srcRow += 1;
    }
    
    if(srcRow > 0 && destRow > 0) {
      ListActions.moveRowAroundByNum(srcRow, destRow, currentSheet);
    }
  } else if(direction === "Top") {
    var srcRow = currentRow;
    var destRow = 1;
    
    if(srcRow > 0 && destRow > 0) {
      ListActions.moveRowByNum(srcRow, destRow, currentSheet);
    }
  } else if(direction === "Middle") {
    var srcRow = currentRow;
    var shownRows = ListActions.getNumberOfShownRows(ListActions.getShownRows(currentSheet));
    var destRow = shownRows/2 + 1; // middle data row
    
    if(srcRow > 0 && destRow > 0) {
      ListActions.moveRowByNum(srcRow, destRow, currentSheet);
    }
  } else if(direction === "Bottom") {   
    var srcRow = currentRow;
    var destRow = currentSheet.getDataRange().getLastRow() + 1; // last data row
    
    if(srcRow > 0 && destRow > 0) {
      ListActions.moveRowByNum(srcRow, destRow, currentSheet);
    }
  }
}

/**
 * Check if the row is hidden
 *
 * Work around to feature request: https://code.google.com/p/google-apps-script-issues/issues/detail?id=195
 */
ListActions.isHiddenRow = function(currentRow, currentSheet) {
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
ListActions.moveRowAroundByNum = function(fromRow, toRow, currentSheet) {
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
ListActions.moveRowByNum = function(fromRow, toRow, currentSheet) {
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
 * Get all shown rows
 */
ListActions.getShownRows = function(currentSheet) {
  var startRow = 1;
  var startCol = 1;
  var numOfRows = currentSheet.getDataRange().getLastRow();
  var numOfCols = 1;
  
  var shownRange = currentSheet.getRange(startRow, startCol, numOfRows, numOfCols);
  
  return shownRange.getValues();
}

/**
 * Get the number of shown rows
 */
ListActions.getNumberOfShownRows = function(allShownRows) {
  ArrayUtils.arrayRotateOneDimension(allShownRows, -90); // rotate array left
  var count = 0;
    
  for(var i = 0; i < allShownRows.length; i++) {   
    if(allShownRows[i] === 'Show') {
      count++;
    }
  }

  return count;
}


/**
 * Tests
 */
function test_list_action_suite() {
  test_get_number_of_shown_rows();
}

function test_get_number_of_shown_rows() {
  var testArray = new Array();
  testArray[0] = new Array('Show');
  testArray[1] = new Array('Hide');
  testArray[2] = new Array('Hide');
  testArray[3] = new Array('Show');
  testArray[4] = new Array('Show');
  testArray[5] = new Array('Show');
  testArray[6] = new Array('Show');
  var expected = 5;
  
  var actual = ListActions.getNumberOfShownRows(testArray);
  
  Logger.log(GSUnit.assertEquals('Get number of shown rows', expected, actual));
}



/**
 * Manual test functions for onEdit. Passes an event object to simulate an edit to
 * a cell in a spreadsheet.
 *
 * Check for updates: http://stackoverflow.com/a/16089067/1677912
 *
 * See https://developers.google.com/apps-script/guides/triggers/events#google_sheets_events
 */
function test_edit_event_hide() {
  ListActions.editEvent({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Hide",
    authMode : ""
  });
}

function test_edit_event_down() {
  ListActions.editEvent({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Down",
    authMode : ""
  });
}

function test_edit_event_up() {
  ListActions.editEvent({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Up",
    authMode : ""
  });
}

function test_edit_event_top() {
  ListActions.editEvent({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Top",
    authMode : ""
  });
}

function test_edit_event_middle() {
  ListActions.editEvent({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Middle",
    authMode : ""
  });
}

function test_edit_event_bottom() {
  ListActions.editEvent({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Bottom",
    authMode : ""
  });
}

