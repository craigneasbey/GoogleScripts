/**
 * V1.1.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var Reminder = {};

// create local configuration object
Reminder.Config = {};
Reminder.Config.TESTING = false;
Logger.log("Reminder configuration loaded");

/**
 * Notify members if they are roster on for this week
 */
Reminder.checkReminder = function() {
  var result = false;
  
  // configuration enables all reminders
  if(Global().REMINDERS) {
    var now = new Date();
    var currentWeek = Reminder.getCurrentWeek(now);
    
    if(Array.isArray(currentWeek)) {
      var result = Reminder.isReminderRequired(now, currentWeek[0]); // get current week date
      
      if(Reminder.Config.TESTING) {
        result = true;
      }
      
      if(result) {
        var subject = Global().REMINDER_SUBJECT;
        var message = Global().REMINDER_MESSAGE;
        
        var memberColumns = Reminder.getRosteredMemberColumns(currentWeek);
        var recipients = Notification.getIndividualMemberEmails(memberColumns);
        
        if(Reminder.Config.TESTING) {
          message += '\nrecipients: ' + recipients + '\n';
          recipients = [Session.getActiveUser().getEmail()];
        }
        
        Notification.sendEmail(recipients, subject, message);
        
        // set reminder sent
        Reminder.setReminder(now.toString());
      }
    }
  }
  
  return result;
}

/**
 * Get the current week from the Roster sheet
 */
Reminder.getCurrentWeek = function(now) {
  
  // get all roster weeks
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = currentSpreadsheet.getSheetByName(Global().ROSTER_SHEET_NAME);

  var numOfColumns = Refresh.getNumOfMembers(rosterSheet) + 1; // add date column
    
  var rosterRange = rosterSheet.getRange(Global().FIRST_ROSTER_ROW,Global().DATE_COLUMN,Global().MAX_ROSTER_ROWS,numOfColumns);
  var weeks = rosterRange.getValues();
  
  if(Array.isArray(weeks)) {
    var currentWeekIndex = Refresh.findCurrentWeekIndex(weeks, now); // refresh function
    
    if(currentWeekIndex < weeks.length) {
      return weeks[currentWeekIndex];
    }
  }
  
  return null;
}

/**
 * Triggered to check if a reminder notification is required
 */
Reminder.isReminderRequired = function(now, weekValue) {
  
  // convert date stamp to Date
  var weekDate = DateUtils.parseDate(weekValue);
  
  // within Global().REMINDER_SEND_BEFORE_DAYS of the current week date
  if(DateUtils.equalDatesWithinTolerance(now, weekDate, Global().REMINDER_SEND_BEFORE_DAYS * DateUtils.ONE_DAY_MS)) {
  
    // check if reminder date is set
    if(Reminder.isRemindered()) {
      var currentValue = Reminder.getReminder();
      
      // convert date stamp to Date
      var reminderDate = DateUtils.parseDate(currentValue);
      
      // if the reminder date is within the REMINDER_SEND_BEFORE_DAYS days of 
      // the current week date, email has already been sent, do not send email
      if(DateUtils.equalDatesWithinTolerance(reminderDate, weekDate, Global().REMINDER_SEND_BEFORE_DAYS * DateUtils.ONE_DAY_MS)) {
        return false; // do not send email
      }
    }
      
    return true; // send email
  }
  
  return false; // not yet reminder day
}

/**
 * Get the rostered member columns for a given week
 */
Reminder.getRosteredMemberColumns = function(weekArray) {
  var memberColumns = new Array();

  if(Array.isArray(weekArray)) {
    // start with first rostered value
    for(var i=1; i < weekArray.length; i++) {
      if(weekArray[i] === Global().ROSTERED) {
        memberColumns.push(i);
      }
    }
  }
  
  return memberColumns;
}

/**
 * Update the second value on hidden sheet 'Updated'
 */
Reminder.setReminder = function(newValue) {
  var updatedSheet = Updated.getUpdatedSheet();
  
  Updated.checkUpdatedSheetExists();
  
  if(updatedSheet) {
    // set first cell in second row
    updatedSheet.getRange(Global().UPDATED_REMINDER_ROW,1,1,1).setValue(newValue);
  }
}

/**
 * Get the second value on hidden sheet 'Updated'
 */
