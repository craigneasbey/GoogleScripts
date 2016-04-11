/**
 * V1.1.0
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
      
      // rotate array to the right to interate through each member roster history column
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
    
    fillTeam = defaultFor(fillTeam, { "start" : 0 });
    
    Logger.log('fillTeam.start: ' + fillTeam.start);
    
    // if there are not enough members allocated, change COULD_BE_AVAILABLE to ROSTERED
    // start on member index fillTeam.start
    if(rosteredCount !== Global().MAX_TEAM_MEMBERS) {
      if(resultArray && Array.isArray(resultArray)) {
        if(isEmpty(fillTeam) || isEmpty(fillTeam.start)) {
          fillTeam.start = 0;
          Logger.log('fillTeam.start not set');
        }
        
        var start = fillTeam.start;
        
        if(fillTeam.start + 1 < resultArray.length)
        {
          // increment to next member after used
          fillTeam.start++;
        } else {
          // move the start to the first member again
          fillTeam.start = 0;
        }
        
        var needMembers = true;
        var needMemberLoops = 0;
        
        // loop until enough members are rostered
        while(needMembers) {
          for(var i=start; i < resultArray.length && rosteredCount < Global().MAX_TEAM_MEMBERS; i++) {
            Logger.log('i: ' + i + ' rosteredCount: ' + rosteredCount);
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
              Logger.log('Not enough members: ' + rosteredCount);
            } else {
              // not enough members, move the start to the first member again
              start = 0;
              Logger.log('start of week again');
            }
          }
          
          needMemberLoops++;
        }
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
    
    for(var i=0; i < memberHistoryArray.length && ( i < maxWeeksRostered || i < maxWeeksRest); i++) {
      if(memberHistoryArray[i] === Global().ROSTERED) {
        rosteredCount++;
        
        if(restCount > 0) {
          if(restCount >= maxWeeksRest) {
            return Global().ROSTERED;
          } else {
            return Global().COULD_BE_AVAILABLE;
          }
        }
      } else {
        restCount++;
        
        if(rosteredCount > 0) {
          if(rosteredCount >= maxWeeksRostered) {
            return Global().COULD_BE_AVAILABLE;
          } else {
            return Global().ROSTERED;
          }
        }
      }
    }
    
    if(rosteredCount == maxWeeksRostered) {
      return Global().COULD_BE_AVAILABLE;
    }
    
    if(restCount == maxWeeksRest) {
      return Global().ROSTERED;
    }
  }
  
  // if no member history exists
  return Global().ROSTERED;
}


/**
 * Tests
 */

/**
 * Utility to make it easier to read the tests
 */
 function rotateTestData(testHistoryArray) {
  // rotate array to the right and remove the two dimension array added during rotate
  var rotatedTestHistoryArray = ArrayUtils.convertToArray(ArrayUtils.arrayCloneRotate(testHistoryArray, 90));
   
  // copy back to input array
  ArrayUtils.arrayCopy(rotatedTestHistoryArray, testHistoryArray);
}

function test_allocate_suite() {
  test_allocate_members_for_week_no_history();
  test_allocate_members_for_week_four_week_history();
  test_allocate_members_for_week_not_enough_members_available();
  test_allocate_member_for_week_no_history();
  test_allocate_member_for_week_with_history();
  test_allocate_member_for_week_with_multiple_history();
  test_allocate_member_for_week_with_multiple_different_history_consecutive_two();
  test_allocate_member_for_week_with_multiple_different_history_consecutive_five();
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
  rotateTestData(historyArray);
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
  rotateTestData(historyArray);
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
  rotateTestData(historyArray);
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
  rotateTestData(historyArray);
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
  rotateTestData(historyArray);
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
  rotateTestData(historyArray);
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
  rotateTestData(historyArray);
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
  rotateTestData(historyArray);
  comment = 'Member for week, empty roster and CBA, CBA, Play, Play, CBA history, rostered 2, rest 3';
  
  actualStatus = AllocateMembers.allocateMemberForWeek("", historyArray, maxWeeksRostered, maxWeeksRest)
  
  Logger.log(GSUnit.assertEquals(comment, "CBA", actualStatus));
}
