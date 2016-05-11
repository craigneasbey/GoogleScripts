/**
 * V1.2.1
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Meals)
 */

/**
 * Creates a new trigger for reminder, triggers every REMINDER_CHECK_HOUR hours
 */
function createTimeDrivenTriggerForReminders() {
  // Deletes all triggers in the current project.
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  // Every day 1am
  ScriptApp.newTrigger('triggerReminder')
      .timeBased()
      .everyDays(1)
      .atHour(1)
      .nearMinute(0)
      .create();
}

/**
 * Run from a installed trigger to send reminder
 */
function triggerReminder() {
  if(DISABLED) {
    return;
  }
  
  Logger.log("triggerReminder function called");
  Reminder.sendReminder();
}

