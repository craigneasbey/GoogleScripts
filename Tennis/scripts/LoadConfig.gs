/**
 * V1.0.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey
 */

var CONFIG_SHEET_NAME = 'Configuration';
 
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
 * Get configuration from the Configuration sheet of key/value pairs
 */
function getConfigFromTable_(configKey) {
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = currentSpreadsheet.getSheetByName('Configuration');
  
  var startRow = 1;  // first row is title
  var startCol = 1;
  var numRows = 1000; // arbitrary number
  var numCols = 2;
  
  var dataRange = configSheet.getRange(startRow, startCol, numRows, numCols);
  var data = dataRange.getValues();
  
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
 * Manual Tests (replies on Configuration sheet values)
 */
function test_manual_load_config_suite() {
  test_getStrConfig();
  test_getNumConfig();
  test_getBoolConfig();
}

function test_getStrConfig() {
  var expected = "2016";
	
  var actual = getStrConfig("DEFAULT_YEAR", "2015");
  
  Logger.log(GSUnit.assertEquals('Get config DEFAULT_YEAR', expected, actual.toString()));
  
  expected = "2015";
	
  actual = getStrConfig("NO_KEY", "2015");
  
  Logger.log(GSUnit.assertEquals('Get config string NO_KEY', expected, actual));
}

function test_getNumConfig() {
  var expected = 5;
	
  var actual = getNumConfig("MEMBER_EMAIL_ROW", 7);
  
  Logger.log(GSUnit.assertEquals('Get config MEMBER_EMAIL_ROW', expected, actual));
  
  expected = 7;
	
  actual = getNumConfig("NO_KEY", 7);
  
  Logger.log(GSUnit.assertEquals('Get config number NO_KEY', expected, actual));
}

function test_getBoolConfig() {
  var expected = true;
	
  var actual = getBoolConfig("REMINDERS", false);
  
  Logger.log(GSUnit.assertEquals('Get config REMINDERS', expected, actual));
  
  expected = false;
	
  actual = getBoolConfig("NO_KEY", false);
  
  Logger.log(GSUnit.assertEquals('Get config number NO_KEY', expected, actual));
}

