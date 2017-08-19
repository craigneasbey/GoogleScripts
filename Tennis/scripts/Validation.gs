/**
 * V1.0.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var Validation = {};

// create local configuration object
Validation.Config = {};
Validation.Config.TESTING = false;
Logger.log("Validation configuration loaded");

/**
 * Check if the roster is valid
 */
Validation.checkValidation = function() {
  // get minimum members required
  var min = Global().MIN_TEAM_MEMBERS;
  // get maximum members required
  var max = Global().MAX_TEAM_MEMBERS;
  var now = new Date();
  
  // get all weeks
  var weekArray = Validation.getAllWeeks(now);
  
  return Validation.getErrorWeeks(weekArray, min, max);
}


/**
 * Get all roster weeks
 */
Validation.getAllWeeks = function(now) {
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = currentSpreadsheet.getSheetByName(Global().ROSTER_SHEET_NAME);

  // add date column
  var numOfColumns = Refresh.getNumOfMembers(rosterSheet) + 1;
    
  var rosterRange = rosterSheet.getRange(Global().FIRST_ROSTER_ROW,Global().DATE_COLUMN,Global().MAX_ROSTER_ROWS,numOfColumns);
  
  var rosterRangeValues = rosterRange.getValues();
  var weeksArray = [];
  
  if(Array.isArray(rosterRangeValues)) {
    // get the current week to start at
    var currentWeekIndex = Refresh.findCurrentWeekIndex(rosterRangeValues, now);
    
    // for future roster rows
    for(var i = currentWeekIndex; i < rosterRangeValues.length; i++) {
      // if the date field is not empty
      if(!isEmpty(rosterRangeValues[i][0])) {
        // add to weeks array
        weeksArray.push(rosterRangeValues[i]);
      }
    }
  }
  
  return weeksArray;
}

/**
 * Get weeks that have invalid rostered members
 */
Validation.getErrorWeeks = function(weeksArray, minRosteredMembers, maxRosteredMembers) {
  var errorArray = [];
  
  // if weeks array exists
  if(Array.isArray(weeksArray)) {
  	// for each week
    for(var i = 0; i < weeksArray.length; i++) {
      var memberRosteredCount = 0;
      
      // if week array exists
      if(Array.isArray(weeksArray[i])) {
      	// for each member
        for(var j = 0; j < weeksArray[i].length; j++) {
          if(weeksArray[i][j] === Global().ROSTERED) {
            memberRosteredCount++;
          }
        }
      }
      
      // if less than the minimum or greater than the maximum and not empty
      if((memberRosteredCount < minRosteredMembers || memberRosteredCount > maxRosteredMembers) && memberRosteredCount !== 0) {
      	// add entire row to error array
      	errorArray.push(weeksArray[i]);
      }
    }
  }
  
  return errorArray;
}

/**
 * Tests
 */
function test_validation_suite() {
  test_getErrorWeeks()
}

function test_getErrorWeeks() {
  var weeksArray = new Array();
  weeksArray[5] = new Array("23 Feb 2016", "CBA", "CBA", "Play", "NA", "Play", "Play");
  weeksArray[4] = new Array("", "", "", "", "", "", "");
  weeksArray[3] = new Array("30 Feb 2016", "Play", "Play", "Play", "NA", "CBA", "CBA");
  weeksArray[2] = new Array("5 Mar 2016", "Play", "Play", "Play", "NA", "CBA", "Play");
  weeksArray[1] = new Array("14 Mar 2016", "Play", "Play", "Play", "NA", "Play", "Play");
  weeksArray[0] = new Array("23 Mar 2016", "Play", "Play", "CBA", "NA", "Play", "Play");
	
  var expectedArray = new Array();
  expectedArray[2] = new Array("23 Feb 2016", "CBA", "CBA", "Play", "NA", "Play", "Play");
  expectedArray[1] = new Array("30 Feb 2016", "Play", "Play", "Play", "NA", "CBA", "CBA");
  expectedArray[0] = new Array("14 Mar 2016", "Play", "Play", "Play", "NA", "Play", "Play");
  
  var actualArray = Validation.getErrorWeeks(weeksArray, 4, 4);
  
  GSUnit.assertArrayEquals('Rostered member weeks that failed validation', expectedArray, actualArray);
}