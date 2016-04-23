/**
 * V1.2.1
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var AllocateMembers = {};

// create local configuration object
AllocateMembers.Config = {};
Logger.log("Allocate Members configuration loaded");

/*
 * Allocate members for selected roster
 *
 * weeksArray - An array of week rows with each members roster
 * historyArray - The previous weeks roster history rows
 * maxWeeksRostered - Maximum consecutive weeks playing
 * maxWeeksRest - Maximum consecutive weeks resting
 * fillTeam - Object containing the start index to look for next available member to roster
 */
AllocateMembers.allocateSelectedMembers = function(weeksArray, historyArray, maxWeeksRostered, maxWeeksRest, fillTeam) {
  var updated = false;
  
  //Logger.log("allocateSelectedMembers history: " + JSON.stringify(ArrayUtils.arrayCloneRotate(historyArray, -90), null, 1));
  //Logger.log("allocateSelectedMembers input: " + JSON.stringify(ArrayUtils.arrayCloneRotate(weeksArray, -90), null, 1));
  
  // for each week allocate members
  for(var i = 0; i < weeksArray.length; i++) {    
    var rosteredWeekArray = AllocateMembers.allocateMembersForWeek(weeksArray[i], historyArray, maxWeeksRostered, maxWeeksRest, fillTeam);
    
    // update week with roster
    ArrayUtils.arrayCopy(rosteredWeekArray, weeksArray[i]);
    
    // move history down roster
    historyArray = AllocateMembers.progressMembersHistory(historyArray, rosteredWeekArray);
    
    updated = true;
  }
  
  //Logger.log("allocateSelectedMembers output: " + JSON.stringify(ArrayUtils.arrayCloneRotate(weeksArray, -90), null, 1));
  
  return updated;
}

/**
 * Allocate members roster for a week
 * 
 * weekArray - The week row with each members roster
 * membersHistoryArray - The previous weeks roster history rows
 * maxWeeksRostered - Maximum consecutive weeks playing
 * maxWeeksRest - Maximum consecutive weeks resting
 * fillTeam - Object containing the start index to look for next available member to roster
 */
AllocateMembers.allocateMembersForWeek = function(weekArray, membersHistoryArray, maxWeeksRostered, maxWeeksRest, fillTeam) {
  var resultArray = new Array();
  var rosteredCount = 0;
  var history = false;
  
  if(weekArray && Array.isArray(weekArray)) {
    var arrayLength = 0;
    
    if(membersHistoryArray && Array.isArray(membersHistoryArray)) {
      // history exists
      history = true;
      maxWeeksRostered = defaultFor(maxWeeksRostered, 1);
      maxWeeksRest = defaultFor(maxWeeksRest, 1);
      
      // rotate array to the right to iterate through each member roster history column
      var localHistoryArray = ArrayUtils.arrayCloneRotate(membersHistoryArray, 90);
      
      // weekArray and localHistoryArray be the same length
      arrayLength = weekArray.length < localHistoryArray.length ? weekArray.length : localHistoryArray.length;
    } else {
      // no history
      arrayLength = weekArray.length;
    }
    
    // for each member
    for(var i = 0; i < arrayLength; i++) {
      var result = "";
      
      if(history) {
        result = AllocateMembers.allocateMemberForWeek(weekArray[i], localHistoryArray[i], maxWeeksRostered, maxWeeksRest);
      } else {
        result = AllocateMembers.allocateMemberForWeek(weekArray[i]);
      }
      
      if(result === Global().ROSTERED) {
        if(rosteredCount >= Global().MAX_TEAM_MEMBERS) {
          result = Global().COULD_BE_AVAILABLE;
        } else {
          rosteredCount++;
        }
      }
      resultArray.push(result);
    }
    
    // if there are not enough members allocated and some members are available, 
    // change COULD_BE_AVAILABLE to ROSTERED, start on member index fillTeam.start
    if(rosteredCount !== Global().MAX_TEAM_MEMBERS && resultArray && Array.isArray(resultArray)) {
      if(isEmpty(fillTeam) || isEmpty(fillTeam.start)) {
        fillTeam = { "start" : 0 };
        Logger.log('fillTeam.start was not set, reset to the first member');
      }
      //Logger.log('fillTeam.start: ' + fillTeam.start);
      
      var start = fillTeam.start;
      var needMembers = true;
      var needMemberLoops = 0;
      
      // loop until enough members are rostered
      while(needMembers) {
        for(var i=start; i < resultArray.length && rosteredCount < Global().MAX_TEAM_MEMBERS; i++) {
          //Logger.log('i: ' + i + ' rosteredCount: ' + rosteredCount);
          if(resultArray[i] === Global().COULD_BE_AVAILABLE) {
            resultArray[i] = Global().ROSTERED;
            rosteredCount++;
          }
        }
        
        if(rosteredCount === Global().MAX_TEAM_MEMBERS) {
          needMembers = false;
        } else {
          // has all members been checked?
          if(needMemberLoops > 1) {
            // not enough members available, exit
            needMembers = false;    
            //Logger.log('Not enough members: ' + rosteredCount);
          } else {
            // not enough members, move the start to the first member again
            start = 0;
            //Logger.log('start of week again');
          }
        }
        
        needMemberLoops++;
      }
      
      // progress start of fill team
      if(fillTeam.start + 1 < resultArray.length)
      {
        // increment to next member
        fillTeam.start++;
      } else {
        // move the start to the first member again
        fillTeam.start = 0;
      }
    }
  }
  
  // if array is empty, fill array with ROSTERED until MAX_TEAM_MEMBERS
  if(resultArray.length == 0) {
    resultArray.push(Global().ROSTERED);
  }
  
  return resultArray;
}

