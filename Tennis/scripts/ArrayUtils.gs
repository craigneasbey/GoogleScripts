/**
 * V1.1.0
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

var ArrayUtils = {};

// create local configuration object
ArrayUtils.Config = {};
Logger.log("Array Utilities configuration loaded");

/**
 * Clone and Rotate array
 *
 * a - Array to rotate
 * intDegrees - degrees of rotation
 */
ArrayUtils.arrayCloneRotate = function(sourceArray, intDegrees) {
  var a;
  
  if(Array.isArray(sourceArray)) {
    a = ArrayUtils.arrayRotate(ArrayUtils.arrayClone(sourceArray), intDegrees);
  } else {
    a = sourceArray; // sourceArray is not an array
  }
  
  return a;
}

/**
 * Rotate array clockwise or counter clockwise
 *
 * a - Array to rotate
 * intDegrees - degrees of rotation
 *
 * Rotating right would be done by passing 90, and left as -90. 
 *
 * http://board.flashkit.com/board/showthread.php?176217-How-to-rotate-a-two-dimensional-array (Superbog)
 *
 * Note: this algorthm is good also:
 *  http://stackoverflow.com/questions/42519/how-do-you-rotate-a-two-dimensional-array (dimple)
 */
ArrayUtils.arrayRotate = function(a, intDegrees) {

  if(Array.isArray(a)) {
  
    // added expand and compress as counter clockwise delete causes index issues
    a = ArrayUtils.expandArray(a);
  
	var x, y, z;
	var intWidth;
	var intRotations = Math.round( intDegrees / 90 );
	var intDir = (intRotations / Math.abs( intRotations ) );

	intRotations = Math.abs( intRotations );

	// get down to the bare minimum rotations necessary
	while ( intRotations >= 4 ) {
		intRotations -= 4;
	}

	// if the rotations is more than 2, than we might as well just 
	// rotate the other way!
	while ( intRotations > 2 ) {
		intRotations -= 2;
		intDir *= - 1;
	}

	for ( z = 1; z <= intRotations; z++ ) {

		var rotArray = new Array;

		var intHeight = a.length;
		// reverse each row of each array
		for ( y = 0; y < intHeight; y++ ) {
			a[y].reverse();
			intWidth = a[y].length;
		}
	
		// this is where the actual "rotation" takes place
		for ( x = 0; x < intWidth; x++ ) {
			var rotRow = new Array;
			for ( y = 0; y < intHeight; y++ ) {
				// dirty way to "reverse" the loop for left ( negative ) rotations ;)
				if ( intDir < 0 ) {
					rotRow[y] = a[y][x];
				}
				else {
					rotRow[y] = a[intHeight-y-1][intWidth-x-1];
				}
			}
			rotArray[x] = rotRow;
			delete rotRow;
		}
	
		// this loop clears all the rows within the array
		// delete this; --  did not work, and trying to repopulate
		// the array produced bad results, so this is the workaround
		for ( y = 0; y < intHeight; y++ ) {
			delete a[y];
		}
	
		// repopulate array
		for ( x = 0; x < intWidth; x++ ) {
			a[x] = rotArray[x];
		}
		// cleanup -- as long as references are alive, so are the objects
		delete rotArray;
		delete rotRow;
	}
  
    // added expand and compress as counter clockwise delete causes index issues
    a = ArrayUtils.compressArray(a);
  }
  
  return a;
}

/**
 * Expand the array to have equal sides (square)
 */
ArrayUtils.expandArray = function(a) {
  if(a && Array.isArray(a)) {
    // add second dimension
    if(!Array.isArray(a[0])) {
      a = ArrayUtils.convertToArrayOfArrays(a);
    }
    
    var arrayLength = a.length;
    
    if(arrayLength > 0) {
      if(Array.isArray(a[0])) {
        var arrayWidth = a[0].length;
        
        // check if already equal sides
        if(arrayLength !== arrayWidth) {
          if(arrayLength > arrayWidth) {
            // add to array width
            for(var i=0; i < arrayLength; i++) {
              for(var j=0; j < arrayLength - arrayWidth; j++) {
                a[i].push(null);
              }
            }
          } else {
            // add to array length
            for(var i=arrayLength; i < arrayWidth; i++) {
              a[i] = new Array();
              for(var j=0; j < arrayWidth; j++) {
                a[i].push(null);
              }
            }
          }
        }
      }
    }
  }
  
  return a;
}

