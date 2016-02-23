/**
 * V1.1.3
 * https://developers.google.com/apps-script/reference/
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 */

/**
 * Runs when the spreadsheet is open, adds a menu to the spreadsheet
 */
function onOpen() {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    {name: 'Generate Shopping List...', functionName: 'generateShoppingList_'}
  ];
  spreadsheet.addMenu('Shopping List', menuItems);
}

/**
 * Recreate the shopping list from the meal plan
 */
function generateShoppingList_() {
  var spreadsheet = SpreadsheetApp.getActive();
  var planSheet = spreadsheet.getSheetByName('Plan');

  var meals = 7;
  var shoppingList = new Array();
  
  for(var mealPlanRow = 2; mealPlanRow <= meals; mealPlanRow++) {
    addDayMeals_(mealPlanRow, shoppingList, planSheet, spreadsheet);
  }
  
  saveShoppingList_(summariseList(shoppingList), spreadsheet);
}

/**
 * Get the meals for each day and lookup the meal sheet for ingredients
 */
function addDayMeals_(mealPlanRow, shoppingList, planSheet, spreadsheet) {
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
    
    addMealIngredients_(mealChoice, mealRowValues, shoppingList);
  }
}

/**
 * Add ingredients to shopping list
 */
function addMealIngredients_(mealChoice, mealRowValues, shoppingList) {
     
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
function saveShoppingList_(shoppingList, spreadsheet) {
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
    itemColumn.setValues(convertToArrayOfArrays(shoppingList));
    
    // add Action dropdown
    var actionColumn = shoppingListSheet.getRange(1, actionCol, shoppingList.length, 1);
    actionColumn.setValue("Show");
    var actionRule = SpreadsheetApp.newDataValidation().requireValueInList(ACTIONS, true).build();
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
 * Convert one dimensional array to two dimensional array for the sheet range
 */
function convertToArrayOfArrays(input) {
  var output = new Array;
  
  for(var i = 0; i < input.length; i++) {
    output.push([input[i]]);
  }
  
  return output;
}


/**
 * Test function for onOpen
 */
function test_generateShoppingList() {
  generateShoppingList_();
}

