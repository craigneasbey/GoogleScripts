/**
 * V1.1.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var Roster = {};

// create local configuration object
Roster.Config = {};
Roster.Config.TESTING = false;
Roster.Config.DATE_COLUMN = 1; // the first column is the week date
Roster.Config.ROSTER_SHEET_NAME = Global().ROSTER_SHEET_NAME;
if(Roster.Config.TESTING) {
  Roster.Config.ROSTER_SHEET_NAME = 'IGNORE - TESTING ONLY';
}
Logger.log("Roster configuration loaded");

/**
 * Generate Dates for members schedule
 */
Roster.generateDates = function() {
  Logger.log("Roster.generateDates function called");
  var defaultYear = Global().DEFAULT_YEAR;
  var dayOfWeek = Global().DAY_OF_WEEK;

  var year = GUIUtils.openEntryDialog('Generate Dates', 'Enter year (default ' + defaultYear + '):');
  Logger.log('year: ' + year);
  
  if(year !== GUIUtils.CANCEL) {
    year = defaultFor(year, defaultYear);
    
    var html = HtmlService.createHtmlOutputFromFile('dates.html')
    .setTitle('Year ' + year + ' Dates').setSandboxMode(HtmlService.SandboxMode.IFRAME);
    html.append("<script>var year = " + year + "; var dayOfWeek = " + dayOfWeek + ";</script>");
    SpreadsheetApp.getUi().showSidebar(html);
  }
}

/**
 * Generate Roster for members schedule
 */
Roster.allocateMembers = function() {
  Logger.log("Roster.allocateMembers function called");
  var currentSheet = SpreadsheetApp.getActiveSheet();
  var currentRange = currentSheet.getActiveRange();
  
  var promptTitle = '';
  var promptText = '';
  var result = false;
  
  // verify range
  if(!Roster.Config.TESTING) {
    promptTitle = 'Roster Range Selected', 
    promptText = 'The current selected range is: ' + currentRange.getA1Notation();
    promptText += '.\n\n Are you sure you want to continue allocating rostered members in that range?', 
    
    result = GUIUtils.openCheckDialog(promptTitle, promptText);
  } else {
    result = true;
  }
  
  if(result) {
    Logger.log("current range: " + JSON.stringify(currentRange));

    var maxWeeksRostered = Global().DEFAULT_MAX_WEEKS_ROSTERED;
    var maxWeeksRest = Global().DEFAULT_MAX_WEEKS_REST;
    
    // get configuration from user
    if(!Roster.Config.TESTING) {
      promptTitle = 'Allocation Configuration';
      promptText = 'Enter maximum consecutive weeks rostered (default ' + Global().DEFAULT_MAX_WEEKS_ROSTERED + '):';
      maxWeeksRostered = GUIUtils.openEntryDialog(promptTitle, promptText);
      
      if(maxWeeksRostered === GUIUtils.CANCEL) {
        return;
      }
      
      promptText = 'Enter maximum consecutive weeks resting (default ' + Global().DEFAULT_MAX_WEEKS_REST + '):';
      maxWeeksRest = GUIUtils.openEntryDialog(promptTitle, promptText);
      
      if(maxWeeksRest === GUIUtils.CANCEL) {
        return;
      }
    }
    
    maxWeeksRostered = defaultFor(maxWeeksRostered, Global().DEFAULT_MAX_WEEKS_ROSTERED);
    maxWeeksRest = defaultFor(maxWeeksRest, Global().DEFAULT_MAX_WEEKS_REST);
    
    // get the selected history
    var historyArray = Roster.getMembersHistory(maxWeeksRostered, maxWeeksRest, currentRange, currentSheet);
    
    // allocate roster for selected members
    var save = Roster.allocateSelectedMembers(maxWeeksRostered, maxWeeksRest, historyArray, currentRange, currentSheet);
    
    if(save) {
      SpreadsheetApp.flush();
    }
  }
}

/*
 * Get rostered/rest history from sheet
 */
Roster.getMembersHistory = function(maxWeeksRostered, maxWeeksRest, currentRange, currentSheet) {
  var historyLength = maxWeeksRostered > maxWeeksRest ? maxWeeksRostered : maxWeeksRest;
  var currentRowIndex = currentRange.getRow();
  var currentColumnIndex = currentRange.getColumn();
  
  var historyRows = currentSheet.getRange(currentRowIndex - historyLength, currentColumnIndex, historyLength, currentRange.getNumColumns());
  var historyArray = historyRows.getValues();
  
  return historyArray;
}

/*
 * Allocate members for selected roster
 */
Roster.allocateSelectedMembers = function(maxWeeksRostered, maxWeeksRest, historyArray, currentRange, currentSheet)
{
  var result = false;
  var currentColumnIndex = currentRange.getColumn();
  var currentWidth = currentRange.getNumColumns();
  var fillTeam = { "start" : 0 }; // move the start to the first member when looking for another available member to roster
  
  // for each row(week) of the current range
  for(var i=currentRange.getRow(); i < currentRange.getRow() + currentRange.getNumRows(); i++) {
    var numOfRows = 1;
    var currentRow = currentSheet.getRange(i, currentColumnIndex, numOfRows, currentWidth);
    var currentRowArrayArray = currentRow.getValues();
    
    var weekArray = AllocateMembers.allocateMembersForWeek(currentRowArrayArray[0], historyArray, maxWeeksRostered, maxWeeksRest, fillTeam);
    
    currentRow.setValues([weekArray]);
    
    historyArray = Roster.progressMembersHistory(historyArray, weekArray);
    
    result = true;
  }
  
  return result;
}

