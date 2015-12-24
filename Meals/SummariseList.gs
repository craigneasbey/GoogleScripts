/**
 * V1.0.0
 */
 
/**
 * Summarise into an alphabetically ordered list with times
 * multipler as a prefix eg. '2x Carrot'
 */
function summariseList(list) {
  var output = new Array();
  
  while(list.length > 0)
  {
    var currentItem = summariseItem(list.shift(), list);
    
    if(currentItem) {
      output.push(currentItem);
    }
  }
  
  // sort list
  output.sort(function(a, b) { 
    return parseItem(a).name.localeCompare(parseItem(b).name); 
  });
  
  return output;
}

/**
 * 
 */
function summariseItem(item, list) {
  
  var itemObj = parseItem(item);
  
  for(var i = 0; i < list.length; i++) {
    var currentItem = parseItem(list[i]);
    
    // merge items
    if(itemObj.name === currentItem.name) {
      itemObj.count += currentItem.count;
      
      // remove matched item from list
      list.splice(i, 1);
      i--;
    }
  }
  
  return formatItem(itemObj);
}

/**
 * 
 */
function parseItem(item) {
  var rawItem = strip(item);
  
  var itemObj = {};
  itemObj.count = 1;
  itemObj.name = rawItem;
  
  var countStr = "";
  var countPresent = false;
  var loop = true;
  
  for(var i = 0; i < rawItem.length && loop; i++) {
    if(isNumeric(rawItem.charAt(i))) {
      countStr += rawItem.charAt(i);
      countPresent = true;
    } else if(rawItem.charAt(i) === 'x' && countPresent) {
      itemObj.count = Number(countStr);
      itemObj.name = rawItem.substring(i+1, rawItem.length).trim();
      loop = false;
    } else {
      loop = false;
    }
  }
  
  return itemObj;
}

/**
 * 
 */
function strip(string) {
  if(string) {
    // replace(/\s+/g, '')
    return string.trim().toLowerCase();
  }
  
  return "";
}
       
/**
 * http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
 *
 * http://run.plnkr.co/plunks/93FPpacuIcXqqKMecLdk/
 */
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * 
 */
function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/**
 * 
 */
function formatItem(itemObj) {
  return itemObj.count + 'x ' + itemObj.name;
}


/**
 * Tests
 */
function test_suite() {
  test_summariseList();
  test_summariseItem();
  test_parseItem();
  test_strip();
  test_capitaliseFirstLetter();
}

function test_summariseList() {
  var testList = ['2x Carrot', 'Carrot', 'Fruit', 'fruit ', '2x Tomato Paste Can'];
  var expectedList = ['3x carrot', '2x fruit', '2x tomato paste can'];
  
  var actualList = summariseList(testList);
  
  Logger.log(GSUnit.assertHashEquals('These should be equal', expectedList, actualList)); 
}

function test_summariseItem() {
  var testList = ['2x Carrot', 'Carrot', 'Fruit', 'fruit '];
  var testItem = '4x Carrot';
  var expectedItem = '7x carrot';
  
  var actualItem = summariseItem(testItem, testList);
  
  Logger.log(GSUnit.assertEquals('These should be equal', expectedItem, actualItem)); 
}

function test_parseItem() {
  var testItem = '3x Carrot ';
  var expectedItemObj = { "count" : 3, "name" : "carrot" };
  
  var actualItemObj = parseItem(testItem);
  
  Logger.log(GSUnit.assertHashEquals('These should be equal', expectedItemObj, actualItemObj));
  
  var testItem2 = '3 Carrot ';
  var expectedItemObj2 = { "count" : 1, "name" : "3 carrot" };
  
  var actualItemObj2 = parseItem(testItem2);
  
  Logger.log(GSUnit.assertHashEquals('These should be equal', expectedItemObj2, actualItemObj2)); 
}

function test_strip() {
  Logger.log(GSUnit.assertEquals('These should be equal', '2x tomato paste can', strip('2x TomatO Paste CAn')));
}

function test_capitaliseFirstLetter() {
  Logger.log(GSUnit.assertEquals('These should be equal', 'Fruit', capitaliseFirstLetter('fruiT')));
}

function test_formatItem() {
  var testItemObj = { "count" : 3, "name" : "Tomato Paste Can" };
  var expectedItem = '3x Tomato Paste Can';
  
  var actualItem = formatItem(testItemObj);
  
  Logger.log(GSUnit.assertEquals('These should be equal', expectedItem, actualItem));
}
