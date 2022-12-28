/**
 * V1.3.2
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var BestAllocateMembers = {};

// create local configuration object
BestAllocateMembers.Config = {};
BestAllocateMembers.Config.MAX_SCORE = 999;
Logger.log("Best Allocate Members configuration loaded");

var bestAllocateProfiler = new Profiler("BestAllocateMembers");
bestAllocateProfiler.enabled = false;

/*
 * Best allocate members for selected roster, iterate through all possible outcomes to find the best
 *
 * weeksArray - An array of week rows with each members roster
 * historyArray - The previous weeks roster history rows
 * maxWeeksRostered - Maximum consecutive weeks playing
 * maxWeeksRest - Maximum consecutive weeks resting
 * fillTeam - Object containing the start index to look for next available member to roster
 */
BestAllocateMembers.bestAllocateSelectedMembers = function(weeksArray, historyArray) {
  var bestScore = { "score" : BestAllocateMembers.Config.MAX_SCORE, "maxWeeksRostered" : 0, "maxWeeksRest" : 0, "start" : 0 };
  var noOfMembers = ArrayUtils.arrayMaxWidth(weeksArray);
  var idealScore = BestAllocateMembers.getIdealScore(Global().MAX_TEAM_MEMBERS, noOfMembers, weeksArray.length);
  Logger.log("Best allocation idealScore: " + idealScore);
  var loops = 0;
  
  bestAllocateProfiler.log("bestAllocateSelectedMembers");
  
  for(var maxWeeksRostered = 1; maxWeeksRostered < noOfMembers; maxWeeksRostered++) {
    for(var maxWeeksRest = 0; maxWeeksRest < noOfMembers; maxWeeksRest++) {
      for(var start = 0; start < noOfMembers; start++) { // move the start to the nth member
        bestAllocateProfiler.log("bestAllocateSelectedMembers loop");
        
        // copy array to attempt to find the best allocation
        var weeksArrayClone = ArrayUtils.arrayClone(weeksArray);

        AllocateMembers.allocateSelectedMembers(weeksArrayClone, ArrayUtils.arrayClone(historyArray), maxWeeksRostered, maxWeeksRest, { "start" : start });
        
        bestAllocateProfiler.log("bestAllocateSelectedMembers after allocateSelectedMembers");
        
        // rotate array to the right to allow iteration through each roster weeks member
        weeksArrayClone = ArrayUtils.arrayRotate(weeksArrayClone, 90);
        
        bestScore = BestAllocateMembers.getBestScore(BestAllocateMembers.getScore(weeksArrayClone, maxWeeksRostered, maxWeeksRest, start, idealScore), bestScore);
        
        loops++;
        bestAllocateProfiler.log("bestAllocateSelectedMembers loop end");
      }
    }
  }
  
  bestAllocateProfiler.log("bestAllocateSelectedMembers end");
  bestAllocateProfiler.logTotal();
  
  Logger.log("Best allocation bestScore: " + bestScore.score + " maxWeeksRostered: " + bestScore.maxWeeksRostered + " maxWeeksRest: " + bestScore.maxWeeksRest + " start: " + bestScore.start + " loops: " + loops);

  // only update weeksArray once the best allocation is found
  return AllocateMembers.allocateSelectedMembers(weeksArray, ArrayUtils.arrayClone(historyArray), bestScore.maxWeeksRostered, bestScore.maxWeeksRest, { "start" : bestScore.start });
}

/**
 * Calculates the ideal score if all members were allocated equally
 */
BestAllocateMembers.getIdealScore = function(max, size, weeks) {
  // handle divide by zero
  if(size === 0) {
    return 0;
  }
  
  return max / size * weeks;
}

/**
 * Calculates the score for this allocation of rostered members, rostered plus not available
 */
