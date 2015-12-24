/**
 * V1.0.1
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey
 */

var TESTING_NOTIFICATION = false;

var ONE_DAY_MS = 1000 * 60 * 60 * 24;
var ONE_HOUR_MS = 1000 * 60 * 60;

/**
 * Updates notification that the Roster sheet has been edited if it 
 * has not already been set
 */
function updateNotification(element) {
  if(element && element.range && element.range.getSheet().getName() === 'Roster') {  
    if(!isUpdated_()) {
      // get date stamp
      var now = new Date();
      // update updated cell
      setUpdated_(now.toString());
    }
  }
  
  return getUpdated_();
}

/**
 * Update value on hidden sheet 'Updated'
 */
function setUpdated_(newValue) { 
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var updatedSheet = currentSpreadsheet.getSheetByName('Updated');
  
  if(updatedSheet) {
    // set first cell
    updatedSheet.getRange(1,1,1,1).setValue(newValue);
  }
}

/**
 * Get value on hidden sheet 'Updated'
 */
function getUpdated_() { 
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var updatedSheet = currentSpreadsheet.getSheetByName('Updated');
  
  var currentValue;
  
  if(updatedSheet) {
    // get first cell
    currentValue = updatedSheet.getRange(1,1,1,1).getValue();
  }
  
  return currentValue;
}

/**
 * Check if the value on hidden sheet 'Updated' exists
 */
function isUpdated_() { 
  var currentValue = getUpdated_();
  
  if(currentValue) {
    return !isEmptyStr(currentValue);
  }
  
  return false;
}

function createTimeDrivenTriggerForNotification() {
  // Trigger every 6 hours
  ScriptApp.newTrigger('triggerNotification')
      .timeBased()
      .everyHours(6)
      .create();
}

/**
 * Run from a installed trigger to notify players if the sheet has updated
 */
function triggerNotification() {
  var result = checkNotificationRequired_();
  
  if(result) {
    var subject = 'Tennis Roster Updated';
    var message = 'Please check the tennis roster as it has been recently updated:';
    message += ' https://docs.google.com/spreadsheets/d/1GgrBVMG9XDi1oqsufmX1dGD9HCM_hDEAOpVvWGJTcF0/edit?usp=sharing';
    
    emailPlayers_(subject, message);
    
    // reset updated
    setUpdated_('');
  }
  
  return result;
}

/**
 * Triggered to check if a notification is required
 */
function checkNotificationRequired_() {
  if(isUpdated_()) {
    var currentValue = getUpdated_();
    
    // convert date stamp to Date
    var updatedDate = new Date(currentValue);
    
    // if the updated date is older than 1 day, return true
    var now = new Date();
    if(updatedDate < now - ONE_DAY_MS) {
      return true;
    }
  }
  
  return false;
}

/**
 * Emails all the players
 */
function emailPlayers_(subject, message) {
  var playerEmails = getPlayerEmails_();
  
  sendEmails_(playerEmails, subject, message);
}

/**
 * Emails all the players
 */
function getPlayerEmails_() {
  var emails = new Array();
  
  if(!TESTING_NOTIFICATION) {
    var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var updatedSheet = currentSpreadsheet.getSheetByName('Roster');
    
    var startRow = 5;  // row with player emails
    var startCol = 2;
    var numRows = 1;
    var numCols = 100; // arbitrary number
    
    var dataRange = updatedSheet.getRange(startRow, startCol, numRows, numCols);
    var data = dataRange.getValues();
    
    for (i in data) {
      var row = data[i];
      for (j in row) {
        if(!isEmptyStr(row[j])) {
          emails.push(row[j]);
        }
      }
    }
  } else {
    emails.push(Session.getActiveUser().getEmail());
  }
  
  return emails;
}

/**
 * Sends emails with this spreadsheet attached
 */
function sendEmails_(recipients, subject, message) {
  var file = DriveApp.getFileById(SPREADSHEET_DOCUMENT_ID);
  var options = {
    name: 'Tennis Roster',
    attachments: [file.getAs(MimeType.PDF)] 
  };
  
  message += '\n\nNOTE: Tennis roster attached in PDF format (ignore other sheets)';
  
  
  if(Array.isArray(recipients)) {
    for (i in recipients) {
      MailApp.sendEmail(recipients[i], subject, message, options);
    }
  }
}


/**
 * Tests
 */
function test_notification_suite() {
  test_getPlayerEmails();
  test_updateNotification();
  test_setUpdated();
  test_isUpdated();
  test_checkNotificationRequired();
}

function test_getPlayerEmails() {
  var expectedMinLength = 1;
  
  var actualArray = getPlayerEmails_();

  GSUnit.assertTrue('Player emails is array', Array.isArray(actualArray));  
  GSUnit.assertTrue('Player emails has length', actualArray.length > expectedMinLength);
  
  for(var i=0; i < actualArray.length; i++) {
    var comment = 'Email ' + actualArray[i] + ' is not a valid email address';
    GSUnit.assertTrue(comment, actualArray[i].indexOf('@') === -1 ? false : true);
  }
}

function test_updateNotification() {
  var expected = (new Date()).toString();
  
  var actual = updateNotification(null);

  GSUnit.assertNotEquals('Update notification', expected, actual);
}

function test_setUpdated() {
  var expected = 'this is a test';
  
  setUpdated_(expected);
  var actual = getUpdated_();

  GSUnit.assertEquals('Set Updated', expected, actual);
  
  // reset cell
  setUpdated_('');
}

function test_isUpdated() {
  var testStr = 'this is a test';
  
  setUpdated_(testStr);
  var actual = isUpdated_();

  GSUnit.assertTrue('This is a test', actual);
  
  // reset cell
  setUpdated_('');
  
  actual = isUpdated_();

  GSUnit.assertFalse('Empty', actual);
}

function test_checkNotificationRequired() {
  var testDate = new Date();
  setUpdated_(testDate.toString());
  
  var actual = checkNotificationRequired_();
  
  GSUnit.assertFalse('Within a date', actual);

  testDate = new Date() - (ONE_DAY_MS + ONE_HOUR_MS);
  setUpdated_(testDate.toString());
  
  actual = checkNotificationRequired_();

  GSUnit.assertTrue('Older than a day', actual);
  
  setUpdated_('');
  
  actual = checkNotificationRequired_();

  GSUnit.assertFalse('Reset cell', actual);
}


/**
 * manual testing only
 */
function test_triggerNotification_NoEmail() {
  var testDate = new Date();
  
  setUpdated_(testDate.toString());
  
  GSUnit.assertFalse('No email trigger notification', triggerNotification());
}

function test_triggerNotification_Email() {
  var testDate = new Date() - (ONE_DAY_MS + ONE_HOUR_MS + ONE_DAY_MS);
  
  setUpdated_(testDate.toString());
  
  GSUnit.assertTrue('Email trigger notification', triggerNotification());
}

function test_sendEmails() {
  sendEmails_([Session.getActiveUser().getEmail()], 'Test Notification', 'This is a test notification');
}