/**
 * Allocate member roster for the current week
 *
 * memberWeek - The members roster for a week
 * memberHistoryArray - The previous weeks member roster history rows
 * maxWeeksRostered - Maximum consecutive weeks playing
 * maxWeeksRest - Maximum consecutive weeks resting
 */
AllocateMembers.allocateMemberForWeek = function(memberWeek, memberHistoryArray, maxWeeksRostered, maxWeeksRest) {  
  if(memberWeek === Global().NOT_AVAILABLE) {
    return memberWeek;
  }
    
  // if member history exists
  if(memberHistoryArray && Array.isArray(memberHistoryArray)) {
    var rosteredCount = 0;
    var restCount = 0;
    
    maxWeeksRostered = defaultFor(maxWeeksRostered, 1);
    maxWeeksRest = defaultFor(maxWeeksRest, 1);
    //Logger.log('maxWeeksRostered: ' + maxWeeksRostered);
    
    // get the larger amount of history required
    var historyRequiredLength = maxWeeksRostered > maxWeeksRest ? maxWeeksRostered : maxWeeksRest;
    
    // for each previous week until max, starting at the previous week, going into the past
    // count the amount of rostered and rested weeks history until the sequence is broken
    for(var i=0; i < historyRequiredLength && i < memberHistoryArray.length; i++) {
      if(memberHistoryArray[i] === Global().ROSTERED) {
        rosteredCount++;
        
        // if rest was previously in the history, sequence is broken
        if(restCount > 0) {
          // if we have reached the max rest history, return rostered
          if(restCount >= maxWeeksRest) {
            return Global().ROSTERED;
          } else {
            return Global().COULD_BE_AVAILABLE;
          }
        }
      } else {
        restCount++;
        
        // if rostered was previously in the history, sequence is broken
        if(rosteredCount > 0) {
          // if we have reached the max rostered history, return rest
          if(rosteredCount >= maxWeeksRostered) {
            return Global().COULD_BE_AVAILABLE;
          } else {
            return Global().ROSTERED;
          }
        }
      }
    }
    
    // if history is all rostered to the max amount, return rest
    if(rosteredCount == maxWeeksRostered) {
      return Global().COULD_BE_AVAILABLE;
    }
    
    // if history is all rest to the max amount, return rostered
    if(restCount == maxWeeksRest) {
      return Global().ROSTERED;
    }
  }
  
  // if no member history exists
  return Global().ROSTERED;
}


/**
 * Move history array down the array(week rows), remove the oldest row, add the latest row
 */
AllocateMembers.progressMembersHistory = function(historyArray, newRow) {
  if(Array.isArray(historyArray) && Array.isArray(newRow)) {
    historyArray.shift(); // remove top
    historyArray.push(newRow); // add new row to bottom
  }
  
  return historyArray;
}


/**
 * Tests
 */
function test_allocate_suite() {
  test_allocate_selected_members();
  test_allocate_members_for_week_no_history();
  test_allocate_members_for_week_four_week_history();
  test_allocate_members_for_week_not_enough_members_available();
  test_allocate_member_for_week_no_history();
  test_allocate_member_for_week_with_history();
  test_allocate_member_for_week_with_multiple_history();
  test_allocate_member_for_week_with_multiple_different_history_consecutive_two();
  test_allocate_member_for_week_with_multiple_different_history_consecutive_five();
  test_allocate_member_for_week_with_multiple_different_history_consecutive_two_with_rest_two();
  test_progress_members_history();
}

