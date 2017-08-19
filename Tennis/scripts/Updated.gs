/**
 * V1.1.2
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var Updated = {};

// create local configuration object
Updated.Config = {};
Updated.Config.TESTING = false;
Logger.log("Updated configuration loaded");

/**
 * Notify members if the sheet has updated
 */
Updated.checkUpdated = function() {
  var now = new Date();
  var result = Updated.checkUpdatedNotificationRequired(now);
  
  if(result) {
  	var recipients = Notification.getMemberEmails();
    var subject = Global().UPDATED_SUBJECT;
    var message = Global().UPDATED_MESSAGE;
    
    if(Updated.Config.TESTING) {
      message += '<div style="margin-top: 20px; margin-bottom: 20px;">recipients: ' + recipients + '</div>';
      recipients = [Session.getActiveUser().getEmail()];
    }
    
    var errorWeeks = Validation.checkValidation();
    
    // if array has any weeks
    if(errorWeeks.length > 0) {
      var preview = new Array();
  
      // get member names row as header
      preview.push(Reminder.getHeader());
      
      // for each error week
      for(var i = 0; i < errorWeeks.length; i++) {
        // change date to date stamp string
        errorWeeks[i][Global().DATE_COLUMN - 1] = DateUtils.formatDateDD_MON_YYYY(errorWeeks[i][Global().DATE_COLUMN - 1]);
         // add error week
        preview.push(errorWeeks[i]);
      }
      
      // email invalid rows
      message += Global().UPDATED_INVALID_MESSAGE;
      message += Notification.createHTMLTable(preview);
    }
    
    Notification.sendEmail(recipients, subject, message);
    
    // reset updated
    Updated.setUpdated('');
  }
  
  return result;
}

/**
 * Triggered to check if a updated notification is required
 */
Updated.checkUpdatedNotificationRequired = function(now) {
  if(Updated.getUpdated()) {
    var currentValue = Updated.getUpdated();
    
    // convert date stamp to Date
    var updatedDate = DateUtils.parseDate(currentValue);
    
    // if the updated date is older than 1 day, return true
    if(updatedDate < now - DateUtils.ONE_DAY_MS) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get the Updated spreadsheet sheet
 */
Updated.getUpdatedSheet = function() {
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  return currentSpreadsheet.getSheetByName(Global().UPDATED_SHEET_NAME);
}

/**
 * Update value on hidden sheet 'Updated'
 */
Updated.setUpdated = function(newValue) { 
  var updatedSheet = Updated.getUpdatedSheet();
  
  Updated.checkUpdatedSheetExists();
  
  if(updatedSheet) {
    // set first cell
    updatedSheet.getRange(Global().UPDATED_UPDATED_ROW,1,1,1).setValue(newValue);
  }
}

/**
 * Check if the Updated sheet exists, if not insert one
 */
Updated.checkUpdatedSheetExists = function() {
  var updatedSheet = Updated.getUpdatedSheet();

    // Insert sheet if it does not exist
    if (updatedSheet === null) {
      updatedSheet = currentSpreadsheet.insertSheet(Global().UPDATED_SHEET_NAME);
    }
}

/**
 * Get value on hidden sheet 'Updated'
 */
Updated.getUpdated = function() {
  var updatedSheet = Updated.getUpdatedSheet();
  
  var currentValue;
  
  if(updatedSheet) {
    // get first cell
    currentValue = updatedSheet.getRange(Global().UPDATED_UPDATED_ROW,1,1,1).getValue();
  }
  
  return currentValue;
}

/**
 * Check if the value on hidden sheet 'Updated' exists
 */
Updated.isUpdated = function() { 
  var currentValue = Updated.getUpdated();
  
  if(currentValue) {
    return !isEmptyStr(currentValue);
  }
  
  return false;
}

/**
 * Checks that the Roster sheet has been edited and sets the updated value if it 
 * has not already been set
 */
Updated.checkRosterUpdated = function(element) {
  if(element && element.range && element.range.getSheet().getName() === Global().ROSTER_SHEET_NAME) {  
    if(!Updated.isUpdated()) {
      // get date stamp
      var now = new Date();
      // update updated cell
      Updated.setUpdated(now.toString());
    }
  }
  
  return Updated.getUpdated();
}


/**
 * Manual Tests (relies on Updated sheet values)
 */
function test_manual_updated_suite() {
  test_setUpdated();
  test_isUpdated();
  test_checkUpdatedNotificationRequired();
  test_checkRosterUpdated();
  
  Notification.Config.TESTING = true;
  
  test_checkUpdated_NoEmail();
  test_checkUpdated_Email();
  
  Notification.Config.TESTING = false;
}

function test_setUpdated() {
  var expected = 'this is a test';
  
  Updated.setUpdated(expected);
  var actual = Updated.getUpdated();

  GSUnit.assertEquals('Set Updated', expected, actual);
  
  // reset cell
  Updated.setUpdated('');
}

function test_isUpdated() {
  var testStr = 'This is a test';
  
  Updated.setUpdated(testStr);
  var actual = Updated.isUpdated();

  GSUnit.assertTrue('This is a test', actual);
  
  // reset cell
  Updated.setUpdated('');
  
  actual = Updated.isUpdated();

  GSUnit.assertFalse('Empty updated', actual);
}

function test_checkUpdatedNotificationRequired() {
  var now = new Date();
  var testDate = new Date();
  Updated.setUpdated(testDate.toString());
  
  var actual = Updated.checkUpdatedNotificationRequired(now);
  
  GSUnit.assertFalse('Within a date', actual);

  testDate = new Date() - (DateUtils.ONE_DAY_MS + DateUtils.ONE_HOUR_MS);
  Updated.setUpdated(testDate.toString());
  
  actual = Updated.checkUpdatedNotificationRequired(now);

  GSUnit.assertTrue('Older than a day', actual);
  
  Updated.setUpdated('');
  
  actual = Updated.checkUpdatedNotificationRequired(now);

  GSUnit.assertFalse('Reset cell', actual);
}

function test_checkRosterUpdated() {
  var expected = (new Date()).toString();
  
  var actual = Updated.checkRosterUpdated(null);

  GSUnit.assertNotEquals('Check updated', expected, actual);
}

function test_checkUpdated_NoEmail() {
  var testDate = new Date();
  
  Updated.setUpdated(testDate.toString());
  
  GSUnit.assertFalse('No email trigger updated', Updated.checkUpdated());
}

function test_checkUpdated_Email() {
  var testDate = new Date() - (DateUtils.ONE_DAY_MS + DateUtils.ONE_HOUR_MS + DateUtils.ONE_DAY_MS);
  
  Updated.setUpdated(testDate.toString());
  
  GSUnit.assertTrue('Email trigger updated', Updated.checkUpdated());
}

