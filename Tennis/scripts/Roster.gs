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
var rosterConfig = {};
rosterConfig.TESTING = false;
rosterConfig.DATE_COLUMN = 1; // the first column is the week date
rosterConfig.ROSTER_SHEET_NAME = global.ROSTER_SHEET_NAME;
if(rosterConfig.TESTING) {
  rosterConfig.ROSTER_SHEET_NAME = 'IGNORE - TESTING ONLY';
}

/**
 * Runs when the spreadsheet is open, adds a menu to the spreadsheet
 */
function onOpen() {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    {name: 'Generate dates...', functionName: 'generateDates_'},
    {name: global.MENU_ITEM_ALLOCATE, functionName: 'allocatePlayers_'},
    {name: global.MENU_ITEM_EMAIL, functionName: 'emailPlayersMessage_'},
    {name: global.MENU_ITEM_REMOVE, functionName: 'removePastWeeks_'}
  ];
  spreadsheet.addMenu('Roster', menuItems);
}

/**
 * Runs when spreadsheet cell has finished editing
 */
function onEdit(e) {
  //Logger.log("onEdit: " + JSON.stringify(e));
  
  checkUpdated(e);
}

/**
 * Generate Dates for players schedule
 */
function generateDates_() {
  var defaultYear = global.DEFAULT_YEAR;

  var year = openEntryDialog('Generate Dates', 'Enter year (default ' + defaultYear + '):');
  Logger.log('year: ' + year);
  
  if(year !== CANCEL) {
    year = defaultFor_(year, defaultYear);
    
    var html = HtmlService.createHtmlOutputFromFile('dates.html')
    .setTitle('Year ' + year + ' Dates').setSandboxMode(HtmlService.SandboxMode.IFRAME);
    html.append("<script>var year = " + year + "</script>");
    SpreadsheetApp.getUi().showSidebar(html);
  }
}

/**
 * Generate Roster for players schedule
 */
function allocatePlayers_() {
  var currentSheet = SpreadsheetApp.getActiveSheet();
  var currentRange = currentSheet.getActiveRange();
  
  var promptTitle = '';
  var promptText = '';
  var result = false;
  
  // verify range
  if(!rosterConfig.TESTING) {
    promptTitle = 'Roster Range Selected', 
    promptText = 'The current selected range is: ' + currentRange.getA1Notation();
    promptText += '.\n\n Are you sure you want to continue allocating rostered members in that range?', 
    
    result = openCheckDialog(promptTitle, promptText);
  } else {
    result = true;
  }
  
  if(result) {
    Logger.log("current range: " + JSON.stringify(currentRange));

    var maxWeeksPlay = global.DEFAULT_MAX_WEEKS_ROSTERED;
    var maxWeeksRest = global.DEFAULT_MAX_WEEKS_REST;
    
    // get configuration from user
    if(!rosterConfig.TESTING) {
      promptTitle = 'Allocation Configuration';
      promptText = 'Enter maximum consecutive weeks rostered (default ' + global.DEFAULT_MAX_WEEKS_ROSTERED + '):';
      maxWeeksPlay = openEntryDialog(promptTitle, promptText);
      
      if(maxWeeksPlay === CANCEL) {
        return;
      }
      
      promptText = 'Enter maximum consecutive weeks resting (default ' + global.DEFAULT_MAX_WEEKS_REST + '):';
      maxWeeksRest = openEntryDialog(promptTitle, promptText);
      
      if(maxWeeksRest === CANCEL) {
        return;
      }
    }
    
    maxWeeksPlay = defaultFor_(maxWeeksPlay, global.DEFAULT_MAX_WEEKS_ROSTERED);
    maxWeeksRest = defaultFor_(maxWeeksRest, global.DEFAULT_MAX_WEEKS_REST);
    
    // get the selected history
    var historyArray = getPlayersHistory_(maxWeeksPlay, maxWeeksRest, currentRange, currentSheet);
    
    // allocate roster for selected players
    var save = allocateSelectedPlayers_(maxWeeksPlay, maxWeeksRest, historyArray, currentRange, currentSheet);
    
    if(save) {
      SpreadsheetApp.flush();
    }
  }
}

/*
 * Get playing/rest history from sheet
 */
function getPlayersHistory_(maxWeeksPlay, maxWeeksRest, currentRange, currentSheet) {
  var historyLength = maxWeeksPlay > maxWeeksRest ? maxWeeksPlay : maxWeeksRest;
  var currentRowIndex = currentRange.getRow();
  var currentColumnIndex = currentRange.getColumn();
  
  var historyRows = currentSheet.getRange(currentRowIndex - historyLength, currentColumnIndex, historyLength, currentRange.getNumColumns());
  var historyRowsValues = historyRows.getValues();
  
  var historyArray = rotate(historyRowsValues, 90); // rotate array to the right
  
  return historyArray;
}

/*
 * Allocate players for selected roster
 */