function test_allocate_selected_members() {
  var maxWeeksRostered = 2;
  var maxWeeksRest = 2;
  var fillTeam = { "start" : 0 };  
  var historyArray = new Array();
  historyArray[6] = new Array("Play","Play","Play","NA","NA","Play");
  historyArray[5] = new Array("CBA","Play","Play","NA","Play","Play");
  historyArray[4] = new Array("Play","CBA","Play","NA","Play","Play");
  historyArray[3] = new Array("Play","Play","Play","NA","NA","Play");
  historyArray[2] = new Array("Play","Play","Play","NA","Play","CBA");
  historyArray[1] = new Array("CBA","Play","Play","NA","Play","Play");
  historyArray[0] = new Array("Play","CBA","Play","NA","Play","Play");
  var weeksArray = new Array();
  weeksArray[4] = new Array("","","","NA","","");
  weeksArray[3] = new Array("","","","NA","","");
  weeksArray[2] = new Array("","","","NA","","");
  weeksArray[1] = new Array("","","","NA","","");
  weeksArray[0] = new Array("","","","NA","","");

  var expectedArray = new Array();
  expectedArray[4] = new Array("Play", "Play", "CBA", "NA", "Play", "Play");
  expectedArray[3] = new Array("Play", "Play", "CBA", "NA", "Play", "Play");
  expectedArray[2] = new Array("Play", "CBA", "Play", "NA", "Play", "Play");
  expectedArray[1] = new Array("CBA", "Play", "Play", "NA", "Play", "Play");
  expectedArray[0] = new Array("Play", "Play", "Play", "NA", "Play", "CBA");

  var updated = AllocateMembers.allocateSelectedMembers(weeksArray, historyArray, maxWeeksRostered, maxWeeksRest, fillTeam);
  var actualArray = weeksArray;
  
  Logger.log(GSUnit.assertTrue('Allocate selected members rostered 2 rest 2 start 0 updated', updated));
  Logger.log(GSUnit.assertArrayEquals('Allocate selected members rostered 2 rest 2 start 0 array', expectedArray, actualArray));
  
  maxWeeksRostered = 2;
  maxWeeksRest = 1;
  fillTeam = { "start" : 3 };
  
  historyArray = new Array();
  historyArray[6] = new Array("Play","Play","Play","NA","NA","Play");
  historyArray[5] = new Array("CBA","Play","Play","NA","Play","Play");
  historyArray[4] = new Array("Play","CBA","Play","NA","Play","Play");
  historyArray[3] = new Array("Play","Play","Play","NA","NA","Play");
  historyArray[2] = new Array("Play","Play","Play","NA","Play","CBA");
  historyArray[1] = new Array("CBA","Play","Play","NA","Play","Play");
  historyArray[0] = new Array("Play","CBA","Play","NA","Play","Play");
  
  weeksArray = new Array();
  weeksArray[4] = new Array("","","","NA","","");
  weeksArray[3] = new Array("","","","NA","","");
  weeksArray[2] = new Array("","","","NA","","");
  weeksArray[1] = new Array("","","","NA","","");
  weeksArray[0] = new Array("","","","NA","","");

  expectedArray = new Array();
  expectedArray[4] = new Array("CBA", "Play", "Play", "NA", "Play", "Play");
  expectedArray[3] = new Array("Play", "Play", "Play", "NA", "Play", "CBA");
  expectedArray[2] = new Array("Play", "Play", "Play", "NA", "CBA", "Play");
  expectedArray[1] = new Array("Play", "CBA", "Play", "NA", "Play", "Play");
  expectedArray[0] = new Array("Play", "Play", "CBA", "NA", "Play", "Play");

  updated = AllocateMembers.allocateSelectedMembers(weeksArray, historyArray, maxWeeksRostered, maxWeeksRest, fillTeam);
  actualArray = weeksArray;
  
  Logger.log(GSUnit.assertTrue('Allocate selected members rostered 2 rest 1 start 3 updated', updated));
  Logger.log(GSUnit.assertArrayEquals('Allocate selected members rostered 2 rest 1 start 3 array', expectedArray, actualArray));
}