BestAllocateMembers.getScore = function(weeksArray, maxWeeksRostered, maxWeeksRest, start, idealScore) {
  var score = 0;
  
  if(Array.isArray(weeksArray)) {
    for(var i = 0; i < weeksArray.length; i++) {
      var memberRosteredCount = 0;
      
      if(Array.isArray(weeksArray[i])) {
        for(var j = 0; j < weeksArray[i].length; j++) {
          if(weeksArray[i][j] === Global().ROSTERED || weeksArray[i][j] === Global().NOT_AVAILABLE) {
            memberRosteredCount++;
          }
        }
      }
      
      score += BestAllocateMembers.getAbsoluteDifference(memberRosteredCount, idealScore);
    }
  }
  
  var newScore = { "score" : score, "maxWeeksRostered" : maxWeeksRostered, "maxWeeksRest" : maxWeeksRest, "start" : start };

  Logger.log("Best allocation getScore: " + newScore.score + " maxWeeksRostered: " + newScore.maxWeeksRostered + " maxWeeksRest: " + newScore.maxWeeksRest + " start: " + newScore.start);
  
  return newScore;
}

/**
 * Calculates the absolute difference of two numbers
 */
BestAllocateMembers.getAbsoluteDifference = function(first, second) {
  return Math.abs(Math.abs(first) - Math.abs(second));
}

/**
 * Gets the best of two scores, the minimum score number
 */
BestAllocateMembers.getBestScore = function(currentScore, bestScore) {
  if(isEmpty(currentScore)) {
    return bestScore;
  }
  
  if(isEmpty(bestScore)) {
    return currentScore;
  }
  
  if(typeof(currentScore) === 'object' && typeof(bestScore) === 'object') {
    if(currentScore.score < bestScore.score) {
      return currentScore;
    } else {
      return bestScore;
    }
  }
  
  return { "score" : BestAllocateMembers.Config.MAX_SCORE };
}


/**
 * Tests
 */
function test_best_allocate_suite() {
  test_best_allocate_selected_members();
  test_get_ideal_score();
  test_get_score();
  test_get_absolute_difference();
  test_get_best_score();
}

function test_best_allocate_selected_members() {
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
  expectedArray[4] = new Array("CBA", "Play", "Play", "NA", "Play", "Play");
  expectedArray[3] = new Array("Play", "Play", "Play", "NA", "Play", "CBA");
  expectedArray[2] = new Array("Play", "Play", "Play", "NA", "CBA", "Play");
  expectedArray[1] = new Array("Play", "CBA", "Play", "NA", "Play", "Play");
  expectedArray[0] = new Array("Play", "Play", "CBA", "NA", "Play", "Play");

  var updated = BestAllocateMembers.bestAllocateSelectedMembers(weeksArray, historyArray);
  var actualArray = weeksArray;
  
  Logger.log(assertTrue('Best allocate selected members updated', updated));
  Logger.log(assertArrayEquals('Best allocate selected members rostered array', expectedArray, actualArray));
}

function test_get_ideal_score() {
  var max = 1;
  var size = 3;
  var weeks = 2;
  var expectedScore = 0.66;
  
  var actualScore = BestAllocateMembers.getIdealScore(max, size, weeks);
  
  Logger.log(assertTrue("Ideal score max 1, size 3, weeks 2", DateUtils.equalWithinTolerance(expectedScore, actualScore, 0.05)));
  
  max = 2
  size = 3;
  weeks = 3;
  expectedScore = 2;
  
  actualScore = BestAllocateMembers.getIdealScore(max, size, weeks);
  
  Logger.log(assertTrue("Ideal score max 2, size 3, weeks 3", DateUtils.equalWithinTolerance(expectedScore, actualScore, 0.05)));

  max = 4
  size = 6;
  weeks = 11;
  expectedScore = 7.33;
  
  actualScore = BestAllocateMembers.getIdealScore(max, size, weeks);
  
  Logger.log(assertTrue("Ideal score max 4, size 6, weeks 11", DateUtils.equalWithinTolerance(expectedScore, actualScore, 0.05)));
}

