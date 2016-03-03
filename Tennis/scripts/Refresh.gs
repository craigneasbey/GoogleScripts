/**
 * V1.0.1
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey
 */

var TESTING_REFRESH = false;

var PLAYER_NAME_ROW = 4;
var FIRST_ROSTER_ROW = 6; // the first week roster row
var DATE_COLUMN = 1; // the first column is the week date
var MAX_ROWS = 1000; // arbitrary number

var ROSTER_SHEET_NAME = 'Roster';
if(TESTING_REFRESH) {
  ROSTER_SHEET_NAME = 'IGNORE - TESTING ONLY';
}

/**
 * Find the current week and highlight it in light grey
 */
function refreshCurrentWeek(now) { 
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = currentSpreadsheet.getSheetByName(ROSTER_SHEET_NAME);
  
  // get number of players
  var NAME_START_COLUMN = 2;
  var NUM_OF_ROWS = 1;
  var NUM_OF_COLS = 100; // arbitrary number
  
  var nameRange = rosterSheet.getRange(PLAYER_NAME_ROW,NAME_START_COLUMN,NUM_OF_ROWS,NUM_OF_COLS);
  var names = nameRange.getValues();
  
  var numOfPlayers = getNumContentColumns(names);
  var numOfColumns = numOfPlayers + 1; // add date column
  
  // get all roster weeks
  var rosterRange = rosterSheet.getRange(FIRST_ROSTER_ROW,DATE_COLUMN,MAX_ROWS,numOfColumns);
  
  // clear highlighting on week rows
  rosterRange.setBackground('white');
  
  var weekDates = rosterRange.getValues();
  var weekRowIndex = findCurrentWeekIndex(weekDates, now);
  
  // highlight that row
  var weekRow = FIRST_ROSTER_ROW + weekRowIndex;
  var NUM_OF_ROWS = 1;
  var currentWeekRange = rosterSheet.getRange(weekRow,DATE_COLUMN,NUM_OF_ROWS,numOfColumns);
  currentWeekRange.setBackground('lightgray');
}

/**
 * Get the number of columns with content
 */
function getNumContentColumns(rowArray) {
  var numContent = 0;
  var row = 0;
  var finished = false;
  
  if(Array.isArray(rowArray) && Array.isArray(rowArray[row])) {
    // for each string, until empty cell found
    for(var i=0; i < rowArray[row].length && !finished; i++) {
      if(isEmptyStr(rowArray[row][i])) {
        numContent = i;
        
        finished = true;
      }
    }
  }
  
  return numContent;
}

/**
 * Find the current or next week index in the roster
 * if it is after the date, move to the next week
 */
function findCurrentWeekIndex(weekDates, now) {
  var currentWeekIndex = 0;
  var found = false;
  
  if(Array.isArray(weekDates)) {
    // for each week, until the current week is found
    for(var i=0; i < weekDates.length && !found; i++) {
      // get date from row
      var weekDate = parseDate(weekDates[i][0]);
    
      // if current date is greater than or equal to row date
      var result = compareDates(now, weekDate);
      if(result <= 0) {
        currentWeekIndex = i;
  
        // exit loop
        found = true;
      }
    }
  }
  
  return currentWeekIndex;
}

/**
 * Tests
 */
function test_refresh_suite() {
  test_getNumContentColumns();
  test_findCurrentWeekIndex();
}

function test_getNumContentColumns() {
  var testArray = new Array();
  testArray[0] = new Array("Test","Hi","This","", "");
  
  var expected = 3;
  var actual = getNumContentColumns(testArray);
  
  GSUnit.assert('Content Columns Empty', actual === expected);
  
  testArray[0] = new Array("Test",null, null);
  
  expected = 1;
  actual = getNumContentColumns(testArray);
  
  GSUnit.assert('Content Columns Null', actual === expected);
  
  testArray[0] = "Test";
  
  expected = 0;
  actual = getNumContentColumns(testArray);
  
  GSUnit.assert('Content Columns No Array', actual === expected);
}


function test_findCurrentWeekIndex() {
  var testArray = new Array();
  testArray[0] = new Array("02 Feb 2016");
  testArray[1] = new Array("09 Feb 2016");
  testArray[2] = new Array("16 Feb 2016");
  testArray[3] = new Array("23 Feb 2016");
  testArray[4] = new Array("01 Mar 2016");
  testArray[5] = new Array("08 Mar 2016");
  
  // AEDT(13) or AEST(14)
  var testDate = new Date(Date.UTC(2016, 1, 22, 13, 0, 0)); // 23 Feb 2016
  
  var expected = 3;
  var actual = findCurrentWeekIndex(testArray, testDate);
  
  GSUnit.assert('Current week on day', actual === expected);
  
  // AEDT(13) or AEST(14)
  testDate = new Date(Date.UTC(2016, 1, 18, 13, 0, 0)); // 19 Feb 2016
  
  expected = 3;
  actual = findCurrentWeekIndex(testArray, testDate);
  
  GSUnit.assert('Current week off day', actual === expected);
}

/**
 * manual testing only
 */
function test_refreshCurrentWeek() { 
  refreshCurrentWeek(new Date());
  //refreshCurrentWeek(new Date(Date.UTC(2016, 1, 17, 13, 0, 0)));
  //refreshCurrentWeek(new Date(Date.UTC(2016, 0, 3, 13, 0, 0)));
}