Reminder.getReminder = function getReminder() {
  var updatedSheet = Updated.getUpdatedSheet();
  
  var currentValue;
  
  if(updatedSheet) {
    // get first cell in second row
    currentValue = updatedSheet.getRange(Global().UPDATED_REMINDER_ROW,1,1,1).getValue();
  }
  
  return currentValue;
}

/**
 * Check if the second value on hidden sheet 'Updated' exists
 */
Reminder.isRemindered = function() {
  var currentValue = Reminder.getReminder();
  
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
  test_getRosteredMemberColumns();
  
  Reminder.Config.TESTING = true;
  
  test_triggerReminder();
  
  Reminder.Config.TESTING = false;
}

function test_setReminder() {
  var expected = 'this is a test also';
  
  Reminder.setReminder(expected);
  var actual = Reminder.getReminder();

  GSUnit.assertEquals('Set Reminder', expected, actual);
  
  // reset cell
  Reminder.setReminder('');
}

function test_isRemindered() {
  var testStr = 'This is a test also';
  
  Reminder.setReminder(testStr);
  var actual = Reminder.isRemindered();

  GSUnit.assertTrue('Is set reminder', actual);
  
  // reset cell
  Reminder.setReminder('');
  
  actual = Reminder.isRemindered();

  GSUnit.assertFalse('Is empty reminder', actual);
}

function test_isReminderRequired() {
  var weekValue = "23 Feb 2016";
  var now = DateUtils.createLocalDate(2016, 2, 22, 6, 0, 0);
  var testDate = '';
  Reminder.setReminder(testDate); // clear reminder
  
  var actual = Reminder.isReminderRequired(now, weekValue);
  
  GSUnit.assertTrue('Within a date, send email', actual);

  testDate = new Date(now.getTime() - (DateUtils.ONE_DAY_MS + DateUtils.ONE_DAY_MS)); // 20/02/2016 06:00:00
  Reminder.setReminder(testDate.toString());
  
  actual = Reminder.isReminderRequired(now, weekValue);
  
  GSUnit.assertTrue('Still within a date, existing reminder, send email', actual);
  
  now.setTime(now.getTime() + DateUtils.ONE_DAY_MS); // 23/02/2016 06:00:00
  testDate.setTime(now.getTime() - (DateUtils.ONE_DAY_MS + DateUtils.ONE_MINUTE_MS)); // 22/02/2016 05:59:00
  
  Reminder.setReminder(testDate.toString());
  
  actual = Reminder.isReminderRequired(now, weekValue);
  
  GSUnit.assertFalse('Still within a date, reminder already set, do not email', actual);
  
  now = DateUtils.createLocalDate(2016, 2, 21, 20, 0, 0);
  testDate = '';
  Reminder.setReminder(testDate); // clear reminder
  
  actual = Reminder.isReminderRequired(now, weekValue);

  GSUnit.assertFalse('Older than a day, do not email', actual);
  
  now = DateUtils.createLocalDate(2016, 2, 23, 18, 0, 0);
  testDate = '';
  Reminder.setReminder(testDate); // clear reminder
  
  actual = Reminder.isReminderRequired(now, weekValue);

  GSUnit.assertTrue('Within a date, newer than a day', actual);
  
  now = DateUtils.createLocalDate(2016, 2, 26, 6, 0, 0);
  testDate = '';
  Reminder.setReminder(testDate); // clear reminder
  
  actual = Reminder.isReminderRequired(now, weekValue);

  GSUnit.assertFalse('Newer than a day', actual);
  
  Reminder.setReminder('');
}

function test_getRosteredMemberColumns() {
  var testArray = new Array("23 Feb 2016","Play","Play","Play","NA","NA","CBA","NA","NA","Play");
  
  var expectedArray = new Array(1,2,3,9);
  
  var actualArray = Reminder.getRosteredMemberColumns(testArray);
  
  GSUnit.assertArrayEquals('Rostered member columns', expectedArray, actualArray);
  
  testArray = new Array();
  
  expectedArray = new Array();
  
  actualArray = Reminder.getRosteredMemberColumns(testArray);
  
  GSUnit.assertArrayEquals('Rostered member columns no columns', expectedArray, actualArray);
  
  testArray = null;
  
  expectedArray = new Array();
  
  actualArray = Reminder.getRosteredMemberColumns(testArray);
  
  GSUnit.assertArrayEquals('Rostered Member Columns null', expectedArray, actualArray);
}

function test_checkReminder() {
  checkReminder();
}

