/**
 * V1.1.2
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var Notification = {};

// create local configuration object
Notification.Config = {};
Notification.Config.TESTING = false;
Logger.log("Notification configuration loaded");

/**
 * Emails all the members
 */
Notification.emailMembers = function(subject, message) {
  var memberEmails = Notification.getMemberEmails();  
   message = '<div style="margin-bottom: 20px;">' + message + '</div>';
  
  Notification.sendEmail(memberEmails, subject, message);
}

/**
 * Get all the members email addresses
 */
Notification.getMemberEmails = function() {
  var emails = new Array();
  
  if(!Notification.Config.TESTING) {
    var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var rosterSheet = currentSpreadsheet.getSheetByName(Global().ROSTER_SHEET_NAME);
    
    var startRow = Global().MEMBER_EMAIL_ROW; // row with member emails
    var startCol = 2;
    var numRows = 1;
    var numCols = Global().MAX_MEMBER_COLUMNS;
    
    var dataRange = rosterSheet.getRange(startRow, startCol, numRows, numCols);
    var data = dataRange.getValues();
    
    for (i in data) {
      var row = data[i];
      for (j in row) {
        if(!isEmptyStr(row[j])) {
          emails.push(row[j]);
        }
      }
    }
  } else {
    emails.push(Session.getActiveUser().getEmail());
  }
  
  return emails;
}

/**
 * Get some of the members email addresses by column number
 */
Notification.getIndividualMemberEmails = function(columns) {
  var emails = new Array();
  
  var allEmails = Notification.getMemberEmails();
  
  if(Array.isArray(columns)) {
    for (var i = 0; i < columns.length; i++) {
      var memberNum = Number(columns[i]);
      emails.push(allEmails[memberNum - 1]);
    }
  }
  
  return emails;
}

/**
 * Sends an email with this spreadsheet attached
 */
Notification.sendEmail = function(recipients, subject, message) {
  var file = DriveApp.getFileById(SPREADSHEET_DOCUMENT_ID);
  
  message += Global().NOTIFICATION_MESSAGE_FOOTER;
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
        name: Global().NOTIFICATION_SENDER_NAME,
        attachments: [file.getAs(MimeType.PDF)]
     });
    }
  }
}

/**
 * Create a HTML table from an array
 */
Notification.createHTMLTable = function(sourceArray, templateFile) {
  templateFile = defaultFor(templateFile, 'table.html');
	
  var htmlObject = HtmlService.createTemplateFromFile(templateFile);
  htmlObject.data = sourceArray;
  
  return htmlObject.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}


/**
 * Manual Tests (relies on Roster sheet values,
 * Notification.Config.TESTING should be set to true before running
 * some individual tests)
 */
function test_manual_notification_suite() {
  test_getMemberEmails();
  test_getIndividualMemberEmails();
  
  Notification.Config.TESTING = true;

  test_sendEmail();
  test_send_email_html();
  
  Notification.Config.TESTING = false;
}

function test_getMemberEmails() {
  var expectedMinLength = 1;
  
  var actualArray = Notification.getMemberEmails();

  GSUnit.assertTrue('Member emails is array', Array.isArray(actualArray));  
  GSUnit.assertTrue('Member emails has length', actualArray.length > expectedMinLength);
  
  for(var i=0; i < actualArray.length; i++) {
    var comment = 'Email ' + actualArray[i] + ' is not a valid email address';
    GSUnit.assertTrue(comment, actualArray[i].indexOf('@') === -1 ? false : true);
  }
}

function test_getIndividualMemberEmails() {
  var expectedLength = 3;
  
  var actualArray = Notification.getIndividualMemberEmails(new Array(1,4,5));

  GSUnit.assertTrue('Individual member emails is array', Array.isArray(actualArray));  
  GSUnit.assertTrue('Individual member emails has length', actualArray.length === expectedLength);
  
  for(var i=0; i < actualArray.length; i++) {
    var comment = 'Email ' + actualArray[i] + ' is not a valid email address';
    GSUnit.assertTrue(comment, actualArray[i].indexOf('@') === -1 ? false : true);
  }
}

function test_sendEmail() {
  Notification.sendEmail([Session.getActiveUser().getEmail()], 'Test Notification', 'This is a test notification');
}

function test_send_email_html() {
  var t = HtmlService.createTemplateFromFile('table.html');
  t.data = new Array();
  t.data[0] = new Array("","Bob","John","Paul","Peter","David","Jerry");
  t.data[1] = new Array("22 Jul 2016","Play","CBA","Play","NA","Play","Play");
  var message = t.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
  
  Notification.sendEmail([Session.getActiveUser().getEmail()], 'Test HTML Notification', message);
}

function test_create_HTML_table() {
  var testArray = new Array();
  testArray[0] = new Array("","Bob","John","Paul","Peter","David","Jerry");
  testArray[1] = new Array("22 Jul 2016","Play","CBA","Play","NA","Play","Play");
  var expected = '<!DOCTYPE html> <html> <head> <base target="_top"> </head> <body> <table cellspacing="0" cellpadding="5" style="border-left: 1px solid #000; border-top:1px solid #000; border-bottom: 1px solid #000; margin-bottom: 20px"> <tr style="border-bottom:1px solid #000;"> <td style="font-weight: bold; border-right: 1px solid #000; border-bottom:1px solid #000;"></td> <td style="font-weight: bold; border-right: 1px solid #000; border-bottom:1px solid #000;">Bob</td> <td style="font-weight: bold; border-right: 1px solid #000; border-bottom:1px solid #000;">John</td> <td style="font-weight: bold; border-right: 1px solid #000; border-bottom:1px solid #000;">Paul</td> <td style="font-weight: bold; border-right: 1px solid #000; border-bottom:1px solid #000;">Peter</td> <td style="font-weight: bold; border-right: 1px solid #000; border-bottom:1px solid #000;">David</td> <td style="font-weight: bold; border-right: 1px solid #000; border-bottom:1px solid #000;">Jerry</td> </tr> <tr style="border-bottom:1px solid #000;"> <td style="background-color: #737F77; color: #E6FFEE; font-weight: bold; border-top:1px solid #000; border-right:1px solid #000;">22 Jul 2016</td> <td style="background-color: #007F11; color: #A3FFB0; font-weight: bold; border-top:1px solid #000; border-right:1px solid #000;">Play</td> <td style="background-color: #737F77; color: #E6FFEE; font-weight: bold; border-top:1px solid #000; border-right:1px solid #000;">CBA</td> <td style="background-color: #007F11; color: #A3FFB0; font-weight: bold; border-top:1px solid #000; border-right:1px solid #000;">Play</td> <td style="background-color: #737F77; color: #E6FFEE; font-weight: bold; border-top:1px solid #000; border-right:1px solid #000;">NA</td> <td style="background-color: #007F11; color: #A3FFB0; font-weight: bold; border-top:1px solid #000; border-right:1px solid #000;">Play</td> <td style="background-color: #007F11; color: #A3FFB0; font-weight: bold; border-top:1px solid #000; border-right:1px solid #000;">Play</td> </tr> </table> </body> </html>';
  
  var actual = Notification.createHTMLTable(testArray);
  
  GSUnit.assertEquals('Create HTML table', expected, actual);
}

