var fs = require('fs');
var Chrome = require('chrome-remote-interface');
var summary = require('./util/browser-perf-summary')
var util = require('util');

var TRACE_CATEGORIES = ["-*", "devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.stack", "disabled-by-default-v8.cpu_profile"];
var rawEvents = [];

Chrome(function (chrome) {
    with (chrome) {
        Page.enable();
        Tracing.start({
            "categories":   TRACE_CATEGORIES.join(','),
            "options":      "sampling-frequency=10000"  // 1000 is default and too slow.
        });

        Page.navigate({'url': 'http://localhost:8000/layout-thrash.html'})
        Page.loadEventFired(function () {
           setTimeout(function(){
                Tracing.end()
            }, 300);
        });

        Tracing.tracingComplete(function () {

            // find forced layouts
            // https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/devtools/front_end/timeline/TimelineModel.js&sq=package:chromium&type=cs&q=f:timelinemodel%20forced
            var forcedReflowEvents = rawEvents
                .filter( e => e.name == "UpdateLayoutTree" || e.name == "Layout")
                .filter( e => e.args && e.args.beginData && e.args.beginData.stackTrace && e.args.beginData.stackTrace.length)

            var file = 'forced-reflow-' + Date.now() + '.devtools.trace';
            fs.writeFileSync(file, JSON.stringify(forcedReflowEvents, null, 2));

            console.log('Found events:')
            console.log(util.inspect(forcedReflowEvents,  {showHidden: false, depth: null}));
            console.log('')
            console.log("Results: ", forcedReflowEvents.length, " forced StyleRecalc and forced Layouts found.")
            console.log('')
            console.log('Found events written to file: ' + file);

            chrome.close();
        });

        Tracing.dataCollected(function(data){
            var events = data.value;
            rawEvents = rawEvents.concat(events);
        });
    }
}).on('error', function (e) {
    console.error('Cannot connect to Chrome', e);
});


