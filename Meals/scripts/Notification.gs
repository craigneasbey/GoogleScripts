/**
 * V1.2.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Meals)
 */

var Notification = {};

// create local configuration object
Notification.Config = {};
Notification.Config.TESTING = false;
Logger.log("Notification configuration loaded");

/**
 * Sends an email with this spreadsheet attached
 */
Notification.sendEmail = function(recipients, subject, message) {  
  message += '<div>https://docs.google.com/spreadsheets/d/' + SPREADSHEET_DOCUMENT_ID + '/edit?usp=sharing</div>';
  
  var recipientsCSV = '';
  
  if(Array.isArray(recipients)) {
    for(i in recipients) {
      if(!isEmptyStr(recipientsCSV)) {
        recipientsCSV += ',';
      }
      
      recipientsCSV += recipients[i];
    }
    
    if(!isEmptyStr(recipientsCSV)) {
      MailApp.sendEmail({
        to: recipientsCSV,
        subject: subject,
        htmlBody: message,
        name: "Meal Plan"
     });
    }
  }
}

/**
 * Create a HTML table from an array
 */
Notification.createHTMLTable = function(sourceArray) {
  var htmlObject = HtmlService.createTemplateFromFile('table.html');
  htmlObject.data = sourceArray;
  
  return htmlObject.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}


/**
 * Manual Tests
 */
function test_manual_notification_suite() {
  test_send_email();
  test_send_email_html();
}

function test_send_email() {
  Notification.sendEmail([Session.getActiveUser().getEmail()], 'Test Notification', 'This is a test notification');
}

function test_send_email_html() {
  var testPlan = new Array();
  testPlan[0] = new Array("","Wednesday");
  testPlan[1] = new Array("Breakfast","Baked beans");
  testPlan[2] = new Array("Snack","Cruskits");
  testPlan[3] = new Array("Lunch","	Egg Wrap");
  testPlan[4] = new Array("Snack","Yoghurt");
  testPlan[5] = new Array("Dinner","San Cho Bow");
  testPlan[6] = new Array("Supper","Milo");
  var message = Notification.createHTMLTable(testPlan);
  
  var testDayMeals = new Array();
  testDayMeals[0] = new Array("Food","Ingredients","Instructions");
  testDayMeals[1] = new Array("Baked beans","ingredients_test","instructions_test");
  testDayMeals[2] = new Array("Cruskits","ingredients_test","instructions_test");
  testDayMeals[3] = new Array("Egg Wrap","ingredients_test","instructions_test");
  testDayMeals[4] = new Array("Yoghurt","ingredients_test","instructions_test");
  testDayMeals[5] = new Array("San Cho Bow","ingredients_test","instructions_test");
  testDayMeals[6] = new Array("Milo","ingredients_test","instructions_test")
  message += Notification.createHTMLTable(testDayMeals);
  
  Notification.sendEmail([Session.getActiveUser().getEmail()], 'Test HTML Notification', message);
}

function test_create_HTML_table() {
  var testArray = new Array();
  testArray[0] = new Array("","Bob","John","Paul","Peter","David","Jerry");
  testArray[1] = new Array("22 Jul 2016","Play","CBA","Play","NA","Play","Play");
  var expected = '<!DOCTYPE html> <html> <head> <base target="_top"> </head> <body> <table cellspacing="0" cellpadding="5" style="border-left: 1px solid #000; border-top:1px solid #000; border-bottom: ...';
  
  var actual = Notification.createHTMLTable(testArray);
  
  GSUnit.assertEquals('Create HTML table', expected, actual);
}

