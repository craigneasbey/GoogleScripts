/**
 * V1.1.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

/**
 * StringUtils functions cannot be added to a StringUtils object as LoadConfig 
 * uses them. Global configuration must be declared first.
 */

/**
 * Checks if variable is defined
 */
function isEmpty(val) {
  if(typeof val !== 'undefined') {
    if(val !== null) {
      return false;
    }
  }
  
  return true;
}

/**
 * Checks if a string is defined and is empty
 */
function isEmptyStr(str) {
  if(!isEmpty(str)) {
    if(str !== "") {
      return false;
    }
  }
  
  return true;
}

/**
 * Check the value, if undefined or empty, return the default
 *
 * http://stackoverflow.com/questions/894860/set-a-default-parameter-value-for-a-javascript-function
 */
function defaultFor(value, defaultValue) { 
  return typeof value !== 'undefined' && value !== '' ? value : defaultValue; 
}


/**
 * Tests
 */
function test_string_suite() {
  test_isEmptyStr();
  test_isEmpty();
  test_defaultFor();
}

function test_isEmptyStr() {
  Logger.log(GSUnit.assertEquals('No string ', true, isEmptyStr()));
  Logger.log(GSUnit.assertEquals('Null string ', true, isEmptyStr(null)));
  Logger.log(GSUnit.assertEquals('Empty string ', true, isEmptyStr("")));
  Logger.log(GSUnit.assertEquals('Not Empty string ', false, isEmptyStr("test")));
}

function test_isEmpty() {
  Logger.log(GSUnit.assertEquals('No string ', true, isEmpty()));
  Logger.log(GSUnit.assertEquals('Null string ', true, isEmpty(null)));
  Logger.log(GSUnit.assertEquals('Empty string ', false, isEmpty("")));
  Logger.log(GSUnit.assertEquals('Not Empty string ', false, isEmpty("test")));
}

function test_defaultFor() { 
  var value;
  var defaultValue = 'test undefined';
  var expected = 'test undefined';
   
  var actual = defaultFor(value, defaultValue);
  
  Logger.log(GSUnit.assertEquals('Undefined', expected, actual));
  
  value = '';
  defaultValue = 'test defined';
  expected = 'test defined';
   
  actual = defaultFor(value, defaultValue);
  
  Logger.log(GSUnit.assertEquals('Defined', expected, actual));
  
  value = 'This is a test';
  defaultValue = 'test text';
  expected = 'This is a test';
   
  actual = defaultFor(value, defaultValue);
  
  Logger.log(GSUnit.assertEquals('This is a test', expected, actual));
}

