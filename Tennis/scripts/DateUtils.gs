/**
 * V1.1.1
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var DateUtils = {};

// create local configuration object
DateUtils.Config = {};
DateUtils.Config.TESTING = false;
Logger.log("Date Utilities configuration loaded");

DateUtils.ONE_DAY_MS = 1000 * 60 * 60 * 24;
DateUtils.ONE_HOUR_MS = 1000 * 60 * 60;
DateUtils.ONE_MINUTE_MS = 1000 * 60;

DateUtils.createLocalDate = function(year, month, day, hour, minute, second) {
  return new Date(year, month - 1, day, hour, minute, second);
}

DateUtils.createUTCDate = function(year, month, day, hour, minute, second) {
  var d = new Date(year, month - 1, day, hour, minute, second);
  
  // remove timezone offset
  d.setTime(d.getTime() - d.getTimezoneOffset() * DateUtils.ONE_MINUTE_MS);
  
  return d;
}

DateUtils.parseDate = function(str) {
  return new Date(str);
}

/**
 * Compare dates, if equal return 0, greater than 1, less than -1
 */
DateUtils.compareDates = function(d1, d2) {
  if(d1.getTime() === d2.getTime()) {
    return 0;
  } else if (d1.getTime() > d2.getTime()) {
    return 1;
  }
  
  return -1;
}

/**
 * Compares if dates are equal within a millisecond tolerance
 */
DateUtils.equalDatesWithinTolerance = function(n1, n2, toleranceMs) {
  return DateUtils.equalWithinTolerance(n1.getTime(), n2.getTime(), toleranceMs);
}

/**
 * Compares dates within a millisecond tolerance
 */
DateUtils.compareDatesWithinTolerance = function(n1, n2, toleranceMs) {
  return DateUtils.compareWithinTolerance(n1.getTime(), n2.getTime(), toleranceMs);
}

/**
 * Compares if numbers are equal within a tolerance
 */
DateUtils.equalWithinTolerance = function(n1, n2, tolerance) {
  return DateUtils.compareWithinTolerance(n1, n2, tolerance) === 0;
}

/**
 * Compares numbers within a tolerance
 */
DateUtils.compareWithinTolerance = function(n1, n2, tolerance) {
  if(n1 === n2) {
    return 0;
  } else if(n1 > n2) {
    if(n1 - tolerance <= n2) {
      return 0;
    } else {
      return 1;
    }
  } else if(n1 < n2) {
    if(n1 + tolerance >= n2) {
      return 0;
    }
  }
  
  return -1;
}

/**
 * Creates array of all a day of the week for a specified month and year
 * 
 * month - 0 to 11 (0 = January, 8 = September)
 * year - 4 digit year (2016)
 * dayOfWeek - 0 to 6 (0 = Sunday, 5 = Friday)
 */
DateUtils.getDays = function(month, year, dayOfWeek) {
    var d = new Date(year, month, 1);
    var days = new Array();
    var offsetDay = 7 + dayOfWeek;

    d.setDate(d.getDate() + (offsetDay - d.getDay()) % 7);
  
    while (d.getMonth() === month) {
        days.push(new Date(d.getTime()));
        d.setDate(d.getDate() + 7);
    }

    return days;
}

/**
 * Test utility to convert array of dates to strings since
 * asserting two arrays of dates fails
 */
DateUtils.convertToStamps = function(input) {
  if(Array.isArray(input)) {
    for(var i = 0; i < input.length; i++) {
      if(input[i] instanceof Date) {
        input[i] = input[i].toString();
      }
    }
  }
  
  return input;
}

/**
 * Convert a date to a string with format "DD MON YYYY"
 */
DateUtils.formatDateDD_MON_YYYY = function(currentDate) {
  if(currentDate instanceof Date) {
    //var timeZoneName = DateUtils.getTimeZoneName(currentDate);
    var timezone = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    
    return Utilities.formatDate(currentDate, timezone, "dd MMM yyyy");
  }
  
  return "";
}

/**
 * Get the time zone short name from a date
 *
 * http://stackoverflow.com/questions/1954397/detect-timezone-abbreviation-using-javascript
 */