/**
 * Compress the array, removing all empty rows or columns on the sides
 */
ArrayUtils.compressArray = function(a) {
  if(a && Array.isArray(a)) {
    var arrayLength = a.length;
    
    if(arrayLength > 0) {
      if(Array.isArray(a[0])) {
        var arrayWidth = a[0].length;
        
        // compress right and bottom sides
        for(var i=arrayLength-1; i >= 0; i--) {
          var finished = false;
          
          for(var j=arrayWidth-1; j >= 0 && !finished; j--) {
            if(isEmpty(a[i][j])) {
              a[i].pop();
            } else {
              finished = true;
            }
          }
          
          // remove the length if it is the bottom
          if(a[i].length === 0 && i === a.length - 1) {
            a.pop();
          }
        }
        
        // compress top and left sides
        var finished = false;
        
        // remove from the top
        for(var i=0; i < a.length && !finished;) {
          // remove the length if it is the top
          if(a[i].length === 0 && i === 0) {
            a.shift();
          } else {
            finished = true;
          }
        }
        
        arrayLength = a.length;
        finished = false;
        var removeLeft = false;
        
        // only remove from the left if all are empty
        for(var i=0; i < arrayLength && !finished; i++) {
          if(a[i].length > 0) {
            if(removeLeft) {
              a[i].shift();
            } else if(!isEmpty(a[i][0])) {
              finished = true;
            }
          }
          
          // last
          if(i === arrayLength - 1) {
            if(!finished && !removeLeft) {
              removeLeft = true;
            } else {
              removeLeft = false;
            }
            
            // go through array again to see if if can compress further
            i = -1;
          }
        }
        
        // re-align array (rectangle)
        arrayLength = a.length;
        arrayWidth = 0;
        
        // find width again
        for(var i=0; i < arrayLength; i++) {
          if(a[i].length > arrayWidth) {
            arrayWidth = a[i].length;
          }
        }
        
        // add back empty indexes
        for(var i=0; i < arrayLength; i++) {
          for(var j=a[i].length; j < arrayWidth; j++) {
            a[i].push("");
          }
        }
      }
    }
  }
  
  return a;
}

/**
 * Convert one dimensional array to two dimensional array
 */
ArrayUtils.convertToArrayOfArrays = function(input) {
  var output = new Array();
  
  if(Array.isArray(input)) {
    var clone = ArrayUtils.arrayClone(input);
    output.push(clone);
    ArrayUtils.arrayCopy(output, input);
  }
  
  return output;
}

/**
 * Removes outer array from two dimensional array to make a one dimensional array
 */
ArrayUtils.convertToArray = function(input) {
  var output = new Array();
  
  if(Array.isArray(input)) {
    if(Array.isArray(input[0])) {
      ArrayUtils.arrayCopy(input[0], output);
    }
  }
  
  return output;
}

/**
 * Copy contents of one array to another
 */
ArrayUtils.arrayCopy = function(source, destination) {
  // clear destination
  while (destination.length > 0) { 
    destination.pop(); 
  }
  
  if(Array.isArray(source)) {
    for(var i = 0; i < source.length; i++) {
      destination.push(source[i]);
    }
  }
}


// http://blog.andrewray.me/how-to-clone-a-nested-array-in-javascript/
ArrayUtils.arrayClone = function( arr ) {
    var i, copy;

    if( Array.isArray( arr ) ) {
        copy = new Array();
        var j = 0;
        for( i = 0; i < arr.length; i++ ) {
          var cloned = ArrayUtils.arrayClone( arr[ i ] );
          if(typeof cloned !== 'undefined') {
            copy[ j ] = cloned;
            j++;
          }
        }
        return copy;
    } else if( typeof arr === 'object' ) {
        throw 'Cannot clone array containing an object!';
    } else {
        return arr;
    }
}


