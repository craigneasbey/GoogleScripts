/**
 * V1.0.3
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

loadGlobalConfig();

/**
 * Allocate players rosters for the current week
 * 
 * maxWeeksPlay - Maximum consecutive weeks playing
 * maxWeeksRest - Maximum consecutive weeks resting
 */
function allocatePlayersForWeek(currentArray, playersHistoryArray, maxWeeksPlay, maxWeeksRest, fillTeam) {
  var resultArray = new Array();
  var playCount = 0;
  
  if(currentArray && Array.isArray(currentArray) && playersHistoryArray && Array.isArray(playersHistoryArray)) { // if history was passed
    maxWeeksPlay = defaultFor_(maxWeeksPlay, 1);
    maxWeeksRest = defaultFor_(maxWeeksRest, 1);
    
    // for each player
    for(var i=0; i < currentArray.length && i < playersHistoryArray.length; i++) {
      var result = allocatePlayerForWeek_(currentArray[i], playersHistoryArray[i], maxWeeksPlay, maxWeeksRest);
      if(result === global.ROSTERED) {
        if(playCount >= global.MAX_TEAM_MEMBERS) {
          result = global.COULD_BE_AVAILABLE;
        } else {
          playCount++;
        }
      }
      resultArray.push(result);
    }
  } else if(currentArray && Array.isArray(currentArray)) { // no history
    // for each player
    for(var i=0; i < currentArray.length; i++) {
      var result = allocatePlayerForWeek_(currentArray[i], new Array(""));
      if(result === global.ROSTERED) {
        if(playCount >= global.MAX_TEAM_MEMBERS) {
          result = global.COULD_BE_AVAILABLE;
        } else {
          playCount++;
        }
      }
      resultArray.push(result);
    }
  }
  
  fillTeam = defaultFor_(fillTeam, { "start" : 0 });
  
  Logger.log('fillTeam: ' + fillTeam.start);
   
  // if there are not enough players allocated, change COULD_BE_AVAILABLE to ROSTERED
  // start on player playerIncrement
  if(playCount !== global.MAX_TEAM_MEMBERS) {
    if(resultArray && Array.isArray(resultArray)) {
      var needPlayers = true;
      var needPlayerLoops = 0;
      
      if(isEmpty(fillTeam) || isEmpty(fillTeam.start)) {
        fillTeam.start = 0;
        Logger.log('fillTeam.start not set');
      }
      
      var start = fillTeam.start;
            
      if(fillTeam.start + 1 < resultArray.length)
      {
        // increment to next player after used
        fillTeam.start++;
      } else {
        // move the start to the beginning of the week again
        fillTeam.start = 0;
      }
      
      while(needPlayers) {
        for(var i=start; i < resultArray.length && playCount < global.MAX_TEAM_MEMBERS; i++) {
          Logger.log('i: ' + i + ' playCount: ' + playCount);
          if(resultArray[i] === global.COULD_BE_AVAILABLE) {
            resultArray[i] = global.ROSTERED;
            playCount++;
          }
        }

        if(playCount === global.MAX_TEAM_MEMBERS) {
          needPlayers = false;
        } else {
          // has all players been checked?
          if(needPlayerLoops > 1) {
            needPlayers = false;    
            Logger.log('Not enough players: ' + playCount);
          } else {
            // not enough players, move the start to the beginning of the week again
            start = 0;
            Logger.log('start of week again');
          }
        }
        
        needPlayerLoops++;
      }
    }
  }
  
  // if array is empty, fill array with ROSTERED until MAX_TEAM_MEMBERS
  if(resultArray.length == 0) {
    resultArray.push(global.ROSTERED);
  }
  
  return resultArray;
}

/**
 * Allocate player roster for the current week
 *
 * maxWeeksPlay - Maximum consecutive weeks playing
 * maxWeeksRest - Maximum consecutive weeks resting
 */