function allocateSelectedPlayers_(maxWeeksPlay, maxWeeksRest, historyArray, currentRange, currentSheet)
{
  var result = false;
  var currentColumnIndex = currentRange.getColumn();
  var currentWidth = currentRange.getNumColumns();
  var fillTeam = { "start" : 0 };
  
  // for each row(week) of the current range
  for(var i=currentRange.getRow(); i < currentRange.getRow() + currentRange.getNumRows(); i++) {
    var numOfRows = 1;
    var currentRow = currentSheet.getRange(i, currentColumnIndex, numOfRows, currentWidth);
    var currentRowArrayArray = currentRow.getValues();
    
    var weekArray = allocatePlayersForWeek(currentRowArrayArray[0], historyArray, maxWeeksPlay, maxWeeksRest, fillTeam);
    
    currentRow.setValues([weekArray]);
    
    historyArray = progressPlayersHistory_(historyArray, weekArray);
    
    result = true;
  }
  
  return result;
}

/**
 * Move history array down the sheet, remove the oldest row, add the latest row
 */
function progressPlayersHistory_(historyArray, newRow) {
  historyArray = rotate(historyArray, -90); // rotate array to the left
  
  historyArray.shift(); // remove top
  historyArray.push(newRow); // add new row to bottom
  
  historyArray = rotate(historyArray, 90); // rotate array to the right again
  
  return historyArray;
}

/**
 * Email all players with a subject and message 
 */
function emailPlayersMessage_() {
 
  // get subject
  var subject = openEntryDialog(global.EMAIL_MEMBERS_DIALOG_TITLE, 'Subject:');
  
  if(subject === CANCEL) {
    return;
  }
  
  // get message
  var message = openEntryDialog(global.EMAIL_MEMBERS_DIALOG_TITLE, 'Message:');
  
  if(message === CANCEL) {
    return;
  }
  
  emailPlayers_(subject, message);
}

/**
 * Remove all weeks older than maximum weeks history required
 */
function removePastWeeks_() {
  var historyLength = global.DEFAULT_MAX_WEEKS_ROSTERED > global.DEFAULT_MAX_WEEKS_REST ? global.DEFAULT_MAX_WEEKS_ROSTERED : global.DEFAULT_MAX_WEEKS_REST;

  // get configuration from user
  if(!rosterConfig.TESTING) {
    var promptText = 'Enter maximum past weeks to keep (default ' + historyLength + '):';
    var maxWeeksHistory = openEntryDialog('Remove Past Weeks Configuration', promptText);
    
    if(maxWeeksHistory === CANCEL) {
      return;
    }
    
    historyLength = defaultFor_(maxWeeksHistory, historyLength);
  }

  // remove history week rows
  var save = removeHistory_(historyLength);
    
  if(save) {
    SpreadsheetApp.flush();
  }
}

/**
 * Remove history week rows older than the history length
 */
function removeHistory_(retainHistoryLength) {
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = currentSpreadsheet.getSheetByName(rosterConfig.ROSTER_SHEET_NAME);
  //Logger.log('rosterConfig.ROSTER_SHEET_NAME: ' + rosterConfig.ROSTER_SHEET_NAME);
  
  // remove all rows between first week index and current week - retainHistoryLength
  var weekRowIndex = findCurrentWeekIndexOnSheet(rosterSheet);
  var deleteNumOfRows = weekRowIndex - retainHistoryLength;
  
  Logger.log('FIRST_ROSTER_ROW: ' + global.FIRST_ROSTER_ROW + ' deleteNumOfRows: ' + deleteNumOfRows);
  if(deleteNumOfRows > 0) {
    rosterSheet.deleteRows(global.FIRST_ROSTER_ROW, deleteNumOfRows);
    return true;
  }
    
  return false;
}


/**
 * Tests
 */
function test_roster_suite() {
  test_progressPlayersHistory();
}


function test_progressPlayersHistory() {
  
  var testArray = new Array("NA","Play","Play","Play","NA","NA","CBA","NA","NA","Play");
  
  var expectedArray = new Array();
  expectedArray[0] = new Array("NA","NA","NA","Play");
  expectedArray[1] = new Array("Play","Play","Play","CBA");
  expectedArray[2] = new Array("Play","Play","Play","CBA");
  expectedArray[3] = new Array("Play","Play","Play","Play");
  expectedArray[4] = new Array("NA","NA","NA","NA");
  expectedArray[5] = new Array("NA","NA","NA","NA");
  expectedArray[6] = new Array("CBA","Play","Play","CBA");
  expectedArray[7] = new Array("NA","NA","NA","Play");
  expectedArray[8] = new Array("NA","NA","NA","NA");
  expectedArray[9] = new Array("Play","CBA","CBA","Play");
  
  var historyArray = new Array();
  historyArray[0] = new Array("NA","NA","Play","");
  historyArray[1] = new Array("Play","Play","CBA","");
  historyArray[2] = new Array("Play","Play","CBA","");
  historyArray[3] = new Array("Play","Play","Play","");
  historyArray[4] = new Array("NA","NA","NA","");
  historyArray[5] = new Array("NA","NA","NA","");
  historyArray[6] = new Array("Play","Play","CBA","");
  historyArray[7] = new Array("NA","NA","Play","");
  historyArray[8] = new Array("NA","NA","NA","");
  historyArray[9] = new Array("CBA","CBA","Play","");
  
  var actualArray = progressPlayersHistory_(historyArray, testArray);
  
  Logger.log(GSUnit.assertArrayEquals('Progress players history', expectedArray, actualArray));
}


/**
 * Manual Tests
 */
function test_generateDates() {
  generateDates_();
}

function test_allocatePlayers() {
  allocatePlayers_();
}

function test_removePastWeeks() {
  removePastWeeks_();
}

