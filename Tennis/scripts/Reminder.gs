/**
 * V1.0.6
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

loadGlobalConfig();

// create local configuration object
var reminderConfig = {};
reminderConfig.TESTING = false;

function createTimeDrivenTriggerForReminder() {
  // Trigger every REMINDER_CHECK_HOUR hours
  ScriptApp.newTrigger('triggerReminder')
      .timeBased()
      .everyHours(global.REMINDER_CHECK_HOUR)
      .create();
}

/**
 * Run from a installed trigger to notify players if they are
 * roster on for this week
 */
function triggerReminder() {  
  var result = false;
  
  // configuration enables all reminders
  if(global.REMINDERS) {
    var now = new Date();
    var currentWeek = getCurrentWeek_(now);
    
    if(Array.isArray(currentWeek)) {
      var result = isReminderRequired_(now, currentWeek[0]); // get current week date
      
      if(reminderConfig.TESTING) {
        result = true;
      }
      
      if(result) {
        var subject = global.REMINDER_SUBJECT;
        var message = global.REMINDER_MESSAGE;
        
        var playerColumns = getRosteredPlayerColumns_(currentWeek);
        var recipients = getIndividualPlayerEmails_(playerColumns);
        
        if(reminderConfig.TESTING) {
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
  var rosterSheet = currentSpreadsheet.getSheetByName(global.ROSTER_SHEET_NAME);
    
  var numOfPlayers = getNumOfPlayers(rosterSheet);
  var numOfColumns = numOfPlayers + 1; // add date column
    
  var rosterRange = rosterSheet.getRange(global.FIRST_ROSTER_ROW,global.DATE_COLUMN,global.MAX_ROSTER_ROWS,numOfColumns);
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
function isReminderRequired_(now, weekValue) {
  
  // convert date stamp to Date
  var weekDate = parseDate(weekValue);
  
  // within global.REMINDER_SEND_BEFORE_DAYS of the current week date
  if(equalDatesWithinTolerance(now, weekDate, global.REMINDER_SEND_BEFORE_DAYS * ONE_DAY_MS)) {
  
    // check if reminder date is set
    if(isRemindered_()) {
      var currentValue = getReminder_();
      
      // convert date stamp to Date
      var reminderDate = parseDate(currentValue);
      
      // if the reminder date is within the REMINDER_SEND_BEFORE_DAYS days of 
      // the current week date, email has already been sent, do not send email
      if(equalDatesWithinTolerance(reminderDate, weekDate, REMINDER_SEND_BEFORE_DAYS * ONE_DAY_MS)) {
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
      if(weekArray[i] === global.ROSTERED) {
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
  var updatedSheet = currentSpreadsheet.getSheetByName(global.UPDATED_SHEET_NAME);
  
  checkUpdatedSheetExists();
  
  if(updatedSheet) {
    // set first cell in second row
    updatedSheet.getRange(global.UPDATED_REMINDER_ROW,1,1,1).setValue(newValue);
  }
}

/**
 * Get the second value on hidden sheet 'Updated'
 */
function getReminder_() { 
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var updatedSheet = currentSpreadsheet.getSheetByName(global.UPDATED_SHEET_NAME);
  
  var currentValue;
  
  if(updatedSheet) {
    // get first cell in second row
    currentValue = updatedSheet.getRange(global.UPDATED_REMINDER_ROW,1,1,1).getValue();
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
 * reminderConfig.TESTING should be set to true before running
 * some individual tests)
 */
function test_manual_reminder_suite() {
  test_setReminder();
  test_isRemindered();
  test_isReminderRequired();
  test_getRosteredPlayerColumns();
  
  reminderConfig.TESTING = true;
  
  test_triggerReminder();
  
  reminderConfig.TESTING = false;
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

function test_isReminderRequired() {
  var weekValue = "23 Feb 2016";
  var now = createLocalDate(2016, 2, 22, 6, 0, 0);
  var testDate = '';
  setReminder_(testDate); // clear reminder
  
  var actual = isReminderRequired_(now, weekValue);
  
  GSUnit.assertTrue('Within a date, send email', actual);

  testDate = new Date(now.getTime() - (ONE_DAY_MS + ONE_DAY_MS)); // 20/02/2016 06:00:00
  setReminder_(testDate.toString());
  
  actual = isReminderRequired_(now, weekValue);
  
  GSUnit.assertTrue('Still within a date, existing reminder, send email', actual);
  
  now.setTime(now.getTime() + ONE_DAY_MS); // 23/02/2016 06:00:00
  testDate.setTime(now.getTime() - (ONE_DAY_MS + ONE_MINUTE_MS)); // 22/02/2016 05:59:00
  
  setReminder_(testDate.toString());
  
  actual = isReminderRequired_(now, weekValue);
  
  GSUnit.assertFalse('Still within a date, reminder already set, do not email', actual);
  
  now = createLocalDate(2016, 2, 21, 20, 0, 0);
  testDate = '';
  setReminder_(testDate); // clear reminder
  
  actual = isReminderRequired_(now, weekValue);

  GSUnit.assertFalse('Older than a day, do not email', actual);
  
  now = createLocalDate(2016, 2, 23, 18, 0, 0);
  testDate = '';
  setReminder_(testDate); // clear reminder
  
  actual = isReminderRequired_(now, weekValue);

  GSUnit.assertTrue('Within a date, newer than a day', actual);
  
  now = createLocalDate(2016, 2, 26, 6, 0, 0);
  testDate = '';
  setReminder_(testDate); // clear reminder
  
  actual = isReminderRequired_(now, weekValue);

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

