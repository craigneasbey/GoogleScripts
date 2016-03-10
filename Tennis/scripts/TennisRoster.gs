/**
 * V1.0.6
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey
 */

var TESTING_ROSTER = false;

var EMPTY = '';
var ROSTERED = 'Play';
var COULD_BE_AVAILABLE = 'CBA';
var NOT_AVAILABLE = 'NA';
var DEFAULT_YEAR = getStrConfig("DEFAULT_YEAR", "2016");
var MAX_TEAM_MEMBERS = getNumConfig("MAX_TEAM_MEMBERS", 4);
var DEFAULT_MAX_WEEKS_ROSTERED = getNumConfig("DEFAULT_MAX_WEEKS_ROSTERED", 2); // maximum consecutive weeks rostered
var DEFAULT_MAX_WEEKS_REST = getNumConfig("DEFAULT_MAX_WEEKS_REST", 1); // maximum consecutive weeks resting

/**
 * Runs when the spreadsheet is open, adds a menu to the spreadsheet
 */
function onOpen() {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    {name: 'Generate dates...', functionName: 'generateDates_'},
    {name: 'Allocate players...', functionName: 'allocatePlayers_'},
    {name: 'Email players...', functionName: 'emailPlayersMessage_'}
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
  var defaultYear = DEFAULT_YEAR;

  var year = openEntryDialog_('Generate Dates', 'Enter year (default ' + defaultYear + '):');
  Logger.log('year: ' + year);
  
  if(year !== 'CANCEL') {
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
  
  // verify range
  if(!TESTING_ROSTER) {
    var result = openCheckDialog_(currentRange);
  } else {
    var result = true;
  }
  
  if(result) {
    Logger.log("current range: " + JSON.stringify(currentRange));
    
    // get configuration
    if(!TESTING_ROSTER) {
      var promptText = 'Enter maximum consecutive weeks playing (default ' + DEFAULT_MAX_WEEKS_ROSTERED + '):';
      var maxWeeksPlay = openEntryDialog_('Allocation Configuration', promptText);
      
      if(maxWeeksPlay === 'CANCEL') {
        return;
      }
      
      promptText = 'Enter maximum consecutive weeks resting (default ' + DEFAULT_MAX_WEEKS_REST + '):';
      var maxWeeksRest = openEntryDialog_('Allocation Configuration', promptText);
      
      if(maxWeeksRest === 'CANCEL') {
        return;
      }
    } else {
      var maxWeeksPlay = DEFAULT_MAX_WEEKS_ROSTERED;
      var maxWeeksRest = DEFAULT_MAX_WEEKS_REST;
    }
    
    maxWeeksPlay = defaultFor_(maxWeeksPlay, DEFAULT_MAX_WEEKS_ROSTERED);
    maxWeeksRest = defaultFor_(maxWeeksRest, DEFAULT_MAX_WEEKS_REST);
    
    // get the selected history
    var historyArray = getPlayersHistory_(maxWeeksPlay, maxWeeksRest, currentRange, currentSheet);
    
    // allocate roster for selected players
    allocateSelectedPlayers_(maxWeeksPlay, maxWeeksRest, historyArray, currentRange, currentSheet);
    
    // save
    SpreadsheetApp.flush();
  }
}

/**
 * Display dialog for user to confirm the current selected range is correct
 */
function openCheckDialog_(currentRange) {
  
  var ui = SpreadsheetApp.getUi(),
      response = ui.alert(
        'Roster Range Selected', 
        'The current selected range is: ' + currentRange.getA1Notation() + '.\n\n Are you sure you want to continue allocating players in that range?', 
        ui.ButtonSet.YES_NO);

 // Process the user's response.
 if (response == ui.Button.YES) {
   Logger.log('The user clicked "Yes."');
   return true;
 } else {
   Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
 }
  
  return false;
}

/**
 * Display dialog for user to enter text
 */
function openEntryDialog_(promptTitle, promptText) {
  
  var ui = SpreadsheetApp.getUi(),
      response = ui.prompt(
        promptTitle, 
        promptText, 
        ui.ButtonSet.OK_CANCEL);

 // Process the user's response.
 var text = response.getResponseText();
 var button = response.getSelectedButton();
 if (button == ui.Button.OK) {
   Logger.log('The user clicked "OK" and entered text: ' + text);
   return text;
 } else {
   Logger.log('The user clicked "Cancel" or the close button in the dialog\'s title bar.');
 }
  
  return 'CANCEL';
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
    }
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
  var subject = openEntryDialog_('Email Players', 'Subject:');
  
  if(subject === 'CANCEL') {
    return;
  }
  
  // get message
  var message = openEntryDialog_('Email Players', 'Message:');
  
  if(message === 'CANCEL') {
    return;
  }
  
  emailPlayers_(subject, message);
}


/**
 * Tests
 */
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

