/**
 * V1.2.0
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
  // Monday
  ScriptApp.newTrigger('triggerReminder')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(7)
      .nearMinute(0)
      .everyWeeks(1)
      .create();
  
  // Tuesday
  ScriptApp.newTrigger('triggerReminder')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.TUESDAY)
      .atHour(7)
      .nearMinute(0)
      .everyWeeks(1)
      .create();
  
  // Wednesday
  ScriptApp.newTrigger('triggerReminder')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.WEDNESDAY)
      .atHour(7)
      .nearMinute(0)
      .everyWeeks(1)
      .create();
  
  // Thursday
  ScriptApp.newTrigger('triggerReminder')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.THURSDAY)
      .atHour(7)
      .nearMinute(0)
      .everyWeeks(1)
      .create();
  
  // Friday
  ScriptApp.newTrigger('triggerReminder')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.FRIDAY)
      .atHour(7)
      .nearMinute(0)
      .everyWeeks(1)
      .create();
  
  // Saturday
  ScriptApp.newTrigger('triggerReminder')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.SATURDAY)
      .atHour(10)
      .nearMinute(0)
      .everyWeeks(1)
      .create();
  
  // Sunday
  ScriptApp.newTrigger('triggerReminder')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.SUNDAY)
      .atHour(10)
      .nearMinute(0)
      .everyWeeks(1)
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

