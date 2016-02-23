/**
 * V1.0.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey
 */

var TESTING_DATES = false;

var ONE_HOUR_MS = 1000 * 60 * 60;

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

function parseDate(str) {
  return new Date(str);
}

function equalWithinTolerance(n1, n2, tolerance) {
  if(n1 === n2) {
    return true;
  } else if(n1 > n2 && n1 - tolerance <= n2) {
    return true;
  } else if(n1 < n2 && n1 + tolerance >= n2) {
    return true;
  }
  
  return false;
}


/**
 * Tests
 */
function test_date_suite() {
  test_compareDates();
  test_equalWithinTolerance();
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

function test_parseDate() {
  var testDateStr = '29 Dec 2015';
  
  // AEDT(13) or AEST(14)
  var expected = new Date(Date.UTC(2015, 11, 28, 13, 0, 0));

  var actual = parseDate(testDateStr);
  
  GSUnit.assert('Parse date', equalWithinTolerance(actual, expected, 10));
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