function test_allocate_members_for_week_no_history() {
  Logger.log(GSUnit.assertArrayEquals('members week roster none', new Array("Play"), AllocateMembers.allocateMembersForWeek()));
  Logger.log(GSUnit.assertArrayEquals('members week roster null array', new Array("Play"), AllocateMembers.allocateMembersForWeek(null)));
  Logger.log(GSUnit.assertArrayEquals('Empty array', new Array("Play"), AllocateMembers.allocateMembersForWeek(new Array())));
  Logger.log(GSUnit.assertArrayEquals('Play array', new Array("Play"), AllocateMembers.allocateMembersForWeek(new Array("Play"))));
  Logger.log(GSUnit.assertArrayEquals('CBA array', new Array("Play"), AllocateMembers.allocateMembersForWeek(new Array("CBA"))));
  Logger.log(GSUnit.assertArrayEquals('NA array', new Array("NA"), AllocateMembers.allocateMembersForWeek(new Array("NA"))));
  Logger.log(GSUnit.assertArrayEquals('Invalid cell', new Array("Play"), AllocateMembers.allocateMembersForWeek(new Array("kjlk"))));
  
  var emptyArray = new Array("","","","","","","","","","");
  var actualArray = AllocateMembers.allocateMembersForWeek(emptyArray);
  var expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('Empty size 10 array', expectedArray, actualArray));
  
  var playArray = new Array("Play","Play","Play","Play","Play","Play","Play","Play","Play","Play");
  actualArray = AllocateMembers.allocateMembersForWeek(playArray);
  expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('Play size 10 array', expectedArray, actualArray));
  
  var cbaArray = new Array("CBA","CBA","CBA","CBA","CBA","CBA","CBA","CBA","CBA","CBA");
  actualArray = AllocateMembers.allocateMembersForWeek(cbaArray);
  expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('CBA size 10 array', expectedArray, actualArray));
  
  var naArray = new Array("NA","NA","NA","NA","NA","NA","NA","NA","NA","NA");
  actualArray = AllocateMembers.allocateMembersForWeek(naArray);
  expectedArray = new Array("NA","NA","NA","NA","NA","NA","NA","NA","NA","NA");
  Logger.log(GSUnit.assertArrayEquals('NA size 10 array', expectedArray, actualArray));
  
  var invalidArray = new Array("kjlk","kjlk","kjlk","kjlk","kjlk","kjlk","kjlk","kjlk","kjlk","kjlk");
  actualArray = AllocateMembers.allocateMembersForWeek(invalidArray);
  expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('Invalid size 10 array', expectedArray, actualArray));
  
  var emptyNAArray = new Array("","","NA","","","NA","","","","");
  actualArray = AllocateMembers.allocateMembersForWeek(emptyNAArray);
  expectedArray = new Array("Play","Play","NA","Play","Play","NA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('Empty NA size 10 array', expectedArray, actualArray));
  
  var playCBAArray = new Array("Play","Play","CBA","Play","Play","CBA","CBA","CBA","CBA","CBA");
  actualArray = AllocateMembers.allocateMembersForWeek(playCBAArray);
  expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('Play CBA size 10 array', expectedArray, actualArray));
}

