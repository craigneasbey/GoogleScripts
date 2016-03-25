/**
 * V1.0.8
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

loadGlobalConfig();

// create local configuration object
var notificationConfig = {};
notificationConfig.TESTING = false;

/**
 * Emails all the players
 */
function emailPlayers_(subject, message) {
  var playerEmails = getPlayerEmails_();
  
  sendEmail_(playerEmails, subject, message);
}

/**
 * Get all the players email addresses
 */
function getPlayerEmails_() {
  var emails = new Array();
  
  if(!notificationConfig.TESTING) {
    var currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var rosterSheet = currentSpreadsheet.getSheetByName(global.ROSTER_SHEET_NAME);
    
    var startRow = global.MEMBER_EMAIL_ROW; // row with player emails
    var startCol = 2;
    var numRows = 1;
    var numCols = global.MAX_MEMBER_COLUMNS;
    
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
 * Get some of the players email addresses by column number
 */
function getIndividualPlayerEmails_(columns) {
  var emails = new Array();
  
  var allEmails = getPlayerEmails_();
  
  if(Array.isArray(columns)) {
    for (var i = 0; i < columns.length; i++) {
      var playerNum = Number(columns[i]);
      emails.push(allEmails[playerNum - 1]);
    }
  }
  
  return emails;
}

/**
 * Sends an email with this spreadsheet attached
 */
function sendEmail_(recipients, subject, message) {
  var file = DriveApp.getFileById(SPREADSHEET_DOCUMENT_ID);
  var options = {
    name: global.NOTIFICATION_SENDER_NAME,
    attachments: [file.getAs(MimeType.PDF)] 
  };
  
  message += global.NOTIFICATION_MESSAGE_FOOTER;
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
 * notificationConfig.TESTING should be set to true before running
 * some individual tests)
 */
function test_manual_notification_suite() {
  test_getPlayerEmails();
  test_getIndividualPlayerEmails();
  
  notificationConfig.TESTING = true;

  test_sendEmails();
  
  notificationConfig.TESTING = false;
}

function test_getPlayerEmails() {
  var expectedMinLength = 1;
  
  var actualArray = getPlayerEmails_();

  GSUnit.assertTrue('Player emails is array', Array.isArray(actualArray));  
  GSUnit.assertTrue('Player emails has length', actualArray.length > expectedMinLength);
  
  for(var i=0; i < actualArray.length; i++) {
    var comment = 'Email ' + actualArray[i] + ' is not a valid email address';
    GSUnit.assertTrue(comment, actualArray[i].indexOf('@') === -1 ? false : true);
  }
}

function test_getIndividualPlayerEmails() {
  var expectedLength = 3;
  
  var actualArray = getIndividualPlayerEmails_(new Array(1,4,5));

  GSUnit.assertTrue('Individual player emails is array', Array.isArray(actualArray));  
  GSUnit.assertTrue('Individual player emails has length', actualArray.length === expectedLength);
  
  for(var i=0; i < actualArray.length; i++) {
    var comment = 'Email ' + actualArray[i] + ' is not a valid email address';
    GSUnit.assertTrue(comment, actualArray[i].indexOf('@') === -1 ? false : true);
  }
}

function test_sendEmails() {
  sendEmail_([Session.getActiveUser().getEmail()], 'Test Notificiation', 'This is a test notification');
}