DateUtils.getTimeZoneName = function(currentDate) {
  if(currentDate instanceof Date) {
    return currentDate.toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2];
  }
  
  return "UTC";
}


/**
 * Tests
 */
function test_date_suite() {
  test_createLocalDate();
  test_createUTCDate();
  test_parseDate();
  test_compareDates();
  test_compareDatesWithinTolerance();
  test_equalDatesWithinTolerance();
  test_equalWithinTolerance();
  test_compareWithinTolerance();
  test_day_of_week();
  test_format_date_DD_MON_YYYY();
  test_get_time_zone_name();
}


function test_createLocalDate() {
  var expected = 1451307600000; // 29/12/2015 00:00:00 local
  
  var actual = DateUtils.createLocalDate(2015, 12, 29, 0, 0, 0);
  
  GSUnit.assertEquals('Equal local date', expected, actual.getTime());
}

function test_createUTCDate() {
  var expected = new Date(Date.UTC(2015, 11, 29, 0, 0, 0));
  
  var actual = DateUtils.createUTCDate(2015, 12, 29, 0, 0, 0);
  
  GSUnit.assertEquals('Equal UTC date', expected.getTime(), actual.getTime());
}

function test_parseDate() {
  var testDateStr = '29 Dec 2015';
  
  var expected = DateUtils.createLocalDate(2015, 12, 29, 0, 0, 0);

  var actual = DateUtils.parseDate(testDateStr);
  
  GSUnit.assert('Parse date', actual.getTime() === expected.getTime());
}

function test_compareDates() {
  var testDate = new Date();
  var now = new Date();
  
  var expected = 0;
  var actual = DateUtils.compareDates(testDate, now);
  
  GSUnit.assert('Equal dates', actual === expected);
  
  testDate.setTime(testDate.getTime() + DateUtils.ONE_HOUR_MS);
  
  expected = 1;
  actual = DateUtils.compareDates(testDate, now);
  
  GSUnit.assert('Greater than date', actual === expected);

  testDate.setTime(testDate.getTime() - DateUtils.ONE_HOUR_MS - DateUtils.ONE_HOUR_MS);
  
  expected = -1;
  actual = DateUtils.compareDates(testDate, now);
  
  GSUnit.assert('Less than date', actual === expected);
}

function test_compareDatesWithinTolerance() {
  var testData1 = DateUtils.createLocalDate(2015, 12, 28, 0, 0, 0);
  var testData2 = DateUtils.createLocalDate(2015, 12, 30, 0, 0, 0);
  
  var expected = 0;

  var actual = DateUtils.compareDatesWithinTolerance(testData1, testData2, DateUtils.ONE_DAY_MS + DateUtils.ONE_DAY_MS);
  
  GSUnit.assertEquals('Compare dates within 2 days', expected, actual);
  
  expected = -1;

  actual = DateUtils.compareDatesWithinTolerance(testData1, testData2, DateUtils.ONE_MINUTE_MS);
  
  GSUnit.assertEquals('Compare dates not within 1 minute', expected, actual);
  
  expected = 0;
  testData2 = DateUtils.createLocalDate(2015, 12, 28, 11, 0, 0);
  
  actual = DateUtils.compareDatesWithinTolerance(testData1, testData2, DateUtils.ONE_DAY_MS);
  
  GSUnit.assertEquals('Compare dates within 1 day', expected, actual);
}

function test_equalDatesWithinTolerance() {
  var testData1 = DateUtils.createLocalDate(2015, 12, 28, 0, 0, 0);
  var testData2 = DateUtils.createLocalDate(2015, 12, 30, 0, 0, 0);

  var actual = DateUtils.equalDatesWithinTolerance(testData1, testData2, DateUtils.ONE_DAY_MS + DateUtils.ONE_DAY_MS);
  
  GSUnit.assertTrue('Dates equal within 2 days', actual);

  actual = DateUtils.equalDatesWithinTolerance(testData1, testData2, DateUtils.ONE_MINUTE_MS);
  
  GSUnit.assertFalse('Dates not equal within 1 minute', actual);
  
  testData2 = DateUtils.createLocalDate(2015, 12, 28, 11, 0, 0);
  
  actual = DateUtils.equalDatesWithinTolerance(testData1, testData2, DateUtils.ONE_DAY_MS);
  
  GSUnit.assertTrue('Dates equal within 1 day', actual);
}

