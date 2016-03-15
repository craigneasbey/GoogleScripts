/**
 * V1.0.4
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var TESTING_REMINDER = false;

var REMINDERS = getBoolConfig("REMINDERS", true);
var REMINDER_SEND_BEFORE_DAYS = getNumConfig("REMINDER_SEND_BEFORE_DAYS", 1);
var REMINDER_CHECK_HOUR = getNumConfig("REMINDER_CHECK_HOUR", 6);
var REMINDER_SUBJECT = getStrConfig("REMINDER_SUBJECT", 'Tennis Roster Reminder');
var REMINDER_MESSAGE = getStrConfig("REMINDER_MESSAGE", 'This is a reminder that you are rostered on to play tennis this week.');

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
  
  // configuration enables all reminders
  if(REMINDERS) {
    var now = new Date();
    var currentWeek = getCurrentWeek_(now);
    
    if(Array.isArray(currentWeek)) {
      var result = checkReminderRequired_(now, currentWeek[0]); // get current week date
      
      if(TESTING_REMINDER) {
        result = true;
      }
      
      if(result) {
        var subject = REMINDER_SUBJECT;
        var message = REMINDER_MESSAGE;
        
        var playerColumns = getRosteredPlayerColumns_(currentWeek);
        var recipients = getIndividualPlayerEmails_(playerColumns);
        
        if(TESTING_REMINDER) {
          message += '\nrecipients: ' + recipients + '\n';
          recipients = [Session.getActiveUser().getEmail()];
        }
        
        sendEmail_(recipients, subject, message);
        
        // set reminder sent
        setReminder_(now.toString());
      }
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
    var currentWeekIndex = findCurrentWeekIndex(weeks, now); // refresh function
    
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
  
  // convert date stamp to Date
  var weekDate = parseDate(weekValue);
  
  // within REMINDER_SEND_BEFORE_DAYS of the current week date
  if(equalDatesWithinTolerance(now, weekDate, REMINDER_SEND_BEFORE_DAYS * ONE_DAY_MS)) {
  
    // check if reminder date is set
    if(isRemindered_()) {
      var currentValue = getReminder_();
      
      // convert date stamp to Date
      var reminderDate = parseDate(currentValue);
      
      // if the reminder date is within the REMINDER_SEND_BEFORE_DAYS days, email has already been sent
      if(equalDatesWithinTolerance(now, reminderDate, REMINDER_SEND_BEFORE_DAYS * ONE_DAY_MS)) {
        return false; // do not send email
      }
    }
      
    return true; // send email
  }
  
  return false; // not yet reminder day
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
  
  if(isEmptyStr(currentValue)) {
    return false;
  }
  
  return true;
}


/**
 * Manual Tests (relies on Roster and Updated sheet values,
 * TESTING_REMINDER should be set to true before running
 * some individual tests)
 */
function test_manual_reminder_suite() {
  test_setReminder();
  test_isRemindered();
  test_checkReminderRequired();
  test_getRosteredPlayerColumns();
  
  TESTING_REMINDER = true;
  
  test_triggerReminder();
  
  TESTING_REMINDER = false;
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

  GSUnit.assertTrue('Is set reminder', actual);
  
  // reset cell
  setReminder_('');
  
  actual = isRemindered_();

  GSUnit.assertFalse('Is empty reminder', actual);
}

function test_checkReminderRequired() {
  var weekValue = "23 Feb 2016";
  var now = createLocalDate(2016, 2, 22, 6, 0, 0);
  var testDate = '';
  setReminder_(testDate); // clear reminder
  
  var actual = checkReminderRequired_(now, weekValue);
  
  GSUnit.assertTrue('Within a date, send email', actual);

  testDate = now - (ONE_DAY_MS + ONE_DAY_MS);
  setReminder_(testDate.toString());
  
  actual = checkReminderRequired_(now, weekValue);
  
  GSUnit.assertTrue('Still within a date, existing reminder, send email', actual);
  
  testDate = now - (ONE_HOUR_MS);
  
  setReminder_(testDate.toString());
  
  actual = checkReminderRequired_(now, weekValue);
  
  GSUnit.assertFalse('Still within a date, reminder already set, do not email', actual);
  
  now = createLocalDate(2016, 2, 21, 20, 0, 0);
  testDate = '';
  setReminder_(testDate); // clear reminder
  
  actual = checkReminderRequired_(now, weekValue);

  GSUnit.assertFalse('Older than a day, do not email', actual);
  
  now = createLocalDate(2016, 2, 23, 18, 0, 0);
  testDate = '';
  setReminder_(testDate); // clear reminder
  
  actual = checkReminderRequired_(now, weekValue);

  GSUnit.assertTrue('Within a date, newer than a day', actual);
  
  now = createLocalDate(2016, 2, 26, 6, 0, 0);
  testDate = '';
  setReminder_(testDate); // clear reminder
  
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

function test_triggerReminder() {
  triggerReminder();
}

