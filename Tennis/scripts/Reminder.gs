/**
 * V1.0.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey
 */

var TESTING_REMINDER = false;

var REMINDER_SEND_BEFORE_DAYS = getNumConfig("REMINDER_SEND_BEFORE_DAYS", 1);

function createTimeDrivenTriggerForReminder() {
  // Trigger every REMINDER_CHECK_HOUR hours
  ScriptApp.newTrigger('triggerReminder')
      .timeBased()
      .everyHours(REMINDER_CHECK_HOUR)
      .create();
}

/**
 * Run from a installed trigger to notify players if they are
 * roster on for this week
 */
function triggerReminder() {
  var result = false;
  
  var now = new Date();
  var currentWeek = getCurrentWeek_(now);
  
  if(Array.isArray(currentWeek)) {
    var result = checkReminderRequired_(now, currentWeek[0]); // get current week date
    
    if(result) {
      var subject = 'Tennis Roster Reminder';
      var message = 'This is a reminder that you are rostered on to play tennis this week.';
      
      var playerColumns = getRosteredPlayerColumns_(currentWeek);
      var recipients = getIndividualPlayerEmails_(playerColumns);
      
      sendEmail_(recipients, subject, message);
      
      // set reminder sent
      setReminder_(now.toString());
    }
  }
  
  return result;
}

/**
 * Get the current week from the Roster sheet
 */
function getCurrentWeek_(now) {
  
  // get all roster weeks
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = currentSpreadsheet.getSheetByName(ROSTER_SHEET_NAME);
    
  var numOfPlayers = getNumOfPlayers(rosterSheet);
  var numOfColumns = numOfPlayers + 1; // add date column
    
  var rosterRange = rosterSheet.getRange(FIRST_ROSTER_ROW,DATE_COLUMN,MAX_ROSTER_ROWS,numOfColumns);
  var weeks = rosterRange.getValues();
  
  if(Array.isArray(weeks)) {
    var currentWeekIndex = findCurrentWeekIndex(weeks, now);
    
    if(currentWeekIndex < weeks.length) {
      return weeks[currentWeekIndex];
    }
  }
  
  return null;
}

/**
 * Triggered to check if a reminder notification is required
 */
function checkReminderRequired_(now, weekValue) {
  
  // check if reminder date should be reset
  if(isRemindered_()) {
    var currentValue = getReminder_();
    
    // convert date stamp to Date
    var reminderDate = parseDate(currentValue);
    
    // if the reminder date within REMINDER_SEND_BEFORE_DAYS days, reset the reminder
    if(!equalWithinTolerance(now.getTime(), reminderDate.getTime(), REMINDER_SEND_BEFORE_DAYS * ONE_DAY_MS)) {
      setReminder_('');
    }
  }
   
  // convert date stamp to Date
  var weekDate = parseDate(weekValue);
  
  // has reminder already been emailed and is it still within 
  // REMINDER_SEND_BEFORE_DAYS of the current week date
  if(!isRemindered_() && equalWithinTolerance(now.getTime(), weekDate.getTime(), REMINDER_SEND_BEFORE_DAYS * ONE_DAY_MS)) {
    return true;
  }
  
  return false;
}

/**
 * Get the rostered player columns for a given week
 */
function getRosteredPlayerColumns_(weekArray) {
  var playerColumns = new Array();

  if(Array.isArray(weekArray)) {
    // start with first rostered value
    for(var i=1; i < weekArray.length; i++) {
      if(weekArray[i] === ROSTERED) {
        playerColumns.push(i);
      }
    }
  }
  
  return playerColumns;
}

/**
 * Update the second value on hidden sheet 'Updated'
 */
function setReminder_(newValue) { 
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var updatedSheet = currentSpreadsheet.getSheetByName(UPDATED_SHEET_NAME);
  
  checkUpdatedSheetExists();
  
  if(updatedSheet) {
    // set first cell in second row
    updatedSheet.getRange(UPDATED_REMINDER_ROW,1,1,1).setValue(newValue);
  }
}

/**
 * Get the second value on hidden sheet 'Updated'
 */