/**
 * Tests
 */
function test_array_suite() {
  test_clone_rotate_array();
  test_rotate_3_by_2_array_clockwise();
  test_rotate_2_by_3_array_clockwise();
  test_rotate_2_by_3_array_clockwise_back();
  test_rotate_2_by_3_array_clockwise_back_clockwise();
  test_rotate_2_by_3_array_counter_clockwise();
  test_rotate_2_by_6_array_clockwise();
  test_rotate_empty_2_by_6_array_clockwise
  test_rotate_4_by_10_array_clockwise();
  test_expand_array();
  test_compress_array();
  test_convert_to_array_of_arrays();
  test_convert_to_array();
  test_copy_array();
  test_clone_array();
}

function test_clone_rotate_array() {
  
  var testArray = new Array("CBA","Play","NA");
  
  var expectedArray = new Array();
  expectedArray[0] = new Array("NA");
  expectedArray[1] = new Array("Play");
  expectedArray[2] = new Array("CBA");
  
  var expectedTestArray = new Array("CBA","Play");
  
  var actualArray = ArrayUtils.arrayCloneRotate(testArray, -90); // rotate array to the left
  
  testArray.pop();
  
  Logger.log(GSUnit.assertArrayEquals('Clone rotate confirm original test array changed', expectedTestArray, testArray));
  
  Logger.log(GSUnit.assertArrayEquals('Cloned and rotated array', expectedArray, actualArray));
}

function test_rotate_3_by_2_array_clockwise() {
  
  var testArray = new Array();
  testArray[0] = new Array("CBA","Play");
  testArray[1] = new Array("Play","NA");
  testArray[2] = new Array("Play","CBA");
  
  var expectedArray = new Array();
  expectedArray[0] = new Array("Play","Play","CBA");
  expectedArray[1] = new Array("CBA","NA","Play");
  
  var actualArray = ArrayUtils.arrayRotate(testArray, 90);
  
  Logger.log(GSUnit.assertArrayEquals('Rotate 3 by 2 array clockwise', expectedArray, actualArray));
}

function test_rotate_2_by_3_array_clockwise() {
  
  var testArray = new Array();
  testArray[0] = new Array("CBA","Play","CBA");
  testArray[1] = new Array("NA","NA","CBA");
  
  var expectedArray = new Array();
  expectedArray[0] = new Array("NA","CBA");
  expectedArray[1] = new Array("NA","Play");
  expectedArray[2] = new Array("CBA","CBA");

  var actualArray = ArrayUtils.arrayRotate(testArray, 90);

  Logger.log(GSUnit.assertArrayEquals('Rotate 2 by 3 array clockwise', expectedArray, actualArray));
}

function test_rotate_2_by_3_array_clockwise_back() {
  
  var testArray = new Array();
  testArray[0] = new Array("CBA","Play","CBA");
  testArray[1] = new Array("NA","NA","CBA");
  
  var expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play","CBA");
  expectedArray[1] = new Array("NA","NA","CBA");

  testArray = ArrayUtils.arrayRotate(testArray, 90);
  var actualArray = ArrayUtils.arrayRotate(testArray, -90);

  Logger.log(GSUnit.assertArrayEquals('Rotate 2 by 3 array clockwise', expectedArray, actualArray));
}

function test_rotate_2_by_3_array_clockwise_back_clockwise() {
  
  var testArray = new Array();
  testArray[0] = new Array("CBA","Play","CBA");
  testArray[1] = new Array("NA","NA","CBA");
  
  var expectedArray = new Array();
  expectedArray[0] = new Array("NA","CBA");
  expectedArray[1] = new Array("NA","Play");
  expectedArray[2] = new Array("CBA","CBA");
  
  testArray = ArrayUtils.arrayRotate(testArray, 90);
  testArray = ArrayUtils.arrayRotate(testArray, -90);
  testArray = ArrayUtils.arrayRotate(testArray, 90);

  Logger.log(GSUnit.assertArrayEquals('Rotate 2 by 3 array clockwise', expectedArray, testArray));
}

