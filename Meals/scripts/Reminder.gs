/**
 * V1.2.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Meals)
 */

var Reminder = {};

// create local configuration object
Reminder.Config = {};
Reminder.Config.TESTING = false;
Reminder.Config.MEAL_PLAN_SHEET_NAME = "Plan";
Reminder.Config.MAX_DETAIL_ROWS = 1000;
Logger.log("Reminder configuration loaded");

/**
 * Notify members if they are roster on for this week
 */
Reminder.sendReminder = function() {
  var now = new Date();
  var dayName = Reminder.getDayName(now);
  var subject = "Meal Plan " + dayName;
  var recipients = new Array(Session.getActiveUser().getEmail());
  
  var allMealsPlan = Reminder.getMealsPlan();
  var dayMealsPlan = Reminder.getMealsPlanForDay(allMealsPlan, dayName);
  var message = Notification.createHTMLTable(dayMealsPlan);
  var dayMealsDetails = Reminder.getMealsDetailsForDay(dayMealsPlan, Reminder.getAllMealDetails);
  message += Notification.createHTMLTable(dayMealsDetails);
        
  Notification.sendEmail(recipients, subject, message);
}

/**
 * Get the meals plan as an array
 */
Reminder.getMealsPlan = function() {
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var planSheet = currentSpreadsheet.getSheetByName(Reminder.Config.MEAL_PLAN_SHEET_NAME);
  
  var startRow = 1;
  var startCol = 1;
  var numRows = 7; // day column + 6 meals
  var numCols = 8; // meal column + 7 days
  
  var dataRange = planSheet.getRange(startRow, startCol, numRows, numCols);
  
  return dataRange.getValues();
}

/**
 * Get the meals plan for a day as an array
 */
Reminder.getMealsPlanForDay = function(allMealsPlan, dayName) {
  var dayMealPlan = new Array();
  
  if(Array.isArray(allMealsPlan)) {
    var mealColumn = 0;
    var dayColumn = 0;
    var found = false;
    
    // get the day column
    for(var i = 0; i < allMealsPlan.length && !found; i++) {
      if(Array.isArray(allMealsPlan[i])) {
        for(var j = 0; j < allMealsPlan[i].length && !found; j++) {
          if(allMealsPlan[i][j] === dayName) {
            dayColumn = j; 
            found = true;
          }
        }
      }
    }
    
    // copy the meal and day columns only
    for(var i = 0; i < allMealsPlan.length; i++) {
      if(Array.isArray(allMealsPlan[i])) {        
        for(var j = 0; j < allMealsPlan[i].length; j++) {
          if(j === mealColumn || j === dayColumn) {
            if(!Array.isArray(dayMealPlan[i])) {
              dayMealPlan[i] = new Array();
            }
            
            dayMealPlan[i].push(allMealsPlan[i][j]);
          }
        }
      }
    }
  }
  
  return dayMealPlan;
}

/**
 * Get the meals details for a day of the meal plan as an array
 */
Reminder.getMealsDetailsForDay = function(dayMealsPlan, getAllMealDetails) {
  var dayMealsDetails = new Array();
  dayMealsDetails.push(new Array("Food","Ingredients","Instructions"));
  
  if(Array.isArray(dayMealsPlan)) {
    for(var i = 1; i < dayMealsPlan.length; i++) {
      if(Array.isArray(dayMealsPlan[i]) && dayMealsPlan.length > 1) {
        var dayAllMealDetails = getAllMealDetails(dayMealsPlan[i][0]);
        
        for(var j = 1; j < dayAllMealDetails.length; j++) {
          if(Array.isArray(dayAllMealDetails[j])  && dayMealsPlan.length > 2) {
            // add when the plan food is the same as meal detail food
            if(dayMealsPlan[i][1] === dayAllMealDetails[j][0]) {
              dayMealsDetails.push(new Array(dayAllMealDetails[j][0],dayAllMealDetails[j][1],dayAllMealDetails[j][2]));
            }
          }
        }
      }
    }
  }
  
  return dayMealsDetails;
}

/**
 * Get the meal details as an array
 */
Reminder.getAllMealDetails = function(mealSheetName) {
  var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var mealSheet = currentSpreadsheet.getSheetByName(mealSheetName);
  
  var startRow = 1;
  var startCol = 1;
  var numRows = Reminder.Config.MAX_DETAIL_ROWS; 
  var numCols = 3; // food, ingredients, instructions
  
  var dataRange = mealSheet.getRange(startRow, startCol, numRows, numCols);
  
  return dataRange.getValues();
}

/**
 * Gets a dates day name
 */
Reminder.getDayName = function(aDate) {
  if(aDate instanceof Date) {
    switch(aDate.getDay()) {
      case 1: return "Monday";
      case 2: return "Tuesday";
      case 3: return "Wednesday";
      case 4: return "Thursday";
      case 5: return "Friday";
      case 6: return "Saturday";
      default: return "Sunday";
    }
  }
  
  return "";
}

/**
 * Tests
 */
function test_reminder_suite() {  
  test_get_meals_plan_for_day();
  test_get_meals_details_for_day();
  test_get_day_name();
}
  
