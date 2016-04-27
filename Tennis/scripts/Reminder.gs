/**
 * V1.1.1
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
        
        var memberReminders = Reminder.getMembersReminder();
        var memberRemindersColumns = Reminder.getReminderMemberColumns(memberReminders);
        var memberRosteredColumns = Reminder.getRosteredMemberColumns(currentWeek);
        var enabledMemberRemindersColumns = Reminder.enabledReminderMemberColumns(memberRosteredColumns, memberRemindersColumns);
        var recipients = Notification.getIndividualMemberEmails(enabledMemberRemindersColumns);
        
        if(Reminder.Config.TESTING) {
          message += '<div style="margin-top: 20px; margin-bottom: 20px;">recipients: ' + recipients + '</div>';
          recipients = [Session.getActiveUser().getEmail()];
        }
        
        message += Notification.createHTMLTable(Reminder.getCurrentWeekWithHeader());
        
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
    var currentWeekIndex = Refresh.findCurrentWeekIndex(weeks, now);
    
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
 * Get the member reminder row in an array
 */
Reminder.getMembersReminder = function() {
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = currentSpreadsheet.getSheetByName(Global().ROSTER_SHEET_NAME);
  
  var startRow = Global().MEMBER_REMINDER_ROW; // row with member reminder preference (Yes/No)
  var startCol = 1; // first empty column remove later
  var numRows = 1;
  var numCols = Global().MAX_MEMBER_COLUMNS;
  
  var dataRange = rosterSheet.getRange(startRow, startCol, numRows, numCols);
  
  return ArrayUtils.convertToArray(dataRange.getValues());
}

/**
 * Get the reminder member columns
 */
Reminder.getReminderMemberColumns = function(memberReminders) {
  return Reminder.getColumnNumbers(memberReminders, Global().REMINDERS_ENABLED);
}

/**
 * Get the rostered member columns for a given week
 */
Reminder.getRosteredMemberColumns = function(weekArray) {
  return Reminder.getColumnNumbers(weekArray, Global().ROSTERED);
}

/**
 * Get the columns numbers that equal the required value.
 * Start with first column value.
 */
Reminder.getColumnNumbers = function(columnArray, requiredValue) {
  var columns = new Array();

  if(Array.isArray(columnArray)) {
    // start with first column value
    for(var i = 1; i < columnArray.length; i++) {
      if(columnArray[i] === requiredValue) {
        columns.push(i);
      }
    }
  }
  
  return columns;
}

/**
 * Filter member columns on enabled reminders
 */
Reminder.enabledReminderMemberColumns = function(memberRosteredColumns, memberReminderColumns) {
  var memberReminders = new Array();
  
  if(Array.isArray(memberRosteredColumns) && Array.isArray(memberReminderColumns)) {
    var found = false;
    
    for (i in memberRosteredColumns) {
      var found = false;
      for (var j = 0; j < memberReminderColumns.length && !found; j++) {
        if(memberRosteredColumns[i] === memberReminderColumns[j]) {
          memberReminders.push(memberRosteredColumns[i]);
          found = true;
        }
      }
    }
  }
  
  return memberReminders;
}

/**
 * Get the member names row and current week row
 */
Reminder.getCurrentWeekWithHeader = function() {
  var currentWeek = new Array();
  
  // get member names row as header
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = currentSpreadsheet.getSheetByName(Global().ROSTER_SHEET_NAME);
  var names = Refresh.getMemberNames(rosterSheet);
  names.unshift(""); // add a empty string to the front of the array for display
  currentWeek.push(names);
  
  // get current week row
  var currentWeekRow = Reminder.getCurrentWeek(new Date());
  // change date to date stamp string
  currentWeekRow[Global().DATE_COLUMN - 1] = DateUtils.formatDateDD_MON_YYYY(currentWeekRow[Global().DATE_COLUMN - 1]);
  currentWeek.push(currentWeekRow);
  
  return currentWeek;
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
 * Tests
 */
function test_reminder_suite() {
  test_get_reminder_member_columns();
  test_get_rostered_member_columns();
  test_get_column_numbers();
  test_enabled_reminder_member_columns();
}

function test_get_reminder_member_columns() {
  var memberReminders = new Array("", "No","Yes","No","No","No","No","No","No","Yes","No");
  var expectedArray = new Array(2,9);
  
  var actualArray = Reminder.getReminderMemberColumns(memberReminders);

  GSUnit.assertArrayEquals('Reminder member columns', expectedArray, actualArray);
}

function test_get_rostered_member_columns() {
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
  
  GSUnit.assertArrayEquals('Rostered member columns null', expectedArray, actualArray);
}

function test_get_column_numbers() {
  var columnArray = new Array("Test", "Test","Yes","No","No","is","This","No","Test","Hi");
  var requiredValue = "Test";
  var expectedArray = new Array(1,8);
  
  var actualArray = Reminder.getColumnNumbers(columnArray, requiredValue);

  GSUnit.assertArrayEquals('Column numbers', expectedArray, actualArray);
}

function test_enabled_reminder_member_columns() {
  var memberRosteredColumns = new Array(1,2,3,9);
  var memberReminderColumns = new Array(2,9);
  var expectedArray = new Array(2,9);
  
  var actualArray = Reminder.enabledReminderMemberColumns(memberRosteredColumns, memberReminderColumns); 
  
  GSUnit.assertArrayEquals('Enabled reminder member columns', expectedArray, actualArray);
}


/**
 * Manual Tests (relies on Roster and Updated sheet values,
 * Reminder.Config.TESTING should be set to true before running
 * some individual tests)
 */
function test_manual_reminder_suite() {
  test_get_reminder_member_columns();
  test_get_rostered_member_columns();
  test_enabled_reminder_member_columns();
  test_get_current_week_with_header();
  test_setReminder();
  test_isRemindered();
  test_isReminderRequired();
  
  Reminder.Config.TESTING = true;
  
  test_checkReminder();
  
  Reminder.Config.TESTING = false;
}

function test_get_current_week_with_header() {
  var actualArray = Reminder.getCurrentWeekWithHeader();
  
  GSUnit.assertTrue('Current week with header size', actualArray.length === 2);
  GSUnit.assertTrue('Current week with header names size', actualArray[0].length === 7);
  GSUnit.assertTrue('Current week with header names first blank', isEmptyStr(actualArray[0][0]));
  GSUnit.assertTrue('Current week with header roster size', actualArray[1].length === 7);
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

function test_checkReminder() {
  Reminder.checkReminder();
}