function test_allocate_members_for_week_four_week_history() {
  var maxWeeksRostered = 2;
  var maxWeeksRest = 1;
  var emptyWeekArray = new Array("","","","","","","","","","");
  var historyArray = new Array();                          
  historyArray[0] = new Array("CBA","Play","CBA","Play","NA","Play","Play","CBA","CBA","CBA");
  historyArray[1] = new Array("Play","Play","Play","CBA","NA","CBA","Play","CBA","CBA","CBA");
  historyArray[2] = new Array("Play","CBA","Play","Play","NA","Play","CBA","CBA","CBA","CBA");
  historyArray[3] = new Array("CBA","Play","CBA","Play","NA","Play","Play","CBA","CBA","CBA");
  var expectedArray = new Array("Play","Play","Play","CBA","Play","CBA","CBA","CBA","CBA","CBA");
  
  var actualArray = AllocateMembers.allocateMembersForWeek(emptyWeekArray, historyArray, maxWeeksRostered, maxWeeksRest);

  Logger.log(GSUnit.assertArrayEquals('Empty size 10 array with history sample 1', expectedArray, actualArray));
  
  maxWeeksRostered = 2;
  maxWeeksRest = 2;
  emptyWeekArray = new Array("","","","","","","","","","");
  historyArray = new Array();
  historyArray[0] = new Array("CBA","Play","CBA","Play","NA","Play","Play","CBA","CBA","CBA");
  historyArray[1] = new Array("Play","Play","Play","CBA","NA","CBA","Play","CBA","CBA","CBA");
  historyArray[2] = new Array("Play","CBA","Play","Play","NA","Play","CBA","CBA","CBA","CBA");
  historyArray[3] = new Array("CBA","Play","CBA","Play","NA","Play","Play","CBA","CBA","CBA");
  expectedArray = new Array("CBA","Play","CBA","CBA","Play","CBA","Play","Play","CBA","CBA");
  
  actualArray = AllocateMembers.allocateMembersForWeek(emptyWeekArray, historyArray, maxWeeksRostered, maxWeeksRest);
  
  Logger.log(GSUnit.assertArrayEquals('Empty size 10 array with history sample 2', expectedArray, actualArray));
  
  maxWeeksRostered = 2;
  maxWeeksRest = 2;
  emptyWeekArray = new Array("","","","","","","","","","");
  historyArray = new Array();
  historyArray[0] = new Array("","","","","","","","","","");
  historyArray[1] = new Array("","","","","","","","","","");
  historyArray[2] = new Array("","","","","","","","","","");
  historyArray[3] = new Array("CBA","Play","Play","CBA","NA","Play","Play","CBA","CBA","CBA");
  expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  
  actualArray = AllocateMembers.allocateMembersForWeek(emptyWeekArray, historyArray, maxWeeksRostered, maxWeeksRest);
  
  Logger.log(GSUnit.assertArrayEquals('Empty size 10 array with history sample 3', expectedArray, actualArray));
}

function test_allocate_members_for_week_not_enough_members_available() {
  var maxWeeksRostered = 2;
  var maxWeeksRest = 2;
  
  var emptyNAArray = new Array("NA","","","","NA","NA","","NA","NA","");
  
  var historyArray = new Array();
  historyArray[0] = new Array("","","","","","","","","","");
  historyArray[1] = new Array("Play","CBA","CBA","Play","NA","NA","CBA","Play","NA","Play");
  historyArray[2] = new Array("NA","Play","Play","Play","NA","NA","Play","NA","NA","CBA");
  historyArray[3] = new Array("NA","Play","Play","Play","NA","NA","Play","NA","NA","CBA");

  var expectedArray = new Array("NA","Play","Play","Play","NA","NA","CBA","NA","NA","Play");
  var actualArray = AllocateMembers.allocateMembersForWeek(emptyNAArray, historyArray, maxWeeksRostered, maxWeeksRest);
  Logger.log(GSUnit.assertArrayEquals('Not enough members for one week', expectedArray, actualArray));
}

function test_allocate_member_for_week_no_history() {
  Logger.log(GSUnit.assertEquals('null cell', "Play", AllocateMembers.allocateMemberForWeek(null)));
  Logger.log(GSUnit.assertEquals('Empty cell', "Play", AllocateMembers.allocateMemberForWeek("")));
  Logger.log(GSUnit.assertEquals('Play cell', "Play", AllocateMembers.allocateMemberForWeek("Play")));
  Logger.log(GSUnit.assertEquals('CBA cell', "Play", AllocateMembers.allocateMemberForWeek("CBA")));
  Logger.log(GSUnit.assertEquals('NA cell', "NA", AllocateMembers.allocateMemberForWeek("NA")));
  Logger.log(GSUnit.assertEquals('Invalid cell', "Play", AllocateMembers.allocateMemberForWeek("kjlk")));
}
 
