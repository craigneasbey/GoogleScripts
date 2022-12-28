/**
 * V1.3.1
 * https://developers.google.com/apps-script/reference/
 * https://sites.google.com/site/scriptsexamples/custom-methods/gsunit
 *
 * Could change logging to https://github.com/peterherrmann/BetterLog
 *
 * Created by craigneasbey (https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)
 */

function Profiler(name) {
  this.name = defaultFor(name, "Sample");  
  this.intervals = new Array();
  this.enabled = true;
  
  this.interval = function() {
   var elapsedTime = 0;
    
    if(this.enabled) {
      var now = new Date().getTime();
      
      if(!isEmpty(this.intervalTime)) {
        elapsedTime = now - this.intervalTime;
        this.intervals.push(elapsedTime);
      }
      
      this.intervalTime = now;
    }
  
    return elapsedTime;
  };
  
  this.log = function(comment) {
    if(this.enabled) {
      Logger.log(this.name + " " + comment + ": " + this.interval() + "ms");
    }
  };
  
  this.total = function() {
    var totalSum = 0;
  
    for(var i = 0; i < this.intervals.length; i++) {
      totalSum += this.intervals[i];
    }

    return totalSum;
  };
  
  this.logTotal = function() {
    if(this.enabled) {
      Logger.log(this.name + " total: " + this.total() + "ms " + this.total() / 1000 + "secs");
    }
  };
  
  this.length = function() {
    return this.intervals.length;
  };
}


/**
 * Tests
 */
function test_profiler_suite() {
  test_profiler();
}

function test_profiler() {
  profiler = new Profiler("Test");
  profiler.log("1");
  profiler.log("2");
  profiler.log("3");
  profiler.logTotal();
  
  assertEquals('Profilers array is size', 2, profiler.length());
  
  profiler = new Profiler("Test");
  profiler.enabled = false;
  profiler.log("1");
  profiler.log("2");
  profiler.log("3");
  profiler.logTotal();
  
  assertEquals('Profilers array is size', 0, profiler.length());
}
