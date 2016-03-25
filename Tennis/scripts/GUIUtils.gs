/**
 * V1.0.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

loadGlobalConfig();

// create local configuration object
var guiConfig = {};
guiConfig.TESTING = false;

var CANCEL = 'CANCEL';

/**
 * Display dialog for user to confirm the something is correct
 */
function openCheckDialog(promptTitle, promptText) {
  
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
function openEntryDialog(promptTitle, promptText) {
  
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
  
  return CANCEL;
}


/**
 * Manual Tests
 */
function test_openCheckDialog() {
  openCheckDialog('Check title', 'Check text');
}

function test_openEntryDialog() {
  openEntryDialog('Entry title', 'Entry text');
}

