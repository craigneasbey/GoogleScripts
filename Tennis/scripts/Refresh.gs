/**
 * V1.0.8
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

loadGlobalConfig();

// create local configuration object
var refreshConfig = {};
refreshConfig.TESTING = false;
refreshConfig.ROSTER_SHEET_NAME = 'Roster';
if(refreshConfig.TESTING) {
  refreshConfig.ROSTER_SHEET_NAME = 'IGNORE - TESTING ONLY';
}

function createTimeDrivenTriggerForRefresh() {
  // Trigger REFRESH_CHECK_DAYS at REFRESH_CHECK_HOUR
  ScriptApp.newTrigger('triggerRefresh')
      .timeBased()
      .atHour(global.REFRESH_CHECK_HOUR)
      .everyDays(global.REFRESH_CHECK_DAYS)
      .create();
}

/**
 * Run from a installed trigger to notify the team member if the sheet has updated
 */
function triggerRefresh() {
  refreshCurrentWeek(new Date());
}

/**
 * Get the number of players
 */
function getNumOfPlayers(rosterSheet) {  
  var numOfRows = 1;
  
  var nameRange = rosterSheet.getRange(global.MEMBER_NAME_ROW,global.NAME_START_COLUMN,numOfRows,global.MAX_MEMBER_COLUMNS);
  var names = nameRange.getValues();
  
  return getNumContentColumns(names);
}

/**
 * Find the current week and highlight it in light grey
 */
function refreshCurrentWeek(now) { 
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = currentSpreadsheet.getSheetByName(refreshConfig.ROSTER_SHEET_NAME);
  
  var numOfPlayers = getNumOfPlayers(rosterSheet);
  var numOfColumns = numOfPlayers + 1; // add date column
  
  // get all roster weeks
  var rosterRange = rosterSheet.getRange(global.FIRST_ROSTER_ROW,global.DATE_COLUMN,global.MAX_ROSTER_ROWS,numOfColumns);
  
  // clear highlighting on week rows
  rosterRange.clearFormat();
  
  var weekDates = rosterRange.getValues();
  var weekRowIndex = findCurrentWeekIndex(weekDates, now);
  
  // highlight that row
  var weekRow = global.FIRST_ROSTER_ROW + weekRowIndex;
  var numOfRows = 1;
  var currentWeekRange = rosterSheet.getRange(weekRow,global.DATE_COLUMN,numOfRows,numOfColumns);
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
 * Find the current or next week index in a sheet
 * if it is after the date, move to the next week
 */
function findCurrentWeekIndexOnSheet(currentSheet) {
  var numOfColumns = 1;
  var now = new Date();
  
  // get all roster weeks
  var currentRange = currentSheet.getRange(global.FIRST_ROSTER_ROW,global.DATE_COLUMN,global.MAX_ROSTER_ROWS,numOfColumns);
  
  // find current week index
  var weekDates = currentRange.getValues();
  
  return findCurrentWeekIndex(weekDates, now);
}

/**
 * Find the current or next week index in the roster
 * if it is after the date, move to the next week
 */
function findCurrentWeekIndex(weekDates, now) {
  var currentWeekIndex = 0;
  var found = false;
  var DATE_COLUMN_INDEX = 0;
  
  if(Array.isArray(weekDates)) {
    // for each week, until the current week is found
    for(var i=0; i < weekDates.length && !found; i++) {
      // get date from row
      var weekDate = parseDate(weekDates[i][DATE_COLUMN_INDEX]);
    
      // if current date is greater than or equal to row date within the day
      var result = compareDatesWithinTolerance(now, weekDate, ONE_DAY_MS);
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
  
  var testDate = createLocalDate(2016, 2, 23, 0, 0, 0);
  
  var expected = 3;
  var actual = findCurrentWeekIndex(testArray, testDate);
  
  GSUnit.assert('Current week on day exact', actual === expected);
    
  testDate = createLocalDate(2016, 2, 23, 11, 0, 0);
  
  expected = 3;
  actual = findCurrentWeekIndex(testArray, testDate);
  
  GSUnit.assert('Current week on day', actual === expected);
  
  testDate = createLocalDate(2016, 2, 19, 0, 0, 0);
  
  expected = 3;
  actual = findCurrentWeekIndex(testArray, testDate);
  
  GSUnit.assert('Current week off day', actual === expected);
}


/**
 * manual testing only
 */
function test_refreshCurrentWeek() {
  refreshCurrentWeek(new Date());
  //refreshCurrentWeek(createLocalDate(2016, 8, 23, 0, 0, 0));
  //refreshCurrentWeek(createLocalDate(2016, 1, 4, 0, 0, 0));
}