function allocatePlayerForWeek_(currentWeek, historyArray, maxWeeksPlay, maxWeeksRest) {  
    if(currentWeek === global.NOT_AVAILABLE) {
      return currentWeek;
    }
    
  if(historyArray) {
    var playCount = 0;
    var restCount = 0;
    
    maxWeeksPlay = defaultFor_(maxWeeksPlay, 1);
    maxWeeksRest = defaultFor_(maxWeeksRest, 1);
    //Logger.log('maxWeeksPlay: ' + maxWeeksPlay);
    
    for(var i=0; i < historyArray.length && ( i < maxWeeksPlay || i < maxWeeksRest); i++) {
      if(historyArray[i] === global.ROSTERED) {
        playCount++;
        
        if(restCount > 0) {
          if(restCount >= maxWeeksRest) {
            return global.ROSTERED;
          } else {
            return global.COULD_BE_AVAILABLE;
          }
        }
      } else {
        restCount++;
        
        if(playCount > 0) {
          if(playCount >= maxWeeksPlay) {
            return global.COULD_BE_AVAILABLE;
          } else {
            return global.ROSTERED;
          }
        }
      }
    }
    
    if(playCount == maxWeeksPlay) {
      return global.COULD_BE_AVAILABLE;
    }
    
    if(restCount == maxWeeksRest) {
      return global.ROSTERED;
    }
  }
  
  return global.ROSTERED;
}


/**
 * Tests
 */

function test_allocate_suite() {
  test_one_cell_roster();
  test_one_cell_roster_with_history();
  test_one_cell_roster_with_multiple_history();
  test_one_cell_roster_with_multiple_different_history_consecutive_two();
  test_one_cell_roster_with_multiple_different_history_consecutive_five();
  test_one_week_roster();
  test_one_week_roster_with_four_week_history();
  test_not_enough_players_available();
}

function test_one_cell_roster() {
  Logger.log(GSUnit.assertEquals('null cell', "Play", allocatePlayerForWeek_(null)));
  Logger.log(GSUnit.assertEquals('Empty cell', "Play", allocatePlayerForWeek_("")));
  Logger.log(GSUnit.assertEquals('Play cell', "Play", allocatePlayerForWeek_("Play")));
  Logger.log(GSUnit.assertEquals('CBA cell', "Play", allocatePlayerForWeek_("CBA")));
  Logger.log(GSUnit.assertEquals('NA cell', "NA", allocatePlayerForWeek_("NA")));
  Logger.log(GSUnit.assertEquals('Invalid cell', "Play", allocatePlayerForWeek_("kjlk")));
}
 
function test_one_cell_roster_with_history() {
  Logger.log(GSUnit.assertEquals('Empty cell and empty history', "Play", allocatePlayerForWeek_("", new Array(""))));
  Logger.log(GSUnit.assertEquals('Empty cell and CBA history', "Play", allocatePlayerForWeek_("", new Array("CBA"))));
  Logger.log(GSUnit.assertEquals('Empty cell and Play history', "CBA", allocatePlayerForWeek_("", new Array("Play"))));
  Logger.log(GSUnit.assertEquals('Empty cell and NA history', "Play", allocatePlayerForWeek_("", new Array("NA"))));
  Logger.log(GSUnit.assertEquals('Empty cell and Invalid history', "Play", allocatePlayerForWeek_("", new Array("kjlk"))));
  
  Logger.log(GSUnit.assertEquals('Play cell and empty history', "Play", allocatePlayerForWeek_("Play", new Array(""))));
  Logger.log(GSUnit.assertEquals('Play cell and CBA history', "Play", allocatePlayerForWeek_("Play", new Array("CBA"))));
  Logger.log(GSUnit.assertEquals('Play cell and Play history', "CBA", allocatePlayerForWeek_("Play", new Array("Play"))));
  Logger.log(GSUnit.assertEquals('Play cell and NA history', "Play", allocatePlayerForWeek_("Play", new Array("NA"))));
  Logger.log(GSUnit.assertEquals('Play cell and Invalid history', "Play", allocatePlayerForWeek_("Play", new Array("kjlk"))));
  
  Logger.log(GSUnit.assertEquals('CBA cell and empty history', "Play", allocatePlayerForWeek_("CBA", new Array(""))));
  Logger.log(GSUnit.assertEquals('CBA cell and CBA history', "Play", allocatePlayerForWeek_("CBA", new Array("CBA"))));
  Logger.log(GSUnit.assertEquals('CBA cell and Play history', "CBA", allocatePlayerForWeek_("CBA", new Array("Play"))));
  Logger.log(GSUnit.assertEquals('CBA cell and NA history', "Play", allocatePlayerForWeek_("CBA", new Array("NA"))));
  Logger.log(GSUnit.assertEquals('CBA cell and Invalid history', "Play", allocatePlayerForWeek_("CBA", new Array("kjlk"))));
  
  Logger.log(GSUnit.assertEquals('NA cell and empty history', "NA", allocatePlayerForWeek_("NA", new Array(""))));
  Logger.log(GSUnit.assertEquals('NA cell and CBA history', "NA", allocatePlayerForWeek_("NA", new Array("CBA"))));
  Logger.log(GSUnit.assertEquals('NA cell and Play history', "NA", allocatePlayerForWeek_("NA", new Array("Play"))));
  Logger.log(GSUnit.assertEquals('NA cell and NA history', "NA", allocatePlayerForWeek_("NA", new Array("NA"))));
  Logger.log(GSUnit.assertEquals('NA cell and Invalid history', "NA", allocatePlayerForWeek_("NA", new Array("kjlk"))));
  
  Logger.log(GSUnit.assertEquals('Invalid cell and empty history', "Play", allocatePlayerForWeek_("kjlk", new Array(""))));
  Logger.log(GSUnit.assertEquals('Invalid cell and CBA history', "Play", allocatePlayerForWeek_("kjlk", new Array("CBA"))));
  Logger.log(GSUnit.assertEquals('Invalid cell and Play history', "CBA", allocatePlayerForWeek_("kjlk", new Array("Play"))));
  Logger.log(GSUnit.assertEquals('Invalid cell and NA history', "Play", allocatePlayerForWeek_("kjlk", new Array("NA"))));
  Logger.log(GSUnit.assertEquals('Invalid cell and Invalid history', "Play", allocatePlayerForWeek_("kjlk", new Array("kjlk"))));
}

