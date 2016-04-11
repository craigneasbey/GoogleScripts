/**
 * V1.1.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

/**
 * Creates a new trigger for updated, triggers every UPDATED_CHECK_HOUR hours
 */
function createTimeDrivenTriggerForUpdated() {
  ScriptApp.newTrigger('triggerUpdated')
      .timeBased()
      .everyHours(Global().UPDATED_CHECK_HOUR)
      .create();
}

/**
 * Run from a installed trigger to check if an update notification is required
 */
function triggerUpdated() {
  if(DISABLED) {
    return;
  }
  
  Logger.log("triggerReminder function called");
  Updated.checkUpdated();
}

/**
 * Creates a new trigger for refresh, Triggers every REFRESH_CHECK_DAYS at REFRESH_CHECK_HOUR
 */
function createTimeDrivenTriggerForRefresh() {
  ScriptApp.newTrigger('triggerRefresh')
      .timeBased()
      .atHour(Global().REFRESH_CHECK_HOUR)
      .everyDays(Global().REFRESH_CHECK_DAYS)
      .create();
}

/**
 * Run from a installed trigger to notify the team member if the sheet has updated
 */
function triggerRefresh() {
  if(DISABLED) {
    return;
  }
  
  Logger.log("triggerRefresh function called");
  Refresh.refreshCurrentWeek(new Date());
}

/**
 * Creates a new trigger for reminder, triggers every REMINDER_CHECK_HOUR hours
 */
function createTimeDrivenTriggerForReminder() {
  ScriptApp.newTrigger('triggerReminder')
      .timeBased()
      .everyHours(Global().REMINDER_CHECK_HOUR)
      .create();
}

/**
 * Run from a installed trigger to check reminder
 */
function triggerReminder() {
  if(DISABLED) {
    return;
  }
  
  Logger.log("triggerReminder function called");
  Reminder.checkReminder();
}

