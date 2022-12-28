/**
 * V1.1.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var GUIUtils = {};

// create local configuration object
GUIUtils.Config = {};
GUIUtils.Config.TESTING = false;
Logger.log("GUI Utilities configuration loaded");

GUIUtils.CANCEL = 'CANCEL';

/**
 * Display dialog for user to confirm the something is correct
 */
GUIUtils.openCheckDialog = function(promptTitle, promptText) {
  
  var ui = SpreadsheetApp.getUi(),
      response = ui.alert(
        promptTitle,
        promptText,
        ui.ButtonSet.YES_NO);

 // Process the user's response.
 if (response == ui.Button.YES) {
   Logger.log('The user clicked "Yes."');
   return true;
 } else {
   Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
 }
  
  return false;
}

/**
 * Display dialog for user to enter text
 */
GUIUtils.openEntryDialog = function(promptTitle, promptText) {
  
  var ui = SpreadsheetApp.getUi(),
      response = ui.prompt(
        promptTitle, 
        promptText, 
        ui.ButtonSet.OK_CANCEL);

 // Process the user's response.
 var text = response.getResponseText();
 var button = response.getSelectedButton();
 if (button == ui.Button.OK) {
   Logger.log('The user clicked "OK" and entered text: ' + text);
   return text;
 } else {
   Logger.log('The user clicked "Cancel" or the close button in the dialog\'s title bar.');
 }
  
  return GUIUtils.CANCEL;
}


/**
 * Manual Tests
 */
function test_openCheckDialog() {
  GUIUtils.openCheckDialog('Check title', 'Check text');
}

function test_openEntryDialog() {
  GUIUtils.openEntryDialog('Entry title', 'Entry text');
}