function test_allocate_member_for_week_with_history() {
  Logger.log(GSUnit.assertEquals('Empty cell and empty history', "Play", AllocateMembers.allocateMemberForWeek("", new Array(""))));
  Logger.log(GSUnit.assertEquals('Empty cell and CBA history', "Play", AllocateMembers.allocateMemberForWeek("", new Array("CBA"))));
  Logger.log(GSUnit.assertEquals('Empty cell and Play history', "CBA", AllocateMembers.allocateMemberForWeek("", new Array("Play"))));
  Logger.log(GSUnit.assertEquals('Empty cell and NA history', "Play", AllocateMembers.allocateMemberForWeek("", new Array("NA"))));
  Logger.log(GSUnit.assertEquals('Empty cell and Invalid history', "Play", AllocateMembers.allocateMemberForWeek("", new Array("kjlk"))));
  
  Logger.log(GSUnit.assertEquals('Play cell and empty history', "Play", AllocateMembers.allocateMemberForWeek("Play", new Array(""))));
  Logger.log(GSUnit.assertEquals('Play cell and CBA history', "Play", AllocateMembers.allocateMemberForWeek("Play", new Array("CBA"))));
  Logger.log(GSUnit.assertEquals('Play cell and Play history', "CBA", AllocateMembers.allocateMemberForWeek("Play", new Array("Play"))));
  Logger.log(GSUnit.assertEquals('Play cell and NA history', "Play", AllocateMembers.allocateMemberForWeek("Play", new Array("NA"))));
  Logger.log(GSUnit.assertEquals('Play cell and Invalid history', "Play", AllocateMembers.allocateMemberForWeek("Play", new Array("kjlk"))));
  
  Logger.log(GSUnit.assertEquals('CBA cell and empty history', "Play", AllocateMembers.allocateMemberForWeek("CBA", new Array(""))));
  Logger.log(GSUnit.assertEquals('CBA cell and CBA history', "Play", AllocateMembers.allocateMemberForWeek("CBA", new Array("CBA"))));
  Logger.log(GSUnit.assertEquals('CBA cell and Play history', "CBA", AllocateMembers.allocateMemberForWeek("CBA", new Array("Play"))));
  Logger.log(GSUnit.assertEquals('CBA cell and NA history', "Play", AllocateMembers.allocateMemberForWeek("CBA", new Array("NA"))));
  Logger.log(GSUnit.assertEquals('CBA cell and Invalid history', "Play", AllocateMembers.allocateMemberForWeek("CBA", new Array("kjlk"))));
  
  Logger.log(GSUnit.assertEquals('NA cell and empty history', "NA", AllocateMembers.allocateMemberForWeek("NA", new Array(""))));
  Logger.log(GSUnit.assertEquals('NA cell and CBA history', "NA", AllocateMembers.allocateMemberForWeek("NA", new Array("CBA"))));
  Logger.log(GSUnit.assertEquals('NA cell and Play history', "NA", AllocateMembers.allocateMemberForWeek("NA", new Array("Play"))));
  Logger.log(GSUnit.assertEquals('NA cell and NA history', "NA", AllocateMembers.allocateMemberForWeek("NA", new Array("NA"))));
  Logger.log(GSUnit.assertEquals('NA cell and Invalid history', "NA", AllocateMembers.allocateMemberForWeek("NA", new Array("kjlk"))));
  
  Logger.log(GSUnit.assertEquals('Invalid cell and empty history', "Play", AllocateMembers.allocateMemberForWeek("kjlk", new Array(""))));
  Logger.log(GSUnit.assertEquals('Invalid cell and CBA history', "Play", AllocateMembers.allocateMemberForWeek("kjlk", new Array("CBA"))));
  Logger.log(GSUnit.assertEquals('Invalid cell and Play history', "CBA", AllocateMembers.allocateMemberForWeek("kjlk", new Array("Play"))));
  Logger.log(GSUnit.assertEquals('Invalid cell and NA history', "Play", AllocateMembers.allocateMemberForWeek("kjlk", new Array("NA"))));
  Logger.log(GSUnit.assertEquals('Invalid cell and Invalid history', "Play", AllocateMembers.allocateMemberForWeek("kjlk", new Array("kjlk"))));
}

function test_allocate_member_for_week_with_multiple_history() {  
  var historyArray = new Array("", "", "", "", "");
  Logger.log(GSUnit.assertEquals('Empty cell and empty size 5 history', "Play", AllocateMembers.allocateMemberForWeek("", historyArray)));
  
  historyArray = new Array("CBA", "CBA", "CBA", "CBA", "CBA");
  Logger.log(GSUnit.assertEquals('Empty cell and CBA size 5 history', "Play", AllocateMembers.allocateMemberForWeek("", historyArray)));
  
  historyArray = new Array("Play", "Play", "Play", "Play", "Play");
  Logger.log(GSUnit.assertEquals('Empty cell and Play size 5 history', "CBA", AllocateMembers.allocateMemberForWeek("", historyArray)));
  
  historyArray = new Array("NA", "NA", "NA", "NA", "NA");
  Logger.log(GSUnit.assertEquals('Empty cell and NA size 5 history', "Play", AllocateMembers.allocateMemberForWeek("", historyArray)));
  
  historyArray = new Array("kjlk", "kjlk", "kjlk", "kjlk", "kjlk");
  Logger.log(GSUnit.assertEquals('Empty cell and Invalid size 5 history', "Play", AllocateMembers.allocateMemberForWeek("", historyArray)));
}

