/**
 * V1.2.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Meals)
 */

DISABLED = false;

/**
 * Runs when the spreadsheet is open, adds a menu to the spreadsheet
 */
function onOpen() {
  if(DISABLED) {
    return;
  }
  
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    {name: 'Generate Shopping List...', functionName: 'generateShoppingList'}
  ];
  spreadsheet.addMenu('Shopping List', menuItems);
}

/**
 * Runs when spreadsheet cell has finished editing
 */
function onEdit(e) {
  if(DISABLED) {
    return;
  }
  
  ListActions.editEvent(e);
}

function generateShoppingList() {
  ShoppingList.generateShoppingList();
}