function test_get_meals_plan_for_day() {
  var day = "Wednesday";
  var testAllPlan = new Array();
  testAllPlan[0] = new Array("","Monday","Tuesday","Wednesday","Thursday");
  testAllPlan[1] = new Array("Breakfast","test","test","Baked beans","test");
  testAllPlan[2] = new Array("Snack","test","test","Cruskits","test");
  testAllPlan[3] = new Array("Lunch","test","test","Egg Wrap","test");
  testAllPlan[4] = new Array("Snack","test","test","Yoghurt","test");
  testAllPlan[5] = new Array("Dinner","test","test","San Cho Bow","test");
  testAllPlan[6] = new Array("Supper","test","test","Milo","test");  
  var expectedArray = new Array();
  expectedArray[0] = new Array("","Wednesday");
  expectedArray[1] = new Array("Breakfast","Baked beans");
  expectedArray[2] = new Array("Snack","Cruskits");
  expectedArray[3] = new Array("Lunch","Egg Wrap");
  expectedArray[4] = new Array("Snack","Yoghurt");
  expectedArray[5] = new Array("Dinner","San Cho Bow");
  expectedArray[6] = new Array("Supper","Milo");
  
  var actualArray = Reminder.getMealsPlanForDay(testAllPlan, day);
  
  GSUnit.assertArrayEquals('Get meals plan for day', expectedArray, actualArray);  
}

function test_get_meals_details_for_day() {
  var dayName = "Wednesday";
  var dayMealsPlan = new Array();
  dayMealsPlan[0] = new Array("","Wednesday");
  dayMealsPlan[1] = new Array("Breakfast","Baked beans");
  dayMealsPlan[2] = new Array("Snack","Cruskits");
  dayMealsPlan[3] = new Array("Lunch","Egg Wrap");
  dayMealsPlan[4] = new Array("Snack","Yoghurt");
  dayMealsPlan[5] = new Array("Dinner","San Cho Bow");
  dayMealsPlan[6] = new Array("Supper","Milo");
  
  function testMealsDetails(mealName) {
    var mealsDetails = new Array();
    
    switch(mealName) {
      case "Breakfast":
        mealsDetails.push(new Array("Food","Ingredients","Instructions"));
        mealsDetails.push(new Array("test","test","test"));
        mealsDetails.push(new Array("test","test","test"));
        mealsDetails.push(new Array("Baked beans","ingredients_test","instructions_test"));
        mealsDetails.push(new Array("test","test","test"));
        break;
      case "Snack":
        mealsDetails.push(new Array("Food","Ingredients","Instructions"));
        mealsDetails.push(new Array("test","test","test"));
        mealsDetails.push(new Array("Cruskits","ingredients_test","instructions_test"));
        mealsDetails.push(new Array("Yoghurt","ingredients_test","instructions_test"));
        mealsDetails.push(new Array("test","test","test"));
        break;
      case "Lunch":
        mealsDetails.push(new Array("Food","Ingredients","Instructions"));
        mealsDetails.push(new Array("Egg Wrap","ingredients_test","instructions_test"));
        mealsDetails.push(new Array("test","test","test"));
        mealsDetails.push(new Array("test","test","test"));
        mealsDetails.push(new Array("test","test","test"));
        break;
      case "Dinner":
        mealsDetails.push(new Array("Food","Ingredients","Instructions"));
        mealsDetails.push(new Array("test","test","test"));
        mealsDetails.push(new Array("test","test","test"));
        mealsDetails.push(new Array("test","test","test"));
        mealsDetails.push(new Array("San Cho Bow","ingredients_test","instructions_test"));
        break;
      case "Supper":
        mealsDetails.push(new Array("Food","Ingredients","Instructions"));
        mealsDetails.push(new Array("test","test","test"));
        mealsDetails.push(new Array("test","test","test"));
        mealsDetails.push(new Array("Milo","ingredients_test","instructions_test"));
        mealsDetails.push(new Array("test","test","test"));
        break;
    }
    
    return mealsDetails;
  }
  
  var expectedArray = new Array();
  expectedArray[0] = new Array("Food","Ingredients","Instructions");
  expectedArray[1] = new Array("Baked beans","ingredients_test","instructions_test");
  expectedArray[2] = new Array("Cruskits","ingredients_test","instructions_test");
  expectedArray[3] = new Array("Egg Wrap","ingredients_test","instructions_test");
  expectedArray[4] = new Array("Yoghurt","ingredients_test","instructions_test");
  expectedArray[5] = new Array("San Cho Bow","ingredients_test","instructions_test");
  expectedArray[6] = new Array("Milo","ingredients_test","instructions_test");
  
  var actualArray = Reminder.getMealsDetailsForDay(dayMealsPlan, testMealsDetails);
  
  GSUnit.assertArrayEquals('Get meals details for day', expectedArray, actualArray);  
}

function test_get_day_name() {
  var aDate = DateUtils.createLocalDate(2016, 5, 5, 0, 0, 0);
  var expected = "Thursday";
 
  var actual = Reminder.getDayName(aDate);
  
  GSUnit.assertEquals('Get day Name', expected, actual);
}


/**
 * Manual Tests
 */
function test_manual_reminder_suite() {
  test_checkReminder();
}

function test_sendReminder() {
  Reminder.sendReminder();
}
