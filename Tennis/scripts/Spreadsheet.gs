/**
 * V1.1.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

DISABLED = false;

/**
 * Runs when the spreadsheet is open, adds a menu to the spreadsheet
 */
function onOpen() {
  if(DISABLED) {
    return;
  }
  
  Global();
  
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    {name: configGlobal.MENU_ITEM_GENERATE, functionName: 'generateDates'},
    {name: configGlobal.MENU_ITEM_ALLOCATE, functionName: 'allocateMembers'},
    {name: configGlobal.MENU_ITEM_EMAIL, functionName: 'emailMembersMessage'},
    {name: configGlobal.MENU_ITEM_REMOVE, functionName: 'removePastWeeks'}
  ];
  spreadsheet.addMenu('Roster', menuItems);
}

/**
 * Runs when spreadsheet cell has finished editing
 */
function onEdit(e) {
  if(DISABLED) {
    return;
  }
  
  //Logger.log("onEdit: " + JSON.stringify(e));
  Updated.checkRosterUpdated(e);
}

function generateDates() {
  Roster.generateDates();
}

function allocateMembers() {
  Roster.allocateMembers();
}

function emailMembersMessage() {
  Roster.emailMembersMessage();
}

function removePastWeeks() {
  Roster.removePastWeeks();
}