function getReminder_() { 
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var updatedSheet = currentSpreadsheet.getSheetByName(UPDATED_SHEET_NAME);
  
  var currentValue;
  
  if(updatedSheet) {
    // get first cell in second row
    currentValue = updatedSheet.getRange(UPDATED_REMINDER_ROW,1,1,1).getValue();
  }
  
  return currentValue;
}

/**
 * Check if the second value on hidden sheet 'Updated' exists
 */
function isRemindered_() { 
  var currentValue = getReminder_();
  
  if(currentValue) {
    return !isEmptyStr(currentValue);
  }
  
  return false;
}


/**
 * Manual Tests (relies on Roster and Updated sheet values,
 * TESTING_NOTIFICATION should be set to true before running
 * some individual tests)
 */
function test_manual_reminder_suite() {
  test_setReminder();
  test_isRemindered();
  test_checkReminderRequired();
  test_getRosteredPlayerColumns();
}

function test_setReminder() {
  var expected = 'this is a test also';
  
  setReminder_(expected);
  var actual = getReminder_();

  GSUnit.assertEquals('Set Reminder', expected, actual);
  
  // reset cell
  setReminder_('');
}

function test_isRemindered() {
  var testStr = 'This is a test also';
  
  setReminder_(testStr);
  var actual = isRemindered_();

  GSUnit.assertTrue('This is a test also', actual);
  
  // reset cell
  setReminder_('');
  
  actual = isRemindered_();

  GSUnit.assertFalse('Empty reminder', actual);
}

function test_checkReminderRequired() {
  // AEDT(13) or AEST(14)
  var now = new Date(Date.UTC(2016, 1, 21, 19, 0, 0)); // 22 Feb 2016 06:00:00
  var weekValue = "23 Feb 2016";
  var testDate = '';
  setReminder_(testDate);
  
  var actual = checkReminderRequired_(now, weekValue);
  
  GSUnit.assertTrue('Within a date', actual);

  testDate = new Date() - (ONE_DAY_MS + ONE_DAY_MS);
  setReminder_(testDate.toString());
  
  actual = checkReminderRequired_(now, weekValue);
  
  GSUnit.assertTrue('Within a date, reset reminder', actual);
  
  testDate = now - (ONE_HOUR_MS);
  
  setReminder_(testDate.toString());
  
  actual = checkReminderRequired_(now, weekValue);
  
  GSUnit.assertFalse('Within a date, reminder set', actual);
  
  // AEDT(13) or AEST(14)
  now = new Date(Date.UTC(2016, 1, 21, 13, 0, 0)); // 22 Feb 2016
  
  actual = checkReminderRequired_(now, weekValue);

  GSUnit.assertFalse('Older than a day', actual);
  
  // AEDT(13) or AEST(14)
  now = new Date(Date.UTC(2016, 1, 23, 7, 0, 0)); // 23 Feb 2016 18:00:00
  
  actual = checkReminderRequired_(now, weekValue);

  GSUnit.assertTrue('Within a date, newer than a day', actual);
  
  // AEDT(13) or AEST(14)
  now = new Date(Date.UTC(2016, 1, 25, 13, 0, 0)); // 26 Feb 2016
  
  actual = checkReminderRequired_(now, weekValue);

  GSUnit.assertFalse('Newer than a day', actual);
  
  setReminder_('');
}

function test_getRosteredPlayerColumns() {
  var testArray = new Array("23 Feb 2016","Play","Play","Play","NA","NA","CBA","NA","NA","Play");
  
  var expectedArray = new Array(1,2,3,9);
  
  var actualArray = getRosteredPlayerColumns_(testArray);
  
  GSUnit.assertArrayEquals('Rostered Player Columns', expectedArray, actualArray);
  
  testArray = new Array();
  
  expectedArray = new Array();
  
  actualArray = getRosteredPlayerColumns_(testArray);
  
  GSUnit.assertArrayEquals('Rostered Player Columns No Columns', expectedArray, actualArray);
  
  testArray = null;
  
  expectedArray = new Array();
  
  actualArray = getRosteredPlayerColumns_(testArray);
  
  GSUnit.assertArrayEquals('Rostered Player Columns null', expectedArray, actualArray);
}