function test_rotate_2_by_3_array_counter_clockwise() {
  
  var testArray = new Array();
  testArray[0] = new Array("NA","CBA");
  testArray[1] = new Array("NA","Play");
  testArray[2] = new Array("CBA","CBA");

  var expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play","CBA");
  expectedArray[1] = new Array("NA","NA","CBA");

  var actualArray = ArrayUtils.arrayRotate(testArray, -90);
  
  Logger.log(GSUnit.assertArrayEquals('Rotate 2 by 3 array counter clockwise', expectedArray, actualArray));
}

function test_rotate_2_by_6_array_clockwise() {
  
  var testArray = new Array();
  testArray[0] = new Array("Play", "Play");
  testArray[1] = new Array("Play", "NA");
  testArray[2] = new Array("Play", "Play");
  testArray[3] = new Array("NA", "NA");
  testArray[4] = new Array("CBA", "Play");
  testArray[5] = new Array("Play", "Play");

  var expectedArray = new Array();
  expectedArray[0] = new Array("Play","CBA","NA","Play","Play","Play");
  expectedArray[1] = new Array("Play","Play","NA","Play","NA","Play");

  var actualArray = ArrayUtils.arrayRotate(testArray, 90);

  Logger.log(GSUnit.assertArrayEquals('Rotate 2 by 6 array clockwise', expectedArray, actualArray));
}

function test_rotate_empty_2_by_6_array_clockwise() {
  
  var testArray = new Array();
  testArray[0] = new Array("Play", "Play");
  testArray[1] = new Array("Play", "NA");
  testArray[2] = new Array("", "");
  testArray[3] = new Array("NA", "NA");
  testArray[4] = new Array("", "");
  testArray[5] = new Array("", "");

  var expectedArray = new Array();
  expectedArray[0] = new Array("","","NA","","Play","Play");
  expectedArray[1] = new Array("","","NA","","NA","Play");

  var actualArray = ArrayUtils.arrayRotate(testArray, 90);

  Logger.log(GSUnit.assertArrayEquals('Rotate 2 by 6 array clockwise', expectedArray, actualArray));
}

function test_rotate_4_by_10_array_clockwise() {
  
  var testArray = new Array();
  testArray[0] = new Array("CBA","Play","CBA","Play","NA","Play","Play","CBA","CBA","CBA");
  testArray[1] = new Array("Play","Play","Play","CBA","NA","CBA","Play","CBA","CBA","CBA");
  testArray[2] = new Array("Play","CBA","Play","Play","NA","CBA","Play","CBA","CBA","CBA");
  testArray[3] = new Array("CBA","Play","CBA","Play","NA","Play","Play","CBA","CBA","CBA");
  
  var expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play","Play","CBA");
  expectedArray[1] = new Array("Play","CBA","Play","Play");
  expectedArray[2] = new Array("CBA","Play","Play","CBA");
  expectedArray[3] = new Array("Play","Play","CBA","Play");
  expectedArray[4] = new Array("NA","NA","NA","NA");
  expectedArray[5] = new Array("Play","CBA","CBA","Play");
  expectedArray[6] = new Array("Play","Play","Play","Play");
  expectedArray[7] = new Array("CBA","CBA","CBA","CBA");
  expectedArray[8] = new Array("CBA","CBA","CBA","CBA");
  expectedArray[9] = new Array("CBA","CBA","CBA","CBA");
  
  var actualArray = ArrayUtils.arrayRotate(testArray, 90);

  Logger.log(GSUnit.assertArrayEquals('Rotate 4 by 10 array clockwise', expectedArray, actualArray));
}

