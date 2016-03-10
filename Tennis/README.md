# Tennis Roster System

## Setup
Create a Google Apps Script file for configuation and add line:

```
var SPREADSHEET_DOCUMENT_ID = '';
```
with the Google Spreadsheet document_id.

run createTimeDrivenTriggerForUpdated in Updated.gs to create a schedule to check every UPDATE_CHECK_HOUR hours if the roster has been updated
run createTimeDrivenTriggerForReminder in Reminder.gs to create a schedule to check every REMINDER_CHECK_HOUR hours if the reminders need to be sent
run createTimeDrivenTriggerForRefresh in Refresh.gs to create a schedule to refresh the current week highlight every REFRESH_CHECK_HOUR and REFRESH_CHECK_DAYS

## Roster Menu
The Roster menu allows the user to:
* Generate Dates - current it prints the date of each Tuesday
* Allocate Players - roster which players are playing
* Email Players - sends an email to all players with the spreadsheet attached

## Details
* Field data validation is used to create a dropdown list from the Values sheet
* Configuration can be changed from the key/value pairs in the Configuration sheet
* Example CSV sheets are included that demonstrate the format of the Google Sheet

