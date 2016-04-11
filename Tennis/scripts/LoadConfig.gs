/**
 * V1.1.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var configSheetName;
var configLoaded;
var configGlobal;
var configTableLoaded;
var configTable;

/**
 * Each script calls this function to ensure the global configuration 
 * variables have been set before running local code
 */
function Global() {
  configSheetName = defaultFor(configSheetName, 'Configuration');
  configLoaded = defaultFor(configLoaded, false);
  
  if(!configLoaded) {
    configGlobal = getGlobalConfigObject();
    configLoaded = true;
    Logger.log("Global configuration loaded");
  }
  
  return configGlobal;
}

/**
 * Creates a global configuration object from the configuration table
 */
function getGlobalConfigObject() {
  var globalConfig = {};
  
  globalConfig.MENU_ITEM_GENERATE = getStrConfig("MENU_ITEM_GENERATE", 'Generate dates...');
  globalConfig.MENU_ITEM_ALLOCATE = getStrConfig("MENU_ITEM_ALLOCATE", 'Allocate players...');
  globalConfig.MENU_ITEM_EMAIL = getStrConfig("MENU_ITEM_EMAIL", 'Email players...');
  globalConfig.MENU_ITEM_REMOVE = getStrConfig("MENU_ITEM_REMOVE", 'Remove past weeks...');
  globalConfig.DAY_OF_WEEK = getNumConfig("DAY_OF_WEEK", 2); // 0 to 6 (0 = Sunday, 5 = Friday)
  globalConfig.EMAIL_MEMBERS_DIALOG_TITLE = getStrConfig("EMAIL_MEMBERS_DIALOG_TITLE", 'Email Players');
  globalConfig.ROSTER_SHEET_NAME = 'Roster';
  globalConfig.UPDATED_SHEET_NAME = 'Updated';
  globalConfig.MEMBER_NAME_ROW = getNumConfig("MEMBER_NAME_ROW", 4);
  globalConfig.MEMBER_EMAIL_ROW = getNumConfig("MEMBER_EMAIL_ROW", 5);
  globalConfig.FIRST_ROSTER_ROW = getNumConfig("FIRST_ROSTER_ROW", 6); // the first week roster row
  globalConfig.EMPTY = '';
  globalConfig.ROSTERED = getStrConfig("ROSTERED", 'Play');
  globalConfig.COULD_BE_AVAILABLE = getStrConfig("COULD_BE_AVAILABLE", 'CBA');
  globalConfig.NOT_AVAILABLE = getStrConfig("NOT_AVAILABLE", 'NA');
  globalConfig.MAX_TEAM_MEMBERS = getNumConfig("MAX_TEAM_MEMBERS", 4);
  globalConfig.MAX_ROSTER_ROWS = getNumConfig("MAX_ROSTER_ROWS", 1000); // arbitrary number
  globalConfig.MAX_MEMBER_COLUMNS = getNumConfig("MAX_MEMBER_COLUMNS", 100); // arbitrary number
  globalConfig.DEFAULT_MAX_WEEKS_ROSTERED = getNumConfig("DEFAULT_MAX_WEEKS_ROSTERED", 2); // maximum consecutive weeks rostered
  globalConfig.DEFAULT_MAX_WEEKS_REST = getNumConfig("DEFAULT_MAX_WEEKS_REST", 1); // maximum consecutive weeks resting
  globalConfig.DEFAULT_YEAR = getStrConfig("DEFAULT_YEAR", "2016");
  globalConfig.DATE_COLUMN = 1; // the first column is the week date
  globalConfig.NAME_START_COLUMN = 2; // the first column of member names
  
  globalConfig.NOTIFICATION_SENDER_NAME = getStrConfig("NOTIFICATION_SENDER_NAME", 'Tennis Roster');
  globalConfig.NOTIFICATION_MESSAGE_FOOTER = getStrConfig("NOTIFICATION_MESSAGE_FOOTER", '\n\nNOTE: Tennis roster attached in PDF format (ignore other sheets)');
  
  globalConfig.UPDATED_UPDATED_ROW = 1;
  globalConfig.UPDATED_REMINDER_ROW = 2;
  globalConfig.UPDATED_CHECK_HOUR = getNumConfig("UPDATED_CHECK_HOUR", 6);
  globalConfig.UPDATED_SUBJECT = getStrConfig("UPDATED_SUBJECT", 'Tennis Roster Updated');
  globalConfig.UPDATED_MESSAGE = getStrConfig("UPDATED_MESSAGE", 'Please check the tennis roster as it has been recently updated.');
  
  globalConfig.REFRESH_CHECK_HOUR = getNumConfig("REFRESH_CHECK_HOUR", 2);
  globalConfig.REFRESH_CHECK_DAYS = getNumConfig("REFRESH_CHECK_DAYS", 1);
  
  globalConfig.REMINDERS = getBoolConfig("REMINDERS", true);
  globalConfig.REMINDER_SEND_BEFORE_DAYS = getNumConfig("REMINDER_SEND_BEFORE_DAYS", 1);
  globalConfig.REMINDER_CHECK_HOUR = getNumConfig("REMINDER_CHECK_HOUR", 6);
  globalConfig.REMINDER_SUBJECT = getStrConfig("REMINDER_SUBJECT", 'Tennis Roster Reminder');
  globalConfig.REMINDER_MESSAGE = getStrConfig("REMINDER_MESSAGE", 'This is a reminder that you are rostered on to play tennis this week.');
  
  return globalConfig;
}


// configuration loading functions
function getStrConfig(configKey, defaultValue) {
  return getConfig_(configKey, defaultValue);
}