function test_one_cell_roster_with_multiple_history() {  
  var historyArray = new Array("", "", "", "", "");
  Logger.log(GSUnit.assertEquals('Empty cell and empty size 5 history', "Play", allocatePlayerForWeek_("", historyArray)));
  
  historyArray = new Array("CBA", "CBA", "CBA", "CBA", "CBA");
  Logger.log(GSUnit.assertEquals('Empty cell and CBA size 5 history', "Play", allocatePlayerForWeek_("", historyArray)));
  
  historyArray = new Array("Play", "Play", "Play", "Play", "Play");
  Logger.log(GSUnit.assertEquals('Empty cell and Play size 5 history', "CBA", allocatePlayerForWeek_("", historyArray)));
  
  historyArray = new Array("NA", "NA", "NA", "NA", "NA");
  Logger.log(GSUnit.assertEquals('Empty cell and NA size 5 history', "Play", allocatePlayerForWeek_("", historyArray)));
  
  historyArray = new Array("kjlk", "kjlk", "kjlk", "kjlk", "kjlk");
  Logger.log(GSUnit.assertEquals('Empty cell and Invalid size 5 history', "Play", allocatePlayerForWeek_("", historyArray)));
}

function test_one_cell_roster_with_multiple_different_history_consecutive_two() {  
  
  var historyArray = new Array("Play", "CBA", "Play", "Play", "CBA");
  var maxWeeksPlay = 2;
  var comment = 'Empty cell and Play, CBA, Play, Play, CBA history';
  Logger.log(GSUnit.assertEquals(comment, "Play", allocatePlayerForWeek_("", historyArray, maxWeeksPlay)));
  
  historyArray = new Array("Play", "Play", "Play", "Play", "CBA");
  maxWeeksPlay = 2;
  comment = 'Empty cell and Play, Play, Play, Play, CBA history';
  Logger.log(GSUnit.assertEquals(comment, "CBA", allocatePlayerForWeek_("", historyArray, maxWeeksPlay)));
}

function test_one_cell_roster_with_multiple_different_history_consecutive_five() {  
 
  var historyArray = new Array("Play", "Play", "Play", "Play", "CBA");
  var maxWeeksPlay = 5;
  var comment = 'Empty cell and Play, Play, Play, Play, CBA history';
  Logger.log(GSUnit.assertEquals(comment, "Play", allocatePlayerForWeek_("", historyArray, maxWeeksPlay)));
  
  historyArray = new Array("Play", "Play", "Play", "Play", "NA");
  maxWeeksPlay = 5;
  comment = 'Empty cell and Play, Play, Play, Play, NA history';
  Logger.log(GSUnit.assertEquals(comment, "Play", allocatePlayerForWeek_("", historyArray, maxWeeksPlay)));
}

