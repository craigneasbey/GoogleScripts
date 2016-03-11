/**
 * V1.0.1
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey
 */

var TESTING_UPDATED = false;

var UPDATED_SHEET_NAME = 'Updated';
var UPDATED_UPDATED_ROW = 1;
var UPDATED_REMINDER_ROW = 2;
var UPDATED_CHECK_HOUR = getNumConfig("UPDATED_CHECK_HOUR", 6);
var UPDATED_SUBJECT = getStrConfig("UPDATED_SUBJECT", 'Tennis Roster Updated');
var UPDATED_MESSAGE = getStrConfig("UPDATED_MESSAGE", 'Please check the tennis roster as it has been recently updated.');

function createTimeDrivenTriggerForUpdated() {
  // Trigger every UPDATED_CHECK_HOUR hours
  ScriptApp.newTrigger('triggerUpdated')
      .timeBased()
      .everyHours(UPDATED_CHECK_HOUR)
      .create();
}

/**
 * Run from a installed trigger to notify players if the sheet has updated
 */
function triggerUpdated() {
  var now = new Date();
  var result = checkUpdatedNotificationRequired_(now);
  
  if(result) {
    var subject = UPDATED_SUBJECT;
    var message = UPDATED_MESSAGE;
    
    emailPlayers_(subject, message);
    
    // reset updated
    setUpdated_('');
  }
  
  return result;
}

/**
 * Triggered to check if a updated notification is required
 */
function checkUpdatedNotificationRequired_(now) {
  if(isUpdated_()) {
    var currentValue = getUpdated_();
    
    // convert date stamp to Date
    var updatedDate = parseDate(currentValue);
    
    // if the updated date is older than 1 day, return true
    if(updatedDate < now - ONE_DAY_MS) {
      return true;
    }
  }
  
  return false;
}

/**
 * Update value on hidden sheet 'Updated'
 */
function setUpdated_(newValue) { 
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var updatedSheet = currentSpreadsheet.getSheetByName(UPDATED_SHEET_NAME);
  
  checkUpdatedSheetExists();
  
  if(updatedSheet) {
    // set first cell
    updatedSheet.getRange(UPDATED_UPDATED_ROW,1,1,1).setValue(newValue);
  }
}

/**
 * Check if the Updated sheet exists, if not insert one
 */
function checkUpdatedSheetExists() {
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var updatedSheet = currentSpreadsheet.getSheetByName(UPDATED_SHEET_NAME);

    // Insert sheet if it does not exist
    if (updatedSheet === null) {
      updatedSheet = currentSpreadsheet.insertSheet(UPDATED_SHEET_NAME);
    }
}

/**
 * Get value on hidden sheet 'Updated'
 */
function getUpdated_() { 
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var updatedSheet = currentSpreadsheet.getSheetByName(UPDATED_SHEET_NAME);
  
  var currentValue;
  
  if(updatedSheet) {
    // get first cell
    currentValue = updatedSheet.getRange(UPDATED_UPDATED_ROW,1,1,1).getValue();
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

/**
 * Checks that the Roster sheet has been edited and sets the updated value if it 
 * has not already been set
 */
function checkUpdated(element) {
  if(element && element.range && element.range.getSheet().getName() === ROSTER_SHEET_NAME) {  
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
 * Manual Tests (relies on Updated sheet values)
 */
function test_manual_updated_suite() {
  test_setUpdated();
  test_isUpdated();
  test_checkUpdatedNotificationRequired();
  test_checkUpdated();
  
  TESTING_NOTIFICATION = true;
  
  test_triggerUpdated_NoEmail();
  test_triggerUpdated_Email();
  
  TESTING_NOTIFICATION = false;
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
  var testStr = 'This is a test';
  
  setUpdated_(testStr);
  var actual = isUpdated_();

  GSUnit.assertTrue('This is a test', actual);
  
  // reset cell
  setUpdated_('');
  
  actual = isUpdated_();

  GSUnit.assertFalse('Empty updated', actual);
}

function test_checkUpdatedNotificationRequired() {
  var now = new Date();
  var testDate = new Date();
  setUpdated_(testDate.toString());
  
  var actual = checkUpdatedNotificationRequired_(now);
  
  GSUnit.assertFalse('Within a date', actual);

  testDate = new Date() - (ONE_DAY_MS + ONE_HOUR_MS);
  setUpdated_(testDate.toString());
  
  actual = checkUpdatedNotificationRequired_(now);

  GSUnit.assertTrue('Older than a day', actual);
  
  setUpdated_('');
  
  actual = checkUpdatedNotificationRequired_(now);

  GSUnit.assertFalse('Reset cell', actual);
}

function test_checkUpdated() {
  var expected = (new Date()).toString();
  
  var actual = checkUpdated(null);

  GSUnit.assertNotEquals('Check updated', expected, actual);
}

function test_triggerUpdated_NoEmail() {
  var testDate = new Date();
  
  setUpdated_(testDate.toString());
  
  GSUnit.assertFalse('No email trigger updated', triggerUpdated());
}

function test_triggerUpdated_Email() {
  var testDate = new Date() - (ONE_DAY_MS + ONE_HOUR_MS + ONE_DAY_MS);
  
  setUpdated_(testDate.toString());
  
  GSUnit.assertTrue('Email trigger updated', triggerUpdated());
}