function test_expand_array() {
  var testArray = new Array();
  testArray[0] = new Array("CBA","Play","CBA","Play");
  testArray[1] = new Array("Play","Play","Play","CBA");
  
  var expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play","CBA","Play");
  expectedArray[1] = new Array("Play","Play","Play","CBA");
  expectedArray[2] = new Array(null,null,null,null);
  expectedArray[3] = new Array(null,null,null,null);
  
  var actualArray = ArrayUtils.expandArray(testArray);
  
  Logger.log(GSUnit.assertArrayEquals('Expand array height', expectedArray, actualArray));
  
  testArray = new Array();
  testArray[0] = new Array("CBA","Play");
  testArray[1] = new Array("Play","Play");
  testArray[2] = new Array("Play","Play");
  testArray[3] = new Array("Play","Play");
  
  expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play",null,null);
  expectedArray[1] = new Array("Play","Play",null,null);
  expectedArray[2] = new Array("Play","Play",null,null);
  expectedArray[3] = new Array("Play","Play",null,null);
  
  actualArray = ArrayUtils.expandArray(testArray);
  
  Logger.log(GSUnit.assertArrayEquals('Expand array width', expectedArray, actualArray));
  
  testArray = new Array("","","","");
  
  expectedArray = new Array();
  expectedArray[0] = new Array("","","","");
  expectedArray[1] = new Array(null,null,null,null);
  expectedArray[2] = new Array(null,null,null,null);
  expectedArray[3] = new Array(null,null,null,null);
  
  actualArray = ArrayUtils.expandArray(testArray);
  
  Logger.log(GSUnit.assertArrayEquals('Expand empty array to two dimensions', expectedArray, actualArray));

  testArray = new Array("CBA","Play","NA");
  
  expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play","NA");
  expectedArray[1] = new Array(null,null,null);
  expectedArray[2] = new Array(null,null,null);
  
  actualArray = ArrayUtils.expandArray(testArray);
  
  Logger.log(GSUnit.assertArrayEquals('Expand array to two dimensions', expectedArray, actualArray));
}

function test_compress_array() {
  var testArray = new Array();
  testArray[0] = new Array("CBA","Play","CBA",null);
  testArray[1] = new Array("Play","Play","Play", null);
  testArray[2] = new Array(null,null,null,null);
  testArray[3] = new Array(null,null,null,null);
  
  var expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play","CBA");
  expectedArray[1] = new Array("Play","Play","Play");
  
  var actualArray = ArrayUtils.compressArray(testArray);
  
  Logger.log(GSUnit.assertArrayEquals('Compress array', expectedArray, actualArray));
  
  testArray = new Array();
  testArray[0] = new Array("CBA","Play","",null);
  testArray[1] = new Array("Play","Play","Play", null);
  testArray[2] = new Array("Play","","",null);
  testArray[3] = new Array(null,null,null,null);
  
  expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play","");
  expectedArray[1] = new Array("Play","Play","Play");
  expectedArray[2] = new Array("Play","","");
  
  actualArray = ArrayUtils.compressArray(testArray);
  
  Logger.log(GSUnit.assertArrayEquals('Compress array with empty values on bottom and right', expectedArray, actualArray));
  
  testArray = new Array();
  testArray[0] = new Array(null,null,null,null);
  testArray[1] = new Array("CBA","Play","Play",null);
  testArray[2] = new Array("Play","Play","",null);
  
  expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play","Play");
  expectedArray[1] = new Array("Play","Play","");
  
  actualArray = ArrayUtils.compressArray(testArray);
  
  Logger.log(GSUnit.assertArrayEquals('Compress array with empty values on top and right', expectedArray, actualArray));

  testArray = new Array();
  testArray[0] = new Array(null,"CBA","Play");
  testArray[1] = new Array(null,"Play","CBA");
  
  expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play");
  expectedArray[1] = new Array("Play","CBA");
  
  actualArray = ArrayUtils.compressArray(testArray);
  
  Logger.log(GSUnit.assertArrayEquals('Compress array with empty values on left', expectedArray, actualArray));
  
  testArray = new Array();
  testArray[0] = new Array(null,"CBA","Play");
  testArray[1] = new Array(null,"","");
  testArray[2] = new Array(null,"Play","CBA");
  
  expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play");
  expectedArray[1] = new Array("","");
  expectedArray[2] = new Array("Play","CBA");
  
  actualArray = ArrayUtils.compressArray(testArray);
  
  Logger.log(GSUnit.assertArrayEquals('Compress array with empty values in the middle and left', expectedArray, actualArray));
  
  testArray = new Array();
  testArray[0] = new Array("","CBA","");
  testArray[1] = new Array("","","");
  testArray[2] = new Array("","Play","");
  
  expectedArray = new Array();
  expectedArray[0] = new Array("","CBA","");
  expectedArray[1] = new Array("","","");
  expectedArray[2] = new Array("","Play","");
  
  actualArray = ArrayUtils.compressArray(testArray);
  
  Logger.log(GSUnit.assertArrayEquals('Compress array with empty values in all around', expectedArray, actualArray));
}

