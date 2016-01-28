/**
 * V1.1.2
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
  var ShoppingListSheetName = 'Shopping List';
  
  if(shoppingList.length > 0) {
    var shoppingListSheet = spreadsheet.getSheetByName(ShoppingListSheetName);

    // delete it if it exists
    if (shoppingListSheet != null) {
      spreadsheet.deleteSheet(shoppingListSheet);
    }
    
    shoppingListSheet = spreadsheet.insertSheet(ShoppingListSheetName);
    shoppingListSheet.activate();

    //Browser.msgBox("shoppingList.length: " + shoppingList.length);   
    
    var operationCol = 1;
    var itemCol = 2;
    var lastColumn = itemCol;
    var addRightPadding = 20; //display with dropdown arrow on mobile
    
    // clean the sheet (obsolete as sheet is deleted)
    //shoppingListSheet.clear();
    //shoppingListSheet.showRows(1, shoppingList.length);
    var allColumns = shoppingListSheet.getRange(1, 1, shoppingList.length, lastColumn);
    //allColumns.clearDataValidations();
    // create shopping list
    var itemColumn = shoppingListSheet.getRange(1, itemCol, shoppingList.length, 1);
    itemColumn.setValues(convertToArrayOfArrays(shoppingList));
    // sort
    //itemColumn.sort(itemCol);
    // add Operation dropdown
    var operationColumn = shoppingListSheet.getRange(1, operationCol, shoppingList.length, 1);
    operationColumn.setValue("Show");
    var operationArray = ['Show', 'Hide', 'Up', 'Down', 'Top', 'Bottom'];
    var operationRule = SpreadsheetApp.newDataValidation().requireValueInList(operationArray, true).build();
    operationColumn.setDataValidation(operationRule);
    
    // increase font for mobile usage
    allColumns.setFontSize(20);
    
    // auto set column width
    //shoppingListSheet.autoResizeColumn(checkCol);
    shoppingListSheet.autoResizeColumn(itemCol);
    shoppingListSheet.autoResizeColumn(operationCol);
    
    // enlarge column to stop dropdown covering value
    var currentOperationWidth = shoppingListSheet.getColumnWidth(operationCol);
    shoppingListSheet.setColumnWidth(operationCol, currentOperationWidth + addRightPadding);
    
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
 * Runs when spreadsheet cell has finished editing
 */
function onEdit(e) {
  // if text value is "Hide" then hide the row of that cell
  if(e.value) {
    if(e.value === "Hide") {
      Logger.log("onEdit: " + JSON.stringify(e));
      hideRow_();
    } else if(e.value === "Up" || e.value === "Down" || e.value === "Top" || e.value === "Bottom") {
      Logger.log("onEdit: " + JSON.stringify(e));
      moveRowAround_(e.value);
    }
  }
}

/**
 * Hide the current row
 */
function hideRow_() {
  var currentSheet = SpreadsheetApp.getActiveSheet();
  
  currentSheet.hideRows(currentSheet.getActiveCell().getRow());
}

/**
 * Move the row around the current row up or down
 */
