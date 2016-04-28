/**
 * V1.2.0
 * https://developers.google.com/apps-script/reference/
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Meals)
 */

var ShoppingList = {};

/**
 * Recreate the shopping list from the meal plan
 */
ShoppingList.generateShoppingList = function() {
  var PLAN_SHEET_NAME = 'Plan';
  
  var spreadsheet = SpreadsheetApp.getActive();
  var planSheet = spreadsheet.getSheetByName(PLAN_SHEET_NAME);

  var meals = 7;
  var shoppingList = new Array();
  
  for(var mealPlanRow = 2; mealPlanRow <= meals; mealPlanRow++) {
    ShoppingList.addDayMeals(mealPlanRow, shoppingList, planSheet, spreadsheet);
  }
  
  ShoppingList.saveShoppingList(Summarise.summariseList(shoppingList), spreadsheet);
}

/**
 * Get the meals for each day and lookup the meal sheet for ingredients
 */
ShoppingList.addDayMeals = function(mealPlanRow, shoppingList, planSheet, spreadsheet) {
  var mealsPlusWeekdays = 8;
    
  var planRow = planSheet.getRange(mealPlanRow, 1, 1, mealsPlusWeekdays);
  var planRowCols = planRow.getLastColumn();
  var planRowValues = planRow.getValues();
  var mealName = planRowValues[0][0];
  
  //Browser.msgBox("mealName: " + mealName);
  Logger.log("mealName: " + mealName);
  
  // get meal sheet values
  var mealSheet = spreadsheet.getSheetByName(mealName);
  
  var maxNumOfMeals = 100;
  
  var mealRow = mealSheet.getRange(2, 1, maxNumOfMeals, 2);
  var mealRowValues = mealRow.getValues();
  
  // for each day
  for(var planDay = 1; planDay < planRowCols; planDay++) {
    var mealChoice = planRowValues[0][planDay];
    
    ShoppingList.addMealIngredients(mealChoice, mealRowValues, shoppingList);
  }
}

/**
 * Add ingredients to shopping list
 */
ShoppingList.addMealIngredients = function(mealChoice, mealRowValues, shoppingList) {
     
    //Browser.msgBox("mealChoice: " + mealChoice);
    Logger.log("mealChoice: " + mealChoice);
    
    var foodCol = 0;
    var ingredientsCol = 1;
    
    var found = false;
    
    // for each food
    for(var foodRow = 0; foodRow < mealRowValues.length && !found; foodRow++) {
      
      if(mealChoice === mealRowValues[foodRow][foodCol]) {
        var rawIngredients = mealRowValues[foodRow][ingredientsCol];
        
        if(rawIngredients) {
          var ingredientsArray = rawIngredients.split(";");
        
          //Browser.msgBox("ingredientsArray: " + ingredientsArray);   
        
          // for each ingredient
          for(var ing = 0; ing < ingredientsArray.length; ing++) {
            if(ingredientsArray[ing]) {
              shoppingList.push(ingredientsArray[ing]);
            }
          }
        }
        
        found = true;
      }
    } 
}

/**
 * Save shopping list to the Shopping List sheet
 */
ShoppingList.saveShoppingList = function(shoppingList, spreadsheet) {
  var SHOPPING_LIST_SHEET_NAME = 'Shopping List';
  
  if(shoppingList.length > 0) {
    var shoppingListSheet = spreadsheet.getSheetByName(SHOPPING_LIST_SHEET_NAME);

    // delete it if it exists
    if (shoppingListSheet != null) {
      spreadsheet.deleteSheet(shoppingListSheet);
    }
    
    shoppingListSheet = spreadsheet.insertSheet(SHOPPING_LIST_SHEET_NAME);
    shoppingListSheet.activate();

    //Browser.msgBox("shoppingList.length: " + shoppingList.length);
    
    // create shopping list
    var actionCol = 1;
    var itemCol = 2;
    var lastColumn = itemCol;
    
    var itemColumn = shoppingListSheet.getRange(1, itemCol, shoppingList.length, 1);
    // convert array list to sheet rows and columns
    ArrayUtils.arrayRotateOneDimensionRight(shoppingList);
    itemColumn.setValues(shoppingList);
    
    // add Action dropdown
    var actionColumn = shoppingListSheet.getRange(1, actionCol, shoppingList.length, 1);
    actionColumn.setValue("Show");
    var actionRule = SpreadsheetApp.newDataValidation().requireValueInList(ListActions.ACTIONS, true).build();
    actionColumn.setDataValidation(actionRule);
    
    // increase font on check column for mobile usage
    var addRightPadding = 20; //display with dropdown arrow on mobile
    
    var allColumns = shoppingListSheet.getRange(1, 1, shoppingList.length, lastColumn);
    allColumns.setFontSize(20);
    
    // auto set column width
    shoppingListSheet.autoResizeColumn(itemCol);
    shoppingListSheet.autoResizeColumn(actionCol);
    
    // enlarge column to stop dropdown covering value
    var currentActionWidth = shoppingListSheet.getColumnWidth(actionCol);
    shoppingListSheet.setColumnWidth(actionCol, currentActionWidth + addRightPadding);
    
    // save
    SpreadsheetApp.flush();
  } else {
    Browser.msgBox("No shopping list items found");   
  }
}


/**
 * Manual test
 */
function test_generateShoppingList() {
  ShoppingList.generateShoppingList();
}




/**
 * Master Tests
 */
function test_master_suite() {
  test_summarise_suite();
  test_array_suite();
}