function getNumConfig(configKey, defaultValue) {
  return Number(getConfig_(configKey, defaultValue));
}

function getBoolConfig(configKey, defaultValue) {
  var configValue = getConfig_(configKey, defaultValue);
   
  return configValue === true;
}

function getConfig_(configKey, defaultValue) {
  var configValue = getConfigFromTable_(configKey);
  
  if(isEmpty(configValue)) {
    configValue = defaultValue;
  } 
  
  return configValue;
}

/**
 * Get a configuration by key from the configuration table
 */
function getConfigFromTable_(configKey) {
  var data = getConfigTable_();
  
  // for each row
  for (i in data) {
    var row = data[i];
    // if row is an array with key and value indexes
    if(Array.isArray(row) && row.length > 1) {
      if(row[0] === configKey) {
        return row[1];
      }
    }
  }
  
  return null;
}

/**
 * Get the configuration table only if it has not already been loaded
 */
function getConfigTable_() {
  configTableLoaded = defaultFor(configTableLoaded, false);
  
  if(!configTableLoaded) {
    configTable = loadConfigTable_();
    configTableLoaded = true;
    Logger.log("Configuration table loaded");
  }
  
  return configTable;
}

/**
 * Get entire configuration table from the Configuration sheet of key/value pairs
 */
function loadConfigTable_() {
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = currentSpreadsheet.getSheetByName(configSheetName);
  
  var startRow = 1;  // first row is title
  var startCol = 1;
  var numRows = 1000; // arbitrary number
  var numCols = 2;
  
  var dataRange = configSheet.getRange(startRow, startCol, numRows, numCols);
  
  return removeEmptyKeys_(dataRange.getValues());
}

/**
 * Removed any empty keys from the configuration table array
 */
function removeEmptyKeys_(configArray) {
  if(Array.isArray(configArray)) {
    for(var i=0; i < configArray.length; i++) {
      if(isEmptyStr(configArray[i][0])) {
        delete configArray[i];
      }
    }
  }
  
  return configArray;
}


/**
 * Tests
 */
function test_load_config_suite() {
  test_getConfigTable();
  test_getStrConfig();
  test_getNumConfig();
  test_getBoolConfig();
}

function test_getConfigTable() {
  configTableLoaded = true;
  configTable = [['DEFAULT_YEAR', '2020']];
  
  var expectedArray = new Array();
  expectedArray[0] = new Array('DEFAULT_YEAR', '2020');
  
  var actualArray = getConfigTable_();
  
  Logger.log(GSUnit.assertArrayEquals('Get config table', expectedArray, actualArray));
}

function test_getStrConfig() {
  configTableLoaded = true;
  configTable = [['DEFAULT_YEAR', '2080']];
  var expected = "2080";
	
  var actual = getStrConfig("DEFAULT_YEAR", "2015");
  
  GSUnit.assertEquals('Get config DEFAULT_YEAR', expected, actual.toString());
  
  expected = "2015";
	
  actual = getStrConfig("NO_KEY", "2015");
  
  GSUnit.assertEquals('Get config string NO_KEY', expected, actual);

  configTableLoaded = false;
}

function test_getNumConfig() {
  configTableLoaded = true;
  configTable = [['MEMBER_EMAIL_ROW', 5]];
  var expected = 5;
	
  var actual = getNumConfig("MEMBER_EMAIL_ROW", 7);
  
  GSUnit.assertEquals('Get config MEMBER_EMAIL_ROW', expected, actual);
  
  expected = 7;
	
  actual = getNumConfig("NO_KEY", 7);
  
  GSUnit.assertEquals('Get config number NO_KEY', expected, actual);
  
  configTableLoaded = false;
}

function test_getBoolConfig() {
  configTableLoaded = true;
  configTable = [['REMINDERS', true]];
  var expected = true;
	
  var actual = getBoolConfig("REMINDERS", false);
  
  GSUnit.assertEquals('Get config REMINDERS', expected, actual);
  
  expected = false;
	
  actual = getBoolConfig("NO_KEY", false);
  
  GSUnit.assertEquals('Get config number NO_KEY', expected, actual);
  
  configTableLoaded = false;
}

 
/**
 * Manual Tests (replies on Configuration sheet values)
 */
function test_manual_load_config_suite() {
  test_manual_getStrConfig();
  test_manual_getNumConfig();
  test_manual_getBoolConfig();
}

function test_manual_getStrConfig() {
  var expected = "2016";
	
  var actual = getStrConfig("DEFAULT_YEAR", "2015");
  
  GSUnit.assertEquals('Get config manual DEFAULT_YEAR', expected, actual.toString());
  
  expected = "2015";
	
  actual = getStrConfig("NO_KEY", "2015");
  
  GSUnit.assertEquals('Get config string manual NO_KEY', expected, actual);
}

function test_manual_getNumConfig() {
  var expected = 5;
	
  var actual = getNumConfig("MEMBER_EMAIL_ROW", 7);
  
  GSUnit.assertEquals('Get config manual MEMBER_EMAIL_ROW', expected, actual);
  
  expected = 7;
	
  actual = getNumConfig("NO_KEY", 7);
  
  GSUnit.assertEquals('Get config number manual NO_KEY', expected, actual);
}

function test_manual_getBoolConfig() {
  var expected = true;
	
  var actual = getBoolConfig("REMINDERS", false);
  
  GSUnit.assertEquals('Get config manual REMINDERS', expected, actual);
  
  expected = false;
	
  actual = getBoolConfig("NO_KEY", false);
  
  GSUnit.assertEquals('Get config number manual NO_KEY', expected, actual);
}