function moveRowAround_(direction) {
  var currentSheet = SpreadsheetApp.getActiveSheet();
  var currentCell = currentSheet.getActiveCell();
  var currentRow = currentCell.getRow();
  var defaultValue = 'Show';
  
  // set default value again
  currentCell.setValue([defaultValue]);
  
  if(direction === "Up") {
    var srcRow = currentRow - 1;
    var destRow = currentRow + 1;
    
    // move to next row if it is hidden
    while(isHiddenRow(srcRow, currentSheet)) {
      srcRow -= 1;
    }
    
    // move to next row if it is hidden
    while(isHiddenRow(destRow, currentSheet)) {
      destRow += 1;
    }
    
    if(srcRow > 0 && destRow > 0) {
      moveRowAroundByNum_(srcRow, destRow, currentSheet);
    }
  } else if(direction === "Down") {    
    var srcRow = currentRow + 1;
    var destRow = currentRow;
    
    // move to next row if it is hidden
    while(isHiddenRow(srcRow, currentSheet)) {
      srcRow += 1;
    }
    
    if(srcRow > 0 && destRow > 0) {
      moveRowAroundByNum_(srcRow, destRow, currentSheet);
    }
  } else if(direction === "Top") {
    var srcRow = currentRow;
    var destRow = 1;
    
    if(srcRow > 0 && destRow > 0) {
      moveRowByNum_(srcRow, destRow, currentSheet);
    }
  } else if(direction === "Bottom") {   
    var srcRow = currentRow;
    var destRow = currentSheet.getDataRange().getLastRow() + 1; //last data row
    
    if(srcRow > 0 && destRow > 0) {
      moveRowByNum_(srcRow, destRow, currentSheet);
    }
  }
}

/**
 * Check if the row is hidden
 *
 * Work around to feature request: https://code.google.com/p/google-apps-script-issues/issues/detail?id=195
 */
function isHiddenRow(currentRow, currentSheet) {
  var startCol = 1;
  var numOfRows = 1;
  var numOfCols = 1;
  
  if(currentRow > 0) {
    var showHideRange = currentSheet.getRange(currentRow, startCol, numOfRows, numOfCols);
    
    // http://stackoverflow.com/questions/6793805/how-to-skip-hidden-rows-while-iterating-through-google-spreadsheet-w-google-app
    if(showHideRange) {
      if(showHideRange.getValue() === 'Hide') {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Move a row up or down around the current row based on the row number
 */
function moveRowAroundByNum_(fromRow, toRow, currentSheet) {
  var startCol = 1;
  var numOfRows = 1;
  var numOfCols = 10;
  
  // if moving up, from row number will change after insert, need to alter appropriately
  if(toRow < fromRow) {
    fromRow += 1;
  }
  
  // insert new row
  currentSheet.insertRows(toRow);
  // copy values      
  currentSheet.getRange(fromRow, startCol, numOfRows, numOfCols).moveTo(currentSheet.getRange(toRow, startCol, numOfRows, numOfCols));
  // delete existing row
  currentSheet.deleteRow(fromRow);
}

/**
 * Move the current row up or down based on the row number
 */
function moveRowByNum_(fromRow, toRow, currentSheet) {
  var startCol = 1;
  var numOfRows = 1;
  var numOfCols = 10;
  
  // if moving up, from row number will change after insert, need to alter appropriately
  if(toRow < fromRow) {
    fromRow += 1;
  }
  
  // insert new row
  currentSheet.insertRows(toRow);
  // copy values      
  currentSheet.getRange(fromRow, startCol, numOfRows, numOfCols).moveTo(currentSheet.getRange(toRow, startCol, numOfRows, numOfCols));
  // delete existing row
  currentSheet.deleteRow(fromRow);
}


/**
 * Test function for onOpen
 */
function test_generateShoppingList() {
  generateShoppingList_();
}

/**
 * Test function for onEdit. Passes an event object to simulate an edit to
 * a cell in a spreadsheet.
 *
 * Check for updates: http://stackoverflow.com/a/16089067/1677912
 *
 * See https://developers.google.com/apps-script/guides/triggers/events#google_sheets_events
 */
function test_onEditHide() {
  onEdit({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Hide",
    authMode : ""
  });
}

function test_onEditDown() {
  onEdit({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Down",
    authMode : ""
  });
}

function test_onEditUp() {
  onEdit({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Up",
    authMode : ""
  });
}

function test_onEditTop() {
  onEdit({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Top",
    authMode : ""
  });
}

function test_onEditBottom() {
  onEdit({
    user : "",
    source : SpreadsheetApp.getActiveSpreadsheet(),
    range : SpreadsheetApp.getActiveSpreadsheet().getActiveCell(),
    value : "Bottom",
    authMode : ""
  });
}