function test_one_cell_roster_with_multiple_different_history_consecutive_two_with_rest_two() {  
 
  var historyArray = new Array("Play", "CBA", "CBA", "Play", "CBA");
  var maxWeeksPlay = 2;
  var maxWeeksRest = 2;
  var comment = 'Empty cell and Play, CBA, CBA, Play, CBA history with rest 2';
  
  var actualStatus = allocatePlayerForWeek_("", historyArray, maxWeeksPlay, maxWeeksRest)
  
  Logger.log(GSUnit.assertEquals(comment, "Play", actualStatus));
  
  historyArray = new Array("CBA", "Play", "Play", "CBA", "CBA");
  maxWeeksPlay = 2;
  maxWeeksRest = 2;
  comment = 'Empty cell and CBA, Play, Play, CBA, CBA history with rest 2';
  
  actualStatus = allocatePlayerForWeek_("", historyArray, maxWeeksPlay, maxWeeksRest)
  
  Logger.log(GSUnit.assertEquals(comment, "CBA", actualStatus));
  
  historyArray = new Array("CBA", "CBA", "Play", "Play", "CBA");
  maxWeeksPlay = 2;
  maxWeeksRest = 2;
  comment = 'Empty cell and CBA, CBA, Play, Play, CBA history with rest 2';
  
  actualStatus = allocatePlayerForWeek_("", historyArray, maxWeeksPlay, maxWeeksRest)
  
  Logger.log(GSUnit.assertEquals(comment, "Play", actualStatus));
  
  historyArray = new Array("CBA", "CBA", "Play", "Play", "CBA");
  maxWeeksPlay = 2;
  maxWeeksRest = 3;
  comment = 'Empty cell and CBA, CBA, Play, Play, CBA history with rest 3';
  
  actualStatus = allocatePlayerForWeek_("", historyArray, maxWeeksPlay, maxWeeksRest)
  
  Logger.log(GSUnit.assertEquals(comment, "CBA", actualStatus));
}

function test_one_week_roster() {
  Logger.log(GSUnit.assertArrayEquals('null array', new Array("Play"), allocatePlayersForWeek(null)));
  Logger.log(GSUnit.assertArrayEquals('Empty array', new Array("Play"), allocatePlayersForWeek(new Array())));
  Logger.log(GSUnit.assertArrayEquals('Play array', new Array("Play"), allocatePlayersForWeek(new Array("Play"))));
  Logger.log(GSUnit.assertArrayEquals('CBA array', new Array("Play"), allocatePlayersForWeek(new Array("CBA"))));
  Logger.log(GSUnit.assertArrayEquals('NA array', new Array("NA"), allocatePlayersForWeek(new Array("NA"))));
  Logger.log(GSUnit.assertArrayEquals('Invalid cell', new Array("Play"), allocatePlayersForWeek(new Array("kjlk"))));
  
  var emptyArray = new Array("","","","","","","","","","");
  var actualArray = allocatePlayersForWeek(emptyArray);
  var expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('Empty size 10 array', expectedArray, actualArray));
  
  var playArray = new Array("Play","Play","Play","Play","Play","Play","Play","Play","Play","Play");
  actualArray = allocatePlayersForWeek(playArray);
  expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('Play size 10 array', expectedArray, actualArray));
  
  var cbaArray = new Array("CBA","CBA","CBA","CBA","CBA","CBA","CBA","CBA","CBA","CBA");
  actualArray = allocatePlayersForWeek(cbaArray);
  expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('CBA size 10 array', expectedArray, actualArray));
  
  var naArray = new Array("NA","NA","NA","NA","NA","NA","NA","NA","NA","NA");
  actualArray = allocatePlayersForWeek(naArray);
  expectedArray = new Array("NA","NA","NA","NA","NA","NA","NA","NA","NA","NA");
  Logger.log(GSUnit.assertArrayEquals('NA size 10 array', expectedArray, actualArray));
  
  var invalidArray = new Array("kjlk","kjlk","kjlk","kjlk","kjlk","kjlk","kjlk","kjlk","kjlk","kjlk");
  actualArray = allocatePlayersForWeek(invalidArray);
  expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('Invalid size 10 array', expectedArray, actualArray));
  
  var emptyNAArray = new Array("","","NA","","","NA","","","","");
  actualArray = allocatePlayersForWeek(emptyNAArray);
  expectedArray = new Array("Play","Play","NA","Play","Play","NA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('Empty NA size 10 array', expectedArray, actualArray));
  
  var playCBAArray = new Array("Play","Play","CBA","Play","Play","CBA","CBA","CBA","CBA","CBA");
  actualArray = allocatePlayersForWeek(playCBAArray);
  expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  Logger.log(GSUnit.assertArrayEquals('Play CBA size 10 array', expectedArray, actualArray));
}