/**
 * Move history array down the sheet, remove the oldest row, add the latest row
 */
Roster.progressMembersHistory = function(historyArray, newRow) {  
  historyArray.shift(); // remove top
  historyArray.push(newRow); // add new row to bottom
  
  return historyArray;
}

/**
 * Email all members with a subject and message 
 */
Roster.emailMembersMessage = function() {
  Logger.log("Roster.emailMembersMessage function called");
 
  // get subject
  var subject = GUIUtils.openEntryDialog(Global().EMAIL_MEMBERS_DIALOG_TITLE, 'Subject:');
  
  if(subject === GUIUtils.CANCEL) {
    return;
  }
  
  // get message
  var message = GUIUtils.openEntryDialog(Global().EMAIL_MEMBERS_DIALOG_TITLE, 'Message:');
  
  if(message === GUIUtils.CANCEL) {
    return;
  }
  
  Notification.emailMembers(subject, message);
}

/**
 * Remove all weeks older than maximum weeks history required
 */
Roster.removePastWeeks = function() {
  Logger.log("Roster.removePastWeeks function called");
  var historyLength = Global().DEFAULT_MAX_WEEKS_ROSTERED > Global().DEFAULT_MAX_WEEKS_REST ? Global().DEFAULT_MAX_WEEKS_ROSTERED : Global().DEFAULT_MAX_WEEKS_REST;

  // get configuration from user
  if(!Roster.Config.TESTING) {
    var promptText = 'Enter maximum past weeks to keep (default ' + historyLength + '):';
    var maxWeeksHistory = GUIUtils.openEntryDialog('Remove Past Weeks Configuration', promptText);
    
    if(maxWeeksHistory === GUIUtils.CANCEL) {
      return;
    }
    
    historyLength = defaultFor(maxWeeksHistory, historyLength);
  }

  // remove history week rows
  var save = Roster.removeHistory_(historyLength);
    
  if(save) {
    SpreadsheetApp.flush();
  }
}

/**
 * Remove history week rows older than the history length
 */
Roster.removeHistory = function(retainHistoryLength) {
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = currentSpreadsheet.getSheetByName(Roster.Config.ROSTER_SHEET_NAME);
  //Logger.log('Roster.Config.ROSTER_SHEET_NAME: ' + Roster.Config.ROSTER_SHEET_NAME);
  
  // remove all rows between first week index and current week - retainHistoryLength
  var weekRowIndex = Refresh.findCurrentWeekIndexOnSheet(rosterSheet);
  var deleteNumOfRows = weekRowIndex - retainHistoryLength;
  
  Logger.log('FIRST_ROSTER_ROW: ' + Global().FIRST_ROSTER_ROW + ' deleteNumOfRows: ' + deleteNumOfRows);
  if(deleteNumOfRows > 0) {
    rosterSheet.deleteRows(Global().FIRST_ROSTER_ROW, deleteNumOfRows);
    return true;
  }
    
  return false;
}


/**
 * Tests
 */
function test_roster_suite() {
  test_progressMembersHistory();
}

function test_progressMembersHistory() {
  var newWeekArray = new Array("NA","Play","Play","Play","NA","NA","CBA","NA","NA","Play");
  
  var historyArray = new Array();
  historyArray[0] = new Array("","","","","","","","","","");
  historyArray[1] = new Array("Play","CBA","CBA","Play","NA","NA","CBA","Play","NA","Play");
  historyArray[2] = new Array("NA","Play","Play","Play","NA","NA","Play","NA","NA","CBA");
  historyArray[3] = new Array("NA","Play","Play","Play","NA","NA","Play","NA","NA","CBA");
  
  var expectedArray = new Array();
  expectedArray[0] = new Array("Play","CBA","CBA","Play","NA","NA","CBA","Play","NA","Play");
  expectedArray[1] = new Array("NA","Play","Play","Play","NA","NA","Play","NA","NA","CBA");
  expectedArray[2] = new Array("NA","Play","Play","Play","NA","NA","Play","NA","NA","CBA");
  expectedArray[3] = new Array("NA","Play","Play","Play","NA","NA","CBA","NA","NA","Play");
  
  var actualArray = Roster.progressMembersHistory(historyArray, newWeekArray);
  
  Logger.log(GSUnit.assertArrayEquals('Progress members history', expectedArray, actualArray));
}


/**
 * Manual Tests
 */
function test_generateDates() {
  Roster.generateDates();
}

function test_allocateMembers() {
  Roster.allocateMembers();
}

function test_emailMembersMessage() {
  Roster.emailMembersMessage();
}

function test_removePastWeeks() {
  Roster.removePastWeeks();
}



/**
 * Master Tests
 */
function test_master_suite() {
  test_roster_suite();
  test_allocate_suite();
  test_refresh_suite();
  test_load_config_suite();
  test_string_suite();
  test_array_suite();
  test_date_suite();
}


/**
 * Master Manual Tests
 */
function test_master_manual_suite() {
  test_manual_notification_suite();
  test_manual_reminder_suite();
  test_manual_updated_suite();
}

