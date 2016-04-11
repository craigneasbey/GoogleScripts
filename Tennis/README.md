# Tennis Roster System

## Setup
* Create a Google Sheet based on the example CSV sheets included that demonstrate the format of the spreadsheet
* Setup the field data validation that is used to create a dropdown list from the Values sheet
* Configure the spreadsheet by changing the key/value pairs in the Configuration sheet
* Hide all sheets except the Roster sheet so that when the spreadsheet is PDFed, the other sheets are not included
* Create a Google Apps Script file for each source code file
* Create a Google Apps Script file for implementation configuation and add line:

```
var SPREADSHEET_DOCUMENT_ID = '';
```

  with the Google Spreadsheet document_id.
* Create a schedule using Triggers.gs:
  * run createTimeDrivenTriggerForUpdated to check every UPDATE_CHECK_HOUR hours if the roster has been updated
  * run createTimeDrivenTriggerForReminder to check every REMINDER_CHECK_HOUR hours if the reminders need to be sent
  * run createTimeDrivenTriggerForRefresh to refresh the current week highlight every REFRESH_CHECK_HOUR and REFRESH_CHECK_DAYS

## Roster Menu
The Roster menu allows the user to:
* Generate Dates - displays the dates of each rostered weekday
* Allocate Players - rosters which players are playing for the selected weeks
* Email Players - sends an email to all players with the spreadsheet attached
* Remove past weeks - removes the past rostered weeks to retain the size

