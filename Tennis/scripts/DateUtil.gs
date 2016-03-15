/**
 * V1.0.4
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var TESTING_DATES = false;

var ONE_DAY_MS = 1000 * 60 * 60 * 24;
var ONE_HOUR_MS = 1000 * 60 * 60;
var ONE_MINUTE_MS = 1000 * 60;

function createLocalDate(year, month, day, hour, minute, second) {
  return new Date(year, month - 1, day, hour, minute, second);
}

function createUTCDate(year, month, day, hour, minute, second) {
  var d = new Date(year, month - 1, day, hour, minute, second);
  
  // remove timezone offset
  d.setTime(d.getTime() - d.getTimezoneOffset() * ONE_MINUTE_MS);
  
  return d;
}

function parseDate(str) {
  return new Date(str);
}

/**
 * Compare dates, if equal return 0, greater than 1, less than -1
 */
function compareDates(d1, d2) {
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
function equalDatesWithinTolerance(n1, n2, toleranceMs) {
  return equalWithinTolerance(n1.getTime(), n2.getTime(), toleranceMs);
}

/**
 * Compares dates within a millisecond tolerance
 */
function compareDatesWithinTolerance(n1, n2, toleranceMs) {
  return compareWithinTolerance(n1.getTime(), n2.getTime(), toleranceMs);
}

/**
 * Compares if numbers are equal within a tolerance
 */
function equalWithinTolerance(n1, n2, tolerance) {
  return compareWithinTolerance(n1, n2, tolerance) === 0;
}

/**
 * Compares numbers within a tolerance
 */
function compareWithinTolerance(n1, n2, tolerance) {
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
 * Tests
 */
function test_date_suite() {
  test_createLocalDate();
  test_createUTCDate();
  test_parseDate();
  test_compareDates();
  test_equalDatesWithinTolerance();
  test_equalWithinTolerance();
  test_compareWithinTolerance();
}


function test_createLocalDate() {
  var expected = 1451307600000; // 29/12/2015 00:00:00 local
  
  var actual = createLocalDate(2015, 12, 29, 0, 0, 0);
  
  GSUnit.assertEquals('Equal local date', expected, actual.getTime());
}

function test_createUTCDate() {
  var expected = new Date(Date.UTC(2015, 11, 29, 0, 0, 0));
  
  var actual = createUTCDate(2015, 12, 29, 0, 0, 0);
  
  GSUnit.assertEquals('Equal UTC date', expected.getTime(), actual.getTime());
}

function test_parseDate() {
  var testDateStr = '29 Dec 2015';
  
  var expected = createLocalDate(2015, 12, 29, 0, 0, 0);

  var actual = parseDate(testDateStr);
  
  GSUnit.assert('Parse date', actual.getTime() === expected.getTime());
}

function test_compareDates() {
  var testDate = new Date();
  var now = new Date();
  
  var expected = 0;
  var actual = compareDates(testDate, now);
  
  GSUnit.assert('Equal dates', actual === expected);
  
  testDate.setTime(testDate.getTime() + ONE_HOUR_MS);
  
  expected = 1;
  actual = compareDates(testDate, now);
  
  GSUnit.assert('Greater than date', actual === expected);

  testDate.setTime(testDate.getTime() - ONE_HOUR_MS - ONE_HOUR_MS);
  
  expected = -1;
  actual = compareDates(testDate, now);
  
  GSUnit.assert('Less than date', actual === expected);
}

function test_equalDatesWithinTolerance() {
  var testData1 = createLocalDate(2015, 12, 28, 0, 0, 0);
  var testData2 = createLocalDate(2015, 12, 30, 0, 0, 0);

  var actual = equalDatesWithinTolerance(testData1, testData2, ONE_DAY_MS + ONE_DAY_MS);
  
  GSUnit.assertTrue('Equal within 2 days', actual);

  actual = equalDatesWithinTolerance(testData1, testData2, ONE_MINUTE_MS);
  
  GSUnit.assertFalse('Equal within 1 minute', actual);
  
  testData2 = createLocalDate(2015, 12, 28, 11, 0, 0);
  
  actual = equalDatesWithinTolerance(testData1, testData2, ONE_DAY_MS);
  
  GSUnit.assertTrue('Equal within 1 day', actual);
}

function test_equalWithinTolerance() {
  var testData1 = 3;
  var testData2 = 5;
  
  var expected = false;
  var actual = equalWithinTolerance(testData1,testData2, 1);
  
  GSUnit.assert('Equal 3 = 5, Tol 1', actual === expected);

  expected = true;
  actual = equalWithinTolerance(testData1,testData2, 2);
  
  GSUnit.assert('Equal 3 = 5, Tol 2', actual === expected);
  
  testData1 = 100;
  testData2 = 71;
  
  expected = true;
  actual = equalWithinTolerance(testData1,testData2, 30);
  
  GSUnit.assert('Equal 100 = 71, Tol 30', actual === expected);

  expected = false;
  actual = equalWithinTolerance(testData1,testData2, 5);
  
  GSUnit.assert('Equal 100 = 71, Tol 5', actual === expected);
}

function test_compareWithinTolerance() {
  var testData1 = 3;
  var testData2 = 5;
  
  var expected = -1;
  var actual = compareWithinTolerance(testData1,testData2, 1);
  
  GSUnit.assert('Compare 3 = 5, Tol 1', actual === expected);

  expected = 0;
  actual = compareWithinTolerance(testData1,testData2, 2);
  
  GSUnit.assert('Compare 3 = 5, Tol 2', actual === expected);
  
  testData1 = 100;
  testData2 = 71;
  
  expected = 0;
  actual = compareWithinTolerance(testData1,testData2, 30);
  
  GSUnit.assert('Compare 100 = 71, Tol 30', actual === expected);

  expected = 1;
  actual = compareWithinTolerance(testData1,testData2, 5);
  
  GSUnit.assert('Compare 100 = 71, Tol 5', actual === expected);
}