function test_convert_to_array_of_arrays() {
  var testArray = new Array("CBA","Play","Play");
  var expectedArray = new Array();
  expectedArray[0] = new Array("CBA","Play","Play");

  var actualArray = ArrayUtils.convertToArrayOfArrays(testArray);

  Logger.log(GSUnit.assertArrayEquals('Convert array to array of arrays', expectedArray, actualArray));
}

function test_convert_to_array() {
  // [["Play", "Play", "Play", "Play", "CBA"]]
  var testArray = new Array();
  testArray[0] = new Array("Play", "Play", "Play", "Play", "CBA");
  var expectedArray = new Array("Play", "Play", "Play", "Play", "CBA");

  var actualArray = ArrayUtils.convertToArray(testArray);

  Logger.log(GSUnit.assertArrayEquals('Convert to array', expectedArray, actualArray));
}

function test_copy_array() {
  var testArray = new Array();
  testArray[0] = new Array("NA", "Play");
  testArray[1] = new Array("Play");
  testArray[2] = new Array("CBA","CBA");

  var expectedArray = new Array();
  expectedArray[0] = new Array("NA", "Play");
  expectedArray[1] = new Array("Play");
  expectedArray[2] = new Array("CBA","CBA");
  
  var actualArray = new Array();
  actualArray[0] = new Array("NA", "Play","NA", "Play","NA", "Play");
  actualArray[1] = new Array("Play","NA","NA","NA");
  actualArray[2] = new Array("CBA","CBA");
  actualArray[3] = new Array("NA");

  ArrayUtils.arrayCopy(testArray, actualArray);
  
  Logger.log(GSUnit.assertArrayEquals('Copy to larger array', expectedArray, actualArray));
  
  actualArray = new Array();
  
  ArrayUtils.arrayCopy(testArray, actualArray);
  
  Logger.log(GSUnit.assertArrayEquals('Copy to empty array', expectedArray, actualArray));
  
  actualArray = new Array();
  actualArray[0] = new Array(null);
  actualArray[1] = new Array(null);
  
  ArrayUtils.arrayCopy(testArray, actualArray);
  
  Logger.log(GSUnit.assertArrayEquals('Copy to smaller array', expectedArray, actualArray));
}

function test_clone_array() {
  var testArray = new Array();
  testArray[0] = new Array("NA");
  testArray[1] = new Array("Play");
  testArray[2] = new Array("CBA","CBA");

  var expectedArray = new Array();
  expectedArray[0] = new Array("NA");
  expectedArray[1] = new Array("Play");
  expectedArray[2] = new Array("CBA","CBA");

  var actualArray = ArrayUtils.arrayClone(testArray);
  
  delete testArray[1];
  
  var expectedTestArray = new Array();
  expectedTestArray[0] = new Array("NA");
  expectedTestArray[2] = new Array("CBA","CBA");
  
  Logger.log(GSUnit.assertArrayEquals('Confirm original test array changed', expectedTestArray, testArray));

  Logger.log(GSUnit.assertArrayEquals('Cloned array unchanged', expectedArray, actualArray));
}