function test_get_score() {
  var testArray = new Array();                          
  testArray[0] = new Array("NA","Play","Play");
  testArray[1] = new Array("Play","Play","CBA");
  testArray[2] = new Array("Play","CBA","Play");
  ArrayUtils.arrayRotateRight(testArray);
  var idealScore = 2 / 3 * 3; // 2
  var expectedScore = 1 + 0 + 0; // 1
  var expected = { "score" : expectedScore, "maxWeeksRostered" : 1, "maxWeeksRest" : 3, "start" : 1};
  
  var actual = BestAllocateMembers.getScore(testArray, expected.maxWeeksRostered, expected.maxWeeksRest, expected.start, idealScore);
  
  Logger.log(assertObjectEquals("Get score for allocation three members", expected, actual));
  
  testArray = new Array();                          
  testArray[0] = new Array("CBA","Play","CBA","Play","NA","Play","Play","CBA","CBA","CBA");
  testArray[1] = new Array("Play","Play","Play","CBA","NA","CBA","Play","CBA","CBA","CBA");
  testArray[2] = new Array("Play","CBA","Play","Play","NA","Play","CBA","CBA","CBA","CBA");
  testArray[3] = new Array("CBA","Play","CBA","Play","NA","Play","Play","CBA","CBA","CBA");
  ArrayUtils.arrayRotateRight(testArray);
  idealScore = 4 / 10 * 4; // 1.6
  expectedScore = 0.4 + 1.4 + 0.4 + 1.4 + 2.4 + 1.4 + 1.4 + 1.6 + 1.6 + 1.6; // 13.6
  expected = { "score" : expectedScore, "maxWeeksRostered" : 2, "maxWeeksRest" : 5, "start" : 2 };
  
  actual = BestAllocateMembers.getScore(testArray, expected.maxWeeksRostered, expected.maxWeeksRest, expected.start, idealScore);
  
  Logger.log(assertObjectEquals("Get score for allocation ten members", expected, actual));
}

function test_get_absolute_difference() {
  var first = 0.3333;
  var second = -3;
  var expected = 2.6666;
  
  var actual = BestAllocateMembers.getAbsoluteDifference(first, second);
  
  Logger.log(assertTrue("Absolute difference of 0.3333 and -3", DateUtils.equalWithinTolerance(expected, actual, 0.05)));
  
  first = 1.8;
  second = 0.5;
  expected = 1.3;
  
  actual = BestAllocateMembers.getAbsoluteDifference(first, second);
  
  Logger.log(assertTrue("Absolute difference of 1.8 and 0.5", DateUtils.equalWithinTolerance(expected, actual, 0.05)));
}

function test_get_best_score() {
  var currentScore = { "score" : 1.2, "maxWeeksRostered" : 1, "maxWeeksRest" : 3, "start" : 4 };
  var bestScore = { "score" : 2.66, "maxWeeksRostered" : 2, "maxWeeksRest" : 2, "start" : 3 };
  var expected = { "score" : 1.2, "maxWeeksRostered" : 1, "maxWeeksRest" : 3, "start" : 4 };
  
  var actual = BestAllocateMembers.getBestScore(currentScore, bestScore);
  
  Logger.log(assertObjectEquals("Best score 1.2 and 2.66", expected, actual));
  
  currentScore = { "score" : 2.33, "maxWeeksRostered" : 1, "maxWeeksRest" : 3, "start" : 1 };
  bestScore = { "score" : 0.5, "maxWeeksRostered" : 4, "maxWeeksRest" : 2, "start" : 0 };
  expected = { "score" : 0.5, "maxWeeksRostered" : 4, "maxWeeksRest" : 2, "start" : 0 };
  
  actual = BestAllocateMembers.getBestScore(currentScore, bestScore);
  
  Logger.log(assertObjectEquals("Best score 2.33 and 0.5", expected, actual));
}