function test_allocate_member_for_week_with_multiple_different_history_consecutive_two() {  
  var maxWeeksRostered = 2;
  var maxWeeksRest = 1;
  var historyArray = new Array();
  historyArray[0] = new Array("Play");
  historyArray[1] = new Array("CBA");
  historyArray[2] = new Array("Play");
  historyArray[3] = new Array("Play");
  historyArray[4] = new Array("CBA");
  ArrayUtils.arrayRotateOneDimensionRight(historyArray);
  var comment = 'Member for week, empty roster and Play, CBA, Play, Play, CBA history, rostered 2, rest 1';
  
  Logger.log(GSUnit.assertEquals(comment, "Play", AllocateMembers.allocateMemberForWeek("", historyArray, maxWeeksRostered, maxWeeksRest)));
  
  maxWeeksRostered = 2;
  maxWeeksRest = 1;
  historyArray = new Array();
  historyArray[0] = new Array("CBA");
  historyArray[1] = new Array("Play");
  historyArray[2] = new Array("Play");
  historyArray[3] = new Array("Play");
  historyArray[4] = new Array("Play");
  ArrayUtils.arrayRotateOneDimensionRight(historyArray);
  comment = 'Member for week, empty roster and Play, Play, Play, Play, CBA history, rostered 2, rest 1';
  
  Logger.log(GSUnit.assertEquals(comment, "CBA", AllocateMembers.allocateMemberForWeek("", historyArray, maxWeeksRostered, maxWeeksRest)));
}

function test_allocate_member_for_week_with_multiple_different_history_consecutive_five() {
  var maxWeeksRostered = 5;
  var maxWeeksRest = 1;
  var historyArray = new Array();
  historyArray[0] = new Array("CBA");
  historyArray[1] = new Array("Play");
  historyArray[2] = new Array("Play");
  historyArray[3] = new Array("Play");
  historyArray[4] = new Array("Play");
  ArrayUtils.arrayRotateOneDimensionRight(historyArray);
  var comment = 'Member for week, empty roster and Play, Play, Play, Play, CBA history, rostered 5, rest 1';
  
  Logger.log(GSUnit.assertEquals(comment, "Play", AllocateMembers.allocateMemberForWeek("", historyArray, maxWeeksRostered, maxWeeksRest)));
  
  maxWeeksRostered = 5;
  maxWeeksRest = 1;
  historyArray = new Array();
  historyArray[0] = new Array("NA");
  historyArray[1] = new Array("Play");
  historyArray[2] = new Array("Play");
  historyArray[3] = new Array("Play");
  historyArray[4] = new Array("Play");
  ArrayUtils.arrayRotateOneDimensionRight(historyArray);
  comment = 'Member for week, empty roster and Play, Play, Play, Play, NA history, rostered 5, rest 1';
  
  Logger.log(GSUnit.assertEquals(comment, "Play", AllocateMembers.allocateMemberForWeek("", historyArray, maxWeeksRostered, maxWeeksRest)));
}

function test_allocate_member_for_week_with_multiple_different_history_consecutive_two_with_rest_two() {
  var maxWeeksRostered = 2;
  var maxWeeksRest = 2; 
  var historyArray = new Array();
  historyArray[0] = new Array("CBA");
  historyArray[1] = new Array("Play");
  historyArray[2] = new Array("CBA");
  historyArray[3] = new Array("CBA");
  historyArray[4] = new Array("Play");
  ArrayUtils.arrayRotateOneDimensionRight(historyArray);
  var comment = 'Member for week, empty roster and Play, CBA, CBA, Play, CBA history, rostered 2, rest 2';
  
  var actualStatus = AllocateMembers.allocateMemberForWeek("", historyArray, maxWeeksRostered, maxWeeksRest)
  
  Logger.log(GSUnit.assertEquals(comment, "Play", actualStatus));
  
  maxWeeksRostered = 2;
  maxWeeksRest = 2;
  historyArray = new Array();
  historyArray[0] = new Array("Play");
  historyArray[1] = new Array("CBA");
  historyArray[2] = new Array("Play");
  historyArray[3] = new Array("Play");
  historyArray[4] = new Array("CBA");
  ArrayUtils.arrayRotateOneDimensionRight(historyArray);
  comment = 'Member for week, empty roster and CBA, Play, Play, CBA, CBA history, rostered 2, rest 2';
  
  actualStatus = AllocateMembers.allocateMemberForWeek("", historyArray, maxWeeksRostered, maxWeeksRest)
  
  Logger.log(GSUnit.assertEquals(comment, "CBA", actualStatus));
  
  maxWeeksRostered = 2;
  maxWeeksRest = 2;
  historyArray = new Array();
  historyArray[0] = new Array("CBA");
  historyArray[1] = new Array("Play");
  historyArray[2] = new Array("Play");
  historyArray[3] = new Array("CBA");
  historyArray[4] = new Array("CBA");
  ArrayUtils.arrayRotateOneDimensionRight(historyArray);
  comment = 'Member for week, empty roster and CBA, CBA, Play, Play, CBA history, rostered 2, rest 2';
  
  actualStatus = AllocateMembers.allocateMemberForWeek("", historyArray, maxWeeksRostered, maxWeeksRest)
  
  Logger.log(GSUnit.assertEquals(comment, "Play", actualStatus));
  
  maxWeeksRostered = 2;
  maxWeeksRest = 3;
  historyArray = new Array();
  historyArray[0] = new Array("CBA");
  historyArray[1] = new Array("Play");
  historyArray[2] = new Array("Play");
  historyArray[3] = new Array("CBA");
  historyArray[4] = new Array("CBA");
  ArrayUtils.arrayRotateOneDimensionRight(historyArray);
  comment = 'Member for week, empty roster and CBA, CBA, Play, Play, CBA history, rostered 2, rest 3';
  
  actualStatus = AllocateMembers.allocateMemberForWeek("", historyArray, maxWeeksRostered, maxWeeksRest)
  
  Logger.log(GSUnit.assertEquals(comment, "CBA", actualStatus));
}