function test_one_week_roster_with_four_week_history() {
  var emptyArray = new Array("","","","","","","","","","");
  var maxWeeksPlay = 2;
  
  var historyArray = new Array();
  historyArray[0] = new Array("CBA","Play","Play","CBA");
  historyArray[1] = new Array("Play","CBA","Play","Play");
  historyArray[2] = new Array("CBA","Play","Play","CBA");
  historyArray[3] = new Array("Play","Play","CBA","Play");
  historyArray[4] = new Array("NA","NA","NA","NA");
  historyArray[5] = new Array("Play","Play","CBA","Play");
  historyArray[6] = new Array("Play","CBA","Play","Play");
  historyArray[7] = new Array("CBA","CBA","CBA","CBA");
  historyArray[8] = new Array("CBA","CBA","CBA","CBA");
  historyArray[9] = new Array("CBA","CBA","CBA","CBA");

  var expectedArray = new Array("Play","Play","Play","CBA","Play","CBA","CBA","CBA","CBA","CBA");
  var actualArray = allocatePlayersForWeek(emptyArray, historyArray, maxWeeksPlay);
  Logger.log(GSUnit.assertArrayEquals('Empty size 10 array with history sample 1', expectedArray, actualArray));
  
  emptyArray = new Array("","","","","","","","","","");
  maxWeeksPlay = 2;
  var maxWeeksRest = 2;
  
  historyArray = new Array();
  historyArray[0] = new Array("CBA","Play","Play","CBA");
  historyArray[1] = new Array("Play","CBA","Play","Play");
  historyArray[2] = new Array("CBA","Play","Play","CBA");
  historyArray[3] = new Array("Play","Play","CBA","Play");
  historyArray[4] = new Array("NA","NA","NA","NA");
  historyArray[5] = new Array("Play","Play","CBA","Play");
  historyArray[6] = new Array("Play","CBA","Play","Play");
  historyArray[7] = new Array("CBA","CBA","CBA","CBA");
  historyArray[8] = new Array("CBA","CBA","CBA","CBA");
  historyArray[9] = new Array("CBA","CBA","CBA","CBA");

  expectedArray = new Array("CBA","Play","CBA","CBA","Play","CBA","Play","Play","CBA","CBA");
  actualArray = allocatePlayersForWeek(emptyArray, historyArray, maxWeeksPlay, maxWeeksRest);
  Logger.log(GSUnit.assertArrayEquals('Empty size 10 array with history sample 2', expectedArray, actualArray));
  
  historyArray = new Array();
  historyArray[0] = new Array("CBA","","","");
  historyArray[1] = new Array("Play","","","");
  historyArray[2] = new Array("Play","","","");
  historyArray[3] = new Array("CBA","","","");
  historyArray[4] = new Array("NA","","","");
  historyArray[5] = new Array("Play","","","");
  historyArray[6] = new Array("Play","","","");
  historyArray[7] = new Array("CBA","","","");
  historyArray[8] = new Array("CBA","","","");
  historyArray[9] = new Array("CBA","","","");

  expectedArray = new Array("Play","Play","Play","Play","CBA","CBA","CBA","CBA","CBA","CBA");
  actualArray = allocatePlayersForWeek(emptyArray, historyArray, maxWeeksPlay, maxWeeksRest);
  Logger.log(GSUnit.assertArrayEquals('Empty size 10 array with history sample 3', expectedArray, actualArray));
}

function test_not_enough_players_available() {
  var maxWeeksPlay = 2;
  var maxWeeksRest = 2;
  
  var emptyNAArray = new Array("NA","","","","NA","NA","","NA","NA","");
  
  var historyArray = new Array();
  historyArray[0] = new Array("NA","NA","Play","");
  historyArray[1] = new Array("Play","Play","CBA","");
  historyArray[2] = new Array("Play","Play","CBA","");
  historyArray[3] = new Array("Play","Play","Play","");
  historyArray[4] = new Array("NA","NA","NA","");
  historyArray[5] = new Array("NA","NA","NA","");
  historyArray[6] = new Array("Play","Play","CBA","");
  historyArray[7] = new Array("NA","NA","Play","");
  historyArray[8] = new Array("NA","NA","NA","");
  historyArray[9] = new Array("CBA","CBA","Play","");

  var expectedArray = new Array("NA","Play","Play","Play","NA","NA","CBA","NA","NA","Play");
  var actualArray = allocatePlayersForWeek(emptyNAArray, historyArray, maxWeeksPlay, maxWeeksRest);
  Logger.log(GSUnit.assertArrayEquals('Not enough players for one week', expectedArray, actualArray));
}