function test_equalWithinTolerance() {
  var testData1 = 3;
  var testData2 = 5;
  
  var expected = false;
  var actual = DateUtils.equalWithinTolerance(testData1,testData2, 1);
  
  GSUnit.assert('Equal 3 = 5, Tol 1', actual === expected);

  expected = true;
  actual = DateUtils.equalWithinTolerance(testData1,testData2, 2);
  
  GSUnit.assert('Equal 3 = 5, Tol 2', actual === expected);
  
  testData1 = 100;
  testData2 = 71;
  
  expected = true;
  actual = DateUtils.equalWithinTolerance(testData1,testData2, 30);
  
  GSUnit.assert('Equal 100 = 71, Tol 30', actual === expected);

  expected = false;
  actual = DateUtils.equalWithinTolerance(testData1,testData2, 5);
  
  GSUnit.assert('Equal 100 = 71, Tol 5', actual === expected);
}

function test_compareWithinTolerance() {
  var testData1 = 3;
  var testData2 = 5;
  
  var expected = -1;
  var actual = DateUtils.compareWithinTolerance(testData1,testData2, 1);
  
  GSUnit.assert('Compare 3 = 5, Tol 1', actual === expected);

  expected = 0;
  actual = DateUtils.compareWithinTolerance(testData1,testData2, 2);
  
  GSUnit.assert('Compare 3 = 5, Tol 2', actual === expected);
  
  testData1 = 100;
  testData2 = 71;
  
  expected = 0;
  actual = DateUtils.compareWithinTolerance(testData1,testData2, 30);
  
  GSUnit.assert('Compare 100 = 71, Tol 30', actual === expected);

  expected = 1;
  actual = DateUtils.compareWithinTolerance(testData1,testData2, 5);
  
  GSUnit.assert('Compare 100 = 71, Tol 5', actual === expected);
}