function test_progress_members_history() {
  var historyArray = new Array();
  historyArray[0] = new Array("CBA", "Play");
  historyArray[1] = new Array("Play", "NA");
  historyArray[2] = new Array("CBA", "CBA");
  var expectedArray = new Array();
  expectedArray[0] = new Array("CBA", "Play");
  expectedArray[1] = new Array("Play", "NA");
  expectedArray[2] = new Array("CBA", "CBA");
  
  var testRow;
  
  var actualArray = AllocateMembers.progressMembersHistory(historyArray, testRow);
  
  Logger.log(GSUnit.assertArrayEquals('Progress member history empty', expectedArray, actualArray));
  
  expectedArray[0] = new Array("Play", "NA");
  expectedArray[1] = new Array("CBA", "CBA");
  expectedArray[2] = new Array();
  testRow = new Array();
  
  actualArray = AllocateMembers.progressMembersHistory(historyArray, testRow);
  
  Logger.log(GSUnit.assertArrayEquals('Progress member history empty array', expectedArray, actualArray));
  
  historyArray = new Array();
  historyArray[0] = new Array("CBA", "Play");
  historyArray[1] = new Array("Play", "NA");
  historyArray[2] = new Array("CBA", "CBA");
  expectedArray = new Array();
  expectedArray[0] = new Array("Play", "NA");
  expectedArray[1] = new Array("CBA", "CBA");
  expectedArray[2] = new Array("CBA", "Play");
  testRow = new Array("CBA", "Play");
  
  actualArray = AllocateMembers.progressMembersHistory(historyArray, testRow);
  
  Logger.log(GSUnit.assertArrayEquals('Progress 2 members history', expectedArray, actualArray));
  
  testRow = new Array("NA","Play","Play","Play","NA","NA","CBA","NA","NA","Play");
  
  historyArray = new Array();
  historyArray[0] = new Array("","","","","","","","","","");
  historyArray[1] = new Array("Play","CBA","CBA","Play","NA","NA","CBA","Play","NA","Play");
  historyArray[2] = new Array("NA","Play","Play","Play","NA","NA","Play","NA","NA","CBA");
  historyArray[3] = new Array("NA","Play","Play","Play","NA","NA","Play","NA","NA","CBA");
  
  expectedArray = new Array();
  expectedArray[0] = new Array("Play","CBA","CBA","Play","NA","NA","CBA","Play","NA","Play");
  expectedArray[1] = new Array("NA","Play","Play","Play","NA","NA","Play","NA","NA","CBA");
  expectedArray[2] = new Array("NA","Play","Play","Play","NA","NA","Play","NA","NA","CBA");
  expectedArray[3] = new Array("NA","Play","Play","Play","NA","NA","CBA","NA","NA","Play");
  
  var actualArray = AllocateMembers.progressMembersHistory(historyArray, testRow);
  
  Logger.log(GSUnit.assertArrayEquals('Progress 10 members history', expectedArray, actualArray));
}

