/**
 * V1.1.2
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var Refresh = {};

// create local configuration object
Refresh.Config = {};
Refresh.Config.TESTING = false;
Refresh.Config.ROSTER_SHEET_NAME = 'Roster';
if(Refresh.Config.TESTING) {
  Refresh.Config.ROSTER_SHEET_NAME = 'IGNORE - TESTING ONLY';
}
Logger.log("Refresh configuration loaded");

/**
 * Find the current week and highlight it in light grey
 */
Refresh.refreshCurrentWeek = function(now) { 
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = currentSpreadsheet.getSheetByName(Refresh.Config.ROSTER_SHEET_NAME);

  var numOfColumns = Refresh.getNumOfMembers(rosterSheet) + 1; // add date column
  
  // get all roster weeks
  var rosterRange = rosterSheet.getRange(Global().FIRST_ROSTER_ROW,Global().DATE_COLUMN,Global().MAX_ROSTER_ROWS,numOfColumns);
  
  // clear highlighting on week rows
  rosterRange.clearFormat();
  
  var weekDates = rosterRange.getValues();
  var weekRowIndex = Refresh.findCurrentWeekIndex(weekDates, now);
  
  // highlight that row
  var weekRow = Global().FIRST_ROSTER_ROW + weekRowIndex;
  var numOfRows = 1;
  var currentWeekRange = rosterSheet.getRange(weekRow,Global().DATE_COLUMN,numOfRows,numOfColumns);
  currentWeekRange.setBackground('lightgray');
}

/**
 * Get the number of members
 */
Refresh.getNumOfMembers = function(rosterSheet) {
  var names = Refresh.getMemberNames(rosterSheet);
  
  if(Array.isArray(names)) {
    return names.length;
  }
  
  return 0;
}

/**
 * Get the member names row
 */
Refresh.getMemberNames = function(rosterSheet) {
  var numOfRows = 1;
  
  var nameRange = rosterSheet.getRange(Global().MEMBER_NAME_ROW,Global().NAME_START_COLUMN,numOfRows,Global().MAX_MEMBER_COLUMNS);
  var names = nameRange.getValues();
  
  return Refresh.getContentColumns(names);
}

/**
 * Get the columns with content
 */
Refresh.getContentColumns = function(rowArray) {
  var emptyIndex = 0;
  var row = 0;
  var finished = false;
  
  if(Array.isArray(rowArray) && Array.isArray(rowArray[row])) {
    // for each string, until empty cell found
    for(var i = 0; i < rowArray[row].length && !finished; i++) {
      if(isEmptyStr(rowArray[row][i])) {
        emptyIndex = i; 
        
        finished = true;
      }
    }
    
    return rowArray[row].splice(0, emptyIndex);
  }
  
  return new Array();
}

/**
 * Find the current or next week index in a sheet
 * if it is after the date, move to the next week
 */
Refresh.findCurrentWeekIndexOnSheet = function(currentSheet) {
  var numOfColumns = 1;
  var now = new Date();
  
  // get all roster weeks
  var currentRange = currentSheet.getRange(Global().FIRST_ROSTER_ROW,Global().DATE_COLUMN,Global().MAX_ROSTER_ROWS,numOfColumns);
  
  // find current week index
  var weekDates = currentRange.getValues();
  
  return Refresh.findCurrentWeekIndex(weekDates, now);
}

/**
 * Find the current or next week index in the roster
 * if it is after the date, move to the next week
 */
Refresh.findCurrentWeekIndex = function(weekDates, now) {
  var currentWeekIndex = 0;
  var found = false;
  var DATE_COLUMN_INDEX = 0;
  
  if(Array.isArray(weekDates)) {
    // for each week, until the current week is found
    for(var i=0; i < weekDates.length && !found; i++) {
      // get date from row
      var weekDate = DateUtils.parseDate(weekDates[i][DATE_COLUMN_INDEX]);
    
      // if current date is greater than or equal to row date within the day
      var result = DateUtils.compareDatesWithinTolerance(now, weekDate, DateUtils.ONE_DAY_MS);
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
  test_get_content_columns();
  test_find_current_week_index();
}

function test_get_content_columns() {
  var testArray = new Array();
  testArray[0] = new Array("Test","Hi","This","", "");
  var expected = new Array("Test","Hi","This");
  
  var actual = Refresh.getContentColumns(testArray);
  
  assertArrayEquals('Content Columns Empty', expected, actual);
  
  testArray = new Array();
  testArray[0] = new Array("Test",null, null);
  expected = new Array("Test");
  
  actual = Refresh.getContentColumns(testArray);
  
  assertArrayEquals('Content Columns Null', expected, actual);
  
  testArray = new Array();
  testArray[0] = "Test";
  expected = new Array();
  
  actual = Refresh.getContentColumns(testArray);
  
  assertArrayEquals('Content Columns No Array', expected, actual);
}


function test_find_current_week_index() {
  var testArray = new Array();
  testArray[0] = new Array("02 Feb 2016");
  testArray[1] = new Array("09 Feb 2016");
  testArray[2] = new Array("16 Feb 2016");
  testArray[3] = new Array("23 Feb 2016");
  testArray[4] = new Array("01 Mar 2016");
  testArray[5] = new Array("08 Mar 2016");
  
  var testDate = DateUtils.createLocalDate(2016, 2, 23, 0, 0, 0);
  
  var expected = 3;
  var actual = Refresh.findCurrentWeekIndex(testArray, testDate);
  
  assert('Current week on day exact', actual === expected);
    
  testDate = DateUtils.createLocalDate(2016, 2, 23, 11, 0, 0);
  
  expected = 3;
  actual = Refresh.findCurrentWeekIndex(testArray, testDate);
  
  assert('Current week on day', actual === expected);
  
  testDate = DateUtils.createLocalDate(2016, 2, 19, 0, 0, 0);
  
  expected = 3;
  actual = Refresh.findCurrentWeekIndex(testArray, testDate);
  
  assert('Current week off day', actual === expected);
}


/**
 * manual testing only
 */
function test_refreshCurrentWeek() {
  Refresh.refreshCurrentWeek(new Date());
  //Refresh.refreshCurrentWeek(DateUtils.createLocalDate(2016, 8, 23, 0, 0, 0));
  //Refresh.refreshCurrentWeek(DateUtils.createLocalDate(2016, 1, 4, 0, 0, 0));
}
