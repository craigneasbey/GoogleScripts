/**
 * V1.1.0
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
  var options = {
    name: Global().NOTIFICATION_SENDER_NAME,
    attachments: [file.getAs(MimeType.PDF)] 
  };
  
  message += Global().NOTIFICATION_MESSAGE_FOOTER;
  message += '\nhttps://docs.google.com/spreadsheets/d/' + SPREADSHEET_DOCUMENT_ID + '/edit?usp=sharing';
  
  var recipientsCSV = '';
  
  if(Array.isArray(recipients)) {
    for(i in recipients) {
      if(!isEmptyStr(recipientsCSV)) {
        recipientsCSV += ',';
      }
      
      recipientsCSV += recipients[i];
    }
    
    if(!isEmptyStr(recipientsCSV)) {
      MailApp.sendEmail(recipientsCSV, subject, message, options);
    }
  }
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