function test_day_of_week() {
  var year = 2016;
  var month = 3;
  
  var dayOfWeek = 0;
  var expectedArray = new Array();
  expectedArray[0] = DateUtils.createLocalDate(2016, 4, 3, 0, 0, 0);
  expectedArray[1] = DateUtils.createLocalDate(2016, 4, 10, 0, 0, 0);
  expectedArray[2] = DateUtils.createLocalDate(2016, 4, 17, 0, 0, 0);
  expectedArray[3] = DateUtils.createLocalDate(2016, 4, 24, 0, 0, 0);
  
  var actualArray = DateUtils.getDays(month, year, dayOfWeek);
  
  Logger.log(GSUnit.assertArrayEquals('Sundays in April 2016', DateUtils.convertToStamps(expectedArray), DateUtils.convertToStamps(actualArray)));
  
  dayOfWeek = 1;
  expectedArray = new Array();
  expectedArray[0] = DateUtils.createLocalDate(2016, 4, 4, 0, 0, 0);
  expectedArray[1] = DateUtils.createLocalDate(2016, 4, 11, 0, 0, 0);
  expectedArray[2] = DateUtils.createLocalDate(2016, 4, 18, 0, 0, 0);
  expectedArray[3] = DateUtils.createLocalDate(2016, 4, 25, 0, 0, 0);
  
  actualArray = DateUtils.getDays(month, year, dayOfWeek);
  
  Logger.log(GSUnit.assertArrayEquals('Mondays in April 2016', DateUtils.convertToStamps(expectedArray), DateUtils.convertToStamps(actualArray)));
  
  dayOfWeek = 2;
  expectedArray = new Array();
  expectedArray[0] = DateUtils.createLocalDate(2016, 4, 5, 0, 0, 0);
  expectedArray[1] = DateUtils.createLocalDate(2016, 4, 12, 0, 0, 0);
  expectedArray[2] = DateUtils.createLocalDate(2016, 4, 19, 0, 0, 0);
  expectedArray[3] = DateUtils.createLocalDate(2016, 4, 26, 0, 0, 0);
  
  actualArray = DateUtils.getDays(month, year, dayOfWeek);
  
  Logger.log(GSUnit.assertArrayEquals('Tuesdays in April 2016', DateUtils.convertToStamps(expectedArray), DateUtils.convertToStamps(actualArray)));
  
  dayOfWeek = 3;
  expectedArray = new Array();
  expectedArray[0] = DateUtils.createLocalDate(2016, 4, 6, 0, 0, 0);
  expectedArray[1] = DateUtils.createLocalDate(2016, 4, 13, 0, 0, 0);
  expectedArray[2] = DateUtils.createLocalDate(2016, 4, 20, 0, 0, 0);
  expectedArray[3] = DateUtils.createLocalDate(2016, 4, 27, 0, 0, 0);
  
  actualArray = DateUtils.getDays(month, year, dayOfWeek);
  
  Logger.log(GSUnit.assertArrayEquals('Wednesdays in April 2016', DateUtils.convertToStamps(expectedArray), DateUtils.convertToStamps(actualArray)));
  
  dayOfWeek = 4;
  expectedArray = new Array();
  expectedArray[0] = DateUtils.createLocalDate(2016, 4, 7, 0, 0, 0);
  expectedArray[1] = DateUtils.createLocalDate(2016, 4, 14, 0, 0, 0);
  expectedArray[2] = DateUtils.createLocalDate(2016, 4, 21, 0, 0, 0);
  expectedArray[3] = DateUtils.createLocalDate(2016, 4, 28, 0, 0, 0);
  
  actualArray = DateUtils.getDays(month, year, dayOfWeek);
  
  Logger.log(GSUnit.assertArrayEquals('Thursdays in April 2016', DateUtils.convertToStamps(expectedArray), DateUtils.convertToStamps(actualArray)));
  
  dayOfWeek = 5;
  expectedArray = new Array();
  expectedArray[0] = DateUtils.createLocalDate(2016, 4, 1, 0, 0, 0);
  expectedArray[1] = DateUtils.createLocalDate(2016, 4, 8, 0, 0, 0);
  expectedArray[2] = DateUtils.createLocalDate(2016, 4, 15, 0, 0, 0);
  expectedArray[3] = DateUtils.createLocalDate(2016, 4, 22, 0, 0, 0);
  expectedArray[4] = DateUtils.createLocalDate(2016, 4, 29, 0, 0, 0);
  
  actualArray = DateUtils.getDays(month, year, dayOfWeek);
  
  Logger.log(GSUnit.assertArrayEquals('Fridays in April 2016', DateUtils.convertToStamps(expectedArray), DateUtils.convertToStamps(actualArray)));
  
  dayOfWeek = 6;
  expectedArray = new Array();
  expectedArray[0] = DateUtils.createLocalDate(2016, 4, 2, 0, 0, 0);
  expectedArray[1] = DateUtils.createLocalDate(2016, 4, 9, 0, 0, 0);
  expectedArray[2] = DateUtils.createLocalDate(2016, 4, 16, 0, 0, 0);
  expectedArray[3] = DateUtils.createLocalDate(2016, 4, 23, 0, 0, 0);
  expectedArray[4] = DateUtils.createLocalDate(2016, 4, 30, 0, 0, 0);
  
  actualArray = DateUtils.getDays(month, year, dayOfWeek);
  
  Logger.log(GSUnit.assertArrayEquals('Saturdays in April 2016', DateUtils.convertToStamps(expectedArray), DateUtils.convertToStamps(actualArray)));
}

function test_format_date_DD_MON_YYYY() {
  var testDate = DateUtils.createLocalDate(2016, 5, 2, 0, 0, 0);
  var expected = '02 May 2016';
  
  var actual = DateUtils.formatDateDD_MON_YYYY(testDate);
  
  GSUnit.assertEquals('Format date DD_MON_YYYY', expected, actual);
}

function test_get_time_zone_name()
{
  var testDate = DateUtils.createLocalDate(2016, 5, 2, 0, 0, 0);
  var expected = 'AEST';
  
  var actual = DateUtils.getTimeZoneName(testDate);
  
  GSUnit.assertEquals('Time zone name', expected, actual);
}
