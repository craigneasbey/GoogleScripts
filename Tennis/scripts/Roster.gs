/**
 * V1.2.2
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
  var currentRangeDescription = currentRange.getA1Notation();
  var userConfiguration = {};
  userConfiguration.maxWeeksRostered = Global().DEFAULT_MAX_WEEKS_ROSTERED;
  userConfiguration.maxWeeksRest = Global().DEFAULT_MAX_WEEKS_REST;
  var result = false;
  
  Logger.log("Roster current range: " + currentRangeDescription);
  Logger.log("Roster current sheet: " + currentSheet.getName());
 
  if(Roster.Config.TESTING) {
    result = true;
  } else {
    result = Roster.getUserAllocationConfiguration(userConfiguration, currentRangeDescription);
  }
    
  if(result) {
    // check user input
    userConfiguration.maxWeeksRostered = defaultFor(userConfiguration.maxWeeksRostered, Global().DEFAULT_MAX_WEEKS_ROSTERED);
    userConfiguration.maxWeeksRest = defaultFor(userConfiguration.maxWeeksRest, Global().DEFAULT_MAX_WEEKS_REST);
    
    // get the selected history
    var historyArray = Roster.getSelectHistory(userConfiguration.maxWeeksRostered, userConfiguration.maxWeeksRest, currentRange, currentSheet);
    
    // get the selected roster weeks
    var weeksArray = currentRange.getValues();
    
    // best allocate roster for selected members
    
    // TODO remove userConfiguration.maxWeeksRostered, userConfiguration.maxWeeksRest
    // var save = AllocateMembers.allocateSelectedMembers(weeksArray, historyArray, userConfiguration.maxWeeksRostered, userConfiguration.maxWeeksRest);
    var save = BestAllocateMembers.bestAllocateSelectedMembers(weeksArray, historyArray);
        
    if(save) {
      currentRange.setValues(weeksArray);
      SpreadsheetApp.flush();
    }
  }
}

/**
 * Prompt the user for roster allocation configuration values
 */
Roster.getUserAllocationConfiguration = function(userConfiguration, currentRangeDescription) {
  var promptTitle = '';
  var promptText = '';
  var result = false;
  
  // verify range
  promptTitle = 'Roster Range Selected';
  promptText = 'The current selected range is: ' + currentRangeDescription;
  promptText += '.\n\n Are you sure you want to continue allocating rostered members in that range?', 
    
  result = GUIUtils.openCheckDialog(promptTitle, promptText);
  
  if(result) {
    Logger.log("current range: " + JSON.stringify(currentRangeDescription));
    
    // get configuration from user
    promptTitle = 'Allocation Configuration';
    promptText = 'Enter maximum consecutive weeks rostered (default ' + userConfiguration.maxWeeksRostered + '):';
    userConfiguration.maxWeeksRostered = GUIUtils.openEntryDialog(promptTitle, promptText);
    
    if(userConfiguration.maxWeeksRostered === GUIUtils.CANCEL) {
      return false;
    }
    
    promptText = 'Enter maximum consecutive weeks resting (default ' + userConfiguration.maxWeeksRest + '):';
    userConfiguration.maxWeeksRest = GUIUtils.openEntryDialog(promptTitle, promptText);
    
    if(userConfiguration.maxWeeksRest === GUIUtils.CANCEL) {
      return false;
    }
  }
  
  return result;
}

/*
 * Get rostered/rest history from sheet
 */
Roster.getSelectHistory = function(maxWeeksRostered, maxWeeksRest, currentRange, currentSheet) {
  var historyLength = maxWeeksRostered > maxWeeksRest ? maxWeeksRostered : maxWeeksRest;
  var currentRowIndex = currentRange.getRow();
  var currentColumnIndex = currentRange.getColumn();
  var currentNumOfColumns = currentRange.getNumColumns();
  
  var historyRows = currentSheet.getRange(currentRowIndex - historyLength, currentColumnIndex, historyLength, currentNumOfColumns);
  var historyArray = historyRows.getValues();
  
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
  var save = Roster.removeHistory(historyLength);
    
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
  
  // remove all rows between first week index and current week minus retain history length
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
  test_best_allocate_suite();
  test_allocate_suite();
  test_refresh_suite();
  test_reminder_suite();
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

